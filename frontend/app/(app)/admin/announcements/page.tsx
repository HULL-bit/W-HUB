"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { Paginated } from "@/lib/types";
import { Announcement } from "@/lib/phase6";

export default function AnnouncementsAdminPage() {
  const list = useApi<Paginated<Announcement>>("/announcements/?all=true");
  const [form, setForm] = useState({ title: "", body: "", pinned: true, expires_at: "" });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await api("/announcements/", {
      method: "POST",
      body: { ...form, expires_at: form.expires_at || null },
    });
    setForm({ title: "", body: "", pinned: true, expires_at: "" });
    list.reload();
  }

  async function remove(id: number) {
    await api(`/announcements/${id}/`, { method: "DELETE" });
    list.reload();
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-wagadu-brown">Fil d&apos;actualités interne</h1>

      <form onSubmit={create} className="card space-y-2">
        <input className="input" placeholder="Titre" required value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <textarea className="input" rows={3} placeholder="Contenu de l'annonce" required value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })} />
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={form.pinned}
              onChange={(e) => setForm({ ...form, pinned: e.target.checked })} />
            Épinglée
          </label>
          <label className="label mb-0">Expire le
            <input type="date" className="input" value={form.expires_at}
              onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
          </label>
        </div>
        <button className="btn-primary">Publier</button>
      </form>

      <div className="card divide-y divide-wagadu-sand">
        {list.data?.results.map((a) => (
          <div key={a.id} className="py-2 flex justify-between items-start gap-2">
            <div>
              <p className="font-medium">{a.pinned && "📌 "}{a.title}</p>
              <p className="text-sm opacity-70">{a.body}</p>
              <p className="text-xs opacity-50 font-mono">
                {a.author_name} · {new Date(a.publish_at).toLocaleDateString("fr-FR")}
                {a.expires_at && ` → ${new Date(a.expires_at).toLocaleDateString("fr-FR")}`}
              </p>
            </div>
            <button className="text-wagadu-terracotta text-xs" onClick={() => remove(a.id)}>Supprimer</button>
          </div>
        ))}
      </div>
    </div>
  );
}
