"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";

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
  const { data: status } = useApi<Status>("/integrations/status/");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [sso, setSso] = useState<SSO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!status?.rocketchat.configured) return;
    api<SSO>("/chat/sso/", { method: "POST", body: {} })
      .then(setSso)
      .catch((e) => setError(e instanceof Error ? e.message : "Connexion impossible"));
  }, [status]);

  // Protocole d'intégration iframe Rocket.Chat : on pousse le jeton de connexion
  useEffect(() => {
    if (!sso) return;
    const send = () => {
      iframeRef.current?.contentWindow?.postMessage(
        { externalCommand: "login-with-token", token: sso.auth_token },
        sso.url,
      );
    };
    const t = setTimeout(send, 2000);
    return () => clearTimeout(t);
  }, [sso]);

  if (status && !status.rocketchat.configured) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl text-wagadu-brown">Messagerie</h1>
        <div className="card">
          <p className="text-sm">
            La messagerie instantanée (Rocket.Chat) n&apos;est pas encore configurée sur cette
            instance. Un administrateur doit renseigner <code className="font-mono">ROCKETCHAT_URL</code> et
            les identifiants d&apos;administration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-wagadu-brown">Messagerie</h1>
        {sso && (
          <a href={sso.url} target="_blank" rel="noopener" className="btn-ghost">Ouvrir dans un onglet</a>
        )}
      </div>
      {error && <p className="text-sm text-wagadu-terracotta">{error}</p>}
      {sso ? (
        <iframe ref={iframeRef} src={sso.url} title="Messagerie Wagadu"
          className="w-full rounded-2xl border border-wagadu-sand" style={{ height: "75vh" }} />
      ) : (
        <p className="text-sm opacity-60">Connexion à la messagerie…</p>
      )}
    </div>
  );
}
