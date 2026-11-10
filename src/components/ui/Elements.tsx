import { useEffect, type ReactNode } from 'react'
import Icone from './Icone'

/* ------------------------------------------------------------------ Mise en page */

export function EnTetePage({ titre, sousTitre, actions, icone }: { titre: string; sousTitre?: ReactNode; actions?: ReactNode; icone?: string }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        {icone && (
          <div className="mt-1 hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-marque-800 text-white sm:flex">
            <Icone nom={icone} />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-[26px] font-bold leading-tight text-slate-900">{titre}</h1>
          {sousTitre && <p className="mt-1 max-w-4xl text-[13px] text-slate-600">{sousTitre}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Carte({ titre, actions, children, className = '', corpsClassName = 'p-4 sm:p-5' }: { titre?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; corpsClassName?: string }) {
  return (
    <section className={`carte ${className}`}>
      {(titre || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[#efede6] px-4 py-3 sm:px-5">
          <h2 className="titre-serif text-[16px] font-bold text-slate-900">{titre}</h2>
          {actions}
        </header>
      )}
      <div className={corpsClassName}>{children}</div>
    </section>
  )
}

/** Icônes de carte en carré plein (vert foncé, orange…), comme sur l'application DGCPT. */
const tonsIcone: Record<string, string> = {
  vert: 'bg-marque-800 text-white',
  bleu: 'bg-ciel-600 text-white',
  jaune: 'bg-amber-500 text-white',
  rouge: 'bg-red-600 text-white',
  gris: 'bg-slate-500 text-white',
  violet: 'bg-violet-600 text-white',
}

const tons: Record<string, string> = {
  vert: 'bg-marque-100 text-marque-800',
  bleu: 'bg-ciel-100 text-ciel-600',
  jaune: 'bg-amber-100 text-amber-800',
  rouge: 'bg-red-100 text-red-700',
  gris: 'bg-slate-100 text-slate-600',
  violet: 'bg-violet-100 text-violet-700',
}

export function CarteStat({ libelle, valeur, detail, icone, ton = 'vert' }: { libelle: string; valeur: ReactNode; detail?: ReactNode; icone?: string; ton?: keyof typeof tons | string }) {
  return (
    <div className="carte flex items-start gap-3 p-4">
      {icone && (
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tonsIcone[ton] ?? tonsIcone.vert}`}>
          <Icone nom={icone} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{libelle}</p>
        <p className="titre-serif mt-0.5 text-2xl font-bold text-slate-900">{valeur}</p>
        {detail && <p className="mt-0.5 text-xs text-slate-500">{detail}</p>}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Badges de statut */

const tonStatut: Record<string, string> = {
  actif: 'vert', en_service: 'vert', confirmee: 'vert', confirme: 'vert', validee: 'vert', approuvee: 'vert', present: 'vert', avis_favorable: 'bleu',
  en_attente_prise_service: 'jaune', declaree: 'jaune', declare: 'jaune', en_attente: 'jaune', soumise: 'jaune', signalee: 'jaune', retard: 'jaune',
  rejetee: 'rouge', rejete: 'rouge', annulee: 'gris', absent: 'rouge', suspendu: 'rouge', cessation: 'rouge', avis_defavorable: 'rouge', decede: 'gris',
  terminee: 'gris', retraite: 'gris', inactif: 'gris', demissionnaire: 'gris', absence_justifiee: 'bleu', mission: 'violet', disponibilite: 'violet', detache: 'violet',
}

export function Statut({ code, libelle }: { code?: string | null; libelle?: string | null }) {
  if (!code) return <span className="text-slate-400">—</span>
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${tons[tonStatut[code] ?? 'gris']}`}>{libelle ?? code}</span>
}

export function Pastille({ children, ton = 'gris' }: { children: ReactNode; ton?: string }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${tons[ton] ?? tons.gris}`}>{children}</span>
}

/* ------------------------------------------------------------------ États */

export function Chargement({ texte = 'Chargement…' }: { texte?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-sm text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-marque-700 border-t-transparent" />
      {texte}
    </div>
  )
}

export function EtatVide({ texte, icone = 'liste', action }: { texte: string; icone?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center text-sm text-slate-500">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icone nom={icone} />
      </div>
      <p>{texte}</p>
      {action}
    </div>
  )
}

export function Alerte({ children, ton = 'jaune', titre }: { children: ReactNode; ton?: 'jaune' | 'rouge' | 'bleu' | 'vert'; titre?: string }) {
  const c = { jaune: 'border-amber-200 bg-amber-50 text-amber-900', rouge: 'border-red-200 bg-red-50 text-red-800', bleu: 'border-ciel-100 bg-ciel-100/60 text-ciel-600', vert: 'border-marque-100 bg-marque-50 text-marque-900' }[ton]
  return (
    <div className={`flex gap-3 rounded-xl border px-4 py-3 text-sm ${c}`}>
      <Icone nom={ton === 'vert' ? 'coche' : 'alerte'} className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        {titre && <p className="font-semibold">{titre}</p>}
        <div>{children}</div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Modale */

export function Modale({ ouverte, titre, onFermer, children, pied, large = false }: { ouverte: boolean; titre: string; onFermer: () => void; children: ReactNode; pied?: ReactNode; large?: boolean | 'xl' }) {
  useEffect(() => {
    if (!ouverte) return
    const f = (e: KeyboardEvent) => e.key === 'Escape' && onFermer()
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [ouverte, onFermer])

  if (!ouverte) return null
  const largeur = large === 'xl' ? 'max-w-5xl' : large ? 'max-w-3xl' : 'max-w-lg'

  return (
    <div className="no-print fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-0 sm:items-center sm:p-4" onMouseDown={onFermer}>
      <div role="dialog" aria-modal="true" aria-label={titre} className={`flex max-h-[94vh] w-full ${largeur} flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl`} onMouseDown={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">{titre}</h2>
          <button type="button" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" onClick={onFermer} aria-label="Fermer">
            <Icone nom="fermer" />
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {pied && <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-3">{pied}</footer>}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Champs de formulaire */

export function Champ({ libelle, erreur, aide, requis, children, className = '' }: { libelle: string; erreur?: string; aide?: string; requis?: boolean; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-semibold text-slate-700">
        {libelle}
        {requis && <span className="text-red-600"> *</span>}
      </span>
      {children}
      {aide && !erreur && <span className="mt-1 block text-xs text-slate-500">{aide}</span>}
      {erreur && <span className="mt-1 block text-xs font-medium text-red-600">{erreur}</span>}
    </label>
  )
}

export function Selecteur({ valeur, onChange, options, vide = '— Choisir —', disabled, id }: { valeur: string | number | null | undefined; onChange: (v: string) => void; options: { valeur: string | number; libelle: string }[]; vide?: string | false; disabled?: boolean; id?: string }) {
  return (
    <select id={id} className="champ" value={valeur ?? ''} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
      {vide !== false && <option value="">{vide}</option>}
      {options.map((o) => (
        <option key={o.valeur} value={o.valeur}>
          {o.libelle}
        </option>
      ))}
    </select>
  )
}

export function versOptions(source: Record<string, string> | undefined): { valeur: string; libelle: string }[] {
  return Object.entries(source ?? {}).map(([valeur, libelle]) => ({ valeur, libelle }))
}

/* ------------------------------------------------------------------ Barre de recherche / filtres */

export function BarreFiltres({ children }: { children: ReactNode }) {
  return <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">{children}</div>
}

export function Recherche({ valeur, onChange, placeholder = 'Rechercher…' }: { valeur: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <Icone nom="recherche" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input className="champ pl-9" value={valeur} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

/* ------------------------------------------------------------------ Onglets */

export function Onglets({ onglets, actif, onChange }: { onglets: { cle: string; libelle: string; compteur?: number }[]; actif: string; onChange: (c: string) => void }) {
  return (
    <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
      {onglets.map((o) => (
        <button
          key={o.cle}
          type="button"
          onClick={() => onChange(o.cle)}
          className={`flex items-center gap-2 whitespace-nowrap rounded-md px-3.5 py-2 text-[13px] font-semibold transition ${actif === o.cle ? 'bg-marque-800 text-white shadow-sm' : 'bg-[#ebe9e1] text-slate-700 hover:bg-[#e1ded3]'}`}
        >
          {o.libelle}
          {!!o.compteur && <span className="rounded-full bg-amber-400 px-1.5 text-[11px] font-bold text-slate-900">{o.compteur}</span>}
        </button>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ Barres horizontales simples */

export function Barres({ donnees, couleur = 'bg-marque-700', suffixe = '' }: { donnees: { libelle: string; valeur: number }[]; couleur?: string; suffixe?: string }) {
  const max = Math.max(1, ...donnees.map((d) => d.valeur))
  if (!donnees.length) return <EtatVide texte="Aucune donnée sur la période." icone="graphique" />
  return (
    <ul className="space-y-2.5">
      {donnees.map((d) => (
        <li key={d.libelle} className="grid grid-cols-[minmax(0,9rem)_1fr_3.5rem] items-center gap-3 text-sm sm:grid-cols-[minmax(0,13rem)_1fr_3.5rem]">
          <span className="truncate text-slate-600" title={d.libelle}>
            {d.libelle}
          </span>
          <span className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <span className={`block h-full rounded-full ${couleur}`} style={{ width: `${(d.valeur / max) * 100}%` }} />
          </span>
          <span className="text-right font-semibold tabular-nums text-slate-800">
            {d.valeur.toLocaleString('fr-FR')}
            {suffixe}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function BoutonIcone({ icone, titre, onClick, ton = 'gris', disabled }: { icone: string; titre: string; onClick: () => void; ton?: 'gris' | 'vert' | 'rouge' | 'bleu'; disabled?: boolean }) {
  const c = { gris: 'text-slate-500 hover:bg-slate-100 hover:text-slate-800', vert: 'text-marque-700 hover:bg-marque-100', rouge: 'text-red-600 hover:bg-red-50', bleu: 'text-ciel-600 hover:bg-ciel-100' }[ton]
  return (
    <button type="button" title={titre} aria-label={titre} onClick={onClick} disabled={disabled} className={`rounded-lg p-1.5 transition disabled:opacity-40 ${c}`}>
      <Icone nom={icone} className="h-4 w-4" />
    </button>
  )
}
