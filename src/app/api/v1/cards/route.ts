import type {
  CardTypeValue,
  KingdomValue,
  PublicationStatusValue,
  RoleValue,
  VerificationStatusValue,
} from "@/core/constants/cards-catalog";
import {
  listCardsPaginatedUseCase,
  listCardsUseCase,
} from "@/server/modules/card/application/card.usecase";
import {
  handleRouteError,
  okResponse,
} from "@/server/shared/http/api-response";

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const cardTypeParam = url.searchParams.get("cardType");
    const kingdomParam = url.searchParams.get("kingdom");
    const roleParam = url.searchParams.get("role");
    const verificationStatusParam =
      url.searchParams.get("verificationStatus");
    const publicationStatusParam = url.searchParams.get("publicationStatus");
    const includeWithdrawn =
      url.searchParams.get("includeWithdrawn") === "true";
    const search = url.searchParams.get("search") ?? undefined;
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");
    const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : undefined;
    const limit = limitParam ? Math.max(1, parseInt(limitParam, 10)) : undefined;

    const filter = {
      cardType: (cardTypeParam as CardTypeValue | null) ?? undefined,
      kingdom: (kingdomParam as KingdomValue | null) ?? undefined,
      role: (roleParam as RoleValue | null) ?? undefined,
      verificationStatus:
        (verificationStatusParam as VerificationStatusValue | null) ??
        undefined,
      publicationStatus:
        (publicationStatusParam as PublicationStatusValue | null) ?? undefined,
      includeWithdrawn,
      search,
      page,
      limit,
    };

    if (page !== undefined || limit !== undefined) {
      const paginated = await listCardsPaginatedUseCase(filter);
      const response = okResponse(paginated);
      response.headers.set(
        "Cache-Control",
        "public, s-maxage=60, stale-while-revalidate=300"
      );
      return response;
    }

    const cards = await listCardsUseCase(filter);

    const response = okResponse(cards, 200, { total: cards.length });
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );
    return response;
  } catch (error: unknown) {
    return handleRouteError(error, request);
  }
}

