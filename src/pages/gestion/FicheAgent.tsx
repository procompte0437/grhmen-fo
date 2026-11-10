import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSession } from '../../context/AuthContext'
import { useNotifier } from '../../context/NotificationContext'
import { api, erreursChamps, messageErreur } from '../../lib/api'
import FicheDossier from '../../components/FicheDossier'
import FormulaireAffectation from '../../components/formulaires/FormulaireAffectation'
import FormulaireAgent from '../../components/formulaires/FormulaireAgent'
import FormulaireCessation from '../../components/formulaires/FormulaireCessation'
import { FenetreDecision, type DemandeDecision } from '../../components/ui/Decision'
import { Alerte, Champ, Chargement, EnTetePage, Modale, Selecteur } from '../../components/ui/Elements'
import Icone from '../../components/ui/Icone'

export default function FicheAgent() {
  const { id } = useParams()
  const { peut, listes } = useSession()
  const notifier = useNotifier()
  const navigate = useNavigate()
  const [d, setD] = useState<any>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [modale, setModale] = useState<'' | 'modifier' | 'affecter' | 'cessation' | 'compte'>('')
  const [decision, setDecision] = useState<DemandeDecision | null>(null)
  const [compte, setCompte] = useState({ email: '', profil_id: '' })
  const [erreursCompte, setErreursCompte] = useState<Record<string, string>>({})
  const [motDePasse, setMotDePasse] = useState<string | null>(null)

  const charger = useCallback(() => {
    api
      .get(`/agents/${id}`)
      .then((r) => setD(r.data.data))
      .catch((e) => setErreur(messageErreur(e)))
  }, [id])
  useEffect(charger, [charger])

  if (erreur) return <Alerte ton="rouge">{erreur}</Alerte>
  if (!d) return <Chargement />
  const a = d.agent

  const profilSuggere = () => {
    const code = a.fonction?.code
    const cible = ['PROV', 'PRINC', 'DIR_ECOLE'].includes(code) ? 'CHEF_ETAB' : code === 'CENS' ? 'CENSEUR' : a.categorie === 'administratif' ? 'AGENT_ADMIN' : 'ENSEIGNANT'
    return String(listes?.profils.find((p) => p.code === cible)?.id ?? '')
  }

  const creerCompte = async () => {
    setErreursCompte({})
    try {
      const r = await api.post(`/agents/${a.id}/compte`, compte)
      setMotDePasse(r.data.mot_de_passe_temporaire)
      notifier('Compte utilisateur créé.')
      charger()
    } catch (e) {
      setErreursCompte(erreursChamps(e))
      notifier(messageErreur(e), 'erreur')
    }
  }

  const actions = (
    <div className="flex flex-wrap justify-end gap-2">
      {peut('AGENT_MODIFIER') && (
        <button className="btn btn-secondaire px-3 py-1.5 text-xs" onClick={() => setModale('modifier')}>
          <Icone nom="crayon" className="h-4 w-4" /> Modifier
        </button>
      )}
      {peut('AFFECTATION_CREER') && a.statut === 'actif' && (
        <button className="btn btn-secondaire px-3 py-1.5 text-xs" onClick={() => setModale('affecter')}>
          <Icone nom="fleches" className="h-4 w-4" /> Affecter
        </button>
      )}
      {peut('AGENT_CREER_COMPTE') && !a.utilisateur && (
        <button
          className="btn btn-secondaire px-3 py-1.5 text-xs"
          onClick={() => {
            setCompte({ email: a.email ?? '', profil_id: profilSuggere() })
            setMotDePasse(null)
            setModale('compte')
          }}
        >
          <Icone nom="utilisateur" className="h-4 w-4" /> Créer le compte
        </button>
      )}
      {peut('CESSATION_SIGNALER') && a.statut === 'actif' && (
        <button className="btn btn-secondaire px-3 py-1.5 text-xs text-red-700" onClick={() => setModale('cessation')}>
          <Icone nom="stop" className="h-4 w-4" /> Cessation
        </button>
      )}
      {peut('AGENT_SUPPRIMER') && (
        <button
          className="btn btn-secondaire px-3 py-1.5 text-xs text-red-700"
          onClick={() =>
            setDecision({
              titre: 'Supprimer le dossier',
              message: `Le dossier de ${a.nom_complet} sera archivé et son compte désactivé. Continuer ?`,
              libelleBouton: 'Supprimer',
              danger: true,
              succes: 'Dossier archivé.',
              action: () => api.delete(`/agents/${a.id}`).then(() => navigate('/personnel')),
            })
          }
        >
          <Icone nom="poubelle" className="h-4 w-4" />
        </button>
      )}
    </div>
  )

  return (
    <div>
      <EnTetePage titre="Dossier de l'agent" icone="dossier" actions={<Link to="/personnel" className="btn btn-secondaire">← Retour à la liste</Link>} />
      <FicheDossier dossier={d} actions={actions} />

      <FormulaireAgent ouvert={modale === 'modifier'} agent={a} onFermer={() => setModale('')} onEnregistre={() => { setModale(''); charger() }} />
      <FormulaireAffectation ouvert={modale === 'affecter'} agentInitial={a} onFermer={() => setModale('')} onEnregistre={() => { setModale(''); charger() }} />
      <FormulaireCessation ouvert={modale === 'cessation'} agentInitial={a} onFermer={() => setModale('')} onEnregistre={() => { setModale(''); charger() }} />
      <FenetreDecision demande={decision} onFermer={() => setDecision(null)} />

      <Modale
        ouverte={modale === 'compte'}
        titre={`Créer le compte de ${a.nom_complet}`}
        onFermer={() => setModale('')}
        pied={
          motDePasse ? (
            <button className="btn btn-primaire" onClick={() => setModale('')}>
              Terminé
            </button>
          ) : (
            <>
              <button className="btn btn-secondaire" onClick={() => setModale('')}>
                Annuler
              </button>
              <button className="btn btn-primaire" onClick={creerCompte}>
                Créer le compte
              </button>
            </>
          )
        }
      >
        {motDePasse ? (
          <Alerte ton="vert" titre="Compte créé">
            Communiquez à l'agent son identifiant <strong>{compte.email}</strong> (ou son matricule <strong>{a.matricule}</strong>) et le mot de passe temporaire :{' '}
            <code className="rounded bg-white px-2 py-0.5 text-base font-bold">{motDePasse}</code>. Il devra le changer à la première connexion.
          </Alerte>
        ) : (
          <div className="space-y-4">
            <Champ libelle="E-mail de connexion" requis erreur={erreursCompte.email}>
              <input type="email" className="champ" value={compte.email} onChange={(e) => setCompte({ ...compte, email: e.target.value })} />
            </Champ>
            <Champ libelle="Profil" requis erreur={erreursCompte.profil_id} aide="Le profil détermine le menu et les actions auxquels l'agent aura accès.">
              <Selecteur valeur={compte.profil_id} onChange={(v) => setCompte({ ...compte, profil_id: v })} options={(listes?.profils ?? []).map((p) => ({ valeur: p.id, libelle: p.libelle as string }))} />
            </Champ>
          </div>
        )}
      </Modale>
    </div>
  )
}
