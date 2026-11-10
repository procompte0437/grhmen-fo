import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../../context/AuthContext'
import { useNotifier } from '../../context/NotificationContext'
import { api, messageErreur } from '../../lib/api'
import { exporterCsv } from '../../lib/format'
import FormulaireAgent from '../../components/formulaires/FormulaireAgent'
import { Alerte, BarreFiltres, Carte, EnTetePage, Pastille, Recherche, Selecteur, Statut, versOptions } from '../../components/ui/Elements'
import Icone from '../../components/ui/Icone'
import { Pagination, Tableau, useListe } from '../../components/ui/Tableau'

export default function Personnel() {
  const { listes, peut, etablissement } = useSession()
  const notifier = useNotifier()
  const navigate = useNavigate()
  const l = useListe<any>('/agents', { q: '', categorie: '', statut: '', discipline_id: '', sexe: '' })
  const [formulaire, setFormulaire] = useState(false)
  const [export_, setExport] = useState(false)

  const exporter = async () => {
    setExport(true)
    try {
      const r = await api.get('/agents', { params: { ...l.filtres, tout: 1 } })
      exporterCsv(
        `personnel-${new Date().toISOString().slice(0, 10)}.csv`,
        ['Matricule', 'Nom', 'Prénom', 'Sexe', 'Date de naissance', 'Catégorie', 'Corps', 'Grade', 'Échelon', 'Fonction', 'Discipline', 'Établissement', 'Province', 'Téléphone', 'Date de recrutement', 'Statut'],
        r.data.data.map((a: any) => [a.matricule, a.nom, a.prenom, a.sexe, a.date_naissance, a.categorie_libelle, a.corps?.libelle, a.grade?.code, a.echelon, a.fonction?.libelle, a.discipline?.libelle, a.etablissement?.nom, a.etablissement?.province?.nom, a.telephone, a.date_recrutement, a.statut_libelle]),
      )
      notifier(`${r.data.data.length} agent(s) exporté(s).`)
    } catch (e) {
      notifier(messageErreur(e), 'erreur')
    } finally {
      setExport(false)
    }
  }

  return (
    <div>
      <EnTetePage
        titre="Personnel"
        icone="personnes"
        sousTitre={`${l.donnees?.total ?? '…'} agent(s)${etablissement ? ` de ${etablissement.nom}` : ''} — enseignants du primaire et du secondaire, personnel administratif`}
        actions={
          <>
            {peut('AGENT_EXPORTER') && (
              <button className="btn btn-secondaire" onClick={exporter} disabled={export_}>
                <Icone nom="telecharger" className="h-4 w-4" /> {export_ ? 'Export…' : 'Exporter (CSV)'}
              </button>
            )}
            {peut('AGENT_CREER') && (
              <button className="btn btn-primaire" onClick={() => setFormulaire(true)}>
                <Icone nom="plus" className="h-4 w-4" /> Nouvel agent
              </button>
            )}
          </>
        }
      />
      <BarreFiltres>
        <Recherche valeur={l.filtres.q} onChange={(v) => l.filtrer('q', v)} placeholder="Nom, prénom, matricule…" />
        <Selecteur valeur={l.filtres.categorie} onChange={(v) => l.filtrer('categorie', v)} vide="Toutes les catégories" options={versOptions(listes?.enums.categories)} />
        <Selecteur valeur={l.filtres.statut} onChange={(v) => l.filtrer('statut', v)} vide="Tous les statuts" options={versOptions(listes?.enums.statuts_agent)} />
        <Selecteur valeur={l.filtres.discipline_id} onChange={(v) => l.filtrer('discipline_id', v)} vide="Toutes les disciplines" options={(listes?.disciplines ?? []).map((e) => ({ valeur: e.id, libelle: e.libelle as string }))} />
        <Selecteur valeur={l.filtres.sexe} onChange={(v) => l.filtrer('sexe', v)} vide="Hommes et femmes" options={[{ valeur: 'M', libelle: 'Hommes' }, { valeur: 'F', libelle: 'Femmes' }]} />
      </BarreFiltres>
      {l.erreur && <Alerte ton="rouge">{l.erreur}</Alerte>}
      <Carte corpsClassName="p-0">
        <Tableau
          lignes={l.lignes}
          chargement={l.chargement}
          surLigne={(a) => navigate(`/personnel/${a.id}`)}
          vide="Aucun agent ne correspond à ces critères."
          colonnes={[
            { titre: 'Matricule', rendu: (a) => <span className="font-mono text-xs font-semibold">{a.matricule}</span> },
            {
              titre: 'Agent',
              rendu: (a) => (
                <div>
                  <p className="font-semibold text-slate-800">{a.nom_complet}</p>
                  <p className="text-xs text-slate-500">
                    {a.sexe === 'F' ? 'F' : 'M'} · {a.fonction?.libelle ?? '—'}
                    {a.discipline ? ` · ${a.discipline.libelle}` : ''}
                  </p>
                </div>
              ),
            },
            { titre: 'Catégorie', rendu: (a) => <Pastille ton={a.categorie === 'administratif' ? 'violet' : a.categorie === 'enseignant_primaire' ? 'bleu' : 'vert'}>{a.categorie_libelle}</Pastille> },
            { titre: 'Grade', rendu: (a) => (a.grade ? `${a.grade.code}${a.echelon ? ` · éch. ${a.echelon}` : ''}` : '—') },
            {
              titre: 'Établissement',
              rendu: (a) => (
                <div>
                  <p className="text-slate-700">{a.etablissement?.nom ?? '—'}</p>
                  <p className="text-xs text-slate-500">{a.etablissement?.province?.nom}</p>
                </div>
              ),
            },
            { titre: 'Statut', rendu: (a) => <Statut code={a.statut} libelle={a.statut_libelle} /> },
            { titre: 'Compte', rendu: (a) => (a.a_un_compte ? <Pastille ton="vert">Oui</Pastille> : <Pastille>Non</Pastille>) },
          ]}
        />
        <Pagination page={l.donnees} onPage={l.setPage} onParPage={l.changerParPage} />
      </Carte>
      <FormulaireAgent
        ouvert={formulaire}
        onFermer={() => setFormulaire(false)}
        onEnregistre={(a) => {
          setFormulaire(false)
          navigate(`/personnel/${a.id}`)
        }}
      />
    </div>
  )
}
