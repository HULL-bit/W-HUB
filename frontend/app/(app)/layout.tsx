"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { GlobalSearch } from "@/components/GlobalSearch";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { me, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !me) router.replace("/login");
  }, [me, loading, router]);

  if (loading || !me) {
    return (
      <main className="min-h-dvh grid place-items-center wagadu-branches">
        <p className="font-display text-xl text-wagadu-brown">Chargement…</p>
      </main>
    );
  }

  return (
    <div className="md:flex min-h-dvh">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-wagadu-sand bg-white/70 px-4 md:px-8 py-2">
          <GlobalSearch />
        </header>
        <main className="flex-1 p-4 md:p-8 max-w-5xl w-full">{children}</main>
      </div>
    </div>
  );
}
