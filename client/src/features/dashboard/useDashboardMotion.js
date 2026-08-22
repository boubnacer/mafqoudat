import { gsap, ScrollTrigger, useGSAP } from "../../utils/gsapSetup";

// Dashboard motion, in one place.
//
// The page is marked up rather than wired up: a section opts into the
// choreography by carrying a data attribute, and this hook finds it. That way
// Dash.js keeps reading as layout, the animated components never import GSAP,
// and a section that stops being animated only loses an attribute.
//
//   data-reveal="map"     the world-map backdrop (pushes in on load)
//   data-reveal="hero"    the stats panel over it (rises on load)
//   data-reveal="section" anything below the fold (rises as it scrolls in)
//   data-reveal="divider" the hairline rules between sections (draw open)
//   data-reveal-item      a child that staggers in after its own section
//
// Direction-safety: every property animated here is vertical (y), a scale, or
// opacity. Nothing moves along x, so the same code reads correctly in Arabic
// RTL without a mirrored variant — GSAP has no logical-property equivalent of
// insetInlineStart, so the constraint lives in the choice of properties.
export const REVEAL_ATTR = "data-reveal";
export const REVEAL_ITEM_ATTR = "data-reveal-item";

const ITEM_SELECTOR = `[${REVEAL_ITEM_ATTR}]`;

// ScrollTrigger measures against the viewport by default, but /dash/* does
// not scroll the window: DashLayout gives #dash-scroll-container an explicit
// height and a non-visible overflow, which makes that box the real scroller
// (see the comment on it). Pointing ScrollTrigger at the window here would
// leave every below-the-fold section hidden forever, since window.scrollY
// never moves. Falls back to the nearest scrollable ancestor, and finally to
// the viewport, so this keeps working if the layout is restructured.
const resolveScroller = (element) => {
  const named = document.getElementById("dash-scroll-container");
  if (named && named.contains(element)) return named;

  let node = element?.parentElement;
  while (node && node !== document.body) {
    const { overflowY } = window.getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") return node;
    node = node.parentElement;
  }
  return undefined;
};

const itemsWithin = (elements) =>
  elements.reduce(
    (all, element) => all.concat(gsap.utils.toArray(element.querySelectorAll(ITEM_SELECTOR))),
    []
  );

/**
 * @param {React.RefObject<HTMLElement>} scopeRef  root of the dashboard page
 * @param {boolean} ready  false while the skeleton is on screen — the marked
 *   elements do not exist yet, and a hook that ran anyway would find nothing
 *   and never run again (useGSAP defaults to an empty dependency array).
 */
export const useDashboardMotion = (scopeRef, { ready = true, dependencies = [] } = {}) => {
  useGSAP(
    () => {
      if (!ready || !scopeRef.current) return undefined;

      const mm = gsap.matchMedia();

      // Everything is created inside this query, so a visitor who prefers
      // reduced motion gets the page in its final state with no tweens at
      // all — and if they change the preference while the page is open,
      // matchMedia reverts whatever it made.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(scopeRef);
        const map = q(`[${REVEAL_ATTR}="map"]`);
        const hero = q(`[${REVEAL_ATTR}="hero"]`);
        const sections = q(`[${REVEAL_ATTR}="section"]`);
        const dividers = q(`[${REVEAL_ATTR}="divider"]`);
        const heroItems = itemsWithin(hero);
        const sectionItems = itemsWithin(sections);
        const scroller = resolveScroller(scopeRef.current);

        try {
          // --- Header, on load -------------------------------------------
          // One timeline rather than three tweens with hand-tuned delays:
          // the map settles while the panel is still rising, and the stats
          // inside it land last. The map scales *down* into place so its
          // edges can never pull away from the section they fill.
          if (map.length || hero.length) {
            const intro = gsap.timeline();
            if (map.length) {
              intro.from(map, { autoAlpha: 0, scale: 1.06, duration: 1.1, ease: "power2.out" }, 0);
            }
            if (hero.length) {
              intro.from(hero, { autoAlpha: 0, y: 30, duration: 0.85 }, 0.12);
            }
            if (heroItems.length) {
              intro.from(heroItems, { autoAlpha: 0, y: 18, duration: 0.6, stagger: 0.09 }, 0.3);
            }
          }

          // --- Below the fold, on scroll ---------------------------------
          // Hidden first, then revealed by ScrollTrigger.batch, which groups
          // everything crossing the line at the same moment into a single
          // staggered tween instead of firing one trigger per element.
          // Sections already on screen at load fire on the first refresh, so
          // a short page still animates.
          if (sections.length) {
            gsap.set(sections, { autoAlpha: 0, y: 34 });
            gsap.set(sectionItems, { autoAlpha: 0, y: 20 });

            ScrollTrigger.batch(sections, {
              scroller,
              start: "top 88%",
              once: true,
              onEnter: (batch) => {
                gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.75, stagger: 0.12, overwrite: true });
                batch.forEach((section, index) => {
                  const items = section.querySelectorAll(ITEM_SELECTOR);
                  if (!items.length) return;
                  gsap.to(items, {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.6,
                    stagger: 0.07,
                    delay: 0.14 + index * 0.12,
                    overwrite: true,
                  });
                });
              },
            });
          }

          if (dividers.length) {
            gsap.set(dividers, { scaleX: 0, transformOrigin: "50% 50%" });
            ScrollTrigger.batch(dividers, {
              scroller,
              start: "top 92%",
              once: true,
              onEnter: (batch) =>
                gsap.to(batch, { scaleX: 1, duration: 0.8, ease: "power2.out", overwrite: true }),
            });
          }
        } catch (error) {
          // A reveal that fails to set itself up would otherwise leave real
          // content stuck at autoAlpha 0. Losing the animation is acceptable;
          // losing the dashboard is not.
          console.error("Dashboard motion failed to initialise:", error);
          gsap.set([...sections, ...sectionItems, ...dividers], { clearProps: "all" });
        }

        // Trigger positions are measured from the layout as it stands when
        // the batch is created. Post images and the map SVG land after that
        // and push everything down, so re-measure once the frame settles and
        // again when the page has finished loading.
        const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
        const onLoad = () => ScrollTrigger.refresh();
        if (document.readyState !== "complete") {
          window.addEventListener("load", onLoad);
        }

        return () => {
          cancelAnimationFrame(raf);
          window.removeEventListener("load", onLoad);
        };
      });

      return () => mm.revert();
    },
    { scope: scopeRef, dependencies: [ready, ...dependencies], revertOnUpdate: true }
  );
};

export default useDashboardMotion;
