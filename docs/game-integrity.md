# Game integrity foundations

## Card ledger and escrow

`UserCard.quantity` is the available-balance projection. `CardLedgerTransaction` and signed `CardLedgerEntry` rows form the audit history; every card movement has a zero-sum pair. Existing inventory is imported as an opening balance by the migration. Starter pack grants are recorded in the same transaction as the paid sandbox order.

`reserveCardsInEscrow`, `settleCardEscrow`, and `releaseCardEscrow` are server-only operations. Reservation checks and decrements available inventory inside a PostgreSQL transaction, then writes the escrow and ledger entries. Settlement must only be called by a trusted server-side result handler. There is intentionally no public endpoint that lets a player select a winner or release a wager. The scheduled sweep releases expired holds to their original owner. `/api/v1/admin/card-ledger/audit` compares the ledger to available balances and open escrows.

This is card custody groundwork, not a complete PvP or championship flow. The current battle engine still plays against a bot; competitive matchmaking, stake valuation rules, dispute review, and the trusted match-result handler must exist before any escrow is settled to a winner.

For an existing PostgreSQL database with the base application tables, apply pending SQL migrations in order with `npx prisma db execute --file ...`: `20261027000000_user_card_ownership`, `20261027000100_game_integrity`, then `20261027000200_starter_pack_catalog`. The first migration creates `user_cards`; the second backfills the ledger from it. For a new, empty database, initialize the current schema with `npx prisma db push` instead of replaying these additive migrations against the schema it just created. Compare the live database to `prisma/schema.prisma` with `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script` before switching `NUSANTARA_STORAGE_DRIVER=prisma` and restarting the server.

## Reconnect and timeout

The browser stores the active battle ID in session storage and reconnects to fetch the server state after a reload. It sends a presence heartbeat every 15 seconds. The server treats a session as disconnected after 45 seconds without a heartbeat and allows 90 seconds to reconnect. Each player turn has a five-minute deadline. Expired sessions become `ABANDONED`; the server appends the timeout to the chained audit events. These are initial policies and should become per-mode rules before ranked PvP.

Configure a scheduler to call `POST /api/v1/internal/battles/sweep` periodically with `Authorization: Bearer $BATTLE_SWEEP_SECRET`. Use a secret with at least 32 characters. The endpoint marks timed-out battles and releases expired escrows.

## Distributed rate limit

With Prisma storage enabled, API token buckets are updated atomically in PostgreSQL, so all application instances share limits. The embedded development store falls back to a process-local bucket and does not provide cross-instance enforcement. Sensitive battle, reconnect, deck-creation, and checkout routes have per-user policies.

## Randomness audit

Battle creation commits to a 32-byte server seed using SHA-256 before returning the session. All gameplay-affecting shuffles and dice draws use a deterministic HMAC-SHA-256 stream with rejection sampling; accepted draw ranges, labels, values, and counters are recorded. Battle action events form a SHA-256 hash chain. The seed remains encrypted and private while the session is active; after completion or timeout it is revealed with the draws and final state hash for replay checks.

Set `BATTLE_RNG_ENCRYPTION_KEY` to 32 random bytes encoded as 64 hex characters in production. Development may use a plaintext seed marker when the key is absent. This event chain is tamper-evident only when its head is retained outside the same database; anchoring commitments and heads in an independent append-only log is required for stronger operator-resistant audits.
