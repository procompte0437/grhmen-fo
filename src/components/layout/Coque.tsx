import { useMemo, useState } from 'react'
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useSession } from '../../context/AuthContext'
import { aujourdhui, dateFr, initiales } from '../../lib/format'
import type { AnneeScolaire } from '../../lib/annee'
import type { OptionAcces } from '../../types'
import { MINISTERE } from '../../lib/ministere'
import Icone from '../ui/Icone'
import { Chargement, Selecteur } from '../ui/Elements'

const ORDRE_GROUPES = ['Général', 'Mon espace', 'Gestion du personnel', 'Pilotage', 'Administration']

const SOUS_TITRES: Record<string, string> = {
  'Général': 'Synthèse et alertes',
  'Mon espace': 'Mes démarches',
  'Gestion du personnel': 'Carrière et assiduité',
  'Pilotage': 'Établissements et indicateurs',
  'Administration': 'Paramétrage et sécurité',
}

/** Bande vert-jaune-bleu, comme en tête du site du ministère. */
export function BandeTricolore() {
  return (
    <div className="flex h-1.5 w-full" aria-hidden="true">
      <span className="flex-1 bg-[#009e60]" />
      <span className="flex-1 bg-soleil-400" />
      <span className="flex-1 bg-[#3a75c4]" />
    </div>
  )
}

/** Emblème officiel (sceau sur fond de drapeau) et nom de l'application. */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img src="/logo/embleme-men.png" alt="Emblème de la République gabonaise" className="h-9 w-auto shrink-0 rounded-[3px] shadow-sm ring-1 ring-marque-800/15" />
      {!compact && (
        <div className="leading-tight">
          <p className="titre-serif text-[17px] font-bold text-marque-950">GRHMEN · MEN</p>
          <p className="text-[10.5px] text-marque-900/60">Ressources humaines</p>
        </div>
      )}
    </div>
  )
}

function MenuLateral({ onNaviguer }: { onNaviguer?: () => void }) {
  const { utilisateur, badges } = useSession()
  const groupes = useMemo(() => {
    const parGroupe = new Map<string, OptionAcces[]>()
    ;(utilisateur?.options_acces ?? []).forEach((o) => {
      const g = parGroupe.get(o.groupe) ?? []
      g.push(o)
      parGroupe.set(o.groupe, g)
    })
    return [...parGroupe.entries()].sort((a, b) => ORDRE_GROUPES.indexOf(a[0]) - ORDRE_GROUPES.indexOf(b[0]))
  }, [utilisateur])

  return (
    <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4" aria-label="Menu principal">
      {groupes.map(([groupe, options]) => (
        <div key={groupe}>
          <div className="mb-1 px-2.5">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-marque-900/70">{groupe}</p>
            <p className="text-[10px] text-marque-900/45">{SOUS_TITRES[groupe] ?? ''}</p>
          </div>
          <ul className="space-y-0.5">
            {options.map((o) => (
              <li key={o.code}>
                <NavLink
                  to={o.route}
                  end={o.route === '/'}
                  onClick={onNaviguer}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13.5px] font-semibold transition ${isActive ? 'bg-menthe-200 text-orange-accent' : 'text-marque-950 hover:bg-white/55'}`
                  }
                >
                  <Icone nom={o.icone} className="h-[17px] w-[17px] shrink-0" />
                  <span className="flex-1 truncate">{o.libelle}</span>
                  {!!badges[o.code] && <span className="min-w-5 rounded-full bg-amber-400 px-1.5 text-center text-[10.5px] font-bold text-marque-950">{badges[o.code] > 99 ? '99+' : badges[o.code]}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

export default function Coque() {
  const { utilisateur, chargement, deconnexion, listes, annee, changerAnnee, etablissement, etablissements, changerEtablissement } = useSession()
  const [menuOuvert, setMenuOuvert] = useState(false)
  const [compteOuvert, setCompteOuvert] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  if (!chargement && !utilisateur) return <Navigate to="/connexion" replace state={{ depuis: location.pathname }} />
  if (utilisateur?.doit_changer_mot_de_passe && location.pathname !== '/mot-de-passe') return <Navigate to="/mot-de-passe" replace />

  const annees = ((listes?.annees_scolaires ?? []) as unknown as AnneeScolaire[]).slice().sort((a, b) => b.date_debut.localeCompare(a.date_debut))
  const jour = aujourdhui()
  const etat = !annee
    ? { libelle: '', classe: '' }
    : annee.active
      ? { libelle: 'En cours', classe: 'bg-marque-100 text-marque-800' }
      : jour > annee.date_fin
        ? { libelle: 'Archive', classe: 'bg-slate-200 text-slate-700' }
        : { libelle: 'À venir', classe: 'bg-ciel-100 text-ciel-600' }

  const quitter = async () => {
    await deconnexion()
    navigate('/connexion')
  }

  const barre = (
    <div className="flex h-full flex-col border-r border-marque-800/10 bg-menthe-100">
      <div className="flex h-[68px] items-center justify-between border-b border-marque-800/10 px-4">
        <Logo />
        <button type="button" className="rounded-lg p-1.5 text-marque-900 hover:bg-white/60 lg:hidden" onClick={() => setMenuOuvert(false)} aria-label="Fermer le menu">
          <Icone nom="fermer" />
        </button>
      </div>
      <MenuLateral onNaviguer={() => setMenuOuvert(false)} />
      <div className="border-t border-marque-800/10 px-3 py-2">
        <NavLink to="/aide" onClick={() => setMenuOuvert(false)} className={({ isActive }) => `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] font-semibold ${isActive ? 'bg-menthe-200 text-orange-accent' : 'text-marque-950 hover:bg-white/55'}`}>
          <Icone nom="aide" className="h-[17px] w-[17px]" /> Aide et guide utilisateur
        </NavLink>
      </div>
      <p className="border-t border-marque-800/10 px-5 py-3 text-[10px] leading-snug text-marque-900/55">République Gabonaise · {MINISTERE.nom}</p>
    </div>
  )

  return (
    <div className="min-h-screen lg:pl-64">
      <div className="no-print fixed inset-x-0 top-0 z-40"><BandeTricolore /></div>
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 pt-1.5 lg:block">{barre}</aside>
      {menuOuvert && (
        <div className="no-print fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMenuOuvert(false)} />
          <aside className="absolute inset-y-0 left-0 w-[min(85vw,17rem)]">{barre}</aside>
        </div>
      )}

      <header className="no-print sticky top-1.5 z-20 mt-1.5 flex h-[68px] items-center justify-between gap-3 border-b border-[#e6e4dc] bg-creme-50/95 px-4 backdrop-blur sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" className="rounded-lg p-2 text-marque-900 hover:bg-creme-100 lg:hidden" onClick={() => setMenuOuvert(true)} aria-label="Ouvrir le menu">
            <Icone nom="menu" />
          </button>
          <div className="lg:hidden">
            <Logo compact />
          </div>
          {utilisateur && (
            <p className="hidden min-w-0 max-w-[16rem] truncate text-[12.5px] text-slate-600 2xl:block">
              {utilisateur.profil?.libelle}
            </p>
          )}
          {etablissement && (etablissements.length > 1 ? (
            <label className="relative flex min-w-0 items-center">
              <Icone nom="ecole" className="pointer-events-none absolute left-2.5 z-10 h-4 w-4 text-marque-800" />
              <Selecteur
                ariaLabel="Établissement consulté"
                vide={false}
                valeur={etablissement.id}
                onChange={(v) => changerEtablissement(Number(v))}
                className="max-w-[11rem] cursor-pointer rounded-lg border border-[#e1ded3] bg-white py-1.5 pl-8 pr-2 text-[13px] font-medium text-slate-800 outline-none hover:border-marque-700/50 focus:border-marque-700 sm:max-w-[20rem]"
                options={etablissements.map((e) => ({ valeur: e.id, libelle: `${e.nom ?? ''}${e.ville ? ` — ${String(e.ville)}` : ''}` }))}
              />
            </label>
          ) : (
            <span className="flex min-w-0 max-w-[9.5rem] items-center gap-1.5 text-[13px] font-medium text-slate-700 sm:max-w-[16rem] md:max-w-[22rem]" title={String(etablissement.nom ?? '')}>
              <Icone nom="ecole" className="h-4 w-4 shrink-0 text-marque-800" />
              <span className="truncate">{etablissement.nom as string}</span>
            </span>
          ))}
          {annee && (
            <div className="hidden items-center gap-2 sm:flex">
              <label className="relative flex items-center">
                <Icone nom="calendrier" className="pointer-events-none absolute left-3 h-4 w-4 text-marque-800" />
                <select
                  aria-label="Année scolaire consultée"
                  className="cursor-pointer appearance-none whitespace-nowrap rounded-lg border border-[#e1ded3] bg-white py-1.5 pl-9 pr-8 text-[13px] font-medium text-slate-800 outline-none hover:border-marque-700/50 focus:border-marque-700"
                  value={annee.id}
                  onChange={(e) => changerAnnee(Number(e.target.value))}
                >
                  {annees.map((a) => (
                    <option key={a.id} value={a.id}>
                      Année scolaire {a.libelle}
                    </option>
                  ))}
                </select>
                <Icone nom="chevron" className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 rotate-90 text-slate-500" />
              </label>
              <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${etat.classe}`}>{etat.libelle}</span>
            </div>
          )}
        </div>
        {utilisateur && (
          <div className="relative">
            <button type="button" className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-creme-100" onClick={() => setCompteOuvert((o) => !o)}>
              <span className="hidden text-right leading-tight sm:block">
                <span className="block whitespace-nowrap text-[13px] font-semibold text-slate-900">{utilisateur.name}</span>
                <span className="block text-[11px] text-slate-500">{utilisateur.profil?.code}</span>
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-marque-900 text-[13px] font-bold text-white">{initiales(utilisateur.name)}</span>
              <Icone nom="chevron" className="hidden h-4 w-4 rotate-90 text-slate-500 sm:block" />
            </button>
            {compteOuvert && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setCompteOuvert(false)} />
                <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-[#e6e4dc] bg-white shadow-xl">
                  <div className="border-b border-slate-100 px-4 py-3 text-sm">
                    <p className="font-semibold text-slate-900">{utilisateur.name}</p>
                    <p className="truncate text-slate-500">{utilisateur.email}</p>
                    {utilisateur.matricule && <p className="text-xs text-slate-500">Matricule {utilisateur.matricule}</p>}
                  </div>
                  <button type="button" className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-creme-50" onClick={() => { setCompteOuvert(false); navigate('/aide') }}>
                    <Icone nom="aide" className="h-4 w-4" /> Guide utilisateur
                  </button>
                  <button type="button" className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-creme-50" onClick={() => { setCompteOuvert(false); navigate('/mot-de-passe') }}>
                    <Icone nom="cle" className="h-4 w-4" /> Changer mon mot de passe
                  </button>
                  <button type="button" className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-700 hover:bg-red-50" onClick={quitter}>
                    <Icone nom="deconnexion" className="h-4 w-4" /> Se déconnecter
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6">
        {utilisateur && !chargement ? (
          <>
            {annee && !annee.active && (
              <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-[13px] text-slate-700">
                <span className="flex items-center gap-2">
                  <Icone nom="historique" className="h-4 w-4 text-slate-500" />
                  Vous consultez l'année scolaire <strong>{annee.libelle}</strong> (du {dateFr(annee.date_debut)} au {dateFr(annee.date_fin)}).
                </span>
                {annees.some((a) => a.active) && (
                  <button type="button" className="font-semibold text-marque-800 hover:underline" onClick={() => changerAnnee(annees.find((a) => a.active)!.id)}>
                    Revenir à l'année en cours
                  </button>
                )}
              </div>
            )}
            {/* Changer d'année ou d'établissement recharge les données de l'écran. */}
            <Outlet key={`${annee?.id ?? 'annee'}-${etablissement?.id ?? 'etab'}`} />
          </>
        ) : (
          <Chargement />
        )}
      </main>
    </div>
  )
}

/** Protège une page : l'utilisateur doit posséder l'option d'accès correspondante. */
export function Garde({ code, children }: { code: string; children: React.ReactNode }) {
  const { peut } = useSession()
  if (!peut(code)) return <AccesRefuse />
  return <>{children}</>
}

export function AccesRefuse() {
  return (
    <div className="carte mx-auto mt-10 max-w-lg p-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
        <Icone nom="bouclier" />
      </div>
      <h1 className="text-lg font-bold">Accès non autorisé</h1>
      <p className="mt-1 text-sm text-slate-500">Votre profil ne dispose pas de l'option d'accès à cet écran. Contactez l'administrateur pour obtenir l'habilitation.</p>
      <NavLink to="/" className="btn btn-primaire mt-5">
        Retour au tableau de bord
      </NavLink>
    </div>
  )
}
