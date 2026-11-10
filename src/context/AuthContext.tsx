import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, enregistrerJeton, lireJeton } from '../lib/api'
import type { Listes, Utilisateur } from '../types'

interface ContexteSession {
  utilisateur: Utilisateur | null
  chargement: boolean
  listes: Listes | null
  badges: Record<string, number>
  connexion: (identifiant: string, motDePasse: string) => Promise<Utilisateur>
  deconnexion: () => Promise<void>
  rafraichir: () => Promise<void>
  rafraichirBadges: () => void
  majUtilisateur: (u: Utilisateur) => void
  /** L'utilisateur possède-t-il l'option (d'accès ou de gestion) ? */
  peut: (...codes: string[]) => boolean
}

const Contexte = createContext<ContexteSession | null>(null)

export function FournisseurSession({ children }: { children: ReactNode }) {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null)
  const [chargement, setChargement] = useState(true)
  const [listes, setListes] = useState<Listes | null>(null)
  const [badges, setBadges] = useState<Record<string, number>>({})

  const chargerListes = useCallback(async () => {
    const r = await api.get('/listes')
    setListes(r.data)
  }, [])

  const rafraichirBadges = useCallback(() => {
    api
      .get('/badges')
      .then((r) => setBadges(r.data.data ?? {}))
      .catch(() => {})
  }, [])

  const rafraichir = useCallback(async () => {
    const r = await api.get('/auth/moi')
    setUtilisateur(r.data.user)
  }, [])

  useEffect(() => {
    if (!lireJeton()) {
      setChargement(false)
      return
    }
    Promise.all([rafraichir(), chargerListes()])
      .then(() => rafraichirBadges())
      .catch(() => enregistrerJeton(null))
      .finally(() => setChargement(false))
  }, [rafraichir, chargerListes, rafraichirBadges])

  useEffect(() => {
    if (!utilisateur) return
    const minuterie = window.setInterval(rafraichirBadges, 60000)
    return () => window.clearInterval(minuterie)
  }, [utilisateur, rafraichirBadges])

  const connexion = useCallback(
    async (identifiant: string, motDePasse: string) => {
      const r = await api.post('/auth/connexion', { identifiant, mot_de_passe: motDePasse })
      enregistrerJeton(r.data.token)
      setUtilisateur(r.data.user)
      await chargerListes()
      rafraichirBadges()
      return r.data.user as Utilisateur
    },
    [chargerListes, rafraichirBadges],
  )

  const deconnexion = useCallback(async () => {
    try {
      await api.post('/auth/deconnexion')
    } catch {
      /* jeton déjà expiré */
    }
    enregistrerJeton(null)
    setUtilisateur(null)
    setBadges({})
  }, [])

  const peut = useCallback(
    (...codes: string[]) => {
      if (!utilisateur) return false
      return codes.some((c) => utilisateur.options_gestion.includes(c) || utilisateur.options_acces.some((o) => o.code === c))
    },
    [utilisateur],
  )

  const valeur = useMemo(
    () => ({ utilisateur, chargement, listes, badges, connexion, deconnexion, rafraichir, rafraichirBadges, majUtilisateur: setUtilisateur, peut }),
    [utilisateur, chargement, listes, badges, connexion, deconnexion, rafraichir, rafraichirBadges, peut],
  )

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>
}

export function useSession() {
  const c = useContext(Contexte)
  if (!c) throw new Error('useSession doit être utilisé dans FournisseurSession')
  return c
}
