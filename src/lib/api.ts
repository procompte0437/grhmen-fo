import axios, { AxiosError } from 'axios'
import type { Listes, Utilisateur } from '../types'

const CLE_JETON = 'grhmen.jeton'
const CLE_SESSION = 'grhmen.session'

export interface SessionLocale {
  utilisateur: Utilisateur
  listes: Listes
}

/** Dernière session connue, pour réafficher l'application tout de suite au rafraîchissement. */
export function lireSession(): SessionLocale | null {
  try {
    const brut = localStorage.getItem(CLE_SESSION)
    if (!brut) return null
    const data = JSON.parse(brut) as SessionLocale
    if (!data?.utilisateur?.id || !Array.isArray(data.utilisateur.options_acces) || !data.listes) return null
    return data
  } catch {
    return null
  }
}

export function enregistrerSession(session: SessionLocale | null) {
  try {
    if (session) localStorage.setItem(CLE_SESSION, JSON.stringify(session))
    else localStorage.removeItem(CLE_SESSION)
  } catch {
    /* stockage indisponible */
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  headers: { Accept: 'application/json' },
})

export function lireJeton(): string | null {
  try {
    return localStorage.getItem(CLE_JETON)
  } catch {
    return null
  }
}

export function enregistrerJeton(jeton: string | null) {
  try {
    if (jeton) localStorage.setItem(CLE_JETON, jeton)
    else localStorage.removeItem(CLE_JETON)
  } catch {
    /* stockage indisponible */
  }
}

const CLE_ANNEE = 'grhmen.annee'

/** Année scolaire consultée (identifiant), choisie dans la barre du haut. */
export function lireAnnee(): string | null {
  try {
    return localStorage.getItem(CLE_ANNEE)
  } catch {
    return null
  }
}

export function enregistrerAnnee(id: string | null) {
  try {
    if (id) localStorage.setItem(CLE_ANNEE, id)
    else localStorage.removeItem(CLE_ANNEE)
  } catch {
    /* stockage indisponible */
  }
}

const CLE_ETABLISSEMENT = 'grhmen.etablissement'

/** Établissement consulté (identifiant), choisi dans la barre du haut. */
export function lireEtablissement(): string | null {
  try {
    return localStorage.getItem(CLE_ETABLISSEMENT)
  } catch {
    return null
  }
}

export function enregistrerEtablissement(id: string | null) {
  try {
    if (id) localStorage.setItem(CLE_ETABLISSEMENT, id)
    else localStorage.removeItem(CLE_ETABLISSEMENT)
  } catch {
    /* stockage indisponible */
  }
}

api.interceptors.request.use((config) => {
  const jeton = lireJeton()
  if (jeton) config.headers.Authorization = `Bearer ${jeton}`
  const annee = lireAnnee()
  if (annee) config.headers['X-Annee-Scolaire'] = annee
  const etablissement = lireEtablissement()
  if (etablissement) config.headers['X-Etablissement'] = etablissement
  return config
})

api.interceptors.response.use(
  (r) => r,
  (erreur: AxiosError) => {
    if (erreur.response?.status === 401 && !String(erreur.config?.url ?? '').includes('auth/connexion')) {
      enregistrerJeton(null)
      enregistrerSession(null)
      if (!window.location.pathname.startsWith('/connexion')) window.location.href = '/connexion'
    }
    return Promise.reject(erreur)
  },
)

/** Message lisible à partir d'une erreur d'API (validation Laravel comprise). */
export function messageErreur(e: unknown): string {
  const err = e as AxiosError<{ message?: string; errors?: Record<string, string[]> }>
  const data = err?.response?.data
  if (data?.errors) {
    const premiers = Object.values(data.errors).flat()
    if (premiers.length) return premiers.join(' ')
  }
  if (data?.message) return data.message
  if (err?.response?.status === 403) return "Vous n'avez pas l'habilitation requise."
  if (err?.message === 'Network Error') return "Le serveur GRHMEN est injoignable. Vérifiez que l'API est démarrée."
  return 'Une erreur est survenue.'
}

export function erreursChamps(e: unknown): Record<string, string> {
  const err = e as AxiosError<{ errors?: Record<string, string[]> }>
  const sortie: Record<string, string> = {}
  Object.entries(err?.response?.data?.errors ?? {}).forEach(([k, v]) => {
    sortie[k] = v[0]
  })
  return sortie
}
