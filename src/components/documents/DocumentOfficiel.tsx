import type { ReactNode } from 'react'
import { dateFr } from '../../lib/format'
import { MINISTERE } from '../../lib/ministere'

/** Pointillés de séparation, comme sur les correspondances administratives. */
function Points() {
  return <p className="my-0.5 tracking-[0.35em] text-slate-400">…………………</p>
}

export interface Signataire {
  qualite: string
  nom?: string | null
  mention?: string
}

/**
 * Document administratif à en-tête du ministère, sur le modèle des notes circulaires :
 * ministère et services à gauche avec le numéro, République gabonaise et emblème à droite,
 * titre souligné, corps, lieu et date, signatures et pied de page.
 */
export default function DocumentOfficiel({
  numero,
  service = 'Direction Générale des Ressources Humaines',
  sousService,
  titre,
  sousTitre,
  lieu = 'Libreville',
  date,
  signataires,
  ampliations,
  filigrane,
  children,
}: {
  numero?: string | null
  service?: string
  sousService?: string | null
  titre: string
  sousTitre?: string
  lieu?: string | null
  date?: string | null
  signataires: Signataire[]
  ampliations?: string[]
  filigrane?: string | null
  children: ReactNode
}) {
  return (
    <article className="zone-impression document-a4 relative mx-auto w-full max-w-[52rem] overflow-hidden bg-white px-10 py-9 text-[14.5px] leading-relaxed text-slate-900 shadow-sm ring-1 ring-[#e6e4dc] sm:px-14">
      {filigrane && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span className="-rotate-[28deg] select-none text-[64px] font-black uppercase tracking-widest text-red-600/10">{filigrane}</span>
        </div>
      )}

      <header className="grid grid-cols-[1fr_auto] items-start gap-6 font-serif text-[12px] uppercase leading-snug">
        <div className="max-w-[22rem] text-center">
          <p className="font-bold">{MINISTERE.nom}</p>
          <Points />
          <p className="font-semibold">Secrétariat Général</p>
          <Points />
          <p className="font-semibold">{service}</p>
          {sousService && (
            <>
              <Points />
              <p className="font-semibold normal-case">{sousService}</p>
            </>
          )}
          {numero && (
            <p className="mt-3 text-left text-[13px] normal-case">
              N° <span className="font-semibold">{numero}</span>
            </p>
          )}
        </div>
        <div className="flex flex-col items-center text-center">
          <img src="/logo/embleme-men.png" alt="Emblème de la République gabonaise" className="h-[4.6rem] w-auto rounded-[3px] ring-1 ring-slate-200" />
          <p className="mt-2 font-bold">République Gabonaise</p>
          <p className="text-[11px] normal-case italic">Union – Travail – Justice</p>
        </div>
      </header>

      <div className="mt-8 text-center">
        <h1 className="inline-block border-b-2 border-slate-900 pb-0.5 font-serif text-[22px] font-bold uppercase tracking-wide">{titre}</h1>
        {sousTitre && <p className="mt-2 font-serif text-[15px] font-semibold">{sousTitre}</p>}
      </div>

      <div className="relative mt-8 space-y-4 text-justify">{children}</div>

      <div className="relative mt-10">
        <p className="text-right">
          Fait à {lieu || 'Libreville'}, le {dateFr(date ?? new Date().toISOString())}
        </p>
        <div className={`mt-4 grid gap-8 ${signataires.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {signataires.map((s, i) => (
            <div key={i} className={`text-center ${signataires.length === 1 ? 'ml-auto w-72' : ''}`}>
              {s.mention && <p className="text-[12.5px] italic">{s.mention}</p>}
              <p className="font-bold">{s.qualite}</p>
              <div className="mx-auto mt-14 w-52 border-t border-slate-400" />
              <p className="mt-1 text-[13px]">{s.nom ?? ''}</p>
            </div>
          ))}
        </div>
      </div>

      {ampliations && ampliations.length > 0 && (
        <div className="relative mt-8 text-[12.5px]">
          <p className="font-semibold underline">Ampliations :</p>
          <ul className="mt-1 list-inside list-disc">
            {ampliations.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      <footer className="relative mt-10 flex items-center justify-between gap-3 border-t border-slate-300 pt-2 text-[10.5px] text-slate-500">
        <span>
          {MINISTERE.adresse} · {MINISTERE.telephone} · {MINISTERE.site}
        </span>
        <span className="flex h-1.5 w-16 overflow-hidden rounded-sm" aria-hidden="true">
          <span className="flex-1 bg-[#009e60]" />
          <span className="flex-1 bg-soleil-400" />
          <span className="flex-1 bg-[#3a75c4]" />
        </span>
      </footer>
    </article>
  )
}

/** Tableau d'identification de l'agent (libellé / valeur). */
export function TableauIdentite({ lignes }: { lignes: [string, ReactNode][] }) {
  return (
    <table className="w-full text-[14px]">
      <tbody>
        {lignes
          .filter(([, v]) => v !== undefined)
          .map(([l, v]) => (
            <tr key={l} className="align-top">
              <td className="w-60 py-1 pr-4 text-slate-600">{l}</td>
              <td className="py-1 font-semibold">{v || '—'}</td>
            </tr>
          ))}
      </tbody>
    </table>
  )
}
