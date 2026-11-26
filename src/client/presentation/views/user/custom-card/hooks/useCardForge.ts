"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useTranslator } from "@/core/translator";
import { getService } from "@/core/di/container";
import { CUSTOM_CARD_USECASE_TOKEN } from "@/core/di/tokens";
import { sendBase64SolanaTx } from "@/core/utils/solana-tx-client";
import type {
  CustomCardPricingEntity,
  CreateCustomCardResultEntity,
} from "@/client/domain/custom-card/entity/custom_card_entity";
import type { CardEntity } from "@/client/domain/card/entity/card_entity";
import { CARD_FORGE_TEXT_CONSTANT } from "../constants/TextConstant";

export interface KingdomOption {
  readonly id: string;
  readonly name: string;
  readonly tag: string;
  readonly color: string;
  readonly template: string;
}

export const KINGDOM_OPTIONS: readonly KingdomOption[] = [
  { id: "MAJAPAHIT", name: "Majapahit", tag: "Surya Wilwatikta", color: "#F59E0B", template: "majapahit" },
  { id: "PAJAJARAN", name: "Pajajaran", tag: "Kujang Pakuan", color: "#10B981", template: "pajajaran" },
  { id: "DEMAK_CIREBON", name: "Demak-Cirebon", tag: "Pesisir Jawa", color: "#3B82F6", template: "demak" },
  { id: "BANTEN", name: "Banten", tag: "Surosowan", color: "#EC4899", template: "banten" },
  { id: "DAHA_KADIRI", name: "Daha (Kadiri)", tag: "Hamenang", color: "#8B5CF6", template: "daha" },
  { id: "NUSANTARA_UMUM", name: "Nusantara (Keta)", tag: "Pesisir Timur", color: "#F97316", template: "keta" },
  { id: "PORTUGIS", name: "Portugis", tag: "Armada Samudra", color: "#06B6D4", template: "portugis" },
] as const;

export const ROLE_OPTIONS = [
  { id: "PEMIMPIN", label: "Pemimpin" },
  { id: "PRAJURIT", label: "Prajurit" },
  { id: "PEMUKA", label: "Pemuka" },
  { id: "PERAJIN", label: "Perajin" },
  { id: "UTUSAN", label: "Utusan" },
] as const;

export interface UseCardForgeReturn {
  name: string;
  setName: (val: string) => void;
  kingdom: string;
  setKingdom: (val: string) => void;
  selectedKingdom: KingdomOption;
  role: string;
  setRole: (val: string) => void;
  gender: "LAKI_LAKI" | "PEREMPUAN";
  setGender: (val: "LAKI_LAKI" | "PEREMPUAN") => void;
  attack: number;
  defense: number;
  handleAttackChange: (val: number) => void;
  handleDefenseChange: (val: number) => void;
  applyPreset: (atk: number, def: number) => void;
  totalBp: number;
  maxBp: number;
  isBpOver: boolean;
  description: string;
  setDescription: (val: string) => void;
  disclaimerAccepted: boolean;
  setDisclaimerAccepted: (val: boolean) => void;
  imageFile: File | null;
  imagePreviewUrl: string | null;
  imageDimensions: { width: number; height: number } | null;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  cropScale: number;
  setCropScale: React.Dispatch<React.SetStateAction<number>>;
  cropOffsetX: number;
  setCropOffsetX: React.Dispatch<React.SetStateAction<number>>;
  cropOffsetY: number;
  setCropOffsetY: React.Dispatch<React.SetStateAction<number>>;
  handleResetCrop: () => void;
  pricing: CustomCardPricingEntity | null;
  isLoadingPricing: boolean;
  isSubmitting: boolean;
  errorMsg: string | null;
  successCard: CardEntity | null;
  handleCreateAnother: () => void;
  submitCard: (e: React.FormEvent) => Promise<void>;
}

export function useCardForge(): UseCardForgeReturn {
  const { t } = useTranslator();
  const { connection } = useConnection();
  const { connected, publicKey, signTransaction, sendTransaction } = useWallet();
  const customCardUseCase = useMemo(() => getService(CUSTOM_CARD_USECASE_TOKEN), []);
  const [isSubmitting, startTransition] = useTransition();

  // State Form
  const [name, setName] = useState("Ksatria Baru");
  const [kingdom, setKingdom] = useState<string>("MAJAPAHIT");
  const [role, setRole] = useState<string>("PRAJURIT");
  const [gender, setGender] = useState<"LAKI_LAKI" | "PEREMPUAN">("LAKI_LAKI");
  const [attack, setAttack] = useState<number>(1050);
  const [defense, setDefense] = useState<number>(1050);
  const [description, setDescription] = useState(
    "Sosok pahlawan tangguh yang mengabdikan hidupnya demi menjaga kedaulatan dan kemakmuran tanah Nusantara."
  );
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  // Artwork & Crop/Pan/Zoom Transform
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [cropScale, setCropScale] = useState<number>(1);
  const [cropOffsetX, setCropOffsetX] = useState<number>(0);
  const [cropOffsetY, setCropOffsetY] = useState<number>(0);

  const handleResetCrop = () => {
    setCropScale(1);
    setCropOffsetX(0);
    setCropOffsetY(0);
  };

  // Pricing & Status
  const [pricing, setPricing] = useState<CustomCardPricingEntity | null>(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successCard, setSuccessCard] = useState<CardEntity | null>(null);

  const fetchPricing = async () => {
    setIsLoadingPricing(true);
    try {
      const data = await customCardUseCase.getPricing();
      setPricing(data);
    } catch (e: unknown) {
      const msg =
        e instanceof Error
          ? e.message
          : t(CARD_FORGE_TEXT_CONSTANT.ERROR_LOAD_PRICING_FAILED);
      setErrorMsg(msg);
    } finally {
      setIsLoadingPricing(false);
    }
  };

  useEffect(() => {
    void fetchPricing();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrorMsg(t(CARD_FORGE_TEXT_CONSTANT.ERROR_INVALID_IMAGE_FORMAT));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(t(CARD_FORGE_TEXT_CONSTANT.ERROR_IMAGE_TOO_LARGE));
      return;
    }

    setErrorMsg(null);
    setImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreviewUrl(objectUrl);
    setCropScale(1);
    setCropOffsetX(0);
    setCropOffsetY(0);

    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = objectUrl;
  };

  const totalBp = attack + defense;
  const maxBp = pricing?.battlePointCap ?? 2100;
  const isBpOver = totalBp > maxBp;

  const handleAttackChange = (val: number) => {
    setAttack(val);
    if (val + defense > maxBp) {
      setDefense(Math.max(100, maxBp - val));
    }
  };

  const handleDefenseChange = (val: number) => {
    setDefense(val);
    if (attack + val > maxBp) {
      setAttack(Math.max(100, maxBp - val));
    }
  };

  const applyPreset = (atk: number, def: number) => {
    setAttack(atk);
    setDefense(def);
  };

  const submitCard = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageFile) {
      setErrorMsg(t(CARD_FORGE_TEXT_CONSTANT.ERROR_NO_IMAGE));
      return;
    }
    if (!disclaimerAccepted) {
      setErrorMsg(t(CARD_FORGE_TEXT_CONSTANT.ERROR_DISCLAIMER_REQUIRED));
      return;
    }
    if (isBpOver) {
      setErrorMsg(t(CARD_FORGE_TEXT_CONSTANT.ERROR_BP_OVER, { maxBp }));
      return;
    }

    setErrorMsg(null);

    startTransition(async () => {
      try {
        let txSignature: string | undefined;
        if (pricing && pricing.nextCost > 0) {
          if (!connected || !publicKey) {
            throw new Error(
              "Hubungkan dompet Solana (Phantom) terlebih dahulu untuk burn NUSA."
            );
          }
          const prepared = await customCardUseCase.prepareBurn();
          if (prepared.requiresBurn && prepared.serializedTransaction) {
            txSignature = await sendBase64SolanaTx({
              serializedTransaction: prepared.serializedTransaction,
              connection,
              signTransaction,
              sendTransaction,
            });
          }
        }

        const result: CreateCustomCardResultEntity = await customCardUseCase.createCustomCard({
          name,
          kingdom,
          role,
          gender,
          attack,
          defense,
          description,
          disclaimerAccepted: true,
          artwork: imageFile,
          cropScale,
          cropOffsetX,
          cropOffsetY,
          txSignature,
        });

        setSuccessCard(result.card);
        void fetchPricing();
      } catch (err: unknown) {
        setErrorMsg(
          err instanceof Error ? err.message : t(CARD_FORGE_TEXT_CONSTANT.ERROR_GENERAL)
        );
      }
    });
  };

  const handleCreateAnother = () => {
    setSuccessCard(null);
    setImageFile(null);
    setImagePreviewUrl(null);
    setImageDimensions(null);
    setCropScale(1);
    setCropOffsetX(0);
    setCropOffsetY(0);
  };

  const selectedKingdom = useMemo(
    () => KINGDOM_OPTIONS.find((k) => k.id === kingdom) ?? KINGDOM_OPTIONS[0],
    [kingdom]
  );

  return {
    name,
    setName,
    kingdom,
    setKingdom,
    selectedKingdom,
    role,
    setRole,
    gender,
    setGender,
    attack,
    defense,
    handleAttackChange,
    handleDefenseChange,
    applyPreset,
    totalBp,
    maxBp,
    isBpOver,
    description,
    setDescription,
    disclaimerAccepted,
    setDisclaimerAccepted,
    imageFile,
    imagePreviewUrl,
    imageDimensions,
    handleImageChange,
    cropScale,
    setCropScale,
    cropOffsetX,
    setCropOffsetX,
    cropOffsetY,
    setCropOffsetY,
    handleResetCrop,
    pricing,
    isLoadingPricing,
    isSubmitting,
    errorMsg,
    successCard,
    handleCreateAnother,
    submitCard,
  };
}

