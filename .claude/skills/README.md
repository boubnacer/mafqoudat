# Vendored agent skills

Skills committed here load automatically for anyone working in this repo with
an agent that reads `.claude/skills/` — local CLI sessions, web sessions and
teammates alike. They are documentation for the agent only: nothing here is
imported by `client/`, `server/` or `mobile/`, and none of it reaches a bundle.

## gsap-* (8 skills)

Official GSAP skills from GreenSock, MIT licensed — see `GSAP_SKILLS_LICENSE`.

- Source: https://github.com/greensock/gsap-skills
- Vendored from commit `aed9cfd`
- Contents: `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-plugins`,
  `gsap-utils`, `gsap-react`, `gsap-performance`, `gsap-frameworks`, plus
  `gsap-skills-index.txt` (upstream's `skills/llms.txt`, the skill index).

Only the `skills/` folder is vendored; upstream's examples, assets and
agent-config files are not.

To update: re-clone upstream and copy `skills/gsap-*` over these directories.
The runtime library is a separate concern — it lives in `client/package.json`
(`gsap` + `@gsap/react`) and is what actually ships.

Three project constraints these skills do not know about, which still apply to
any GSAP work here:

1. **RTL.** The site runs full RTL in Arabic. `y`/`opacity` are safe; any `x`
   offset has to flip with direction. GSAP has no logical-property equivalent
   of `insetInlineStart`.
2. **Reduced motion.** Every animation stays behind a
   `prefers-reduced-motion` check (`gsap.matchMedia()` is the idiomatic form).
3. **Skeleton gating.** Pages that return a skeleton while an RTK Query is in
   flight have no DOM for the animation to target on mount, so the hook must be
   keyed on that loading flag — see the `useGSAP` call in
   `client/src/components/WelcomePage.jsx`.
