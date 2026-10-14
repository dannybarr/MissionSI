# Migration roadmap (Replit → Lovable)

- [x] Copy mission-studio source into src/studio, rewrite `@/` imports
- [x] Copy oki-home landing source into src/landing, rewrite `@/` imports
- [x] Copy public assets (NASA webp, media, favicon) into public/
- [x] Install runtime deps (three, r3f, drei, postprocessing, framer-motion, radix, etc.)
- [x] Wire routes: `/` = landing, `/studio` = Mission Studio, keep TanStack router
- [x] Merge/scope both apps' CSS (studio body styles scoped to .studio-root)
- [x] Head metadata for both routes
- [x] Verify build + visual check of both pages (build OK, tests pass, no console errors)
- [x] Ledger + handoff note (no DB records exist; nothing to import)
