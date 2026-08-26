"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/hooks/useAuth";
import { hasRole } from "@/lib/utils/permissions";
import { useLanguage } from "@/lib/context/LanguageContext";
import { protectedRouteTranslations } from "@/constants/translations/auth";

interface ProtectedRouteProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export default function ProtectedRoute({
  allowedRoles,
  children,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { roles, isAuthenticated, isLoading } = useAuth();
  const { language } = useLanguage();
  const t = protectedRouteTranslations[language];

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (!hasRole(roles, allowedRoles)) {
      router.replace("/access-denied");
    }
  }, [isLoading, isAuthenticated, roles, allowedRoles, router]);

  if (isLoading || !isAuthenticated || !hasRole(roles, allowedRoles)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-gray-500">{t.checkingAccess}</p>
      </div>
    );
  }

  return <>{children}</>;
}
