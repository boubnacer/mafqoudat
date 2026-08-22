// Single place where GSAP and its plugins are registered.
//
// registerPlugin() is idempotent, but doing it in each component means every
// new animated screen has to remember which plugins it needs and re-register
// them. Importing gsap from here instead guarantees the plugins are attached
// before the first tween runs, whichever component happens to mount first.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// The site's animation baseline: everything else overrides from here, so a
// tween that says nothing about duration or ease still feels like the rest.
gsap.defaults({ duration: 0.7, ease: "power3.out" });

// True when the visitor has asked their OS for less motion. Every animation
// in this codebase is expected to check it — the reveal helpers below do so
// through gsap.matchMedia(), which additionally reverts what it created if
// the preference changes while the page is open.
export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export { gsap, ScrollTrigger, useGSAP };
