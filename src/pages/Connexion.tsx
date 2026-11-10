import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useSession } from '../context/AuthContext'
import { messageErreur } from '../lib/api'
import { MINISTERE } from '../lib/ministere'
import { Alerte, Modale } from '../components/ui/Elements'
import Icone from '../components/ui/Icone'

const COMPTES_DEMO = [
  ['admin@grhmen.ga', 'Administrateur système'],
  ['drh@grhmen.ga', 'Directrice générale des ressources humaines'],
  ['gestionnaire@grhmen.ga', 'Gestionnaire RH (DGRH)'],
  ['dap.estuaire@grhmen.ga', "Directeur d'académie (Estuaire)"],
  ['proviseur@grhmen.ga', 'Proviseur — Lycée Léon Mba'],
  ['censeur@grhmen.ga', 'Censeur — Lycée Léon Mba'],
  ['enseignant@grhmen.ga', 'Enseignante en service'],
  ['nouveau.enseignant@grhmen.ga', 'Enseignant nouvellement affecté'],
  ['directeur.ecole@grhmen.ga', "Directrice d'école (Glass)"],
  ['agent@grhmen.ga', 'Agent administratif (DGRH)'],
]

/** Logo de l'application : pictogramme (personnel + élan jaune) et nom GRHMEN. */
function LogoGrhmen() {
  return (
    <div className="flex items-center justify-center gap-3">
      <svg viewBox="0 0 64 64" className="h-16 w-16" aria-hidden="true">
        <path d="M8 26 32 10l24 16v4H8z" fill="#14563a" />
        <rect x="12" y="30" width="40" height="22" rx="2" fill="#14563a" />
        <circle cx="24" cy="38" r="4" fill="#fff" />
        <circle cx="40" cy="38" r="4" fill="#fff" />
        <path d="M17 50c0-5 3-7 7-7s7 2 7 7M33 50c0-5 3-7 7-7s7 2 7 7" fill="#fff" />
        <path d="M4 50c14 10 40 10 58-12l-4-1 6-5 1 8-3-2C46 54 18 58 4 50z" fill="#fcd116" />
        <rect x="30" y="52" width="4" height="9" fill="#2f62a8" />
      </svg>
      <span className="text-[44px] font-black leading-none tracking-tight text-[#14205a]">
        GRH<span className="text-marque-800">MEN</span>
      </span>
    </div>
  )
}

export default function Connexion() {
  const { utilisateur, connexion } = useSession()
  const navigate = useNavigate()
  const [identifiant, setIdentifiant] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [voir, setVoir] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const [oubli, setOubli] = useState(false)
  const [demo, setDemo] = useState(false)

  if (utilisateur) return <Navigate to="/" replace />

  const soumettre = async (e: FormEvent) => {
    e.preventDefault()
    setErreur(null)
    setEnvoi(true)
    try {
      await connexion(identifiant, motDePasse)
      navigate('/')
    } catch (err) {
      setErreur(messageErreur(err))
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-[#f4f8f6] lg:grid-cols-2">
      {/* Colonne gauche : formulaire */}
      <div className="flex flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">
          <LogoGrhmen />
          <p className="mt-4 text-center text-[14.5px] font-semibold text-[#14205a]">Gestion des Ressources Humaines de l'Éducation Nationale</p>

          <div className="mt-8 rounded-xl border border-[#e3e8e5] bg-white p-6 shadow-[0_8px_30px_rgb(16_40_28/0.07)] sm:p-7">
            <h1 className="text-center text-[24px] font-semibold text-slate-900" style={{ fontFamily: 'var(--font-sans)', letterSpacing: 0 }}>Connexion</h1>
            <p className="mt-1 text-center text-sm text-slate-500">Entrez votre e-mail ou matricule et votre mot de passe</p>

            <form onSubmit={soumettre} className="mt-6 space-y-5">
              {erreur && <Alerte ton="rouge">{erreur}</Alerte>}
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-800">
                  E-mail ou matricule <span className="text-red-600">*</span>
                </span>
                <input className="champ border-[#eef1ef] bg-[#f1f4f2] py-3" placeholder="votre.email@education.gouv.ga" value={identifiant} onChange={(e) => setIdentifiant(e.target.value)} autoComplete="username" required autoFocus />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-800">
                  Mot de passe <span className="text-red-600">*</span>
                </span>
                <div className="relative">
                  <input className="champ border-[#eef1ef] bg-[#f1f4f2] py-3 pr-11" placeholder="Votre mot de passe" type={voir ? 'text' : 'password'} value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} autoComplete="current-password" required />
                  <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-600 hover:bg-slate-200/60" onClick={() => setVoir((v) => !v)} aria-label={voir ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                    <Icone nom="oeil" className="h-4 w-4" />
                  </button>
                </div>
              </label>
              <button type="button" className="text-sm font-semibold text-marque-700 hover:underline" onClick={() => setOubli(true)}>
                Mot de passe oublié ?
              </button>
              <button type="submit" className="btn btn-primaire w-full bg-[#14874f] py-3 text-[15px] hover:bg-marque-800" disabled={envoi}>
                {envoi ? 'Connexion…' : 'Se connecter'}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-slate-600">© {new Date().getFullYear()} GRHMEN — {MINISTERE.sigle}. Tous droits réservés.</p>

          <div className="mt-4 text-center">
            <button type="button" onClick={() => setDemo((d) => !d)} className="text-xs font-medium text-slate-500 underline-offset-2 hover:text-marque-800 hover:underline">
              {demo ? 'Masquer' : 'Afficher'} les comptes de démonstration
            </button>
            {demo && (
              <div className="mt-2 grid gap-0.5 rounded-xl border border-[#e3e8e5] bg-white p-2 text-left">
                <p className="px-2 pb-1 text-[11px] text-slate-500">Mot de passe : « password »</p>
                {COMPTES_DEMO.map(([email, role]) => (
                  <button
                    key={email}
                    type="button"
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-[#f1f4f2]"
                    onClick={() => {
                      setIdentifiant(email)
                      setMotDePasse('password')
                    }}
                  >
                    <span className="font-medium text-slate-700">{role}</span>
                    <span className="truncate text-slate-500">{email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Colonne droite : siège du ministère */}
      <div className="relative hidden overflow-hidden lg:block">
        <img src="/images/siege-men.jpg" alt="Siège du Ministère de l'Éducation nationale, immeuble des 9 étages à Libreville" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-black/45" />
        <div className="relative flex h-full flex-col items-center justify-center px-10 text-center text-white">
          <div className="rounded-2xl bg-white p-4 shadow-2xl">
            <img src="/logo/embleme-men.png" alt="Emblème de la République gabonaise" className="h-24 w-auto rounded" />
          </div>
          <p className="mt-6 text-[32px] font-extrabold tracking-wide drop-shadow-[0_2px_6px_rgb(0_0_0/0.6)]">{MINISTERE.sigle}</p>
          <p className="mt-2 max-w-xl text-[19px] font-semibold leading-snug drop-shadow-[0_2px_6px_rgb(0_0_0/0.6)]">{MINISTERE.nom}</p>
        </div>
      </div>

      <Modale
        ouverte={oubli}
        titre="Mot de passe oublié"
        onFermer={() => setOubli(false)}
        pied={
          <button className="btn btn-primaire" onClick={() => setOubli(false)}>
            J'ai compris
          </button>
        }
      >
        <div className="space-y-3 text-sm text-slate-700">
          <p>Pour des raisons de sécurité, les mots de passe sont réinitialisés par l'administrateur de GRHMEN.</p>
          <p>
            Contactez le service informatique ou la <strong>{MINISTERE.directionRh}</strong> en indiquant votre matricule : un mot de passe temporaire vous sera communiqué, à changer dès votre connexion.
          </p>
          <p className="text-slate-500">
            {MINISTERE.adresse} · {MINISTERE.telephone}
          </p>
        </div>
      </Modale>
    </div>
  )
}
