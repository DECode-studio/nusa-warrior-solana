import "server-only";
import type {
  PaymentGatewayUserQueryFilter,
  PaymentMode,
} from "../domain/payment.repository";
import { paymentRepository } from "../infrastructure/payment.repository.impl";

export async function getPaymentGatewaySettingsUseCase(
  filter?: PaymentGatewayUserQueryFilter
) {
  return paymentRepository.getSettings(filter);
}

export async function setPaymentGatewayModeUseCase(mode: PaymentMode, adminUserId: string) {
  return paymentRepository.setGlobalMode(mode, adminUserId);
}

export async function setUserPaymentModeOverrideUseCase(userId: string, mode: PaymentMode | null) {
  return paymentRepository.setUserOverride(userId, mode);
}

export async function resolvePaymentModeForUserUseCase(userId: string) {
  return paymentRepository.resolveModeForUser(userId);
}
