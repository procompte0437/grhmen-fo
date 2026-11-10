import { useEffect, useState, type FormEvent } from 'react'
import { useSession } from '../../context/AuthContext'
import { useNotifier } from '../../context/NotificationContext'
import { api, erreursChamps, messageErreur } from '../../lib/api'
import { aujourdhui } from '../../lib/format'
import { Alerte, Champ, Modale, Selecteur, versOptions } from '../ui/Elements'
import SelecteurAgent from './SelecteurAgent'

/** Création ou modification d'une affectation (mutation, nomination, première affectation…). */
export default function FormulaireAffectation({ ouvert, agentInitial, affectation, onFermer, onEnregistre }: { ouvert: boolean; agentInitial?: any; affectation?: any; onFermer: () => void; onEnregistre: () => void }) {
  const { listes } = useSession()
  const notifier = useNotifier()
  const [agent, setAgent] = useState<any>(null)
  const [f, setF] = useState<Record<string, string>>({})
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    if (!ouvert) return
    setErreurs({})
    setErreur(null)
    if (affectation) {
      setAgent(affectation.agent)
      setF({
        etablissement_id: String(affectation.etablissement_id), nature: affectation.nature, numero_decision: affectation.numero_decision ?? '',
        date_decision: affectation.date_decision ?? '', date_effet: affectation.date_effet, fonction_id: String(affectation.fonction_id ?? ''),
        discipline_id: String(affectation.discipline_id ?? ''), observations: affectation.observations ?? '',
      })
    } else {
      setAgent(agentInitial ?? null)
      setF({ etablissement_id: '', nature: 'mutation', numero_decision: '', date_decision: aujourdhui(), date_effet: aujourdhui(), fonction_id: String(agentInitial?.fonction_id ?? ''), discipline_id: String(agentInitial?.discipline_id ?? ''), observations: '' })
    }
  }, [ouvert, affectation?.id, agentInitial?.id]) // réinitialise seulement à l'ouverture ou si la cible change

  const maj = (k: string) => (v: string) => setF((x) => ({ ...x, [k]: v }))

  const soumettre = async (e: FormEvent) => {
    e.preventDefault()
    if (!agent) {
      setErreur('Choisissez l\'agent à affecter.')
      return
    }
    setEnvoi(true)
    setErreurs({})
    setErreur(null)
    const charge: Record<string, unknown> = { agent_id: agent.id }
    Object.entries(f).forEach(([k, v]) => (charge[k] = v === '' ? null : v))
    try {
      if (affectation) await api.put(`/affectations/${affectation.id}`, charge)
      else await api.post('/affectations', charge)
      notifier(affectation ? 'Affectation modifiée.' : 'Affectation enregistrée. L\'agent doit maintenant prendre service.')
      onEnregistre()
    } catch (err) {
      setErreurs(erreursChamps(err))
      setErreur(messageErreur(err))
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <Modale
      ouverte={ouvert}
      large
      titre={affectation ? 'Modifier l\'affectation' : 'Nouvelle affectation'}
      onFermer={onFermer}
      pied={
        <>
          <button type="button" className="btn btn-secondaire" onClick={onFermer}>
            Annuler
          </button>
          <button className="btn btn-primaire" form="form-affectation" disabled={envoi}>
            {envoi ? 'Enregistrement…' : 'Enregistrer l\'affectation'}
          </button>
        </>
      }
    >
      <form id="form-affectation" onSubmit={soumettre} className="grid gap-4 sm:grid-cols-2">
        {erreur && (
          <div className="sm:col-span-2">
            <Alerte ton="rouge">{erreur}</Alerte>
          </div>
        )}
        <Champ libelle="Agent" requis className="sm:col-span-2" erreur={erreurs.agent_id}>
          {affectation || agentInitial ? (
            <div className="champ bg-slate-50 font-medium">
              {agent?.nom_complet ?? `${agent?.nom} ${agent?.prenom}`} — {agent?.matricule}
            </div>
          ) : (
            <SelecteurAgent valeur={agent} onChange={setAgent} />
          )}
        </Champ>
        {!affectation && (
          <Champ libelle="Établissement d'affectation" requis className="sm:col-span-2" erreur={erreurs.etablissement_id}>
            <Selecteur valeur={f.etablissement_id} onChange={maj('etablissement_id')} options={(listes?.etablissements ?? []).filter((e) => e.id !== agent?.etablissement_id).map((e) => ({ valeur: e.id, libelle: `${e.nom} — ${e.ville ?? ''}` }))} />
          </Champ>
        )}
        <Champ libelle="Nature de l'affectation" requis erreur={erreurs.nature}>
          <Selecteur vide={false} valeur={f.nature} onChange={maj('nature')} options={versOptions(listes?.enums.natures_affectation)} />
        </Champ>
        <Champ libelle="N° de la décision / de l'arrêté" erreur={erreurs.numero_decision}>
          <input className="champ" value={f.numero_decision ?? ''} onChange={(e) => maj('numero_decision')(e.target.value)} placeholder="0123/MEN/SG/DRH" />
        </Champ>
        <Champ libelle="Date de la décision" erreur={erreurs.date_decision}>
          <input type="date" className="champ" value={f.date_decision ?? ''} onChange={(e) => maj('date_decision')(e.target.value)} />
        </Champ>
        <Champ libelle="Date d'effet" requis erreur={erreurs.date_effet}>
          <input type="date" className="champ" value={f.date_effet ?? ''} onChange={(e) => maj('date_effet')(e.target.value)} required />
        </Champ>
        <Champ libelle="Fonction au nouveau poste">
          <Selecteur valeur={f.fonction_id} onChange={maj('fonction_id')} options={(listes?.fonctions ?? []).map((x) => ({ valeur: x.id, libelle: x.libelle as string }))} />
        </Champ>
        <Champ libelle="Discipline">
          <Selecteur valeur={f.discipline_id} onChange={maj('discipline_id')} options={(listes?.disciplines ?? []).map((x) => ({ valeur: x.id, libelle: x.libelle as string }))} />
        </Champ>
        <Champ libelle="Observations" className="sm:col-span-2">
          <textarea className="champ min-h-16" value={f.observations ?? ''} onChange={(e) => maj('observations')(e.target.value)} />
        </Champ>
      </form>
    </Modale>
  )
}
