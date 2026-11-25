# Battle server authority

PvE matches now use server-owned state. The browser sends actions to `/api/v1/battles/:id/actions`; it does not send a proposed state, dice values, score, or winner. Every accepted action uses an expected sequence number and updates the stored state with compare-and-swap semantics. The server builds decks from the authenticated user's saved deck and the server card catalog, rolls randomness on the server, and runs bot decisions there.

The battle response is a player view. It redacts hidden card identity, statistics, hand contents, and deck order while preserving counts needed by the UI. Treat all browser state and presentation as untrusted. The old client result submission endpoint returns `410 Gone`.

## Storage and deployment

`BattleSession` is stored in Prisma for production. Apply the schema change with the project's normal database migration workflow before deploying, and set `NUSANTARA_STORAGE_DRIVER=prisma`. Production refuses to start a battle on the embedded JSON store because it cannot provide cross-process atomic updates. `npm run db:generate` regenerates the Prisma client after schema changes.

Set `NEXT_PUBLIC_APP_URL` to the exact public origin used by the application. Battle and deck mutations verify the `Origin` header against it. The proxy applies a per-request nonce CSP and security headers; Google Fonts are the only external style/font source currently allowed. If the app later adds external scripts, images, or API connections, update the policy deliberately and keep `script-src` nonce-based.

## Scope still required before competitive assets

This is a single-player PvE foundation. The state model still uses `PLAYER` and `BOT`, and action/event history is stored as JSON on one session record. Multiplayer and championship work needs participant-specific views and permissions, durable event records, reconnect/timeout rules, idempotency keys, and operational rate limits. Any card wagering needs a separate append-only ownership ledger and transactional escrow/settlement; do not use the PvE result flow to settle card transfers. Competitive randomness should add a commitment/reveal audit scheme before ranked matches launch.
