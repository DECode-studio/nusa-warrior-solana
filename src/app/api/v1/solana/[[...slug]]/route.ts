import { createCatchAllHandlers } from "@/server/shared/http/catch-all-router";
import * as mintPack from "@/server/http/v1/solana/cards/mint-pack/route";
import * as dexPools from "@/server/http/v1/solana/dex/pools/route";
import * as dexQuote from "@/server/http/v1/solana/dex/quote/route";
import * as dexSwap from "@/server/http/v1/solana/dex/swap/route";
import * as faucet from "@/server/http/v1/solana/faucet/route";
import * as rpc from "@/server/http/v1/solana/rpc/route";
import * as tokenBalances from "@/server/http/v1/solana/tokens/balances/route";
import * as tokenFaucet from "@/server/http/v1/solana/tokens/faucet/route";
import * as tokenClaimPrepare from "@/server/http/v1/solana/tokens/claim/prepare/route";
import * as tokenClaimConfirm from "@/server/http/v1/solana/tokens/claim/confirm/route";

export const { GET, POST, PUT, PATCH, DELETE } = createCatchAllHandlers([
  { pattern: "cards/mint-pack", mod: mintPack },
  { pattern: "dex/pools", mod: dexPools },
  { pattern: "dex/quote", mod: dexQuote },
  { pattern: "dex/swap", mod: dexSwap },
  { pattern: "faucet", mod: faucet },
  { pattern: "rpc", mod: rpc },
  { pattern: "tokens/balances", mod: tokenBalances },
  { pattern: "tokens/faucet", mod: tokenFaucet },
  { pattern: "tokens/claim/prepare", mod: tokenClaimPrepare },
  { pattern: "tokens/claim/confirm", mod: tokenClaimConfirm },
]);
