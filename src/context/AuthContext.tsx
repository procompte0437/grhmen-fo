import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, enregistrerAnnee, enregistrerEtablissement, enregistrerJeton, enregistrerSession, lireAnnee, lireEtablissement, lireJeton, lireSession } from '../lib/api'
import type { AnneeScolaire } from '../lib/annee'
import type { Listes, Ref, Utilisateur } from '../types'

interface ContexteSession {
  utilisateur: Utilisateur | null
  chargement: boolean
  listes: Listes | null
  badges: Record<string, number>
  /** Année scolaire consultée (barre du haut). */
  annee: AnneeScolaire | null
  changerAnnee: (id: number) => void
  /** Établissements que le profil peut ouvrir, et celui consulté (personnel affiché). */
  etablissements: Ref[]
  etablissement: Ref | null
  changerEtablissement: (id: number) => void
  connexion: (identifiant: string, motDePasse: string) => Promise<Utilisateur>
  deconnexion: () => Promise<void>
  rafraichir: () => Promise<void>
  rafraichirBadges: () => void
  majUtilisateur: (u: Utilisateur) => void
  /** L'utilisateur possède-t-il l'option (d'accès ou de gestion) ? */
  peut: (...codes: string[]) => boolean
}

const Contexte = createContext<ContexteSession | null>(null)

function sessionDepart() {
  if (!lireJeton()) return { utilisateur: null as Utilisateur | null, listes: null as Listes | null, chargement: false }
  const session = lireSession()
  if (!session) return { utilisateur: null, listes: null, chargement: true }
  return { utilisateur: session.utilisateur, listes: session.listes, chargement: false }
}

export function FournisseurSession({ children }: { children: ReactNode }) {
  const [depart] = useState(sessionDepart)
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(depart.utilisateur)
  const [chargement, setChargement] = useState(depart.chargement)
  const [listes, setListes] = useState<Listes | null>(depart.listes)
  const [badges, setBadges] = useState<Record<string, number>>({})
  const [anneeId, setAnneeId] = useState<string | null>(lireAnnee())
  const [etablissementId, setEtablissementId] = useState<string | null>(lireEtablissement())

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
    if (utilisateur && listes) enregistrerSession({ utilisateur, listes })
  }, [utilisateur, listes])

  useEffect(() => {
    if (!lireJeton()) {
      setChargement(false)
      return
    }
    // La session déjà affichée reste en place : on ne rebloque pas l'écran pendant la vérification.
    Promise.all([rafraichir(), chargerListes()])
      .then(() => rafraichirBadges())
      .catch(() => {
        enregistrerJeton(null)
        enregistrerSession(null)
        setUtilisateur(null)
        setListes(null)
      })
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
    enregistrerSession(null)
    enregistrerEtablissement(null)
    setUtilisateur(null)
    setListes(null)
    setEtablissementId(null)
    setBadges({})
  }, [])

  // Année consultée : celle mémorisée si elle existe encore, sinon l'année active.
  const annees = (listes?.annees_scolaires ?? []) as unknown as AnneeScolaire[]
  const annee = annees.find((a) => String(a.id) === anneeId) ?? annees.find((a) => a.active) ?? annees[0] ?? null

  useEffect(() => {
    if (annee && String(annee.id) !== lireAnnee()) enregistrerAnnee(String(annee.id))
  }, [annee])

  const changerAnnee = useCallback(
    (id: number) => {
      enregistrerAnnee(String(id))
      setAnneeId(String(id))
      rafraichirBadges()
    },
    [rafraichirBadges],
  )

  const etablissements = listes?.etablissements ?? []
  const etablissement =
    (utilisateur && listes
      ? etablissements.find((e) => String(e.id) === etablissementId) ??
        etablissements.find((e) => e.id === utilisateur.etablissement?.id) ??
        etablissements[0] ??
        null
      : null)
  const etablissementChoisi = etablissement ? String(etablissement.id) : null
  if (utilisateur && listes && etablissementChoisi !== etablissementId) {
    setEtablissementId(etablissementChoisi)
  }
  if (utilisateur && listes && etablissementChoisi !== lireEtablissement()) {
    enregistrerEtablissement(etablissementChoisi)
  }

  const changerEtablissement = useCallback(
    (id: number) => {
      if (!(listes?.etablissements ?? []).some((e) => e.id === id)) return
      enregistrerEtablissement(String(id))
      setEtablissementId(String(id))
      rafraichirBadges()
    },
    [listes, rafraichirBadges],
  )

  const peut = useCallback(
    (...codes: string[]) => {
      if (!utilisateur) return false
      return codes.some((c) => utilisateur.options_gestion.includes(c) || utilisateur.options_acces.some((o) => o.code === c))
    },
    [utilisateur],
  )

  const valeur = useMemo(
    () => ({ utilisateur, chargement, listes, badges, annee, changerAnnee, etablissements, etablissement, changerEtablissement, connexion, deconnexion, rafraichir, rafraichirBadges, majUtilisateur: setUtilisateur, peut }),
    [utilisateur, chargement, listes, badges, annee, changerAnnee, etablissements, etablissement, changerEtablissement, connexion, deconnexion, rafraichir, rafraichirBadges, peut],
  )

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>
}

export function useSession() {
  const c = useContext(Contexte)
  if (!c) throw new Error('useSession doit être utilisé dans FournisseurSession')
  return c
}
