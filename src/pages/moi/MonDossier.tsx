import { useEffect, useState } from 'react'
import { api, messageErreur } from '../../lib/api'
import FicheDossier from '../../components/FicheDossier'
import { Alerte, Carte, Chargement, EnTetePage } from '../../components/ui/Elements'

export default function MonDossier() {
  const [d, setD] = useState<any>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    api
      .get('/moi/dossier')
      .then((r) => setD(r.data.data))
      .catch((e) => setErreur(messageErreur(e)))
  }, [])

  return (
    <div>
      <EnTetePage titre="Mon dossier" sousTitre="Votre dossier administratif tel qu'enregistré par la direction des ressources humaines." icone="dossier" />
      {erreur && <Alerte ton="rouge">{erreur}</Alerte>}
      {!d && !erreur && <Carte><Chargement /></Carte>}
      {d && <FicheDossier dossier={d} />}
    </div>
  )
}
