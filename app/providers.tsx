"use client";

import { LoginModalProvider } from "@/components/login-modal";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LoginModalProvider>{children}</LoginModalProvider>
    </SessionProvider>
  );
}
