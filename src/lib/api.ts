import axios, { AxiosError } from 'axios'

const CLE_JETON = 'grhmen.jeton'

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

api.interceptors.request.use((config) => {
  const jeton = lireJeton()
  if (jeton) config.headers.Authorization = `Bearer ${jeton}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (erreur: AxiosError) => {
    if (erreur.response?.status === 401 && !String(erreur.config?.url ?? '').includes('auth/connexion')) {
      enregistrerJeton(null)
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
