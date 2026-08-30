"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { Icon } from "@/components/Icon";

interface Status {
  rocketchat: { configured: boolean };
  jitsi: { configured: boolean; jwt: boolean };
}

interface SSO {
  url: string;
  user_id: string;
  auth_token: string;
}

export default function MessageriePage() {
  const { data: status, loading: statusLoading } = useApi<Status>("/integrations/status/");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [sso, setSso] = useState<SSO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!status?.rocketchat.configured) return;
    api<SSO>("/chat/sso/", { method: "POST", body: {} })
      .then(setSso)
      .catch((e) => setError(e instanceof Error ? e.message : "Connexion impossible"));
  }, [status]);

  // Protocole d'intégration iframe Rocket.Chat.
  const pushLogin = useCallback(() => {
    if (!sso || !iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      { event: "login-with-token", loginToken: sso.auth_token },
      new URL(sso.url).origin,
    );
  }, [sso]);

  useEffect(() => {
    if (!sso) return;
    const onMessage = (ev: MessageEvent) => {
      if (ev.origin !== new URL(sso.url).origin) return;
      const data = ev.data as { eventName?: string };
      if (data?.eventName === "startup" || data?.eventName === "Custom_Script_On_Logout") {
        pushLogin();
      }
      if (data?.eventName === "Custom_Script_Logged_In" || data?.eventName === "startup") {
        setReady(true);
      }
    };
    window.addEventListener("message", onMessage);
    // filet de sécurité : quelques tentatives espacées le temps du chargement
    const timers = [1500, 4000, 8000].map((d) => setTimeout(pushLogin, d));
    return () => {
      window.removeEventListener("message", onMessage);
      timers.forEach(clearTimeout);
    };
  }, [sso, pushLogin]);

  if (statusLoading) {
    return <p className="text-sm text-wagadu-brown animate-fade">Chargement…</p>;
  }

  if (!status?.rocketchat.configured) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl text-wagadu-brown">Messagerie</h1>
        <div className="card space-y-2">
          <p className="text-sm">
            La messagerie instantanée (Rocket.Chat) n&apos;est pas active sur cette instance.
          </p>
          <p className="text-sm opacity-70">
            Pour l&apos;activer en local :{" "}
            <code className="font-mono text-xs bg-wagadu-sand/60 px-1 py-0.5 rounded">
              cd infra &amp;&amp; docker compose --profile chat up -d
            </code>{" "}
            (les variables <code className="font-mono text-xs">ROCKETCHAT_*</code> sont déjà
            renseignées dans <code className="font-mono text-xs">infra/.env</code>).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-wagadu-brown">Messagerie</h1>
        {sso && (
          <a
            href={sso.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost text-sm"
          >
            <Icon name="chat" className="w-4 h-4" /> Ouvrir dans un onglet
          </a>
        )}
      </div>

      {error && <p className="text-sm text-wagadu-terracotta">{error}</p>}

      {sso ? (
        <div className="relative rounded-2xl overflow-hidden border border-wagadu-sand">
          {!ready && (
            <div className="absolute inset-0 grid place-items-center bg-wagadu-ivory/70 z-10">
              <p className="text-sm text-wagadu-brown animate-fade">Connexion à la messagerie…</p>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={sso.url}
            title="Messagerie Wagadu"
            onLoad={pushLogin}
            className="w-full bg-white"
            style={{ height: "78vh" }}
          />
        </div>
      ) : (
        <p className="text-sm opacity-60">Connexion à la messagerie…</p>
      )}
    </div>
  );
}
