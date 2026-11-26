import { createCatchAllHandlers } from "@/server/shared/http/catch-all-router";
import * as login from "@/server/http/v1/auth/login/route";
import * as logout from "@/server/http/v1/auth/logout/route";
import * as me from "@/server/http/v1/auth/me/route";
import * as refresh from "@/server/http/v1/auth/refresh/route";
import * as solanaNonce from "@/server/http/v1/auth/solana/nonce/route";
import * as solanaRegister from "@/server/http/v1/auth/solana/register/route";
import * as solanaVerify from "@/server/http/v1/auth/solana/verify/route";

export const { GET, POST, PUT, PATCH, DELETE } = createCatchAllHandlers([
  { pattern: "login", mod: login },
  { pattern: "logout", mod: logout },
  { pattern: "me", mod: me },
  { pattern: "refresh", mod: refresh },
  { pattern: "solana/nonce", mod: solanaNonce },
  { pattern: "solana/register", mod: solanaRegister },
  { pattern: "solana/verify", mod: solanaVerify },
]);
