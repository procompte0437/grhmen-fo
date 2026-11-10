import { useEffect, useState, type FormEvent } from 'react'
import { useSession } from '../../context/AuthContext'
import { useNotifier } from '../../context/NotificationContext'
import { api, erreursChamps, messageErreur } from '../../lib/api'
import { aujourdhui } from '../../lib/format'
import { Alerte, Champ, Modale, Selecteur, versOptions } from '../ui/Elements'
import SelecteurAgent from './SelecteurAgent'

export default function FormulaireCessation({ ouvert, agentInitial, onFermer, onEnregistre }: { ouvert: boolean; agentInitial?: any; onFermer: () => void; onEnregistre: () => void }) {
  const { listes } = useSession()
  const notifier = useNotifier()
  const [agent, setAgent] = useState<any>(null)
  const [f, setF] = useState({ type: 'abandon_poste', date_cessation: aujourdhui(), motif: '' })
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)

  useEffect(() => {
    if (!ouvert) return
    setAgent(agentInitial ?? null)
    setF({ type: 'abandon_poste', date_cessation: aujourdhui(), motif: '' })
    setErreurs({})
    setErreur(null)
  }, [ouvert, agentInitial?.id])

  const soumettre = async (e: FormEvent) => {
    e.preventDefault()
    if (!agent) return setErreur('Choisissez l\'agent concerné.')
    setEnvoi(true)
    try {
      await api.post('/cessations', { ...f, agent_id: agent.id })
      notifier('Cessation de service signalée. Elle doit être validée par l\'autorité compétente.')
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
      titre="Signaler une cessation de service"
      onFermer={onFermer}
      pied={
        <>
          <button type="button" className="btn btn-secondaire" onClick={onFermer}>
            Annuler
          </button>
          <button className="btn btn-danger" form="form-cessation" disabled={envoi}>
            {envoi ? 'Envoi…' : 'Signaler la cessation'}
          </button>
        </>
      }
    >
      <form id="form-cessation" onSubmit={soumettre} className="space-y-4">
        {erreur && <Alerte ton="rouge">{erreur}</Alerte>}
        <Champ libelle="Agent" requis>
          {agentInitial ? <div className="champ bg-slate-50 font-medium">{agentInitial.nom_complet} — {agentInitial.matricule}</div> : <SelecteurAgent valeur={agent} onChange={setAgent} filtres={{ statut: 'actif' }} />}
        </Champ>
        <Champ libelle="Motif de cessation" requis erreur={erreurs.type}>
          <Selecteur vide={false} valeur={f.type} onChange={(v) => setF({ ...f, type: v })} options={versOptions(listes?.enums.types_cessation)} />
        </Champ>
        <Champ libelle="Date de cessation" requis erreur={erreurs.date_cessation}>
          <input type="date" className="champ" value={f.date_cessation} onChange={(e) => setF({ ...f, date_cessation: e.target.value })} required />
        </Champ>
        <Champ libelle="Exposé des faits" requis erreur={erreurs.motif}>
          <textarea className="champ min-h-28" value={f.motif} onChange={(e) => setF({ ...f, motif: e.target.value })} required placeholder="Circonstances, dates, démarches effectuées (mises en demeure, etc.)" />
        </Champ>
      </form>
    </Modale>
  )
}
