# Story Mode

## Requirements

- Players can enter the Majapahit and Pajajaran campaigns independently and switch between them at any time.
- Campaigns contain ordered story missions with choices that can influence later narration.
- A completed mission can be replayed. Replay Nusa Point rewards diminish by half per replay, with a minimum of one point before daily caps.
- The first clear of a campaign's final boss grants one random, unowned high-end card: a character of that campaign's kingdom or any high-end instrument.
- Replaying completed missions does not grant additional cards.
- Winning the final boss marks the campaign complete and presents an ending scene.

## Architecture

### Frontend

- Add a Story Mode route with campaign selection, mission map, choice prompts, deck selection, progress state, and campaign ending.
- Start each mission through an authenticated API and enter the existing battle arena.
- Claim the result after an authoritative battle win; show the result on return to Story Mode.

### Backend

- Store one progress record per user and kingdom, including completed missions, choices, replay counts, and claimed battle ids.
- Persist story metadata on battle sessions so the server can validate mission wins.
- Use the existing battle engine and card catalog. Grant points and a final-boss card with idempotent ledger operations.
- Support Prisma and embedded development storage.

### Security

- Require player sessions and same-origin mutation checks on all Story Mode mutations.
- Validate kingdom, mission, choice, deck ownership, mission unlocks, battle ownership, and battle outcome server-side.
- Use per-user/per-campaign locking and unique reward identifiers to prevent duplicate claims.

## Implementation

- [x] Add campaign content and persistent progress model.
- [x] Add authenticated campaign and mission APIs.
- [x] Connect story missions to battle sessions and reward claims.
- [x] Add the Story Mode page and ending scenes.
- [x] Add replay decay, daily point caps, and idempotent reward claims.
