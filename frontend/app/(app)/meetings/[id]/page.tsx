"use client";

import { use, useState } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { useAuth } from "@/lib/auth";
import { Meeting } from "@/lib/comms";
import { BackLink } from "@/components/BackLink";

interface JoinInfo {
  url: string;
  room: string;
  jwt: string | null;
  moderator: boolean;
  lobby: boolean;
  configured: boolean;
}

export default function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { me } = useAuth();
  const { data: m, reload } = useApi<Meeting>(`/meetings/${id}/`);
  const [minutes, setMinutes] = useState("");
  const [poll, setPoll] = useState({ question: "", options: "" });
  const [joinInfo, setJoinInfo] = useState<JoinInfo | null>(null);

  if (!m) return <p className="text-sm opacity-60">Chargement…</p>;
  const isOrganizer = m.organizer === me?.id;
  const myParticipation = m.meeting_participants.find((p) => p.email === me?.email);

  async function act(path: string, body: unknown = {}) {
    await api(`/meetings/${id}/${path}/`, { method: "POST", body });
    reload();
  }

  async function join() {
    const info = await api<JoinInfo>(`/meetings/${id}/join/`);
    setJoinInfo(info);
    const target = info.jwt ? `${info.url}?jwt=${info.jwt}` : info.url;
    window.open(target, "_blank", "noopener");
    reload();
  }

  async function createPoll() {
    await api("/meeting-polls/", {
      method: "POST",
      body: {
        meeting: Number(id),
        question: poll.question,
        option_labels: poll.options.split(",").map((s) => s.trim()).filter(Boolean),
      },
    });
    setPoll({ question: "", options: "" });
    reload();
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <BackLink href="/meetings" />
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="font-display text-2xl text-wagadu-brown">{m.title}</h1>
        <span className="badge bg-wagadu-sand">{m.status_display}</span>
      </div>
      <p className="text-sm font-mono opacity-70">
        {new Date(m.start).toLocaleString("fr-FR")} → {new Date(m.end).toLocaleTimeString("fr-FR")}
      </p>
      {m.description && <p className="text-sm">{m.description}</p>}

      <div className="card flex flex-wrap gap-2 items-center">
        {m.status !== "cancelled" && m.status !== "ended" && (
          <button className="btn-primary" onClick={join}>Rejoindre la visioconférence</button>
        )}
        {joinInfo && !joinInfo.configured && (
          <span className="text-xs text-wagadu-terracotta">
            Jitsi non configuré : lien public {joinInfo.url}
          </span>
        )}
        {myParticipation && !isOrganizer && (
          <div className="flex gap-1">
            {["accepted", "tentative", "declined"].map((r) => (
              <button key={r} className={myParticipation.response === r ? "btn-primary" : "btn-ghost"}
                onClick={() => act("respond", { response: r })}>
                {{ accepted: "Présent", tentative: "Peut-être", declined: "Absent" }[r]}
              </button>
            ))}
          </div>
        )}
      </div>

      {m.agenda && (
        <div className="card">
          <p className="label">Ordre du jour</p>
          <p className="text-sm whitespace-pre-wrap">{m.agenda}</p>
        </div>
      )}

      <div className="card">
        <p className="label">Participants ({m.meeting_participants.length})</p>
        <ul className="text-sm divide-y divide-wagadu-sand">
          {m.meeting_participants.map((p) => (
            <li key={p.id} className="py-1.5 flex justify-between">
              <span>{p.name || p.email}{p.is_organizer && " (organisateur)"}</span>
              <span className="text-xs opacity-60">{p.response}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Sondages */}
      <div className="card space-y-2">
        <p className="label">Sondages</p>
        {m.polls.map((p) => (
          <div key={p.id} className="border-l-2 border-wagadu-gold pl-2">
            <p className="font-medium text-sm">{p.question} {!p.is_open && "(clos)"}</p>
            {p.options.map((o) => (
              <button key={o.id} disabled={!p.is_open}
                className={`block w-full text-left text-sm rounded px-2 py-1 my-0.5 ${p.my_vote === o.id ? "bg-wagadu-gold/40" : "bg-wagadu-sand/40"}`}
                onClick={() => api(`/meeting-polls/${p.id}/vote/`, { method: "POST", body: { option: o.id } }).then(reload)}>
                {o.label} — {o.vote_count}
              </button>
            ))}
            {isOrganizer && p.is_open && (
              <button className="text-xs text-wagadu-terracotta mt-1"
                onClick={() => api(`/meeting-polls/${p.id}/close/`, { method: "POST", body: {} }).then(reload)}>
                Clore le sondage
              </button>
            )}
          </div>
        ))}
        {isOrganizer && (
          <div className="flex flex-wrap gap-2 items-end border-t border-wagadu-sand pt-2">
            <input className="input w-48" placeholder="Question" value={poll.question}
              onChange={(e) => setPoll({ ...poll, question: e.target.value })} />
            <input className="input w-48" placeholder="Options (virgules)" value={poll.options}
              onChange={(e) => setPoll({ ...poll, options: e.target.value })} />
            <button className="btn-ghost" onClick={createPoll}>Lancer un sondage</button>
          </div>
        )}
      </div>

      {/* Compte-rendu */}
      <div className="card space-y-2">
        <p className="label">Compte-rendu</p>
        {m.minutes && <p className="text-sm whitespace-pre-wrap">{m.minutes}</p>}
        {isOrganizer && m.status !== "cancelled" && (
          <>
            <textarea className="input" rows={4} placeholder="Rédiger le compte-rendu"
              value={minutes || m.minutes} onChange={(e) => setMinutes(e.target.value)} />
            <button className="btn-primary" onClick={() => act("close", { minutes: minutes || m.minutes })}>
              Clôturer &amp; enregistrer le CR
            </button>
          </>
        )}
      </div>
    </div>
  );
}
