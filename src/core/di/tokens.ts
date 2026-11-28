import { InjectionToken } from "@needle-di/core";
import type { AuthRepository } from "@/client/domain/auth/repository/auth_repository";
import type { BattleRepository } from "@/client/domain/battle/repository/battle_repository";
import type { CardRepository } from "@/client/domain/card/repository/card_repository";
import type { DeckRepository } from "@/client/domain/deck/repository/deck_repository";
import type { PaymentGatewayRepository } from "@/client/domain/payment/repository/payment_gateway_repository";
import type { ShopRepository } from "@/client/domain/shop/repository/shop_repository";
import type { AuthUseCase } from "@/client/domain/auth/usecase/auth_usecase";
import type { BattleUseCase } from "@/client/domain/battle/usecase/battle_usecase";
import type { LeagueRepository } from "@/client/domain/league/repository/league_repository";
import type { LeagueUseCase } from "@/client/domain/league/usecase/league_usecase";
import type { CardUseCase } from "@/client/domain/card/usecase/card_usecase";
import type { DeckUseCase } from "@/client/domain/deck/usecase/deck_usecase";
import type { PaymentGatewayUseCase } from "@/client/domain/payment/usecase/payment_gateway_usecase";
import type { ShopUseCase } from "@/client/domain/shop/usecase/shop_usecase";
import type { StoryModeRepository } from "@/client/domain/story-mode/repository/story_mode_repository";
import type { StoryModeUseCase } from "@/client/domain/story-mode/usecase/story_mode_usecase";
import type { CustomCardRepository } from "@/client/domain/custom-card/repository/custom_card_repository";
import type { CustomCardUseCase } from "@/client/domain/custom-card/usecase/custom_card_usecase";
import type { TeamRepository } from "@/client/domain/team/repository/team_repository";
import type { TeamUseCase } from "@/client/domain/team/usecase/team_usecase";
import type { SolanaTokenRepository } from "@/client/domain/solana-token/repository/solana_token_repository";
import type { SolanaTokenUseCase } from "@/client/domain/solana-token/usecase/solana_token_usecase";
import type { AuctionRepository } from "@/client/domain/auction/repository/auction_repository";
import type { AuctionUseCase } from "@/client/domain/auction/usecase/auction_usecase";

export const CARD_REPOSITORY_TOKEN = new InjectionToken<CardRepository>(
  "CARD_REPOSITORY_TOKEN"
);
export const DECK_REPOSITORY_TOKEN = new InjectionToken<DeckRepository>(
  "DECK_REPOSITORY_TOKEN"
);
export const BATTLE_REPOSITORY_TOKEN = new InjectionToken<BattleRepository>(
  "BATTLE_REPOSITORY_TOKEN"
);
export const LEAGUE_REPOSITORY_TOKEN = new InjectionToken<LeagueRepository>(
  "LEAGUE_REPOSITORY_TOKEN"
);
export const SHOP_REPOSITORY_TOKEN = new InjectionToken<ShopRepository>(
  "SHOP_REPOSITORY_TOKEN"
);
export const AUTH_REPOSITORY_TOKEN = new InjectionToken<AuthRepository>(
  "AUTH_REPOSITORY_TOKEN"
);
export const PAYMENT_GATEWAY_REPOSITORY_TOKEN =
  new InjectionToken<PaymentGatewayRepository>(
    "PAYMENT_GATEWAY_REPOSITORY_TOKEN"
  );
export const STORY_MODE_REPOSITORY_TOKEN = new InjectionToken<StoryModeRepository>(
  "STORY_MODE_REPOSITORY_TOKEN"
);
export const CUSTOM_CARD_REPOSITORY_TOKEN = new InjectionToken<CustomCardRepository>(
  "CUSTOM_CARD_REPOSITORY_TOKEN"
);
export const TEAM_REPOSITORY_TOKEN = new InjectionToken<TeamRepository>(
  "TEAM_REPOSITORY_TOKEN"
);
export const SOLANA_TOKEN_REPOSITORY_TOKEN =
  new InjectionToken<SolanaTokenRepository>("SOLANA_TOKEN_REPOSITORY_TOKEN");
export const AUCTION_REPOSITORY_TOKEN =
  new InjectionToken<AuctionRepository>("AUCTION_REPOSITORY_TOKEN");

export const CARD_USECASE_TOKEN = new InjectionToken<CardUseCase>(
  "CARD_USECASE_TOKEN"
);
export const DECK_USECASE_TOKEN = new InjectionToken<DeckUseCase>(
  "DECK_USECASE_TOKEN"
);
export const BATTLE_USECASE_TOKEN = new InjectionToken<BattleUseCase>(
  "BATTLE_USECASE_TOKEN"
);
export const LEAGUE_USECASE_TOKEN = new InjectionToken<LeagueUseCase>(
  "LEAGUE_USECASE_TOKEN"
);
export const SHOP_USECASE_TOKEN = new InjectionToken<ShopUseCase>(
  "SHOP_USECASE_TOKEN"
);
export const AUTH_USECASE_TOKEN = new InjectionToken<AuthUseCase>(
  "AUTH_USECASE_TOKEN"
);
export const PAYMENT_GATEWAY_USECASE_TOKEN =
  new InjectionToken<PaymentGatewayUseCase>(
    "PAYMENT_GATEWAY_USECASE_TOKEN"
  );
export const STORY_MODE_USECASE_TOKEN = new InjectionToken<StoryModeUseCase>(
  "STORY_MODE_USECASE_TOKEN"
);
export const CUSTOM_CARD_USECASE_TOKEN = new InjectionToken<CustomCardUseCase>(
  "CUSTOM_CARD_USECASE_TOKEN"
);
export const TEAM_USECASE_TOKEN = new InjectionToken<TeamUseCase>(
  "TEAM_USECASE_TOKEN"
);
export const SOLANA_TOKEN_USECASE_TOKEN =
  new InjectionToken<SolanaTokenUseCase>("SOLANA_TOKEN_USECASE_TOKEN");
export const AUCTION_USECASE_TOKEN =
  new InjectionToken<AuctionUseCase>("AUCTION_USECASE_TOKEN");

