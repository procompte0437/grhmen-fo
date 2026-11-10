import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { api, messageErreur } from '../../lib/api'
import type { Page } from '../../types'
import { Chargement, EtatVide } from './Elements'

export interface Colonne<T> {
  titre: string
  rendu: (ligne: T) => ReactNode
  className?: string
}

export function Tableau<T extends { id?: number }>({ colonnes, lignes, chargement, vide = 'Aucun élément à afficher.', cle, surLigne, selection }: {
  colonnes: Colonne<T>[]
  lignes: T[]
  chargement?: boolean
  vide?: string
  cle?: (l: T) => string | number
  surLigne?: (l: T) => void
  selection?: { ids: number[]; basculer: (id: number) => void; tout: (ids: number[]) => void; eligible?: (l: T) => boolean }
}) {
  if (chargement && !lignes.length) return <Chargement />
  if (!lignes.length) return <EtatVide texte={vide} />

  const eligibles = selection ? lignes.filter((l) => (selection.eligible ? selection.eligible(l) : true)).map((l) => l.id as number) : []
  const toutCoche = selection && eligibles.length > 0 && eligibles.every((id) => selection.ids.includes(id))

  return (
    <div className={`overflow-x-auto ${chargement ? 'opacity-60' : ''}`}>
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
            {selection && (
              <th className="w-10 px-3 py-2.5">
                <input type="checkbox" aria-label="Tout sélectionner" checked={!!toutCoche} onChange={() => selection.tout(toutCoche ? [] : eligibles)} />
              </th>
            )}
            {colonnes.map((c) => (
              <th key={c.titre} className={`px-3 py-2.5 font-semibold ${c.className ?? ''}`}>
                {c.titre}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lignes.map((l, i) => (
            <tr key={cle ? cle(l) : (l.id ?? i)} className={`border-b border-slate-100 last:border-0 hover:bg-marque-50/50 ${surLigne ? 'cursor-pointer' : ''}`} onClick={surLigne ? () => surLigne(l) : undefined}>
              {selection && (
                <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                  {(selection.eligible ? selection.eligible(l) : true) && (
                    <input type="checkbox" aria-label="Sélectionner" checked={selection.ids.includes(l.id as number)} onChange={() => selection.basculer(l.id as number)} />
                  )}
                </td>
              )}
              {colonnes.map((c) => (
                <td key={c.titre} className={`px-3 py-2.5 align-middle ${c.className ?? ''}`}>
                  {c.rendu(l)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Pagination({ page, onPage }: { page: Page<unknown> | null; onPage: (p: number) => void }) {
  if (!page || page.total === 0) return null
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
      <span>
        {page.from}–{page.to} sur <strong>{page.total.toLocaleString('fr-FR')}</strong>
      </span>
      <div className="flex items-center gap-1">
        <button type="button" className="btn btn-secondaire px-3 py-1" disabled={page.current_page <= 1} onClick={() => onPage(page.current_page - 1)}>
          Précédent
        </button>
        <span className="px-2">
          Page {page.current_page} / {page.last_page}
        </span>
        <button type="button" className="btn btn-secondaire px-3 py-1" disabled={page.current_page >= page.last_page} onClick={() => onPage(page.current_page + 1)}>
          Suivant
        </button>
      </div>
    </div>
  )
}

/** Charge une liste paginée de l'API avec filtres ; la recherche texte est temporisée. */
export function useListe<T>(url: string, filtresInitiaux: Record<string, string> = {}) {
  const [filtres, setFiltres] = useState<Record<string, string>>(filtresInitiaux)
  const [page, setPage] = useState(1)
  const [donnees, setDonnees] = useState<Page<T> | null>(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const minuterie = useRef<number | undefined>(undefined)

  useEffect(() => {
    window.clearTimeout(minuterie.current)
    minuterie.current = window.setTimeout(() => {
      setChargement(true)
      const params = Object.fromEntries(Object.entries({ ...filtres, page: String(page) }).filter(([, v]) => v !== '' && v !== undefined))
      api
        .get(url, { params })
        .then((r) => {
          setDonnees(r.data)
          setErreur(null)
        })
        .catch((e) => setErreur(messageErreur(e)))
        .finally(() => setChargement(false))
    }, 250)
    return () => window.clearTimeout(minuterie.current)
  }, [url, filtres, page, version])

  const filtrer = useCallback((cle: string, valeur: string) => {
    setFiltres((f) => ({ ...f, [cle]: valeur }))
    setPage(1)
  }, [])

  const recharger = useCallback(() => setVersion((v) => v + 1), [])

  return { donnees, lignes: donnees?.data ?? [], chargement, erreur, filtres, filtrer, setFiltres, page, setPage, recharger }
}
