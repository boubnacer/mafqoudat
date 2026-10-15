## Motion (GSAP)

Web animation is GSAP (`gsap` + `@gsap/react`). Plugins are registered once in
[gsapSetup.js](client/src/utils/gsapSetup.js) — import `gsap`/`ScrollTrigger`/`useGSAP`
from there rather than calling `registerPlugin` per component; `gsap.defaults()` there
carries the house feel (0.7s, `power3.out`). Reference material for writing GSAP lives in
`.claude/skills/gsap-*` (GreenSock's official agent skills, vendored).

- **The dashboard home page is marked up, not wired up.**
  [useDashboardMotion.js](client/src/features/dashboard/useDashboardMotion.js) owns the
  whole choreography and finds its targets through data attributes:
  `data-reveal="map|hero|section|divider"`, plus `data-reveal-item` on children that should
  stagger in behind their own section. `Dash.js` keeps reading as layout, and
  `LeftSide`/`RecentSection`/`RecentPosts`/`QuickActions`/`Categories`/`HelpSupportSection`
  only carry attributes — none of them imports GSAP. A section that stops being animated
  loses an attribute, not a hook.
- **Only `y`, `scale` and opacity are ever animated.** GSAP has no logical-property
  equivalent of `insetInlineStart`, so RTL-safety here comes from the choice of properties
  rather than a mirrored variant. Nothing moves along `x`.
- **Reduced motion is a `gsap.matchMedia("(prefers-reduced-motion: no-preference)")`
  wrapper around every setup block**, not an early return: those visitors get the page in
  its final state with no tween created at all, and changing the OS setting mid-session
  reverts whatever was made.
- **`/dash/*` does not scroll the window.** DashLayout's `#dash-scroll-container` is the
  real scroller (it has an explicit height and a non-visible overflow), so every
  ScrollTrigger here passes `scroller`. Against the default scroller `window.scrollY` never
  moves, which leaves every below-the-fold section stuck at `autoAlpha: 0` forever —
  the first version of this shipped exactly that bug. `resolveScroller()` prefers the id,
  falls back to the nearest scrollable ancestor, then the viewport.
- **Reveal hooks are keyed on the loading flag, never on mount.** `Dash.js` returns
  `<DashboardSkeleton />` while its query is in flight, so a `useGSAP` with the default
  empty dependency array runs against a page whose animated elements do not exist yet and
  never runs again — the same trap the WelcomePage hero animation fell into.
- **Failure mode is guarded.** Because the scroll reveal hides elements before revealing
  them, a setup that throws would leave real content invisible; the hook catches, logs, and
  `clearProps`-es everything it touched. Losing the animation is acceptable, losing the
  dashboard is not.
- **Count-ups**: `FoundLostStrip` keeps its own rAF counter for Found/Lost;
  [TotalBox.jsx](client/src/components/TotalBox.jsx) takes an opt-in `countUp` prop (GSAP,
  writing `textContent` so a 1.2s tween doesn't re-render React ~60x/s, with React still
  owning the final value). Both are enabled from `LeftSide`, so all four stats count
  rather than two counting and two appearing.
- **One system per element.** `Process.jsx` moved off framer-motion onto its own local
  GSAP `useGSAP`/`ScrollTrigger` reveal (own step-card redesign, own sequencing — the three
  cards stagger in together in DOM order, then each icon disc pops with `back.out` on top of
  its card, then the social row) and its section stays deliberately unmarked so
  `useDashboardMotion`'s shared reveal never runs a second animation on the same nodes. It
  reuses `useDashboardMotion`'s exported `resolveScroller` rather than re-deriving the
  `#dash-scroll-container` lookup. `Categories.jsx` moved the same
  direction earlier, off framer-motion: its entrance was mount-based, and the section sits
  far below the fold, so it always finished playing before anyone scrolled to it. The cards
  "show all" adds after the reveal has run get a matching local entrance inside
  `Categories.jsx`.
