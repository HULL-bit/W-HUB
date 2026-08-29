"use client";

import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useAuth } from "@/lib/auth";
import { Paginated, Permission, Role } from "@/lib/types";

export default function RolesPage() {
  const { can } = useAuth();
  const roles = useApi<Paginated<Role>>("/roles/");
  const perms = useApi<Permission[]>("/permissions/");
  const [selected, setSelected] = useState<number | null>(null);
  const [draft, setDraft] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<string | null>(null);

  const current = roles.data?.results.find((r) => r.id === selected) ?? null;
  const byModule = useMemo(() => {
    const m: Record<string, Permission[]> = {};
    (perms.data ?? []).forEach((p) => (m[p.module] ??= []).push(p));
    return m;
  }, [perms.data]);

  function open(r: Role) {
    setSelected(r.id);
    setDraft(new Set(r.permission_codes));
    setMsg(null);
  }

  async function save() {
    if (!current) return;
    await api(`/roles/${current.id}/permissions/`, {
      method: "PUT",
      body: { permission_codes: [...draft] },
    });
    setMsg("Permissions enregistrées.");
    roles.reload();
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl text-wagadu-brown">Rôles &amp; permissions</h1>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card space-y-1">
          {roles.data?.results.map((r) => (
            <button key={r.id} onClick={() => open(r)}
              className={`block w-full text-left rounded-xl px-3 py-2 text-sm ${
                selected === r.id ? "bg-wagadu-gold text-wagadu-ebony" : "hover:bg-wagadu-sand/50"
              }`}>
              {r.name}
              <span className="opacity-60"> · {r.user_count} membre(s)</span>
              {r.is_system && <span className="badge bg-wagadu-sand ml-2">système</span>}
            </button>
          ))}
        </div>

        <div className="card md:col-span-2">
          {!current ? (
            <p className="text-sm opacity-60">Sélectionnez un rôle pour voir son socle de permissions.</p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg text-wagadu-brown">{current.name}</h2>
                {can("accounts.manage_permissions") && (
                  <button className="btn-primary" onClick={save}>Enregistrer</button>
                )}
              </div>
              <p className="text-sm opacity-70 mb-3">{current.description}</p>
              {msg && <p className="text-sm text-wagadu-terracotta mb-2">{msg}</p>}

              <div className="space-y-4">
                {Object.entries(byModule).map(([mod, list]) => (
                  <div key={mod}>
                    <p className="label uppercase text-xs tracking-wide">{mod}</p>
                    <div className="grid sm:grid-cols-2 gap-1">
                      {list.map((p) => (
                        <label key={p.code} className="flex items-center gap-2 text-sm">
                          <input type="checkbox"
                            disabled={!can("accounts.manage_permissions")}
                            checked={draft.has(p.code)}
                            onChange={(e) => {
                              const next = new Set(draft);
                              if (e.target.checked) next.add(p.code);
                              else next.delete(p.code);
                              setDraft(next);
                            }} />
                          <span title={p.code}>{p.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
