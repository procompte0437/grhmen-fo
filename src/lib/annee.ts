import { useSession } from '../context/AuthContext'
import { aujourdhui } from './format'

export interface AnneeScolaire {
  id: number
  libelle: string
  active: boolean
  date_debut: string
  date_fin: string
}

/**
 * Année scolaire consultée et dates de référence associées :
 * aujourd'hui pour l'année en cours, sinon la fin (année passée) ou le début (année à venir).
 */
export function useAnnee() {
  const { annee } = useSession()
  const jour = aujourdhui()
  let reference = jour
  if (annee) {
    if (jour > annee.date_fin) reference = annee.date_fin
    else if (jour < annee.date_debut) reference = annee.date_debut
  }
  const debutMoisReference = reference.slice(0, 8) + '01'
  return {
    annee,
    reference,
    debutMoisReference: annee && debutMoisReference < annee.date_debut ? annee.date_debut : debutMoisReference,
    enCours: !annee || annee.active,
  }
}
