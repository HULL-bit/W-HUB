"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useAuth } from "@/lib/auth";
import { Paginated, Role, UserRow } from "@/lib/types";

export default function UsersPage() {
  const { can } = useAuth();
  const users = useApi<Paginated<UserRow>>("/users/");
  const roles = useApi<Paginated<Role>>("/roles/");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ email: "", first_name: "", last_name: "", role: "", password: "" });
  const [err, setErr] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await api("/users/", { method: "POST", body: { ...form, role: form.role ? Number(form.role) : null } });
      setCreating(false);
      setForm({ email: "", first_name: "", last_name: "", role: "", password: "" });
      users.reload();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Échec de création");
    }
  }

  async function suspend(id: string) {
    if (!confirm("Suspendre ce compte ?")) return;
    await api(`/users/${id}/`, { method: "DELETE" });
    users.reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-wagadu-brown">Comptes</h1>
        {can("accounts.manage") && (
          <button className="btn-primary" onClick={() => setCreating((v) => !v)}>
            {creating ? "Annuler" : "Nouveau compte"}
          </button>
        )}
      </div>

      {creating && (
        <form onSubmit={create} className="card grid sm:grid-cols-2 gap-3">
          <input className="input" placeholder="E-mail" type="email" required
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input" placeholder="Prénom"
            value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          <input className="input" placeholder="Nom"
            value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="">— Rôle —</option>
            {roles.data?.results.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <input className="input" placeholder="Mot de passe initial" type="text"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <div className="sm:col-span-2 flex gap-2 items-center">
            <button className="btn-primary">Créer</button>
            {err && <span className="text-sm text-wagadu-terracotta">{err}</span>}
          </div>
        </form>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-wagadu-brown">
            <tr><th className="py-2">E-mail</th><th>Nom</th><th>Rôle</th><th>Statut</th><th></th></tr>
          </thead>
          <tbody className="divide-y divide-wagadu-sand">
            {users.data?.results.map((u) => (
              <tr key={u.id}>
                <td className="py-2 font-mono text-xs">{u.email}</td>
                <td>{u.full_name || "—"}</td>
                <td>{u.is_super_admin ? "Super Admin" : u.role_detail?.name ?? "—"}</td>
                <td>
                  <span className={`badge ${u.is_active ? "bg-wagadu-sand" : "bg-wagadu-terracotta/20 text-wagadu-terracotta"}`}>
                    {u.status}
                  </span>
                </td>
                <td className="text-right">
                  {can("accounts.manage") && u.is_active && !u.is_super_admin && (
                    <button className="text-wagadu-terracotta text-xs" onClick={() => suspend(u.id)}>
                      Suspendre
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.loading && <p className="py-2 text-sm opacity-60">Chargement…</p>}
        {users.error && <p className="py-2 text-sm text-wagadu-terracotta">{users.error}</p>}
      </div>
    </div>
  );
}
