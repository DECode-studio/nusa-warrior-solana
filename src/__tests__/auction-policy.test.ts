import { describe, expect, it } from "vitest";
import {
  AUCTION_POLICY,
  calculateAuctionFeeSplit,
  computeAntiSnipeExtension,
  computeMinNextBid,
} from "@/server/modules/auction/domain/auction.types";

describe("Auction Domain Policy", () => {
  it("charges 10% platform fee and gives 90% to seller", () => {
    expect(calculateAuctionFeeSplit(1000)).toEqual({
      feeAmount: 100,
      sellerPayout: 900,
    });
    expect(calculateAuctionFeeSplit(155)).toEqual({
      feeAmount: 15,
      sellerPayout: 140,
    });
  });

  it("requires +50 NUSA for the first bid and at least +50 NUSA for subsequent bids", () => {
    expect(computeMinNextBid(100, 0, 0)).toBe(150);
    expect(computeMinNextBid(100, 150, 1)).toBe(200);
    expect(computeMinNextBid(100, 350, 3)).toBe(400);
  });

  it("extends auction by 5 minutes during final 5 minutes and caps at 30 minutes", () => {
    const baseEnd = 1_700_000_000_000;
    const outsideWindow = computeAntiSnipeExtension({
      nowMs: baseEnd - 600_000,
      endsAtMs: baseEnd,
      extendedSecs: 0,
    });
    expect(outsideWindow.wasExtended).toBe(false);
    expect(outsideWindow.nextEndsAtMs).toBe(baseEnd);

    const insideWindow = computeAntiSnipeExtension({
      nowMs: baseEnd - 120_000,
      endsAtMs: baseEnd,
      extendedSecs: 0,
    });
    expect(insideWindow.wasExtended).toBe(true);
    expect(insideWindow.nextExtendedSecs).toBe(
      AUCTION_POLICY.antiSnipeExtensionSecs
    );
    expect(insideWindow.nextEndsAtMs).toBe(
      baseEnd + AUCTION_POLICY.antiSnipeExtensionSecs * 1000
    );

    const atCap = computeAntiSnipeExtension({
      nowMs: baseEnd - 60_000,
      endsAtMs: baseEnd,
      extendedSecs: AUCTION_POLICY.antiSnipeMaxExtensionSecs,
    });
    expect(atCap.wasExtended).toBe(false);
    expect(atCap.nextEndsAtMs).toBe(baseEnd);
  });
});
