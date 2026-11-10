import { useEffect, useState, type FormEvent } from 'react'
import { useSession } from '../../context/AuthContext'
import { useNotifier } from '../../context/NotificationContext'
import { api, erreursChamps, messageErreur } from '../../lib/api'
import { Alerte, Champ, Modale, Selecteur, versOptions } from '../ui/Elements'

const VIDE = {
  matricule: '', nom: '', prenom: '', sexe: 'M', date_naissance: '', lieu_naissance: '', nationalite: 'Gabonaise', situation_matrimoniale: '',
  nombre_enfants: '0', numero_piece: '', telephone: '', email: '', adresse: '', categorie: 'enseignant_secondaire', corps_id: '', grade_id: '',
  echelon: '', discipline_id: '', fonction_id: '', etablissement_id: '', diplome: '', date_recrutement: '', statut: 'actif', observations: '',
}

const opts = (l: any[] | undefined, champ = 'libelle') => (l ?? []).map((x) => ({ valeur: x.id, libelle: (x.code && champ === 'libelle' ? `${x.libelle}` : x[champ]) as string }))

export default function FormulaireAgent({ ouvert, agent, onFermer, onEnregistre }: { ouvert: boolean; agent?: any; onFermer: () => void; onEnregistre: (a: any) => void }) {
  const { listes } = useSession()
  const notifier = useNotifier()
  const [f, setF] = useState<Record<string, string>>(VIDE)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    if (!ouvert) return
    setErreurs({})
    setErreur(null)
    if (agent) {
      const valeurs: Record<string, string> = { ...VIDE }
      Object.keys(VIDE).forEach((k) => {
        valeurs[k] = agent[k] === null || agent[k] === undefined ? '' : String(agent[k])
      })
      setF(valeurs)
    } else setF(VIDE)
  }, [ouvert, agent?.id])

  const maj = (k: string) => (v: string) => setF((x) => ({ ...x, [k]: v }))
  const champ = (k: string) => ({ value: f[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => maj(k)(e.target.value) })

  const soumettre = async (e: FormEvent) => {
    e.preventDefault()
    setEnvoi(true)
    setErreurs({})
    setErreur(null)
    const charge: Record<string, unknown> = {}
    Object.entries(f).forEach(([k, v]) => (charge[k] = v === '' ? null : v))
    try {
      const r = agent ? await api.put(`/agents/${agent.id}`, charge) : await api.post('/agents', charge)
      notifier(agent ? 'Dossier de l\'agent mis à jour.' : 'Agent créé.')
      onEnregistre(r.data.data)
    } catch (err) {
      setErreurs(erreursChamps(err))
      setErreur(messageErreur(err))
    } finally {
      setEnvoi(false)
    }
  }

  const enseignant = f.categorie !== 'administratif'
  const corps = (listes?.corps ?? []).filter((c) => c.categorie === f.categorie)

  return (
    <Modale
      ouverte={ouvert}
      large
      titre={agent ? `Modifier le dossier de ${agent.nom_complet}` : 'Nouvel agent'}
      onFermer={onFermer}
      pied={
        <>
          <button type="button" className="btn btn-secondaire" onClick={onFermer}>
            Annuler
          </button>
          <button className="btn btn-primaire" form="form-agent" disabled={envoi}>
            {envoi ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </>
      }
    >
      <form id="form-agent" onSubmit={soumettre} className="space-y-5">
        {erreur && <Alerte ton="rouge">{erreur}</Alerte>}
        <fieldset>
          <legend className="mb-3 text-xs font-bold uppercase tracking-wide text-marque-800">État civil</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            <Champ libelle="Matricule" requis erreur={erreurs.matricule}>
              <input className="champ" {...champ('matricule')} required />
            </Champ>
            <Champ libelle="Nom" requis erreur={erreurs.nom}>
              <input className="champ uppercase" {...champ('nom')} required />
            </Champ>
            <Champ libelle="Prénom(s)" requis erreur={erreurs.prenom}>
              <input className="champ" {...champ('prenom')} required />
            </Champ>
            <Champ libelle="Sexe" requis>
              <Selecteur vide={false} valeur={f.sexe} onChange={maj('sexe')} options={[{ valeur: 'M', libelle: 'Masculin' }, { valeur: 'F', libelle: 'Féminin' }]} />
            </Champ>
            <Champ libelle="Date de naissance" erreur={erreurs.date_naissance}>
              <input type="date" className="champ" {...champ('date_naissance')} />
            </Champ>
            <Champ libelle="Lieu de naissance">
              <input className="champ" {...champ('lieu_naissance')} />
            </Champ>
            <Champ libelle="Nationalité">
              <input className="champ" {...champ('nationalite')} />
            </Champ>
            <Champ libelle="Situation matrimoniale">
              <Selecteur valeur={f.situation_matrimoniale} onChange={maj('situation_matrimoniale')} options={[{ valeur: 'celibataire', libelle: 'Célibataire' }, { valeur: 'marie', libelle: 'Marié(e)' }, { valeur: 'union_libre', libelle: 'Union libre' }, { valeur: 'divorce', libelle: 'Divorcé(e)' }, { valeur: 'veuf', libelle: 'Veuf / veuve' }]} />
            </Champ>
            <Champ libelle="Enfants à charge" erreur={erreurs.nombre_enfants}>
              <input type="number" min={0} className="champ" {...champ('nombre_enfants')} />
            </Champ>
            <Champ libelle="N° pièce d'identité">
              <input className="champ" {...champ('numero_piece')} />
            </Champ>
            <Champ libelle="Téléphone">
              <input className="champ" {...champ('telephone')} placeholder="+241 0X XX XX XX" />
            </Champ>
            <Champ libelle="E-mail" erreur={erreurs.email}>
              <input type="email" className="champ" {...champ('email')} />
            </Champ>
            <Champ libelle="Adresse" className="sm:col-span-3">
              <input className="champ" {...champ('adresse')} />
            </Champ>
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-3 text-xs font-bold uppercase tracking-wide text-marque-800">Situation administrative</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            <Champ libelle="Catégorie de personnel" requis>
              <Selecteur vide={false} valeur={f.categorie} onChange={(v) => setF((x) => ({ ...x, categorie: v, corps_id: '' }))} options={versOptions(listes?.enums.categories)} />
            </Champ>
            <Champ libelle="Corps">
              <Selecteur valeur={f.corps_id} onChange={maj('corps_id')} options={opts(corps)} />
            </Champ>
            <Champ libelle="Grade">
              <Selecteur valeur={f.grade_id} onChange={maj('grade_id')} options={(listes?.grades ?? []).map((g) => ({ valeur: g.id, libelle: `${g.code} — ${g.libelle}` }))} />
            </Champ>
            <Champ libelle="Échelon" erreur={erreurs.echelon}>
              <input type="number" min={1} max={15} className="champ" {...champ('echelon')} />
            </Champ>
            <Champ libelle="Fonction">
              <Selecteur valeur={f.fonction_id} onChange={maj('fonction_id')} options={opts(listes?.fonctions)} />
            </Champ>
            {enseignant && (
              <Champ libelle="Discipline">
                <Selecteur valeur={f.discipline_id} onChange={maj('discipline_id')} options={opts(listes?.disciplines)} />
              </Champ>
            )}
            <Champ libelle="Établissement / structure" aide={agent ? 'Pour changer de poste, passez par une affectation.' : undefined} className={enseignant ? '' : 'sm:col-span-2'}>
              <Selecteur valeur={f.etablissement_id} onChange={maj('etablissement_id')} options={opts(listes?.etablissements, 'nom')} disabled={!!agent} />
            </Champ>
            <Champ libelle="Diplôme le plus élevé">
              <input className="champ" {...champ('diplome')} />
            </Champ>
            <Champ libelle="Date de recrutement" erreur={erreurs.date_recrutement}>
              <input type="date" className="champ" {...champ('date_recrutement')} />
            </Champ>
            <Champ libelle="Statut" requis>
              <Selecteur vide={false} valeur={f.statut} onChange={maj('statut')} options={versOptions(listes?.enums.statuts_agent)} />
            </Champ>
            <Champ libelle="Observations" className="sm:col-span-3">
              <textarea className="champ min-h-16" {...champ('observations')} />
            </Champ>
          </div>
        </fieldset>
      </form>
    </Modale>
  )
}
