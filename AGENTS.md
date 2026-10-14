<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# AGENTS.md

- Migrated from a Replit pnpm monorepo; the two apps now live in `src/landing` (Mission marketing site, route `/`) and `src/studio` (3D Mission Studio, route `/studio`), each self-contained with its own `index.css` and `@/landing` / `@/studio` import alias.
- Studio renders only on the client (`ClientOnly` + lazy import in `src/routes/studio.tsx`) because three.js is not SSR-safe.
- Studio's global body styles are scoped to a `.studio-root` wrapper class so they don't leak into the landing page; keep it that way when editing `src/studio/index.css`.
- `tsconfig.json` has `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, and `noPropertyAccessFromIndexSignature` disabled to match the source project's looser strictness; don't re-enable without fixing the ported code.
- `react-resizable-panels` v3 renamed `PanelGroup`/`PanelResizeHandle`; the resizable wrappers in both apps alias the old names — keep the aliases.
- Web fonts load via `<link>` in `src/routes/__root.tsx` head, never via CSS `@import` of remote URLs.
- The old Replit api-server was only a health check and was intentionally not ported; there is no database or auth.
