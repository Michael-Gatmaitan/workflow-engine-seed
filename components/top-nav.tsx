"use client";

import { useEffect } from "react";
import { LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { getJwtExpiryMillis } from "@/lib/jwt";

export default function TopNav() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.accessToken) return;

    const expiryMillis = getJwtExpiryMillis(session.accessToken);
    if (expiryMillis !== null && Date.now() >= expiryMillis) {
      void signOut({ callbackUrl: "/login" });
    }
  }, [session?.accessToken]);

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-background px-6">
      <span className="text-sm font-semibold">Workflow Engine Seed</span>
      {session && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void signOut({ callbackUrl: "/login" })}
        >
          <LogOut />
          Logout
        </Button>
      )}
    </header>
  );
}
