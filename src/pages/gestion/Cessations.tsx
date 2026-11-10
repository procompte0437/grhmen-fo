import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '../../context/AuthContext'
import { useNotifier } from '../../context/NotificationContext'
import { api, messageErreur } from '../../lib/api'
import { dateFr } from '../../lib/format'
import FormulaireCessation from '../../components/formulaires/FormulaireCessation'
import { FenetreDecision, type DemandeDecision } from '../../components/ui/Decision'
import { Alerte, BarreFiltres, BoutonIcone, Carte, Champ, EnTetePage, Modale, Pastille, Recherche, Selecteur, Statut, versOptions } from '../../components/ui/Elements'
import Icone from '../../components/ui/Icone'
import { Pagination, Tableau, useListe } from '../../components/ui/Tableau'

export default function Cessations() {
  const { listes, peut, rafraichirBadges } = useSession()
  const notifier = useNotifier()
  const l = useListe<any>('/cessations', { q: '', statut: '', type: '' })
  const [formulaire, setFormulaire] = useState(false)
  const [decision, setDecision] = useState<DemandeDecision | null>(null)
  const [generation, setGeneration] = useState(false)
  const [delai, setDelai] = useState('30')
  const [resultat, setResultat] = useState<any>(null)

  const generer = async () => {
    try {
      const r = await api.post('/cessations/generer', { delai_jours: Number(delai) })
      setResultat(r.data)
      notifier(r.data.message)
      l.recharger()
      rafraichirBadges()
    } catch (e) {
      notifier(messageErreur(e), 'erreur')
    }
  }

  return (
    <div>
      <EnTetePage
        titre="Cessations de service"
        icone="stop"
        sousTitre="Non-prise de service, abandon de poste, retraite, décès, démission… Une cessation signalée est validée par l'autorité compétente, ce qui met à jour la situation de l'agent."
        actions={
          <>
            {peut('CESSATION_GENERER') && (
              <button className="btn btn-secondaire" onClick={() => { setResultat(null); setGeneration(true) }}>
                <Icone nom="eclair" className="h-4 w-4" /> Générer pour non-prise de service
              </button>
            )}
            {peut('CESSATION_SIGNALER') && (
              <button className="btn btn-danger" onClick={() => setFormulaire(true)}>
                <Icone nom="plus" className="h-4 w-4" /> Signaler une cessation
              </button>
            )}
          </>
        }
      />
      <BarreFiltres>
        <Recherche valeur={l.filtres.q} onChange={(v) => l.filtrer('q', v)} placeholder="Agent, matricule, n°…" />
        <Selecteur valeur={l.filtres.statut} onChange={(v) => l.filtrer('statut', v)} vide="Tous les statuts" options={[{ valeur: 'signalee', libelle: 'À valider' }, { valeur: 'validee', libelle: 'Validées' }, { valeur: 'annulee', libelle: 'Annulées' }]} />
        <Selecteur valeur={l.filtres.type} onChange={(v) => l.filtrer('type', v)} vide="Tous les motifs" options={versOptions(listes?.enums.types_cessation)} />
      </BarreFiltres>
      {l.erreur && <Alerte ton="rouge">{l.erreur}</Alerte>}
      <Carte corpsClassName="p-0">
        <Tableau
          lignes={l.lignes}
          chargement={l.chargement}
          vide="Aucune cessation de service."
          colonnes={[
            { titre: 'N°', rendu: (c) => <span className="font-mono text-xs">{c.numero}</span> },
            { titre: 'Agent', rendu: (c) => <Link to={`/personnel/${c.agent_id}`} className="hover:underline"><p className="font-semibold">{c.agent?.nom_complet}</p><p className="text-xs text-slate-500">{c.agent?.matricule} · {c.agent?.grade?.code ?? ''}</p></Link> },
            { titre: 'Établissement', rendu: (c) => <div><p>{c.etablissement?.nom ?? '—'}</p><p className="text-xs text-slate-500">{c.etablissement?.province?.nom}</p></div> },
            { titre: 'Motif', rendu: (c) => <div><Pastille ton="rouge">{c.type_libelle}</Pastille>{c.generee_automatiquement && <p className="mt-0.5 text-[11px] text-slate-500">Générée automatiquement</p>}</div> },
            { titre: 'Date', rendu: (c) => dateFr(c.date_cessation) },
            { titre: 'Statut', rendu: (c) => <div><Statut code={c.statut} libelle={c.statut_libelle} />{c.valideur && <p className="mt-0.5 text-[11px] text-slate-500">{c.valideur.name}</p>}</div> },
            {
              titre: '',
              className: 'text-right',
              rendu: (c) => (
                <div className="flex justify-end gap-1">
                  {c.statut === 'signalee' && peut('CESSATION_VALIDER') && (
                    <button
                      className="btn btn-danger px-2.5 py-1 text-xs"
                      onClick={() =>
                        setDecision({
                          titre: 'Valider la cessation de service',
                          message: `La cessation « ${c.type_libelle} » de ${c.agent?.nom_complet} sera validée : l'affectation est close et la situation administrative de l'agent est mise à jour.`,
                          libelleBouton: 'Valider la cessation',
                          danger: true,
                          succes: 'Cessation validée.',
                          action: () => api.post(`/cessations/${c.id}/valider`),
                        })
                      }
                    >
                      Valider
                    </button>
                  )}
                  {c.statut === 'signalee' && peut('CESSATION_ANNULER', 'CESSATION_VALIDER') && (
                    <BoutonIcone
                      icone="refuser"
                      titre="Annuler"
                      onClick={() =>
                        setDecision({
                          titre: 'Annuler la cessation',
                          message: `La cessation de ${c.agent?.nom_complet} sera annulée (ex. : l'agent a repris le service).`,
                          libelleBouton: 'Annuler la cessation',
                          libelleMotif: 'Motif de l\'annulation',
                          motifRequis: true,
                          succes: 'Cessation annulée.',
                          action: (motif) => api.post(`/cessations/${c.id}/annuler`, { motif }),
                        })
                      }
                    />
                  )}
                  <Link to={`/certificats/cessation/${c.id}`} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" title="Certificat de cessation de service">
                    <Icone nom="imprimer" className="h-4 w-4" />
                  </Link>
                </div>
              ),
            },
          ]}
        />
        <Pagination page={l.donnees} onPage={l.setPage} />
      </Carte>

      <FormulaireCessation ouvert={formulaire} onFermer={() => setFormulaire(false)} onEnregistre={() => { setFormulaire(false); l.recharger(); rafraichirBadges() }} />
      <FenetreDecision demande={decision} onFermer={() => setDecision(null)} onTermine={() => { l.recharger(); rafraichirBadges() }} />

      <Modale
        ouverte={generation}
        titre="Générer les cessations pour non-prise de service"
        onFermer={() => setGeneration(false)}
        pied={
          resultat ? (
            <button className="btn btn-primaire" onClick={() => setGeneration(false)}>Fermer</button>
          ) : (
            <>
              <button className="btn btn-secondaire" onClick={() => setGeneration(false)}>Annuler</button>
              <button className="btn btn-danger" onClick={generer}>Générer</button>
            </>
          )
        }
      >
        {resultat ? (
          <div className="space-y-3">
            <Alerte ton={resultat.nombre ? 'jaune' : 'vert'}>{resultat.message}</Alerte>
            <ul className="divide-y divide-slate-100 text-sm">
              {resultat.data.map((c: any) => (
                <li key={c.id} className="py-2">
                  <strong>{c.agent?.nom_complet}</strong> — {c.etablissement?.nom}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Une cessation « Non-prise de service » sera signalée pour chaque agent affecté qui ne s'est pas présenté à son poste au-delà du délai, dans votre périmètre. Elles devront ensuite être validées.</p>
            <Champ libelle="Délai depuis la date d'effet (jours)">
              <input type="number" min={1} max={365} className="champ" value={delai} onChange={(e) => setDelai(e.target.value)} />
            </Champ>
          </div>
        )}
      </Modale>
    </div>
  )
}
