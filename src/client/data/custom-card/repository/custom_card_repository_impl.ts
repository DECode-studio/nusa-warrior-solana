import { inject, injectable } from "@needle-di/core";
import type { CustomCardRepository } from "@/client/domain/custom-card/repository/custom_card_repository";
import type {
  CustomCardPricingEntity,
  CreateCustomCardParams,
  CreateCustomCardResultEntity,
} from "@/client/domain/custom-card/entity/custom_card_entity";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import { mapCardModelToEntity } from "@/client/data/card/model/card_model";
import { CustomCardRemoteDataSource } from "../datasource/custom_card_remote_datasource";
import {
  mapPricingModelToEntity,
  mapCreateCustomCardResponseToEntity,
} from "../model/custom_card_model";

@injectable()
export class CustomCardRepositoryImpl implements CustomCardRepository {
  constructor(
    private readonly dataSource: CustomCardRemoteDataSource = inject(
      CustomCardRemoteDataSource
    )
  ) {}

  public async getPricing(): Promise<CustomCardPricingEntity> {
    const raw = await this.dataSource.getPricing();
    return mapPricingModelToEntity(raw);
  }

  public async prepareBurn(): Promise<{
    requiresBurn: boolean;
    serializedTransaction: string | null;
  }> {
    return this.dataSource.prepareBurn();
  }

  public async createCustomCard(
    params: CreateCustomCardParams
  ): Promise<CreateCustomCardResultEntity> {
    const formData = new FormData();
    formData.append("name", params.name);
    formData.append("kingdom", params.kingdom);
    formData.append("role", params.role);
    formData.append("gender", params.gender);
    formData.append("attack", String(params.attack));
    formData.append("defense", String(params.defense));
    formData.append("description", params.description);
    formData.append("disclaimerAccepted", String(params.disclaimerAccepted));
    formData.append("artwork", params.artwork);
    if (params.cropScale !== undefined) {
      formData.append("cropScale", String(params.cropScale));
    }
    if (params.cropOffsetX !== undefined) {
      formData.append("cropOffsetX", String(params.cropOffsetX));
    }
    if (params.cropOffsetY !== undefined) {
      formData.append("cropOffsetY", String(params.cropOffsetY));
    }
    if (params.txSignature) {
      formData.append("txSignature", params.txSignature);
    }

    const raw = await this.dataSource.createCustomCard(formData);
    return mapCreateCustomCardResponseToEntity(raw);
  }

  public async listUserCustomCards(): Promise<CardEntity[]> {
    const raw = await this.dataSource.listUserCustomCards();
    return raw.map(mapCardModelToEntity);
  }
}

