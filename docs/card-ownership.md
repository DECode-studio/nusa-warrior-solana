# Card ownership

`UserCard` is the server-side source of truth for each player's inventory. The collection API derives the user from the authenticated session. Deck creation checks ownership again on the server, and saved or preset decks are only listed when the account owns every card in them.

Starter pack checkout currently uses the app's sandbox payment flow. A successful sandbox order and its card grants are committed together in Prisma. The embedded local store follows the same ownership rules for development.

## Activate the PostgreSQL store

The app uses `.data/nusantara-db.json` when `NUSANTARA_STORAGE_DRIVER=embedded` and PostgreSQL when it is set to `prisma`. Before switching an existing database, ensure the Prisma schema is applied and the application data has been imported:

1. For a fresh database, run `npx prisma db push`. For an existing database, apply pending files in `prisma/migrations` order; see `docs/game-integrity.md`.
2. Import existing users, decks, cards, orders, and ownership before activating PostgreSQL. Do not point production at an empty database when its users still live in the embedded store.
3. Set `NUSANTARA_STORAGE_DRIVER=prisma` and the correct `DATABASE_URL` in the server environment, then restart the app.
4. Run `npm run db:generate` after changing the Prisma schema.

The seed assigns the demo player the first starter pack idempotently. New accounts receive cards through a successful starter pack checkout; there is no grant based on client-provided card IDs or slugs.
