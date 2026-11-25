import { listOwnedCards } from "@/server/modules/collection/infrastructure/collection.repository";
import { requirePlayerSession } from "@/server/shared/auth/authorization";
import { handleRouteError, okResponse } from "@/server/shared/http/api-response";
import { enforceRateLimit } from "@/server/shared/http/distributed-rate-limit";

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await requirePlayerSession();
    await enforceRateLimit(`collection:read:${session.userId}`, { capacity: 60, refillPerSecond: 1 });
    const ownedCards = await listOwnedCards(session.userId);
    const totalOwnedQuantity = ownedCards.reduce((total, item) => total + item.quantity, 0);
    let mapped = ownedCards.map(({ card, quantity }) => ({ ...card, quantity }));

    const url = new URL(request.url);
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");
    const cardType = url.searchParams.get("cardType");
    const kingdom = url.searchParams.get("kingdom");

    if (cardType && cardType !== "ALL") {
      mapped = mapped.filter((c) => c.cardType === cardType);
    }
    if (kingdom && kingdom !== "ALL") {
      mapped = mapped.filter((c) => c.kingdom === kingdom);
    }

    if (pageParam !== null || limitParam !== null) {
      const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
      const limit = limitParam ? Math.max(1, parseInt(limitParam, 10)) : 12;
      const total = mapped.reduce((sum, card) => sum + card.quantity, 0);
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      let copyOffset = 0;
      const items: Array<(typeof mapped)[number] & { copyNumber: number }> = [];
      for (const card of mapped) {
        const cardEnd = copyOffset + card.quantity;
        const firstCopy = Math.max(0, startIndex - copyOffset);
        const lastCopy = Math.min(card.quantity, endIndex - copyOffset);
        for (let copyIndex = firstCopy; copyIndex < lastCopy; copyIndex += 1) {
          items.push({ ...card, copyNumber: copyIndex + 1 });
        }
        copyOffset = cardEnd;
        if (copyOffset >= endIndex) break;
      }

      return okResponse({
        items,
        total,
        totalOwnedQuantity,
        page,
        limit,
        totalPages,
      });
    }

    return okResponse(mapped);
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}
