"use client";

import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { Paginated } from "@/lib/types";

interface Notif {
  id: number;
  title: string;
  body: string;
  url: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const { data, reload, loading } = useApi<Paginated<Notif>>("/notifications/");

  async function markAll() {
    await api("/notifications/read-all/", { method: "POST", body: {} });
    reload();
  }
  async function markOne(id: number) {
    await api(`/notifications/${id}/read/`, { method: "POST", body: {} });
    reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-wagadu-brown">Notifications</h1>
        <button className="btn-ghost" onClick={markAll}>Tout marquer comme lu</button>
      </div>
      <div className="card divide-y divide-wagadu-sand">
        {loading && <p className="text-sm opacity-60">Chargement…</p>}
        {data?.results.length === 0 && <p className="text-sm opacity-60">Aucune notification.</p>}
        {data?.results.map((n) => (
          <button key={n.id} onClick={() => markOne(n.id)}
            className="block w-full text-left py-3">
            <p className={n.is_read ? "opacity-60" : "font-medium"}>{n.title}</p>
            {n.body && <p className="text-sm opacity-70">{n.body}</p>}
            <p className="text-xs opacity-50 font-mono">
              {new Date(n.created_at).toLocaleString("fr-FR")}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
