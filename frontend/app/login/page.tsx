"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [needTotp, setNeedTotp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password, totp);
      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.data && typeof err.data === "object" && "totp_code" in err.data) {
        setNeedTotp(true);
        setError("Code de vérification à deux facteurs requis.");
      } else {
        setError(err instanceof Error ? err.message : "Connexion impossible.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-dvh grid md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-between bg-wagadu-bark text-wagadu-ivory p-10 wagadu-branches">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/brand/logo-mark.png" alt="Wagadu Africa" width={44} height={44} className="rounded-lg" />
          <span className="font-display text-2xl">Wagadu&nbsp;Hub</span>
        </Link>
        <div>
          <Image src="/brand/logo-negatif.png" alt="Wagadu Africa" width={180} height={137} className="mb-6" />
          <p className="font-display text-4xl leading-tight">
            La plateforme interne de Wagadu&nbsp;Africa
          </p>
          <p className="mt-4 text-wagadu-sand/80 max-w-sm">
            RH, courrier, tâches, documents et réunions — un seul accès sécurisé,
            sur ordinateur comme sur mobile.
          </p>
        </div>
        <p className="text-xs text-wagadu-sand/60">Projet Blue-Track</p>
      </div>

      <div className="flex flex-col items-center justify-center p-6 wagadu-branches">
        <Link href="/" className="md:hidden flex items-center gap-2 mb-6">
          <Image src="/brand/logo-mark.png" alt="Wagadu Africa" width={40} height={40} className="rounded-lg" />
          <span className="font-display text-xl text-wagadu-brown">Wagadu&nbsp;Hub</span>
        </Link>
        <form onSubmit={onSubmit} className="card w-full max-w-sm space-y-4">
          <h1 className="font-display text-2xl text-wagadu-brown">Connexion</h1>

          <div>
            <label className="label" htmlFor="email">Adresse e-mail</label>
            <input id="email" type="email" required autoComplete="username"
              className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <label className="label" htmlFor="password">Mot de passe</label>
            <input id="password" type="password" required autoComplete="current-password"
              className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          {needTotp && (
            <div>
              <label className="label" htmlFor="totp">Code à deux facteurs</label>
              <input id="totp" inputMode="numeric" className="input font-mono"
                value={totp} onChange={(e) => setTotp(e.target.value)} />
            </div>
          )}

          {error && <p className="text-sm text-wagadu-terracotta">{error}</p>}

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </main>
  );
}
