import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { dateFr } from '../../lib/format'
import FormulaireAffectation from '../../components/formulaires/FormulaireAffectation'
import { FenetreDecision, type DemandeDecision } from '../../components/ui/Decision'
import { Alerte, BarreFiltres, BoutonIcone, Carte, EnTetePage, Pastille, Recherche, Selecteur, Statut, versOptions } from '../../components/ui/Elements'
import Icone from '../../components/ui/Icone'
import { Pagination, Tableau, useListe } from '../../components/ui/Tableau'

export default function Affectations() {
  const { listes, peut } = useSession()
  const l = useListe<any>('/affectations', { q: '', statut: '', nature: '', etablissement_id: '', province_id: '', retard_jours: '' })
  const [formulaire, setFormulaire] = useState<{ ouvert: boolean; affectation?: any }>({ ouvert: false })
  const [decision, setDecision] = useState<DemandeDecision | null>(null)

  return (
    <div>
      <EnTetePage
        titre="Affectations"
        icone="fleches"
        sousTitre="Premières affectations, mutations, nominations et redéploiements. Une affectation reste « en attente » jusqu'à la prise de service confirmée."
        actions={
          peut('AFFECTATION_CREER') && (
            <button className="btn btn-primaire" onClick={() => setFormulaire({ ouvert: true })}>
              <Icone nom="plus" className="h-4 w-4" /> Nouvelle affectation
            </button>
          )
        }
      />
      <BarreFiltres>
        <Recherche valeur={l.filtres.q} onChange={(v) => l.filtrer('q', v)} placeholder="Agent, matricule, n° de décision…" />
        <Selecteur valeur={l.filtres.statut} onChange={(v) => l.filtrer('statut', v)} vide="Tous les statuts" options={versOptions(listes?.enums.statuts_affectation)} />
        <Selecteur valeur={l.filtres.nature} onChange={(v) => l.filtrer('nature', v)} vide="Toutes les natures" options={versOptions(listes?.enums.natures_affectation)} />
        <Selecteur valeur={l.filtres.etablissement_id} onChange={(v) => l.filtrer('etablissement_id', v)} vide="Tous les établissements" options={(listes?.etablissements ?? []).map((e) => ({ valeur: e.id, libelle: e.nom as string }))} />
        <Selecteur valeur={l.filtres.retard_jours} onChange={(v) => l.filtrer('retard_jours', v)} vide="Sans filtre de délai" options={[{ valeur: '15', libelle: 'Sans prise de service > 15 jours' }, { valeur: '30', libelle: 'Sans prise de service > 30 jours' }, { valeur: '60', libelle: 'Sans prise de service > 60 jours' }]} />
      </BarreFiltres>
      {l.erreur && <Alerte ton="rouge">{l.erreur}</Alerte>}
      <Carte corpsClassName="p-0">
        <Tableau
          lignes={l.lignes}
          chargement={l.chargement}
          vide="Aucune affectation."
          colonnes={[
            {
              titre: 'Agent',
              rendu: (a) => (
                <Link to={`/personnel/${a.agent_id}`} className="hover:underline">
                  <p className="font-semibold text-slate-800">{a.agent?.nom_complet}</p>
                  <p className="text-xs text-slate-500">{a.agent?.matricule}</p>
                </Link>
              ),
            },
            {
              titre: 'Mouvement',
              rendu: (a) => (
                <div>
                  <p className="font-medium text-slate-700">{a.etablissement?.nom}</p>
                  <p className="text-xs text-slate-500">{a.etablissement_origine ? `depuis ${a.etablissement_origine.nom}` : a.etablissement?.province?.nom}</p>
                </div>
              ),
            },
            { titre: 'Nature', rendu: (a) => <Pastille ton="bleu">{a.nature_libelle}</Pastille> },
            { titre: 'Décision', rendu: (a) => <span className="text-xs">{a.numero_decision ?? '—'}<br /><span className="text-slate-500">{dateFr(a.date_decision)}</span></span> },
            {
              titre: 'Effet',
              rendu: (a) => (
                <div>
                  <p>{dateFr(a.date_effet)}</p>
                  {a.statut === 'en_attente_prise_service' && a.jours_depuis_effet > 0 && <p className={`text-xs font-semibold ${a.jours_depuis_effet > 30 ? 'text-red-600' : 'text-amber-700'}`}>il y a {a.jours_depuis_effet} j</p>}
                </div>
              ),
            },
            {
              titre: 'Statut',
              rendu: (a) => (
                <div className="space-y-1">
                  <Statut code={a.statut} libelle={a.statut_libelle} />
                  {a.prise_service_active?.statut === 'declaree' && <p className="text-[11px] text-amber-700">Prise de service déclarée</p>}
                </div>
              ),
            },
            {
              titre: '',
              className: 'text-right',
              rendu: (a) =>
                a.statut === 'en_attente_prise_service' && (
                  <div className="flex justify-end gap-1">
                    {peut('AFFECTATION_MODIFIER') && <BoutonIcone icone="crayon" titre="Modifier" onClick={() => setFormulaire({ ouvert: true, affectation: a })} />}
                    {peut('AFFECTATION_ANNULER') && (
                      <BoutonIcone
                        icone="refuser"
                        titre="Annuler l'affectation"
                        ton="rouge"
                        onClick={() =>
                          setDecision({
                            titre: 'Annuler l\'affectation',
                            message: `L'affectation de ${a.agent?.nom_complet} à ${a.etablissement?.nom} sera annulée et l'agent retrouvera son poste précédent.`,
                            libelleBouton: 'Annuler l\'affectation',
                            danger: true,
                            libelleMotif: 'Motif de l\'annulation',
                            motifRequis: true,
                            succes: 'Affectation annulée.',
                            action: (motif) => api.post(`/affectations/${a.id}/annuler`, { motif }),
                          })
                        }
                      />
                    )}
                  </div>
                ),
            },
          ]}
        />
        <Pagination page={l.donnees} onPage={l.setPage} onParPage={l.changerParPage} />
      </Carte>
      <FormulaireAffectation
        ouvert={formulaire.ouvert}
        affectation={formulaire.affectation}
        onFermer={() => setFormulaire({ ouvert: false })}
        onEnregistre={() => {
          setFormulaire({ ouvert: false })
          l.recharger()
        }}
      />
      <FenetreDecision demande={decision} onFermer={() => setDecision(null)} onTermine={l.recharger} />
    </div>
  )
}
