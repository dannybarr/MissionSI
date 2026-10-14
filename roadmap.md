# Migration roadmap (Replit → Lovable)

- [ ] Copy mission-studio source into src/studio, rewrite `@/` imports
- [ ] Copy oki-home landing source into src/landing, rewrite `@/` imports
- [ ] Copy public assets (NASA webp, media, favicon) into public/
- [ ] Install runtime deps (three, r3f, drei, postprocessing, wouter, framer-motion, radix, etc.)
- [ ] Wire routes: `/` = landing, `/studio` = Mission Studio, keep TanStack router
- [ ] Merge/scope both apps' CSS (HSL token sets) without conflicts
- [ ] Head metadata for both routes
- [ ] Verify build + visual check of both pages
- [ ] Ledger + handoff note (no DB records exist; nothing to import)
