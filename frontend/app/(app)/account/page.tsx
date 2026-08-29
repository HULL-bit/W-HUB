"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function AccountPage() {
  const { me, refreshMe } = useAuth();
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    first_name: me?.first_name ?? "",
    last_name: me?.last_name ?? "",
    phone: "",
    emergency_contact: me?.emergency_contact ?? "",
    bank_account: me?.bank_account ?? "",
    preferred_language: me?.preferred_language ?? "fr",
  });
  const [pwd, setPwd] = useState({ current_password: "", new_password: "" });

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    await api("/auth/me/", { method: "PATCH", body: form });
    await refreshMe();
    setMsg("Profil mis à jour.");
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      await api("/auth/change-password/", { method: "POST", body: pwd });
      setPwd({ current_password: "", new_password: "" });
      setMsg("Mot de passe modifié.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Échec.");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-wagadu-brown">Mon compte</h1>
      {msg && <p className="text-sm text-wagadu-terracotta">{msg}</p>}

      <form onSubmit={saveProfile} className="card space-y-3">
        <p className="label">Informations personnelles (libre-service)</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {(["first_name", "last_name", "phone", "emergency_contact", "bank_account"] as const).map((k) => (
            <div key={k}>
              <label className="label" htmlFor={k}>
                {{
                  first_name: "Prénom", last_name: "Nom", phone: "Téléphone",
                  emergency_contact: "Contact d'urgence", bank_account: "RIB / IBAN",
                }[k]}
              </label>
              <input id={k} className="input" value={form[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            </div>
          ))}
          <div>
            <label className="label" htmlFor="lang">Langue</label>
            <select id="lang" className="input" value={form.preferred_language}
              onChange={(e) => setForm({ ...form, preferred_language: e.target.value })}>
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
        <button className="btn-primary">Enregistrer</button>
      </form>

      <form onSubmit={changePassword} className="card space-y-3">
        <p className="label">Changer de mot de passe</p>
        <input type="password" className="input" placeholder="Mot de passe actuel"
          autoComplete="current-password" value={pwd.current_password}
          onChange={(e) => setPwd({ ...pwd, current_password: e.target.value })} />
        <input type="password" className="input" placeholder="Nouveau mot de passe"
          autoComplete="new-password" value={pwd.new_password}
          onChange={(e) => setPwd({ ...pwd, new_password: e.target.value })} />
        <button className="btn-primary">Mettre à jour</button>
      </form>

      <div className="card space-y-2">
        <p className="label">Double authentification (2FA)</p>
        <p className="text-sm">
          Statut : {me?.is_2fa_enabled ? "activée" : "désactivée"}.
        </p>
        <TwoFactor enabled={!!me?.is_2fa_enabled} onChange={refreshMe} />
      </div>
    </div>
  );
}

function TwoFactor({ enabled, onChange }: { enabled: boolean; onChange: () => Promise<void> }) {
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function start() {
    const r = await api<{ secret: string; otpauth_uri: string }>("/auth/2fa/enable/", { method: "POST", body: {} });
    setSecret(r.secret);
  }
  async function verify() {
    try {
      await api("/auth/2fa/verify/", { method: "POST", body: { code } });
      setSecret(null);
      setCode("");
      await onChange();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Code invalide");
    }
  }
  async function disable() {
    await api("/auth/2fa/disable/", { method: "POST", body: { code } });
    setCode("");
    await onChange();
  }

  if (enabled) {
    return (
      <div className="flex gap-2 items-end">
        <input className="input font-mono w-32" placeholder="Code" value={code}
          onChange={(e) => setCode(e.target.value)} />
        <button className="btn-ghost" onClick={disable}>Désactiver</button>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {!secret ? (
        <button className="btn-primary" onClick={start}>Activer la 2FA</button>
      ) : (
        <>
          <p className="text-sm">Clé à saisir dans votre application d'authentification :</p>
          <code className="badge bg-wagadu-sand font-mono">{secret}</code>
          <div className="flex gap-2 items-end">
            <input className="input font-mono w-32" placeholder="Code" value={code}
              onChange={(e) => setCode(e.target.value)} />
            <button className="btn-primary" onClick={verify}>Valider</button>
          </div>
        </>
      )}
      {msg && <p className="text-sm text-wagadu-terracotta">{msg}</p>}
    </div>
  );
}
