import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useSession } from '../../context/AuthContext'
import { useNotifier } from '../../context/NotificationContext'
import { api, erreursChamps, messageErreur } from '../../lib/api'
import { dateFr } from '../../lib/format'
import { FenetreDecision, type DemandeDecision } from '../../components/ui/Decision'
import { Alerte, BoutonIcone, Carte, Champ, EnTetePage, Modale, Onglets, Selecteur, Statut, versOptions } from '../../components/ui/Elements'
import Icone from '../../components/ui/Icone'
import { Tableau } from '../../components/ui/Tableau'

type Def = { libelle: string; champs: { cle: string; libelle: string; type?: 'texte' | 'nombre' | 'date' | 'booleen' | 'categorie' }[] }

const DEFS: Record<string, Def> = {
  provinces: { libelle: 'Provinces', champs: [{ cle: 'code', libelle: 'Code' }, { cle: 'nom', libelle: 'Nom' }, { cle: 'chef_lieu', libelle: 'Chef-lieu' }] },
  corps: { libelle: 'Corps', champs: [{ cle: 'code', libelle: 'Code' }, { cle: 'libelle', libelle: 'Libellé' }, { cle: 'categorie', libelle: 'Catégorie', type: 'categorie' }] },
  grades: { libelle: 'Grades', champs: [{ cle: 'code', libelle: 'Code' }, { cle: 'libelle', libelle: 'Libellé' }, { cle: 'hierarchie', libelle: 'Hiérarchie' }, { cle: 'indice_base', libelle: 'Indice de base', type: 'nombre' }] },
  disciplines: { libelle: 'Disciplines', champs: [{ cle: 'code', libelle: 'Code' }, { cle: 'libelle', libelle: 'Libellé' }] },
  fonctions: { libelle: 'Fonctions', champs: [{ cle: 'code', libelle: 'Code' }, { cle: 'libelle', libelle: 'Libellé' }, { cle: 'enseignante', libelle: 'Fonction enseignante', type: 'booleen' }] },
  'annees-scolaires': { libelle: 'Années scolaires', champs: [{ cle: 'libelle', libelle: 'Libellé' }, { cle: 'date_debut', libelle: 'Début', type: 'date' }, { cle: 'date_fin', libelle: 'Fin', type: 'date' }, { cle: 'active', libelle: 'Année en cours', type: 'booleen' }] },
}

export default function Referentiels() {
  const { peut, listes } = useSession()
  const notifier = useNotifier()
  const [type, setType] = useState('provinces')
  const [lignes, setLignes] = useState<any[] | null>(null)
  const [edition, setEdition] = useState<any | null>(null)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreur, setErreur] = useState<string | null>(null)
  const [decision, setDecision] = useState<DemandeDecision | null>(null)
  const def = DEFS[type]

  const charger = useCallback(() => {
    setLignes(null)
    api.get(`/referentiels/${type}`).then((r) => setLignes(r.data.data))
  }, [type])
  useEffect(charger, [charger])

  const soumettre = async (e: FormEvent) => {
    e.preventDefault()
    setErreurs({})
    setErreur(null)
    try {
      if (edition.id) await api.put(`/referentiels/${type}/${edition.id}`, edition)
      else await api.post(`/referentiels/${type}`, edition)
      notifier('Référentiel enregistré.')
      setEdition(null)
      charger()
    } catch (err) {
      setErreurs(erreursChamps(err))
      setErreur(messageErreur(err))
    }
  }

  const afficher = (l: any, c: Def['champs'][number]) => {
    const v = l[c.cle]
    if (c.type === 'booleen') return <Statut code={v ? 'actif' : 'inactif'} libelle={v ? 'Oui' : 'Non'} />
    if (c.type === 'date') return dateFr(v)
    if (c.type === 'categorie') return listes?.enums.categories?.[v] ?? v
    return v ?? '—'
  }

  return (
    <div>
      <EnTetePage titre="Référentiels" icone="liste" sousTitre="Listes de valeurs utilisées dans les formulaires." actions={peut('REFERENTIEL_GERER') && <button className="btn btn-primaire" onClick={() => { setErreurs({}); setErreur(null); setEdition({}) }}><Icone nom="plus" className="h-4 w-4" /> Ajouter</button>} />
      <Onglets actif={type} onChange={setType} onglets={Object.entries(DEFS).map(([cle, d]) => ({ cle, libelle: d.libelle }))} />
      <Carte corpsClassName="p-0">
        <Tableau
          lignes={lignes ?? []}
          chargement={lignes === null}
          colonnes={[
            ...def.champs.map((c) => ({ titre: c.libelle, rendu: (l: any) => afficher(l, c) })),
            {
              titre: '',
              className: 'text-right',
              rendu: (l: any) =>
                peut('REFERENTIEL_GERER') && (
                  <div className="flex justify-end gap-1">
                    <BoutonIcone icone="crayon" titre="Modifier" onClick={() => { setErreurs({}); setErreur(null); setEdition({ ...l }) }} />
                    <BoutonIcone icone="poubelle" titre="Supprimer" ton="rouge" onClick={() => setDecision({ titre: 'Supprimer', message: `Supprimer « ${l.libelle ?? l.nom} » ?`, libelleBouton: 'Supprimer', danger: true, succes: 'Supprimé.', action: () => api.delete(`/referentiels/${type}/${l.id}`) })} />
                  </div>
                ),
            },
          ]}
        />
      </Carte>
      <Modale ouverte={!!edition} titre={`${edition?.id ? 'Modifier' : 'Ajouter'} — ${def.libelle}`} onFermer={() => setEdition(null)} pied={<><button className="btn btn-secondaire" onClick={() => setEdition(null)}>Annuler</button><button className="btn btn-primaire" form="form-ref">Enregistrer</button></>}>
        {edition && (
          <form id="form-ref" onSubmit={soumettre} className="space-y-4">
            {erreur && <Alerte ton="rouge">{erreur}</Alerte>}
            {def.champs.map((c) =>
              c.type === 'booleen' ? (
                <label key={c.cle} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!edition[c.cle]} onChange={(e) => setEdition({ ...edition, [c.cle]: e.target.checked })} /> {c.libelle}
                </label>
              ) : (
                <Champ key={c.cle} libelle={c.libelle} erreur={erreurs[c.cle]}>
                  {c.type === 'categorie' ? (
                    <Selecteur valeur={edition[c.cle]} onChange={(v) => setEdition({ ...edition, [c.cle]: v })} options={versOptions(listes?.enums.categories)} />
                  ) : (
                    <input className="champ" type={c.type === 'nombre' ? 'number' : c.type === 'date' ? 'date' : 'text'} value={edition[c.cle] ?? ''} onChange={(e) => setEdition({ ...edition, [c.cle]: e.target.value })} />
                  )}
                </Champ>
              ),
            )}
          </form>
        )}
      </Modale>
      <FenetreDecision demande={decision} onFermer={() => setDecision(null)} onTermine={charger} />
    </div>
  )
}
