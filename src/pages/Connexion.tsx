import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useSession } from '../context/AuthContext'
import { messageErreur } from '../lib/api'
import { MINISTERE } from '../lib/ministere'
import { BandeTricolore } from '../components/layout/Coque'
import { Alerte } from '../components/ui/Elements'
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

export default function Connexion() {
  const { utilisateur, connexion } = useSession()
  const navigate = useNavigate()
  const [identifiant, setIdentifiant] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [voir, setVoir] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)
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
    <div className="relative min-h-screen overflow-hidden bg-marque-950">
      {/* Siège du ministère (immeuble des 9 étages, Libreville) en arrière-plan */}
      <img src="/images/siege-men.jpg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-marque-950/95 via-marque-950/80 to-marque-900/45" />
      <div className="absolute inset-x-0 top-0 z-10"><BandeTricolore /></div>

      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-5 py-12 lg:grid-cols-[1.15fr_1fr] lg:px-10">
        <div className="text-white">
          <div className="inline-flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-lg">
            <img src="/logo/embleme-men.png" alt="Emblème de la République gabonaise" className="h-11 w-auto rounded-sm" />
            <img src="/logo/logo-men.png" alt={MINISTERE.nom} className="h-10 w-auto sm:h-11" />
          </div>

          <h1 className="mt-10 text-4xl font-bold leading-[1.1] sm:text-[46px]">
            GRHMEN
            <span className="mt-2 block text-[26px] font-semibold leading-snug text-menthe-100 sm:text-[30px]">Gestion des ressources humaines de l'Éducation nationale</span>
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/85">
            Affectations, prises de service, début des cours, présence au poste et cessations de service : un seul outil pour le personnel enseignant et administratif, de l'école pré-primaire aux directions centrales.
          </p>

          <ul className="mt-8 grid max-w-xl grid-cols-2 gap-3 text-[13.5px] font-medium">
            {[
              ['fleches', 'Suivi des affectations'],
              ['drapeau', 'Prises de service attestées'],
              ['horloge', 'Pointage de présence'],
              ['stop', 'Cessations de service'],
            ].map(([i, t]) => (
              <li key={t} className="flex items-center gap-2.5 rounded-lg border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur-sm">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-soleil-400 text-marque-950"><Icone nom={i} className="h-4 w-4" /></span> {t}
              </li>
            ))}
          </ul>

          <div className="mt-10 hidden max-w-xl border-l-2 border-soleil-400 pl-4 text-[12.5px] leading-relaxed text-white/75 lg:block">
            <p className="font-semibold text-white">{MINISTERE.nom}</p>
            <p className="mt-1">{MINISTERE.mission}</p>
            <p className="mt-2">{MINISTERE.adresse} · {MINISTERE.telephone}</p>
          </div>
        </div>

        <div className="w-full max-w-md justify-self-center lg:justify-self-end">
          <div className="rounded-2xl bg-creme-50 p-7 shadow-2xl sm:p-8">
            <h2 className="titre-serif text-3xl font-bold text-slate-900">Connexion</h2>
            <p className="mt-1 text-sm text-slate-500">Identifiez-vous avec votre adresse e-mail ou votre matricule.</p>

            <form onSubmit={soumettre} className="mt-6 space-y-4">
              {erreur && <Alerte ton="rouge">{erreur}</Alerte>}
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">E-mail ou matricule</span>
                <input className="champ py-2.5" value={identifiant} onChange={(e) => setIdentifiant(e.target.value)} autoComplete="username" required autoFocus />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-700">Mot de passe</span>
                <div className="relative">
                  <input className="champ py-2.5 pr-11" type={voir ? 'text' : 'password'} value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} autoComplete="current-password" required />
                  <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-500 hover:bg-slate-100" onClick={() => setVoir((v) => !v)} aria-label={voir ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                    <Icone nom="oeil" className="h-4 w-4" />
                  </button>
                </div>
              </label>
              <button type="submit" className="btn btn-primaire w-full py-2.5" disabled={envoi}>
                {envoi ? 'Connexion…' : 'Se connecter'}
              </button>
            </form>

            <div className="mt-6 border-t border-[#e6e4dc] pt-4">
              <button type="button" onClick={() => setDemo((d) => !d)} className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-marque-800">
                Comptes de démonstration (mot de passe « password »)
                <Icone nom="chevron" className={`h-4 w-4 transition ${demo ? 'rotate-90' : ''}`} />
              </button>
              {demo && (
                <div className="mt-2 grid max-h-64 gap-0.5 overflow-y-auto">
                  {COMPTES_DEMO.map(([email, role]) => (
                    <button
                      key={email}
                      type="button"
                      className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-white"
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
          <p className="mt-4 text-center text-[11.5px] text-white/70">© {new Date().getFullYear()} République Gabonaise · Union – Travail – Justice</p>
        </div>
      </div>
    </div>
  )
}
