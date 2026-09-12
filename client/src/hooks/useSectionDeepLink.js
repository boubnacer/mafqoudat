import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Opens a page scrolled to one of its sections, from a `?section=<id>` link.
 *
 * Built for the social-publish notifications ("your listing is on our Facebook
 * page"), whose whole point is to land the author on that listing's reach
 * section rather than at the top of a long page - but written as a general
 * mechanism, because the comment alerts want exactly the same thing and every
 * notification in this app currently drops the reader at the top of the post.
 *
 * Four things it has to survive, all of which broke an earlier version of
 * this:
 *
 *  1. **The section may not exist yet when the page mounts.** A post page is
 *     rendered from props its parent is still fetching parts of, and the reach
 *     section in particular appears only once the listing has a social copy to
 *     describe. So this retries for RETRY_WINDOW_MS instead of looking once.
 *  2. **This page can be the very first thing the browser loads.** A tap on a
 *     real push notification reaches the service worker's `notificationclick`
 *     ([push-sw.js](../../public/push-sw.js)), which navigates via
 *     `Client.navigate`/`clients.openWindow` - an actual document navigation,
 *     not a client-side route change. Unlike opening the same link from
 *     inside an already-running tab (instant - the app is already booted),
 *     this is a cold start: download the bundle, boot React, fetch the post,
 *     load its photo, only then does the section exist. RETRY_WINDOW_MS has
 *     to outlast that on a slow mobile connection, not just a slow API call.
 *  3. **The page keeps growing after the scroll, more than once.** The hero
 *     photo above the section is lazy-loaded, and on the same slow connection
 *     that made (2) slow, it can keep shifting layout well past a single
 *     correction check. So this schedules a few, not one, each only moving
 *     the page if it has actually drifted - never an unconditional second
 *     jump, which would yank a reader who has since scrolled themselves.
 *  4. **Reduced motion.** A long smooth scroll is exactly the kind of movement
 *     `prefers-reduced-motion` is about, so those visitors are placed at the
 *     section instead of travelling to it.
 *
 * Returns a ref to put on the section and a `isHighlighted` flag that is true
 * briefly after arrival - landing mid-page with no explanation reads as a
 * mis-scroll, so the section says "here" for a moment.
 *
 * @param {string} sectionId value of `?section=` this section answers to.
 */

export const SECTION_QUERY_PARAM = 'section';

/**
 * The listing's reach section. Shared by whoever links to it and by the page
 * that answers to it - and it is the same string the server puts in a social
 * publish push's `section` field (services/pushNotificationService.js), so the
 * mobile tap and the web link land in the same place.
 */
export const SOCIAL_REACH_SECTION = 'social-reach';

// How long to keep looking for a section that has not rendered yet. Sized for
// the cold-start case (2 above), not just a slow API call: on a real phone,
// tapping the push notification is a fresh document load - bundle download,
// React boot, the post fetch, its photo - all of which can run past 4s on a
// weak mobile connection. 15s comfortably covers that while still being over
// before anyone could plausibly have read the page and scrolled by hand.
const RETRY_WINDOW_MS = 15000;
const RETRY_INTERVAL_MS = 120;

// When the correction passes run. A single check at 700ms was tuned for a
// warm, already-booted tab; on the cold-start path the hero photo can still
// be loading well past that, so this re-checks a few times rather than once -
// each one a no-op unless the page has actually drifted since the last check.
const CORRECTION_DELAYS_MS = [700, 2000, 4000];

// How far out of place the section has to be for the correction pass to move
// the page again. A small drift is the browser's own smooth-scroll settling;
// anything larger is layout that shifted underneath it.
const CORRECTION_TOLERANCE_PX = 120;

const HIGHLIGHT_MS = 2400;

const prefersReducedMotion = () => (
  typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches
);

const scrollToNode = (node) => {
  node.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    // Centred rather than aligned to the top: /dash/* renders behind a fixed
    // navbar, and centring needs no offset to account for it.
    block: 'center',
    inline: 'nearest',
  });
};

/** Roughly how far the node is from where a centred scroll would put it. */
const distanceFromCentre = (node) => {
  const rect = node.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  return Math.abs((rect.top + rect.height / 2) - viewportHeight / 2);
};

export const useSectionDeepLink = (sectionId) => {
  const [searchParams] = useSearchParams();
  const requested = searchParams.get(SECTION_QUERY_PARAM) === sectionId;

  const nodeRef = useRef(null);
  const [isHighlighted, setIsHighlighted] = useState(false);

  const ref = useCallback((node) => {
    nodeRef.current = node;
  }, []);

  useEffect(() => {
    if (!requested) return undefined;

    const timers = new Set();
    let cancelled = false;

    const later = (fn, delay) => {
      const id = setTimeout(() => {
        timers.delete(id);
        if (!cancelled) fn();
      }, delay);
      timers.add(id);
    };

    const arrive = (node) => {
      scrollToNode(node);
      setIsHighlighted(true);
      later(() => setIsHighlighted(false), HIGHLIGHT_MS);
      CORRECTION_DELAYS_MS.forEach((delay) => {
        later(() => {
          // Only if the page moved underneath the last scroll - never an
          // unconditional jump, which would yank a reader who has already
          // started scrolling somewhere else.
          if (distanceFromCentre(node) > CORRECTION_TOLERANCE_PX) scrollToNode(node);
        }, delay);
      });
    };

    const deadline = Date.now() + RETRY_WINDOW_MS;
    const attempt = () => {
      if (cancelled) return;
      const node = nodeRef.current;
      if (node) {
        arrive(node);
        return;
      }
      if (Date.now() < deadline) later(attempt, RETRY_INTERVAL_MS);
    };

    // One frame in: the ref is attached by the time effects run, but the
    // browser has not laid the page out yet on the first commit.
    const frame = requestAnimationFrame(attempt);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      timers.forEach((id) => clearTimeout(id));
      timers.clear();
    };
  }, [requested, sectionId]);

  return { ref, isHighlighted };
};

export default useSectionDeepLink;
