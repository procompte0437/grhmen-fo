import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { FournisseurSession } from './context/AuthContext'
import { FournisseurNotifications } from './context/NotificationContext'
import Coque, { Garde } from './components/layout/Coque'
import Connexion from './pages/Connexion'
import MotDePasse from './pages/MotDePasse'
import TableauBord from './pages/TableauBord'
import Document from './pages/Document'
import Aide from './pages/Aide'
import MonDossier from './pages/moi/MonDossier'
import MesServices from './pages/moi/MesServices'
import MonPointage from './pages/moi/MonPointage'
import MesConges from './pages/moi/MesConges'
import Personnel from './pages/gestion/Personnel'
import FicheAgent from './pages/gestion/FicheAgent'
import Affectations from './pages/gestion/Affectations'
import PrisesService from './pages/gestion/PrisesService'
import DebutsCours from './pages/gestion/DebutsCours'
import Presences from './pages/gestion/Presences'
import Cessations from './pages/gestion/Cessations'
import Conges from './pages/gestion/Conges'
import Etablissements, { FicheEtablissement } from './pages/pilotage/Etablissements'
import Rapports from './pages/pilotage/Rapports'
import Referentiels from './pages/admin/Referentiels'
import Utilisateurs from './pages/admin/Utilisateurs'
import Profils from './pages/admin/Profils'
import Journal from './pages/admin/Journal'

const g = (code: string, page: ReactNode) => <Garde code={code}>{page}</Garde>

function Introuvable() {
  return (
    <div className="carte mx-auto mt-10 max-w-lg p-8 text-center">
      <h1 className="text-lg font-bold">Page introuvable</h1>
      <p className="mt-1 text-sm text-slate-500">L'adresse demandée n'existe pas.</p>
      <Link to="/" className="btn btn-primaire mt-5">Retour au tableau de bord</Link>
    </div>
  )
}

export default function App() {
  return (
    <FournisseurNotifications>
      <FournisseurSession>
        <BrowserRouter>
          <Routes>
            <Route path="/connexion" element={<Connexion />} />
            <Route element={<Coque />}>
              <Route index element={g('TABLEAU_BORD', <TableauBord />)} />
              <Route path="mot-de-passe" element={<MotDePasse />} />
              <Route path="aide" element={<Aide />} />

              <Route path="mon-dossier" element={g('MON_DOSSIER', <MonDossier />)} />
              <Route path="mes-services" element={g('MES_SERVICES', <MesServices />)} />
              <Route path="mon-pointage" element={g('MON_POINTAGE', <MonPointage />)} />
              <Route path="mes-conges" element={g('MES_CONGES', <MesConges />)} />

              <Route path="personnel" element={g('PERSONNEL', <Personnel />)} />
              <Route path="personnel/:id" element={g('PERSONNEL', <FicheAgent />)} />
              <Route path="affectations" element={g('AFFECTATIONS', <Affectations />)} />
              <Route path="prises-service" element={g('PRISES_SERVICE', <PrisesService />)} />
              <Route path="debuts-cours" element={g('DEBUTS_COURS', <DebutsCours />)} />
              <Route path="presences" element={g('PRESENCES', <Presences />)} />
              <Route path="cessations" element={g('CESSATIONS', <Cessations />)} />
              <Route path="conges" element={g('CONGES', <Conges />)} />

              <Route path="etablissements" element={g('ETABLISSEMENTS', <Etablissements />)} />
              <Route path="etablissements/:id" element={g('ETABLISSEMENTS', <FicheEtablissement />)} />
              <Route path="rapports" element={g('RAPPORTS', <Rapports />)} />

              <Route path="referentiels" element={g('REFERENTIELS', <Referentiels />)} />
              <Route path="utilisateurs" element={g('UTILISATEURS', <Utilisateurs />)} />
              <Route path="profils" element={g('PROFILS', <Profils />)} />
              <Route path="journal" element={g('JOURNAL', <Journal />)} />

              <Route path="certificats/:type/:id" element={<Document />} />
              <Route path="documents/:type/:id" element={<Document />} />
              <Route path="*" element={<Introuvable />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </FournisseurSession>
    </FournisseurNotifications>
  )
}
