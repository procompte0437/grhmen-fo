import { useState } from 'react'
import { useSession } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { dateFr } from '../../lib/format'
import { FenetreDecision, type DemandeDecision } from '../../components/ui/Decision'
import { Alerte, BarreFiltres, Carte, EnTetePage, Recherche, Selecteur, Statut, versOptions } from '../../components/ui/Elements'
import { Pagination, Tableau, useListe } from '../../components/ui/Tableau'

export default function Conges() {
  const { listes, peut, rafraichirBadges } = useSession()
  const l = useListe<any>('/conges', { q: '', statut: peut('CONGE_AVIS') ? 'soumise' : '', type: '' })
  const [decision, setDecision] = useState<DemandeDecision | null>(null)

  const avis = (c: any, favorable: boolean) =>
    setDecision({
      titre: favorable ? 'Avis favorable' : 'Avis défavorable',
      message: `${favorable ? 'Émettre un avis favorable' : 'Émettre un avis défavorable'} sur la demande de ${c.agent?.nom_complet} (${c.type_libelle}, ${c.nombre_jours} j).`,
      libelleBouton: 'Transmettre l\'avis',
      danger: !favorable,
      libelleMotif: 'Commentaire',
      motifRequis: !favorable,
      succes: 'Avis transmis.',
      action: (commentaire) => api.post(`/conges/${c.id}/avis`, { favorable, commentaire }),
    })

  const decider = (c: any, approuver: boolean) =>
    setDecision({
      titre: approuver ? 'Approuver le congé' : 'Rejeter la demande',
      message: approuver ? `Le congé de ${c.agent?.nom_complet} du ${dateFr(c.date_debut)} au ${dateFr(c.date_fin)} sera approuvé et porté en absence justifiée sur la feuille de présence.` : `La demande de ${c.agent?.nom_complet} sera rejetée.`,
      libelleBouton: approuver ? 'Approuver' : 'Rejeter',
      danger: !approuver,
      libelleMotif: 'Commentaire',
      motifRequis: !approuver,
      succes: approuver ? 'Congé approuvé.' : 'Demande rejetée.',
      action: (commentaire) => api.post(`/conges/${c.id}/decision`, { approuver, commentaire }),
    })

  return (
    <div>
      <EnTetePage titre="Congés et absences" icone="soleil" sousTitre="Circuit : demande de l'agent → avis du chef d'établissement → décision de l'académie ou de la DRH." />
      <BarreFiltres>
        <Recherche valeur={l.filtres.q} onChange={(v) => l.filtrer('q', v)} placeholder="Agent, matricule…" />
        <Selecteur valeur={l.filtres.statut} onChange={(v) => l.filtrer('statut', v)} vide="Tous les statuts" options={versOptions(listes?.enums.statuts_conge)} />
        <Selecteur valeur={l.filtres.type} onChange={(v) => l.filtrer('type', v)} vide="Tous les types" options={versOptions(listes?.enums.types_conge)} />
      </BarreFiltres>
      {l.erreur && <Alerte ton="rouge">{l.erreur}</Alerte>}
      <Carte corpsClassName="p-0">
        <Tableau
          lignes={l.lignes}
          chargement={l.chargement}
          vide="Aucune demande."
          colonnes={[
            { titre: 'Agent', rendu: (c) => <div><p className="font-semibold">{c.agent?.nom_complet}</p><p className="text-xs text-slate-500">{c.etablissement?.nom}</p></div> },
            { titre: 'Type', rendu: (c) => c.type_libelle },
            { titre: 'Période', rendu: (c) => <span>{dateFr(c.date_debut)} → {dateFr(c.date_fin)}<br /><span className="text-xs text-slate-500">{c.nombre_jours} jour(s) ouvré(s)</span></span> },
            { titre: 'Motif', rendu: (c) => <p className="max-w-xs text-xs text-slate-600">{c.motif}{c.avis_chef && <span className="block text-slate-500">Avis : {c.avis_chef}</span>}</p> },
            { titre: 'Statut', rendu: (c) => <Statut code={c.statut} libelle={c.statut_libelle} /> },
            {
              titre: '',
              className: 'text-right',
              rendu: (c) => (
                <div className="flex justify-end gap-1">
                  {c.statut === 'soumise' && peut('CONGE_AVIS') && (
                    <>
                      <button className="btn btn-primaire px-2.5 py-1 text-xs" onClick={() => avis(c, true)}>Favorable</button>
                      <button className="btn btn-secondaire px-2.5 py-1 text-xs" onClick={() => avis(c, false)}>Défavorable</button>
                    </>
                  )}
                  {['soumise', 'avis_favorable', 'avis_defavorable'].includes(c.statut) && peut('CONGE_APPROUVER') && (
                    <>
                      <button className="btn btn-primaire px-2.5 py-1 text-xs" onClick={() => decider(c, true)}>Approuver</button>
                      <button className="btn btn-secondaire px-2.5 py-1 text-xs" onClick={() => decider(c, false)}>Rejeter</button>
                    </>
                  )}
                </div>
              ),
            },
          ]}
        />
        <Pagination page={l.donnees} onPage={l.setPage} />
      </Carte>
      <FenetreDecision demande={decision} onFermer={() => setDecision(null)} onTermine={() => { l.recharger(); rafraichirBadges() }} />
    </div>
  )
}
