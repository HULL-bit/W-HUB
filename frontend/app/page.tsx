"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const { me, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(me ? "/dashboard" : "/login");
  }, [me, loading, router]);

  return (
    <main className="min-h-dvh grid place-items-center wagadu-branches">
      <p className="font-display text-2xl text-wagadu-brown">Wagadu Hub…</p>
    </main>
  );
}
