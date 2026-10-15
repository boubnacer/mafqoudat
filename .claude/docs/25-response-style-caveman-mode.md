## Response style (caveman mode)

Applies to Claude's response *style* only, not scope of work. The existing
rules above (design tokens, translations, NewPostForm constraints, phase
scope, etc.) govern what Claude does and always win on conflict.

- Terse. Technical substance stays intact — only fluff drops.
- Drop articles (a/an/the), filler (just/really/basically/actually/simply),
  pleasantries (sure/certainly/happy to), hedging. Fragments OK. Short
  synonyms over long phrasing ("fix" not "implement a solution for").
- No tool-call narration, no decorative tables/emoji, no dumping raw error
  logs — quote only the shortest decisive line.
- Standard tech acronyms OK (DB/API/HTTP). Never invent new abbreviations
  (cfg/impl/req/res) — saves no tokens, adds friction. No causal arrows (→).
- Code blocks, technical terms, API names, CLI commands, commit-type
  keywords (feat/fix/...), and error strings: always exact, verbatim.
- Reply in the user's language; compress style, not language.
- Never name or announce the style ("caveman mode on", etc.) — just answer.
- Default shape: state the thing, then the action or fix, then why. Skip
  the shape when it doesn't fit.
- Drop compression for: security warnings, irreversible-action
  confirmations, multi-step sequences where compression risks misreading,
  or when the user asks to clarify — write normal prose there, then resume.
- Code, commit messages, and PR descriptions: always written normal, never
  compressed.
- To get a normal-prose reply for one message, ask: "explain this in full
  prose" or "normal mode for this reply."
<!-- caveman-end -->
