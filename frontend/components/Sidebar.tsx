"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const NAV: { href: string; label: string; perm?: string }[] = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/tasks", label: "Mes tâches" },
  { href: "/tasks/board", label: "Suivi des tâches", perm: "tasks.assign" },
  { href: "/documents", label: "Documents", perm: "documents.view" },
  { href: "/documents/received", label: "Documents reçus" },
  { href: "/agenda", label: "Agenda" },
  { href: "/meetings", label: "Réunions" },
  { href: "/messagerie", label: "Messagerie" },
  { href: "/requests", label: "Mes demandes" },
  { href: "/requests/validate", label: "Demandes à valider", perm: "requests.validate" },
  { href: "/polls", label: "Sondages" },
  { href: "/reports", label: "Rapports", perm: "reports.export" },
  { href: "/leave", label: "Mes congés" },
  { href: "/leave/validate", label: "Congés à valider", perm: "hr.leave.validate" },
  { href: "/mail", label: "Courrier", perm: "mail.view" },
  { href: "/hr", label: "RH", perm: "hr.view" },
  { href: "/account", label: "Mon compte" },
  { href: "/admin/users", label: "Comptes", perm: "accounts.view" },
  { href: "/admin/roles", label: "Rôles & permissions", perm: "accounts.view" },
  { href: "/admin/permission-overrides", label: "Exceptions", perm: "accounts.manage_permissions" },
  { href: "/admin/announcements", label: "Annonces", perm: "engagement.announce" },
  { href: "/admin/validation-flows", label: "Circuits de validation", perm: "platform.manage_validation_flows" },
  { href: "/admin/audit", label: "Journal d'audit", perm: "audit.view" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { me, can, logout } = useAuth();

  return (
    <aside className="w-full md:w-64 md:min-h-dvh bg-wagadu-bark text-wagadu-ivory flex md:flex-col wagadu-branches">
      <div className="p-4 md:p-6 flex items-center gap-2 border-b border-white/10">
        <span className="font-display text-xl">Wagadu&nbsp;Hub</span>
      </div>
      <nav className="flex-1 p-2 md:p-4 flex md:flex-col gap-1 overflow-x-auto">
        {NAV.filter((n) => !n.perm || can(n.perm)).map((n) => {
          const active = pathname === n.href || pathname.startsWith(n.href + "/");
          return (
            <Link key={n.href} href={n.href}
              className={`rounded-xl px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                active ? "bg-wagadu-gold text-wagadu-ebony font-medium" : "hover:bg-white/10"
              }`}>
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/10 text-xs hidden md:block">
        <p className="truncate">{me?.email}</p>
        <p className="text-wagadu-sand/60">
          {me?.is_super_admin ? "Super Administrateur" : me?.role_detail?.name ?? "—"}
        </p>
        <button onClick={logout} className="mt-2 btn-ghost text-wagadu-ivory border-white/30 w-full">
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
