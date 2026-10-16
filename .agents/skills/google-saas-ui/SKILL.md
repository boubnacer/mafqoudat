---
name: google-saas-ui
description: Audits and restyles UI components into a modern Google Workspace / Firebase / Material 3 SaaS aesthetic. Use whenever asked to redesign, polish, or upgrade a component to a Google SaaS look.
---

# Google SaaS UI Restyling Protocol

When restyling a component, follow this exact workflow:

0. **Verify & Import Fonts First:** Check the global CSS file (`index.css` or `globals.css`). If `Inter` and `Plus Jakarta Sans` are missing, add this at the top of the global CSS file:
   ```css
   @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap');

   body {
     font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
     -webkit-font-smoothing: antialiased;
   }

   h1, h2, h3, h4, button {
     font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
   }
   ```

1. **Audit First:** Briefly list 3-4 visual hierarchy, spacing, or contrast flaws in the existing component.

2. **Apply Google SaaS Tokens:**
   - **Typography:** Load or use Plus Jakarta Sans for headings/buttons and Inter for body. Use 14px (text-sm) for all primary controls, table cells, inputs, and buttons. Use 16px (text-base font-medium) for card titles, and 20px-22px for page titles. Use 12px (text-xs) only for badges/timestamps. Prefer font-medium (500) over font-bold (700).
   - **Tonal Surfaces Over Borders (Light & Dark Mode):**
     - **The Dark Mode Elevation Rule:** Never place pure black cards (`#000000`) on a black page — they blend together completely. The parent canvas must be deep near-black/carbon (`#0E0E10` or `#0B0F17`), and component cards elevated to dark slate/zinc (`#18181B`) with a razor-thin translucent rim (`rgba(255, 255, 255, 0.08)` or `border-white/[0.08]`).
     - **The Exact Parent vs. Card Color Pairing (Google Material 3 / SaaS Standard):**
       | Layer | Light Mode | Dark Mode |
       | :--- | :--- | :--- |
       | **Parent / Homepage Background** *(The Canvas)* | `#F8FAFD` (Tailwind `bg-slate-50` / `bg-[#F8FAFD]`) | `#0E0E10` or `#0B0F17` (Tailwind `dark:bg-zinc-950` / `dark:bg-slate-950`) |
       | **Component / Card Background** *(The Elevated Surface)* | `#FFFFFF` (Tailwind `bg-white`) | `#18181B` or `#1E1F22` (Tailwind `dark:bg-zinc-900` / `dark:bg-[#1E1F22]`) |
       | **Nested / Inner Box Inside a Card** *(Secondary Surface)* | `#F1F5F9` (Tailwind `bg-slate-100/80`) | `#27272A` (Tailwind `dark:bg-zinc-800/60`) |
       | **Subtle Hairline Border** *(Dividers / Dark Rims)* | Optional (`#E1E3E1` / `border-slate-200/60`) | **Required**: 1px subtle rim (`rgba(255, 255, 255, 0.08)` / `border-white/[0.08]` or `border-zinc-800`) |
   - **Google Geometry:** Use rounded-2xl (16px-24px) for containers/cards, and rounded-full (pill shape) for primary action buttons, status chips, and active tabs.
   - **Colors & States:** Primary actions use Google Blue (#0B57D0 / bg-blue-600), active/selected states use soft tonal blue (#D3E3FD / bg-blue-50 text-blue-700). Include smooth hover/focus state layers.

3. **Preserve Logic:** Never break existing props, state, or event handlers.
