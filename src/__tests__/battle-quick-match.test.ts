import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { battleRepository } from "@/server/modules/battle/infrastructure/battle.repository.impl";

const TEST_USER_ID = `qm-test-user-${randomUUID()}`;

function createDummySessionBuilder() {
  return () => {
    throw new Error("buildSession should not be called without an opponent");
  };
}

describe("Quick Match Queue Re-Enqueue", () => {
  const prevDriver = process.env.NUSANTARA_STORAGE_DRIVER;

  afterEach(async () => {
    process.env.NUSANTARA_STORAGE_DRIVER = "embedded";
    await battleRepository.cancelQuickMatchQueue(TEST_USER_ID).catch(() => false);
    if (prevDriver === undefined) {
      delete process.env.NUSANTARA_STORAGE_DRIVER;
    } else {
      process.env.NUSANTARA_STORAGE_DRIVER = prevDriver;
    }
  });

  it("resumes an existing WAITING queue entry instead of throwing 409 conflict", async () => {
    process.env.NUSANTARA_STORAGE_DRIVER = "embedded";

    const firstKey = randomUUID();
    const secondKey = randomUUID();
    const thirdKey = randomUUID();

    const firstResult = await battleRepository.processQuickMatchQueue({
      userId: TEST_USER_ID,
      enqueue: {
        id: randomUUID(),
        userId: TEST_USER_ID,
        deckId: "deck-alpha",
        deckName: "Deck Alpha",
        battlePower: 120,
        characterSlugs: ["patih-gajah-mada"],
        instrumentSlugs: ["angklung"],
        idempotencyKey: firstKey,
        acceptedAt: new Date(),
      },
      buildSession: createDummySessionBuilder(),
    });

    expect(firstResult).not.toBeNull();
    expect(firstResult?.queue.status).toBe("WAITING");
    const initialCreatedAt = firstResult?.queue.createdAt;

    const secondResult = await battleRepository.processQuickMatchQueue({
      userId: TEST_USER_ID,
      enqueue: {
        id: randomUUID(),
        userId: TEST_USER_ID,
        deckId: "deck-alpha",
        deckName: "Deck Alpha",
        battlePower: 125,
        characterSlugs: ["patih-gajah-mada"],
        instrumentSlugs: ["angklung"],
        idempotencyKey: secondKey,
        acceptedAt: new Date(),
      },
      buildSession: createDummySessionBuilder(),
    });

    expect(secondResult).not.toBeNull();
    expect(secondResult?.queue.status).toBe("WAITING");
    expect(secondResult?.queue.idempotencyKey).toBe(secondKey);
    expect(secondResult?.queue.battlePower).toBe(125);
    expect(secondResult?.queue.createdAt).toBe(initialCreatedAt);

    const thirdResult = await battleRepository.processQuickMatchQueue({
      userId: TEST_USER_ID,
      enqueue: {
        id: randomUUID(),
        userId: TEST_USER_ID,
        deckId: "deck-beta",
        deckName: "Deck Beta",
        battlePower: 210,
        characterSlugs: ["raden-wijaya"],
        instrumentSlugs: ["gamelan"],
        idempotencyKey: thirdKey,
        acceptedAt: new Date(),
      },
      buildSession: createDummySessionBuilder(),
    });

    expect(thirdResult).not.toBeNull();
    expect(thirdResult?.queue.status).toBe("WAITING");
    expect(thirdResult?.queue.deckId).toBe("deck-beta");
    expect(thirdResult?.queue.deckName).toBe("Deck Beta");
    expect(thirdResult?.queue.battlePower).toBe(210);
    expect(thirdResult?.queue.idempotencyKey).toBe(thirdKey);
  });
});
