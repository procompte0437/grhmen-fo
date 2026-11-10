import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useSession } from '../context/AuthContext'
import { messageErreur } from '../lib/api'
import { Logo } from '../components/layout/Coque'
import { Alerte } from '../components/ui/Elements'
import Icone from '../components/ui/Icone'

const COMPTES_DEMO = [
  ['admin@grhmen.ga', 'Administrateur système'],
  ['drh@grhmen.ga', 'Directeur des ressources humaines'],
  ['gestionnaire@grhmen.ga', 'Gestionnaire RH central'],
  ['dap.estuaire@grhmen.ga', "Directeur d'académie (Estuaire)"],
  ['proviseur@grhmen.ga', 'Proviseur — Lycée Léon Mba'],
  ['censeur@grhmen.ga', 'Censeur — Lycée Léon Mba'],
  ['enseignant@grhmen.ga', 'Enseignante en service'],
  ['nouveau.enseignant@grhmen.ga', 'Enseignant nouvellement affecté'],
  ['directeur.ecole@grhmen.ga', "Directrice d'école (Glass)"],
  ['agent@grhmen.ga', 'Agent administratif (DRH)'],
]

export default function Connexion() {
  const { utilisateur, connexion } = useSession()
  const navigate = useNavigate()
  const [identifiant, setIdentifiant] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [voir, setVoir] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)

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
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-menthe-100 p-12 lg:flex lg:flex-col lg:justify-between">
        <img src="/logo/sceau-gabon.png" alt="" aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-24 h-[30rem] w-[30rem] opacity-[0.07]" />
        <div className="relative flex items-center gap-4">
          <img src="/logo/sceau-gabon.png" alt="Sceau de la République gabonaise" className="h-16 w-16 rounded-full border border-marque-800/15 bg-white p-1 shadow-sm" />
          <img src="/logo/logo-men.png" alt="Ministère de l'Éducation nationale, de l'Instruction civique et de la Formation professionnelle" className="h-12 w-auto" />
        </div>
        <div className="relative max-w-xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-marque-800 shadow-sm">
            <span className="flex h-2 w-6 overflow-hidden rounded-sm"><span className="flex-1 bg-marque-700" /><span className="flex-1 bg-soleil-400" /><span className="flex-1 bg-ciel-500" /></span>
            République gabonaise
          </p>
          <h1 className="text-[40px] font-bold leading-[1.1] text-marque-950">GRHMEN — Gestion des ressources humaines de l'Éducation nationale</h1>
          <p className="mt-4 text-[15px] text-marque-900/80">
            Affectations, prises de service, début des cours, présence au poste et cessations de service : un seul outil pour le personnel enseignant et administratif, de l'école au ministère.
          </p>
          <ul className="mt-8 grid grid-cols-2 gap-3 text-[13.5px] font-medium text-marque-950">
            {[
              ['fleches', 'Suivi des affectations'],
              ['drapeau', 'Prises de service attestées'],
              ['horloge', 'Pointage de présence'],
              ['stop', 'Cessations de service'],
            ].map(([i, t]) => (
              <li key={t} className="flex items-center gap-2.5 rounded-lg bg-white/80 px-3 py-2.5 shadow-sm">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-marque-800 text-white"><Icone nom={i} className="h-4 w-4" /></span> {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-marque-900/55">© {new Date().getFullYear()} République Gabonaise · Ministère de l'Éducation nationale — GRHMEN</p>
      </div>

      <div className="flex items-center justify-center bg-creme-50 px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo compact />
            <img src="/logo/logo-men.png" alt="Ministère de l'Éducation nationale" className="h-9 w-auto" />
          </div>
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

          <div className="mt-8 rounded-xl border border-[#e6e4dc] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Comptes de démonstration — mot de passe « password »</p>
            <div className="mt-2 grid gap-1">
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
          </div>
        </div>
      </div>
    </div>
  )
}
