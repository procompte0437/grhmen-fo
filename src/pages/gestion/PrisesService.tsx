import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '../../context/AuthContext'
import { useNotifier } from '../../context/NotificationContext'
import { api, erreursChamps, messageErreur } from '../../lib/api'
import { aujourdhui, dateFr, dateHeure } from '../../lib/format'
import { FenetreDecision, type DemandeDecision } from '../../components/ui/Decision'
import { Alerte, BarreFiltres, BoutonIcone, Carte, Champ, EnTetePage, Modale, Onglets, Recherche, Selecteur, Statut } from '../../components/ui/Elements'
import { Pagination, Tableau, useListe } from '../../components/ui/Tableau'

export default function PrisesService() {
  const { peut, badges, rafraichirBadges } = useSession()
  const [onglet, setOnglet] = useState(peut('PRISE_SERVICE_CONFIRMER') ? 'a_confirmer' : 'attendues')

  return (
    <div>
      <EnTetePage titre="Prises de service" icone="drapeau" sousTitre="Le chef d'établissement ou le censeur atteste que l'agent affecté a bien rejoint son poste. Sans prise de service, une cessation pour non-prise de service peut être générée." />
      <Onglets
        actif={onglet}
        onChange={setOnglet}
        onglets={[
          ...(peut('PRISE_SERVICE_CONFIRMER') ? [{ cle: 'a_confirmer', libelle: 'À confirmer', compteur: badges.PRISES_SERVICE }] : []),
          { cle: 'attendues', libelle: 'Agents attendus (non encore pris service)' },
          { cle: 'historique', libelle: 'Historique' },
        ]}
      />
      {onglet === 'a_confirmer' && <ListePrises statut="declaree" onChange={rafraichirBadges} />}
      {onglet === 'attendues' && <Attendues onChange={rafraichirBadges} />}
      {onglet === 'historique' && <ListePrises statut="" onChange={rafraichirBadges} />}
    </div>
  )
}

function ListePrises({ statut, onChange }: { statut: string; onChange: () => void }) {
  const { peut } = useSession()
  const l = useListe<any>('/prises-service', { q: '', statut })
  const [decision, setDecision] = useState<DemandeDecision | null>(null)

  return (
    <>
      <BarreFiltres>
        <Recherche valeur={l.filtres.q} onChange={(v) => l.filtrer('q', v)} placeholder="Agent, matricule, n°…" />
        {!statut && <Selecteur valeur={l.filtres.statut} onChange={(v) => l.filtrer('statut', v)} vide="Tous les statuts" options={[{ valeur: 'declaree', libelle: 'À confirmer' }, { valeur: 'confirmee', libelle: 'Confirmées' }, { valeur: 'rejetee', libelle: 'Rejetées' }]} />}
      </BarreFiltres>
      {l.erreur && <Alerte ton="rouge">{l.erreur}</Alerte>}
      <Carte corpsClassName="p-0">
        <Tableau
          lignes={l.lignes}
          chargement={l.chargement}
          vide={statut === 'declaree' ? 'Aucune prise de service en attente de confirmation.' : 'Aucune prise de service.'}
          colonnes={[
            { titre: 'N°', rendu: (p) => <span className="font-mono text-xs">{p.numero}</span> },
            { titre: 'Agent', rendu: (p) => <div><p className="font-semibold">{p.agent?.nom_complet}</p><p className="text-xs text-slate-500">{p.agent?.matricule}</p></div> },
            { titre: 'Établissement', rendu: (p) => <div><p>{p.etablissement?.nom}</p><p className="text-xs text-slate-500">{p.affectation?.etablissement_origine ? `venant de ${p.affectation.etablissement_origine.nom}` : ''}</p></div> },
            { titre: 'Date d\'effet', rendu: (p) => dateFr(p.affectation?.date_effet) },
            { titre: 'Prise de service', rendu: (p) => <div><p className="font-medium">{dateFr(p.date_prise_service)}</p><p className="text-xs text-slate-500">déclarée par {p.declarant?.name ?? '—'}</p></div> },
            { titre: 'Statut', rendu: (p) => <div><Statut code={p.statut} libelle={p.statut_libelle} />{p.date_traitement && <p className="mt-0.5 text-[11px] text-slate-500">{p.valideur?.name} · {dateHeure(p.date_traitement)}</p>}{p.motif_rejet && <p className="text-[11px] text-red-600">{p.motif_rejet}</p>}</div> },
            {
              titre: '',
              className: 'text-right',
              rendu: (p) => (
                <div className="flex justify-end gap-1">
                  {p.statut === 'declaree' && peut('PRISE_SERVICE_CONFIRMER') && (
                    <>
                      <button
                        className="btn btn-primaire px-2.5 py-1 text-xs"
                        onClick={() =>
                          setDecision({
                            titre: 'Confirmer la prise de service',
                            message: `J'atteste que ${p.agent?.nom_complet} a effectivement pris service à ${p.etablissement?.nom} le ${dateFr(p.date_prise_service)}.`,
                            libelleBouton: 'Confirmer',
                            libelleMotif: 'Observations (facultatif)',
                            succes: 'Prise de service confirmée.',
                            action: (observations) => api.post(`/prises-service/${p.id}/confirmer`, { observations }),
                          })
                        }
                      >
                        Confirmer
                      </button>
                      <BoutonIcone
                        icone="refuser"
                        titre="Rejeter"
                        ton="rouge"
                        onClick={() =>
                          setDecision({
                            titre: 'Rejeter la prise de service',
                            message: `La déclaration de ${p.agent?.nom_complet} sera rejetée. L'agent pourra en déclarer une nouvelle.`,
                            libelleBouton: 'Rejeter',
                            danger: true,
                            libelleMotif: 'Motif du rejet',
                            motifRequis: true,
                            succes: 'Prise de service rejetée.',
                            action: (motif) => api.post(`/prises-service/${p.id}/rejeter`, { motif }),
                          })
                        }
                      />
                    </>
                  )}
                  {p.statut === 'confirmee' && (
                    <Link to={`/certificats/prise-service/${p.id}`} className="btn btn-secondaire px-2.5 py-1 text-xs">
                      Certificat
                    </Link>
                  )}
                </div>
              ),
            },
          ]}
        />
        <Pagination page={l.donnees} onPage={l.setPage} />
      </Carte>
      <FenetreDecision demande={decision} onFermer={() => setDecision(null)} onTermine={() => { l.recharger(); onChange() }} />
    </>
  )
}

/** Agents affectés qui n'ont pas encore pris service : le chef peut enregistrer leur prise de service. */
function Attendues({ onChange }: { onChange: () => void }) {
  const { peut } = useSession()
  const notifier = useNotifier()
  const l = useListe<any>('/affectations', { q: '', statut: 'en_attente_prise_service' })
  const [cible, setCible] = useState<any>(null)
  const [f, setF] = useState({ date_prise_service: aujourdhui(), observations: '', confirmer: true })
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [envoi, setEnvoi] = useState(false)

  const enregistrer = async (e: FormEvent) => {
    e.preventDefault()
    setEnvoi(true)
    setErreurs({})
    try {
      await api.post('/prises-service', { ...f, affectation_id: cible.id })
      notifier(f.confirmer ? 'Prise de service enregistrée et confirmée.' : 'Prise de service enregistrée.')
      setCible(null)
      l.recharger()
      onChange()
    } catch (err) {
      setErreurs(erreursChamps(err))
      notifier(messageErreur(err), 'erreur')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <>
      <BarreFiltres>
        <Recherche valeur={l.filtres.q} onChange={(v) => l.filtrer('q', v)} placeholder="Agent, matricule…" />
      </BarreFiltres>
      <Carte corpsClassName="p-0">
        <Tableau
          lignes={l.lignes}
          chargement={l.chargement}
          vide="Tous les agents affectés ont pris service."
          colonnes={[
            { titre: 'Agent', rendu: (a) => <div><p className="font-semibold">{a.agent?.nom_complet}</p><p className="text-xs text-slate-500">{a.agent?.matricule}</p></div> },
            { titre: 'Affecté à', rendu: (a) => a.etablissement?.nom },
            { titre: 'Nature', rendu: (a) => a.nature_libelle },
            { titre: 'Date d\'effet', rendu: (a) => dateFr(a.date_effet) },
            { titre: 'Délai écoulé', rendu: (a) => <span className={`font-semibold ${a.jours_depuis_effet > 30 ? 'text-red-600' : a.jours_depuis_effet > 15 ? 'text-amber-700' : 'text-slate-700'}`}>{Math.max(0, a.jours_depuis_effet)} jour(s)</span> },
            { titre: 'Situation', rendu: (a) => (a.prise_service_active ? <Statut code="declaree" libelle="Déclarée, à confirmer" /> : <Statut code="absent" libelle="Non présenté" />) },
            {
              titre: '',
              className: 'text-right',
              rendu: (a) =>
                !a.prise_service_active &&
                peut('PRISE_SERVICE_ENREGISTRER') && (
                  <button className="btn btn-primaire px-2.5 py-1 text-xs" onClick={() => { setCible(a); setF({ date_prise_service: aujourdhui(), observations: '', confirmer: peut('PRISE_SERVICE_CONFIRMER') }) }}>
                    Enregistrer la prise de service
                  </button>
                ),
            },
          ]}
        />
        <Pagination page={l.donnees} onPage={l.setPage} />
      </Carte>
      <Modale
        ouverte={!!cible}
        titre="Enregistrer une prise de service"
        onFermer={() => setCible(null)}
        pied={
          <>
            <button className="btn btn-secondaire" onClick={() => setCible(null)}>Annuler</button>
            <button className="btn btn-primaire" form="form-ps" disabled={envoi}>{envoi ? 'Enregistrement…' : 'Enregistrer'}</button>
          </>
        }
      >
        {cible && (
          <form id="form-ps" onSubmit={enregistrer} className="space-y-4">
            <p className="text-sm text-slate-600">
              <strong>{cible.agent?.nom_complet}</strong> — affectation à {cible.etablissement?.nom} (effet le {dateFr(cible.date_effet)})
            </p>
            <Champ libelle="Date de prise de service" requis erreur={erreurs.date_prise_service}>
              <input type="date" className="champ" min={cible.date_effet} max={aujourdhui()} value={f.date_prise_service} onChange={(e) => setF({ ...f, date_prise_service: e.target.value })} required />
            </Champ>
            <Champ libelle="Observations">
              <textarea className="champ min-h-16" value={f.observations} onChange={(e) => setF({ ...f, observations: e.target.value })} />
            </Champ>
            {peut('PRISE_SERVICE_CONFIRMER') && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={f.confirmer} onChange={(e) => setF({ ...f, confirmer: e.target.checked })} /> Confirmer immédiatement (j'atteste la présence de l'agent)
              </label>
            )}
          </form>
        )}
      </Modale>
    </>
  )
}
