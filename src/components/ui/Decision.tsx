import { useState } from 'react'
import { messageErreur } from '../../lib/api'
import { useNotifier } from '../../context/NotificationContext'
import { Alerte, Champ, Modale } from './Elements'

export interface DemandeDecision {
  titre: string
  message: string
  libelleBouton: string
  danger?: boolean
  /** Si défini, un motif est demandé (obligatoire si `motifRequis`). */
  libelleMotif?: string
  motifRequis?: boolean
  action: (motif: string) => Promise<unknown>
  succes?: string
}

/** Fenêtre de confirmation, avec saisie facultative d'un motif ou d'un commentaire. */
export function FenetreDecision({ demande, onFermer, onTermine }: { demande: DemandeDecision | null; onFermer: () => void; onTermine?: () => void }) {
  const [motif, setMotif] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const notifier = useNotifier()

  if (!demande) return null

  const fermer = () => {
    setMotif('')
    setErreur(null)
    onFermer()
  }

  const valider = async () => {
    if (demande.motifRequis && !motif.trim()) {
      setErreur(`Le champ « ${demande.libelleMotif} » est obligatoire.`)
      return
    }
    setEnvoi(true)
    try {
      await demande.action(motif.trim())
      notifier(demande.succes ?? 'Opération effectuée.')
      fermer()
      onTermine?.()
    } catch (e) {
      setErreur(messageErreur(e))
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <Modale
      ouverte
      titre={demande.titre}
      onFermer={fermer}
      pied={
        <>
          <button type="button" className="btn btn-secondaire" onClick={fermer}>
            Annuler
          </button>
          <button type="button" className={`btn ${demande.danger ? 'btn-danger' : 'btn-primaire'}`} onClick={valider} disabled={envoi}>
            {envoi ? 'Traitement…' : demande.libelleBouton}
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-700">{demande.message}</p>
      {demande.libelleMotif && (
        <Champ libelle={demande.libelleMotif} requis={demande.motifRequis} className="mt-4">
          <textarea className="champ min-h-24" value={motif} onChange={(e) => setMotif(e.target.value)} autoFocus />
        </Champ>
      )}
      {erreur && (
        <div className="mt-3">
          <Alerte ton="rouge">{erreur}</Alerte>
        </div>
      )}
    </Modale>
  )
}
