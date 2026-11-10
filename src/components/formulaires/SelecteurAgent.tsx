import { useEffect, useRef, useState } from 'react'
import { api } from '../../lib/api'

/** Recherche d'un agent par nom ou matricule (liste déroulante avec suggestions). */
export default function SelecteurAgent({ valeur, onChange, filtres = {} }: { valeur: any; onChange: (a: any) => void; filtres?: Record<string, string> }) {
  const [texte, setTexte] = useState('')
  const [resultats, setResultats] = useState<any[]>([])
  const [ouvert, setOuvert] = useState(false)
  const minuterie = useRef<number | undefined>(undefined)
  const cleFiltres = JSON.stringify(filtres)

  useEffect(() => {
    if (!ouvert) return
    window.clearTimeout(minuterie.current)
    minuterie.current = window.setTimeout(() => {
      api
        .get('/agents', { params: { q: texte, par_page: 8, ...JSON.parse(cleFiltres) } })
        .then((r) => setResultats(r.data.data))
        .catch(() => setResultats([]))
    }, 250)
    return () => window.clearTimeout(minuterie.current)
  }, [texte, ouvert, cleFiltres])

  if (valeur)
    return (
      <div className="champ flex items-center justify-between gap-2 bg-marque-50">
        <span className="truncate font-medium">
          {valeur.nom_complet} — {valeur.matricule} {valeur.etablissement ? `· ${valeur.etablissement.nom}` : ''}
        </span>
        <button type="button" className="text-xs font-semibold text-marque-800 hover:underline" onClick={() => onChange(null)}>
          Changer
        </button>
      </div>
    )

  return (
    <div className="relative">
      <input className="champ" placeholder="Nom, prénom ou matricule…" value={texte} onChange={(e) => setTexte(e.target.value)} onFocus={() => setOuvert(true)} onBlur={() => window.setTimeout(() => setOuvert(false), 150)} />
      {ouvert && resultats.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
          {resultats.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-marque-50"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(a)
                  setOuvert(false)
                }}
              >
                <span className="font-medium">{a.nom_complet}</span> <span className="text-slate-500">· {a.matricule}</span>
                <span className="block text-xs text-slate-500">
                  {a.categorie_libelle} · {a.etablissement?.nom ?? 'sans poste'} · {a.statut_libelle}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
