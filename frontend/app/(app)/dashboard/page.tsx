"use client";

import Link from "next/link";
import { useApi } from "@/lib/useApi";
import { useAuth } from "@/lib/auth";

interface Dashboard {
  user: { full_name: string; role: string | null; is_super_admin: boolean };
  permissions: string[];
  notifications: { unread: number; latest: { id: number; title: string; url: string; is_read: boolean }[] };
  shortcuts: { label: string; url: string }[];
  widgets: {
    administration?: { users_total: number; users_active: number; users_locked: number };
    audit?: { entries_total: number; critical_recent: number };
    hr?: { headcount: number; pending_leave: number; contracts_expiring: number };
    my_mail?: number;
    my_leave_pending?: number;
    my_tasks_open?: number;
    my_tasks_overdue?: number;
    my_tasks_to_review?: number;
  };
}

export default function DashboardPage() {
  const { me } = useAuth();
  const { data, loading } = useApi<Dashboard>("/dashboard/");

  return (
    <div className="space-y-6">
      <header className="rounded-2xl bg-gradient-to-br from-wagadu-gold to-wagadu-terracotta p-6 text-wagadu-ebony">
        <p className="font-display text-2xl">
          Bonjour {me?.first_name || me?.email}
        </p>
        <p className="text-sm opacity-80">
          {me?.is_super_admin ? "Super Administrateur" : me?.role_detail?.name ?? "Collaborateur"}
        </p>
      </header>

      {loading && <p className="text-wagadu-brown">Chargement…</p>}

      {data && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="card">
              <p className="label">Notifications non lues</p>
              <p className="font-display text-3xl text-wagadu-brown">{data.notifications.unread}</p>
              <Link href="/notifications" className="text-sm text-wagadu-terracotta">Voir tout</Link>
            </div>
            {data.widgets.administration && (
              <div className="card">
                <p className="label">Comptes</p>
                <p className="font-display text-3xl text-wagadu-brown">
                  {data.widgets.administration.users_active}
                  <span className="text-base opacity-60"> / {data.widgets.administration.users_total}</span>
                </p>
                <p className="text-sm text-wagadu-terracotta">
                  {data.widgets.administration.users_locked} verrouillé(s)
                </p>
              </div>
            )}
            {data.widgets.audit && (
              <div className="card">
                <p className="label">Journal d'audit</p>
                <p className="font-display text-3xl text-wagadu-brown">{data.widgets.audit.entries_total}</p>
                <p className="text-sm text-wagadu-terracotta">
                  {data.widgets.audit.critical_recent} critique(s)
                </p>
              </div>
            )}
            {data.widgets.hr && (
              <div className="card">
                <p className="label">RH</p>
                <p className="font-display text-3xl text-wagadu-brown">{data.widgets.hr.headcount}</p>
                <p className="text-sm text-wagadu-terracotta">
                  {data.widgets.hr.pending_leave} congé(s) à valider · {data.widgets.hr.contracts_expiring} contrat(s) &lt; 60 j
                </p>
              </div>
            )}
            {!!data.widgets.my_tasks_open && (
              <div className="card">
                <p className="label">Mes tâches en cours</p>
                <p className="font-display text-3xl text-wagadu-brown">{data.widgets.my_tasks_open}</p>
                {!!data.widgets.my_tasks_overdue && (
                  <p className="text-sm text-wagadu-terracotta">{data.widgets.my_tasks_overdue} en retard</p>
                )}
              </div>
            )}
            {!!data.widgets.my_tasks_to_review && (
              <div className="card">
                <p className="label">Tâches à valider</p>
                <p className="font-display text-3xl text-wagadu-brown">{data.widgets.my_tasks_to_review}</p>
              </div>
            )}
            {!!data.widgets.my_mail && (
              <div className="card">
                <p className="label">Courrier qui m'est affecté</p>
                <p className="font-display text-3xl text-wagadu-brown">{data.widgets.my_mail}</p>
              </div>
            )}
            {!!data.widgets.my_leave_pending && (
              <div className="card">
                <p className="label">Mes demandes de congé en cours</p>
                <p className="font-display text-3xl text-wagadu-brown">{data.widgets.my_leave_pending}</p>
              </div>
            )}
          </section>

          {data.shortcuts.length > 0 && (
            <section className="card">
              <p className="label">Raccourcis</p>
              <div className="flex flex-wrap gap-2">
                {data.shortcuts.map((s) => (
                  <Link key={s.url} href={s.url} className="btn-ghost">{s.label}</Link>
                ))}
              </div>
            </section>
          )}

          <section className="card">
            <p className="label">Dernières notifications</p>
            {data.notifications.latest.length === 0 ? (
              <p className="text-sm opacity-60">Aucune notification.</p>
            ) : (
              <ul className="divide-y divide-wagadu-sand">
                {data.notifications.latest.map((n) => (
                  <li key={n.id} className="py-2 text-sm">
                    <span className={n.is_read ? "opacity-60" : "font-medium"}>{n.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
