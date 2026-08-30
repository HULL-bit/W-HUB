"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth";

const MODULES = [
  { icon: "👥", title: "Ressources humaines", text: "Fiches employés, contrats, congés, évaluations, intégration et départ." },
  { icon: "✉️", title: "Courrier", text: "Enregistrement, affectation et traçabilité du courrier entrant et sortant." },
  { icon: "✅", title: "Tâches", text: "Assignation, suivi hebdomadaire, kanban et validation des livrables." },
  { icon: "📁", title: "Documents", text: "Diffusion ciblée, bibliothèque commune, versions et suivi de lecture." },
  { icon: "💬", title: "Communication", text: "Messagerie d'équipe, visioconférence et agenda partagé." },
  { icon: "📊", title: "Demandes & rapports", text: "Circuits de validation, exports et tableaux de bord." },
];

const PHOTOS = ["/brand/photo-1.jpg", "/brand/photo-3.jpg", "/brand/photo-2.jpg", "/brand/photo-5.jpg"];

export default function LandingPage() {
  const { me } = useAuth();
  const cta = me ? { href: "/dashboard", label: "Accéder à la plateforme" } : { href: "/login", label: "Se connecter" };

  return (
    <main className="min-h-dvh bg-wagadu-ivory text-wagadu-ebony">
      {/* bandeau motif */}
      <div className="h-2" style={{ backgroundImage: "url(/brand/bg-pattern.jpg)", backgroundSize: "auto 100%" }} aria-hidden />

      {/* En-tête */}
      <header className="flex items-center justify-between px-6 md:px-12 py-4">
        <div className="flex items-center gap-3">
          <Image src="/brand/logo-mark.png" alt="Wagadu Africa" width={40} height={40} className="rounded-lg" />
          <span className="font-display text-xl text-wagadu-brown">Wagadu&nbsp;Hub</span>
        </div>
        <Link href={cta.href} className="btn-primary">{cta.label}</Link>
      </header>

      {/* Hero — photo de fond + dégradé de la charte */}
      <section className="relative overflow-hidden text-wagadu-ivory">
        <Image src="/brand/bg-hero.jpg" alt="" fill priority className="object-cover" />
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(120deg, rgba(74,42,18,0.92) 0%, rgba(110,60,19,0.82) 45%, rgba(210,129,46,0.62) 100%)" }} aria-hidden />
        <div className="relative grid lg:grid-cols-2 gap-10 items-center px-6 md:px-12 py-16 md:py-24 max-w-6xl mx-auto">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-wagadu-gold">Projet Blue-Track</p>
            <h1 className="font-display text-4xl md:text-5xl leading-tight mt-3">
              La plateforme interne de Wagadu&nbsp;Africa
            </h1>
            <p className="mt-4 text-lg text-wagadu-sand/90 max-w-lg">
              Un seul espace, sécurisé et accessible en mobilité, pour piloter le fonctionnement
              administratif et organisationnel de l&apos;ONG — du siège comme sur le terrain.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={cta.href} className="btn-primary">{cta.label}</Link>
              <a href="#modules" className="btn-ghost text-wagadu-ivory border-white/40 hover:bg-white/10">
                Découvrir les modules
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {PHOTOS.map((src, i) => (
              <div key={src} className={`rounded-2xl overflow-hidden border border-white/20 shadow-lg ${i % 2 ? "mt-6" : ""}`}>
                <Image src={src} alt="" width={400} height={280} className="w-full h-40 object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="px-6 md:px-12 py-14 max-w-6xl mx-auto">
        <h2 className="font-display text-2xl md:text-3xl text-wagadu-brown">Ce que couvre Wagadu&nbsp;Hub</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {MODULES.map((m) => (
            <div key={m.title} className="card">
              <span className="text-2xl">{m.icon}</span>
              <h3 className="font-display text-lg text-wagadu-brown mt-1">{m.title}</h3>
              <p className="text-sm opacity-75 mt-1">{m.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bandeau mission — silhouette Afrique */}
      <section className="relative text-wagadu-ivory">
        <Image src="/brand/bg-africa.jpg" alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-wagadu-ebony/80" aria-hidden />
        <div className="relative px-6 md:px-12 py-16 max-w-4xl mx-auto text-center">
          <Image src="/brand/logo-negatif.png" alt="Wagadu Africa" width={220} height={168} className="mx-auto" />
          <p className="font-display text-2xl md:text-3xl leading-snug mt-6">
            « Réduire la dépendance aux outils dispersés et donner à chacun un accès unique,
            sécurisé et clair au fonctionnement de l&apos;organisation. »
          </p>
        </div>
      </section>

      <footer className="px-6 md:px-12 py-8 text-center text-sm opacity-60">
        Wagadu Africa — plateforme interne · réservée aux membres et collaborateurs de l&apos;ONG
      </footer>
    </main>
  );
}
