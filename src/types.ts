export interface OptionAcces {
  code: string
  libelle: string
  groupe: string
  route: string
  icone: string
  ordre: number
}

export interface Utilisateur {
  id: number
  name: string
  email: string
  matricule: string | null
  telephone: string | null
  etat: string
  doit_changer_mot_de_passe: boolean
  derniere_connexion: string | null
  profil: { id: number; code: string; libelle: string; portee: string } | null
  agent: { id: number; matricule: string; nom_complet: string; categorie: string; fonction: string | null; discipline: string | null } | null
  etablissement: { id: number; nom: string; province: string | null } | null
  province: { id: number; nom: string } | null
  options_acces: OptionAcces[]
  options_gestion: string[]
}

export interface Page<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface Ref {
  id: number
  code?: string
  libelle?: string
  nom?: string
  [k: string]: unknown
}

export interface Listes {
  provinces: Ref[]
  corps: Ref[]
  grades: Ref[]
  disciplines: Ref[]
  fonctions: Ref[]
  annees_scolaires: Ref[]
  etablissements: Ref[]
  profils: Ref[]
  enums: Record<string, Record<string, string>>
  feries?: Record<string, string>
  ministere?: { nom: string; adresse: string; telephone: string }
}
