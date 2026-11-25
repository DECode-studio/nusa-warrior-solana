import { Container, type Token } from "@needle-di/core";
import { AuthRemoteDataSource } from "@/client/data/auth/datasource/auth_remote_datasource";
import { AuthRepositoryImpl } from "@/client/data/auth/repository/auth_repository_impl";
import { BattleRemoteDataSource } from "@/client/data/battle/datasource/battle_remote_datasource";
import { BattleRepositoryImpl } from "@/client/data/battle/repository/battle_repository_impl";
import { LeagueRemoteDataSource } from "@/client/data/league/datasource/league_remote_datasource";
import { LeagueRepositoryImpl } from "@/client/data/league/repository/league_repository_impl";
import { CardRemoteDataSource } from "@/client/data/card/datasource/card_remote_datasource";
import { CardRepositoryImpl } from "@/client/data/card/repository/card_repository_impl";
import { DeckRemoteDataSource } from "@/client/data/deck/datasource/deck_remote_datasource";
import { DeckRepositoryImpl } from "@/client/data/deck/repository/deck_repository_impl";
import { PaymentGatewayRemoteDataSource } from "@/client/data/payment/datasource/payment_gateway_remote_datasource";
import { PaymentGatewayRepositoryImpl } from "@/client/data/payment/repository/payment_gateway_repository_impl";
import { ShopRemoteDataSource } from "@/client/data/shop/datasource/shop_remote_datasource";
import { ShopRepositoryImpl } from "@/client/data/shop/repository/shop_repository_impl";
import { StoryModeRemoteDataSource } from "@/client/data/story-mode/datasource/story_mode_remote_datasource";
import { StoryModeRepositoryImpl } from "@/client/data/story-mode/repository/story_mode_repository_impl";
import { CustomCardRemoteDataSource } from "@/client/data/custom-card/datasource/custom_card_remote_datasource";
import { CustomCardRepositoryImpl } from "@/client/data/custom-card/repository/custom_card_repository_impl";
import { TeamRemoteDataSource } from "@/client/data/team/datasource/team_remote_datasource";
import { TeamRepositoryImpl } from "@/client/data/team/repository/team_repository_impl";
import { AuthUseCase } from "@/client/domain/auth/usecase/auth_usecase";
import { BattleUseCase } from "@/client/domain/battle/usecase/battle_usecase";
import { LeagueUseCase } from "@/client/domain/league/usecase/league_usecase";
import { CardUseCase } from "@/client/domain/card/usecase/card_usecase";
import { DeckUseCase } from "@/client/domain/deck/usecase/deck_usecase";
import { PaymentGatewayUseCase } from "@/client/domain/payment/usecase/payment_gateway_usecase";
import { ShopUseCase } from "@/client/domain/shop/usecase/shop_usecase";
import { StoryModeUseCase } from "@/client/domain/story-mode/usecase/story_mode_usecase";
import { CustomCardUseCase } from "@/client/domain/custom-card/usecase/custom_card_usecase";
import { TeamUseCase } from "@/client/domain/team/usecase/team_usecase";
import {
  AUTH_REPOSITORY_TOKEN,
  AUTH_USECASE_TOKEN,
  BATTLE_REPOSITORY_TOKEN,
  BATTLE_USECASE_TOKEN,
  LEAGUE_REPOSITORY_TOKEN,
  LEAGUE_USECASE_TOKEN,
  CARD_REPOSITORY_TOKEN,
  CARD_USECASE_TOKEN,
  DECK_REPOSITORY_TOKEN,
  DECK_USECASE_TOKEN,
  PAYMENT_GATEWAY_REPOSITORY_TOKEN,
  PAYMENT_GATEWAY_USECASE_TOKEN,
  SHOP_REPOSITORY_TOKEN,
  SHOP_USECASE_TOKEN,
  STORY_MODE_REPOSITORY_TOKEN,
  STORY_MODE_USECASE_TOKEN,
  CUSTOM_CARD_REPOSITORY_TOKEN,
  CUSTOM_CARD_USECASE_TOKEN,
  TEAM_REPOSITORY_TOKEN,
  TEAM_USECASE_TOKEN,
} from "./tokens";

const container = new Container();

container.bind(CardRemoteDataSource);
container.bind(DeckRemoteDataSource);
container.bind(BattleRemoteDataSource);
container.bind(LeagueRemoteDataSource);
container.bind(ShopRemoteDataSource);
container.bind(AuthRemoteDataSource);
container.bind(PaymentGatewayRemoteDataSource);
container.bind(StoryModeRemoteDataSource);
container.bind(CustomCardRemoteDataSource);
container.bind(TeamRemoteDataSource);

container.bind({
  provide: CARD_REPOSITORY_TOKEN,
  useClass: CardRepositoryImpl,
});
container.bind({
  provide: DECK_REPOSITORY_TOKEN,
  useClass: DeckRepositoryImpl,
});
container.bind({
  provide: BATTLE_REPOSITORY_TOKEN,
  useClass: BattleRepositoryImpl,
});
container.bind({
  provide: LEAGUE_REPOSITORY_TOKEN,
  useClass: LeagueRepositoryImpl,
});
container.bind({
  provide: SHOP_REPOSITORY_TOKEN,
  useClass: ShopRepositoryImpl,
});
container.bind({
  provide: AUTH_REPOSITORY_TOKEN,
  useClass: AuthRepositoryImpl,
});
container.bind({
  provide: PAYMENT_GATEWAY_REPOSITORY_TOKEN,
  useClass: PaymentGatewayRepositoryImpl,
});
container.bind({
  provide: STORY_MODE_REPOSITORY_TOKEN,
  useClass: StoryModeRepositoryImpl,
});
container.bind({
  provide: CUSTOM_CARD_REPOSITORY_TOKEN,
  useClass: CustomCardRepositoryImpl,
});
container.bind({
  provide: TEAM_REPOSITORY_TOKEN,
  useClass: TeamRepositoryImpl,
});

container.bind({
  provide: CARD_USECASE_TOKEN,
  useClass: CardUseCase,
});
container.bind({
  provide: DECK_USECASE_TOKEN,
  useClass: DeckUseCase,
});
container.bind({
  provide: BATTLE_USECASE_TOKEN,
  useClass: BattleUseCase,
});
container.bind({
  provide: LEAGUE_USECASE_TOKEN,
  useClass: LeagueUseCase,
});
container.bind({
  provide: SHOP_USECASE_TOKEN,
  useClass: ShopUseCase,
});
container.bind({
  provide: AUTH_USECASE_TOKEN,
  useClass: AuthUseCase,
});
container.bind({
  provide: PAYMENT_GATEWAY_USECASE_TOKEN,
  useClass: PaymentGatewayUseCase,
});
container.bind({
  provide: STORY_MODE_USECASE_TOKEN,
  useClass: StoryModeUseCase,
});
container.bind({
  provide: CUSTOM_CARD_USECASE_TOKEN,
  useClass: CustomCardUseCase,
});
container.bind({
  provide: TEAM_USECASE_TOKEN,
  useClass: TeamUseCase,
});

export function getService<T>(token: Token<T>): T {
  return container.get(token);
}

export { container };

