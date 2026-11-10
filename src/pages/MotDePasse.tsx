import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../context/AuthContext'
import { useNotifier } from '../context/NotificationContext'
import { api, erreursChamps, messageErreur } from '../lib/api'
import { Alerte, Carte, Champ, EnTetePage } from '../components/ui/Elements'

export default function MotDePasse() {
  const { utilisateur, majUtilisateur } = useSession()
  const notifier = useNotifier()
  const navigate = useNavigate()
  const [f, setF] = useState({ ancien: '', nouveau: '', nouveau_confirmation: '' })
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)

  const soumettre = async (e: FormEvent) => {
    e.preventDefault()
    setEnvoi(true)
    setErreurs({})
    setErreur(null)
    try {
      const r = await api.put('/auth/mot-de-passe', f)
      majUtilisateur(r.data.user)
      notifier('Mot de passe modifié.')
      navigate('/')
    } catch (err) {
      setErreurs(erreursChamps(err))
      setErreur(messageErreur(err))
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <EnTetePage titre="Changer mon mot de passe" icone="cle" />
      {utilisateur?.doit_changer_mot_de_passe && (
        <div className="mb-4">
          <Alerte titre="Première connexion">Pour la sécurité de votre compte, choisissez un mot de passe personnel avant de continuer.</Alerte>
        </div>
      )}
      <Carte>
        <form onSubmit={soumettre} className="space-y-4">
          {erreur && <Alerte ton="rouge">{erreur}</Alerte>}
          <Champ libelle="Mot de passe actuel" requis erreur={erreurs.ancien}>
            <input type="password" className="champ" value={f.ancien} onChange={(e) => setF({ ...f, ancien: e.target.value })} required />
          </Champ>
          <Champ libelle="Nouveau mot de passe" requis erreur={erreurs.nouveau} aide="8 caractères minimum.">
            <input type="password" className="champ" value={f.nouveau} onChange={(e) => setF({ ...f, nouveau: e.target.value })} required minLength={8} />
          </Champ>
          <Champ libelle="Confirmer le nouveau mot de passe" requis>
            <input type="password" className="champ" value={f.nouveau_confirmation} onChange={(e) => setF({ ...f, nouveau_confirmation: e.target.value })} required />
          </Champ>
          <div className="flex justify-end">
            <button className="btn btn-primaire" disabled={envoi}>
              {envoi ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Carte>
    </div>
  )
}
