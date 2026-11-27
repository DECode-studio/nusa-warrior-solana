"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { UserEntity } from "@/client/domain/auth/entity/user_entity";
import { ROUTES } from "@/core/constants/routes";
import { getService } from "@/core/di/container";
import { AUTH_USECASE_TOKEN } from "@/core/di/tokens";
import {
  clearAuthRefreshCache,
  refreshAuthSession,
  runWithAuthMutationLock,
} from "@/core/http-client/auth-refresh";
import { useTranslator } from "@/core/translator";
import { ADMIN_LAYOUT_SEMANTIC_IDS } from "./constants/SemanticIdConstant";
import { ADMIN_LAYOUT_TEXT_CONSTANT } from "./constants/TextConstant";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { AdminMobileDrawer } from "./AdminMobileDrawer";
import { SessionHeartbeat } from "@/client/presentation/components/SessionHeartbeat";

interface AdminLayoutShellProps {
  children: React.ReactNode;
  initialAdminUser?: UserEntity | null;
}

export function AdminLayoutShell({
  children,
  initialAdminUser = null,
}: AdminLayoutShellProps): React.ReactElement {
  const pathname = usePathname() ?? "";
  const { locale, t } = useTranslator();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<UserEntity | null>(initialAdminUser);
  const [checkingAuth, setCheckingAuth] = useState(!initialAdminUser);
  const loggingOutRef = useRef(false);

  const isLoginRoute = pathname.endsWith("/admin/login");

  useEffect(() => {
    if (initialAdminUser) {
      setAdminUser(initialAdminUser);
      setCheckingAuth(false);
    }
  }, [initialAdminUser]);

  useEffect(() => {
    if (isLoginRoute || initialAdminUser) {
      setCheckingAuth(false);
      return;
    }

    let active = true;
    const verifyAdmin = async (): Promise<void> => {
      setCheckingAuth(true);
      try {
        const authUseCase = getService(AUTH_USECASE_TOKEN);
        let me = await authUseCase.getCurrentUser();
        if (!active) return;

        if (!me) {
          const refreshed = await refreshAuthSession({ force: true });
          if (!active) return;
          if (refreshed) {
            me = await authUseCase.getCurrentUser();
            if (!active) return;
          }
        }

        const isAdminOrCurator =
          me !== null && (me.role === "ADMIN" || me.role === "CURATOR");
        setAdminUser(isAdminOrCurator ? me : null);

        if (!isAdminOrCurator) {
          window.location.assign(ROUTES.ADMIN_LOGIN(locale));
        }
      } catch {
        if (!active) return;
        if (!adminUser) {
          setAdminUser(null);
          window.location.assign(ROUTES.ADMIN_LOGIN(locale));
        }
      } finally {
        if (active) {
          setCheckingAuth(false);
        }
      }
    };
    void verifyAdmin();
    return () => {
      active = false;
    };
  }, [adminUser, initialAdminUser, isLoginRoute, locale]);

  // If currently on /admin/login, render login view without sidebar/header shell
  if (isLoginRoute) {
    return <>{children}</>;
  }

  const handleLogout = async (): Promise<void> => {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    try {
      const authUseCase = getService(AUTH_USECASE_TOKEN);
      await runWithAuthMutationLock(() => authUseCase.logout());
      clearAuthRefreshCache();
    } catch {
      // Ignore logout error
    } finally {
      setAdminUser(null);
      window.location.assign(`${ROUTES.ADMIN_LOGIN(locale)}&loggedOut=1`);
    }
  };

  if (checkingAuth && !adminUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080220] text-white">
        <div className="rounded-[24px] border border-[rgba(103,102,255,0.28)] bg-[#0F0927] px-8 py-6 text-center">
          <div className="font-display text-lg font-bold text-white">
            {t(ADMIN_LAYOUT_TEXT_CONSTANT.AUTH_CHECKING)}
          </div>
          <p className="mt-1 text-xs text-[#CFCBE2]">
            {t(ADMIN_LAYOUT_TEXT_CONSTANT.AUTH_REQUIRED)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      id={ADMIN_LAYOUT_SEMANTIC_IDS.SHELL}
      className="min-h-screen bg-[#080220] text-white"
    >
      <SessionHeartbeat />
      <AdminSidebar
        currentPath={pathname}
        adminUsername={adminUser?.name}
        onLogout={() => void handleLogout()}
      />

      <AdminMobileDrawer
        isOpen={isMobileDrawerOpen}
        currentPath={pathname}
        onClose={() => setIsMobileDrawerOpen(false)}
        onLogout={() => void handleLogout()}
      />

      <div className="flex min-h-screen flex-col md:pl-72 lg:pl-80 transition-all">
        <AdminHeader
          currentPath={pathname}
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
          onLogout={() => void handleLogout()}
        />

        <main className="flex-1 px-4 pt-24 pb-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}

