import { useCallback, useEffect, useState } from 'react'
import { useSession } from '../../context/AuthContext'
import { useNotifier } from '../../context/NotificationContext'
import { api, messageErreur } from '../../lib/api'
import { aujourdhui, dateFr, debutMois, exporterCsv, heure } from '../../lib/format'
import { Alerte, BarreFiltres, Barres, Carte, CarteStat, Chargement, EnTetePage, Onglets, Recherche, Selecteur, Statut, versOptions } from '../../components/ui/Elements'
import Icone from '../../components/ui/Icone'
import { Pagination, Tableau, useListe } from '../../components/ui/Tableau'

const BOUTONS_STATUT: [string, string, string][] = [
  ['present', 'P', 'bg-marque-700 text-white'],
  ['retard', 'R', 'bg-amber-500 text-white'],
  ['absent', 'A', 'bg-red-600 text-white'],
  ['absence_justifiee', 'J', 'bg-ciel-600 text-white'],
  ['mission', 'M', 'bg-violet-600 text-white'],
]

export default function Presences() {
  const { peut, badges, rafraichirBadges } = useSession()
  const [onglet, setOnglet] = useState('feuille')
  return (
    <div>
      <EnTetePage titre="Présences au poste" icone="coche" sousTitre="Feuille d'appel du jour, validation des pointages des agents, historique et taux de présence." />
      <Onglets
        actif={onglet}
        onChange={setOnglet}
        onglets={[
          { cle: 'feuille', libelle: "Feuille d'appel" },
          ...(peut('PRESENCE_VALIDER') ? [{ cle: 'valider', libelle: 'Pointages à valider', compteur: badges.PRESENCES }] : []),
          { cle: 'historique', libelle: 'Historique' },
          { cle: 'statistiques', libelle: 'Statistiques' },
        ]}
      />
      {onglet === 'feuille' && <Feuille onChange={rafraichirBadges} />}
      {onglet === 'valider' && <AValider onChange={rafraichirBadges} />}
      {onglet === 'historique' && <Historique />}
      {onglet === 'statistiques' && <Statistiques />}
    </div>
  )
}

function Feuille({ onChange }: { onChange: () => void }) {
  const { utilisateur, listes, peut } = useSession()
  const notifier = useNotifier()
  const [date, setDate] = useState(aujourdhui())
  const [etab, setEtab] = useState(String(utilisateur?.etablissement?.id ?? ''))
  const [d, setD] = useState<any>(null)
  const [saisie, setSaisie] = useState<Record<number, { statut: string; heure_arrivee: string; observations: string }>>({})
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const choixEtab = utilisateur?.profil?.portee === 'national' || utilisateur?.profil?.portee === 'provincial'

  const charger = useCallback(() => {
    if (!etab) return
    setD(null)
    api
      .get('/presences/feuille', { params: { date, etablissement_id: etab } })
      .then((r) => {
        setD(r.data)
        setErreur(null)
        const s: Record<number, any> = {}
        r.data.lignes.forEach((l: any) => {
          s[l.agent.id] = { statut: l.presence?.statut ?? '', heure_arrivee: l.presence?.heure_arrivee?.slice(0, 5) ?? '', observations: l.presence?.observations ?? '' }
        })
        setSaisie(s)
      })
      .catch((e) => setErreur(messageErreur(e)))
  }, [date, etab])
  useEffect(charger, [charger])

  const toutPresent = () => setSaisie((s) => Object.fromEntries(Object.entries(s).map(([k, v]) => [k, { ...v, statut: v.statut || 'present' }])))

  const enregistrer = async () => {
    const lignes = Object.entries(saisie)
      .filter(([, v]) => v.statut)
      .map(([agent_id, v]) => ({ agent_id: Number(agent_id), statut: v.statut, heure_arrivee: v.heure_arrivee || null, observations: v.observations || null }))
    if (!lignes.length) return notifier('Renseignez au moins une ligne.', 'erreur')
    setEnvoi(true)
    try {
      const r = await api.post('/presences/saisie', { date, etablissement_id: Number(etab), lignes })
      notifier(r.data.message)
      onChange()
      charger()
    } catch (e) {
      notifier(messageErreur(e), 'erreur')
    } finally {
      setEnvoi(false)
    }
  }

  const modifiable = peut('PRESENCE_SAISIR') && date <= aujourdhui()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-700">Date</span>
          <input type="date" className="champ w-auto" value={date} max={aujourdhui()} onChange={(e) => setDate(e.target.value)} />
        </label>
        {choixEtab && (
          <label className="block min-w-64 flex-1 sm:flex-none">
            <span className="mb-1 block text-xs font-semibold text-slate-700">Établissement</span>
            <Selecteur valeur={etab} onChange={setEtab} options={(listes?.etablissements ?? []).map((e) => ({ valeur: e.id, libelle: e.nom as string }))} />
          </label>
        )}
        {modifiable && d && (
          <div className="ml-auto flex gap-2">
            <button className="btn btn-secondaire" onClick={toutPresent}>
              Marquer les non renseignés « présents »
            </button>
            <button className="btn btn-primaire" onClick={enregistrer} disabled={envoi}>
              <Icone nom="valider" className="h-4 w-4" /> {envoi ? 'Enregistrement…' : 'Enregistrer et attester la feuille'}
            </button>
          </div>
        )}
      </div>
      {listes?.feries?.[date] && <Alerte ton="bleu" titre="Jour férié">Le {dateFr(date)} est un jour férié ({listes.feries[date]}) : aucune présence n'est attendue.</Alerte>}
      {!etab && <Alerte ton="bleu">Choisissez un établissement pour afficher sa feuille de présence.</Alerte>}
      {erreur && <Alerte ton="rouge">{erreur}</Alerte>}
      {etab && !d && !erreur && <Chargement />}
      {d && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <CarteStat libelle="Effectif" valeur={d.synthese.effectif} />
            <CarteStat libelle="Présents" valeur={d.synthese.present} ton="vert" />
            <CarteStat libelle="Retards" valeur={d.synthese.retard} ton="jaune" />
            <CarteStat libelle="Absents" valeur={d.synthese.absent} ton="rouge" />
            <CarteStat libelle="Justifiés / mission" valeur={d.synthese.absence_justifiee + d.synthese.mission} ton="bleu" />
            <CarteStat libelle="Non renseignés" valeur={d.synthese.non_renseigne} ton="gris" />
          </div>
          <Carte titre={`${d.etablissement?.nom} — ${dateFr(d.date)}`} actions={<span className="text-xs text-slate-500">P présent · R retard · A absent · J absence justifiée · M mission</span>} corpsClassName="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <th className="px-4 py-2.5">Agent</th>
                    <th className="px-4 py-2.5">Fonction</th>
                    <th className="px-4 py-2.5">Pointage</th>
                    <th className="px-4 py-2.5">Situation</th>
                    <th className="px-4 py-2.5">Heure</th>
                    <th className="px-4 py-2.5">Observation</th>
                  </tr>
                </thead>
                <tbody>
                  {d.lignes.map((l: any) => {
                    const s = saisie[l.agent.id] ?? { statut: '', heure_arrivee: '', observations: '' }
                    const maj = (k: string, v: string) => setSaisie((x) => ({ ...x, [l.agent.id]: { ...s, [k]: v } }))
                    return (
                      <tr key={l.agent.id} className="border-b border-slate-100">
                        <td className="px-4 py-2">
                          <p className="font-semibold">{l.agent.nom_complet}</p>
                          <p className="text-xs text-slate-500">{l.agent.matricule}</p>
                        </td>
                        <td className="px-4 py-2 text-xs text-slate-600">
                          {l.agent.fonction?.libelle}
                          {l.agent.discipline ? ` · ${l.agent.discipline.libelle}` : ''}
                        </td>
                        <td className="px-4 py-2 text-xs">
                          {l.presence?.mode === 'pointage' ? (
                            <span>
                              {heure(l.presence.heure_arrivee)} → {heure(l.presence.heure_depart)}
                              <br />
                              <Statut code={l.presence.validation} libelle={{ en_attente: 'À valider', validee: 'Validé', rejetee: 'Rejeté' }[l.presence.validation as string]} />
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-1">
                            {BOUTONS_STATUT.map(([code, lettre, actif]) => (
                              <button
                                key={code}
                                type="button"
                                disabled={!modifiable}
                                title={listes?.enums.statuts_presence?.[code]}
                                onClick={() => maj('statut', code)}
                                className={`h-8 w-8 rounded-lg text-xs font-bold transition disabled:cursor-default ${s.statut === code ? actif : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                              >
                                {lettre}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <input type="time" className="champ w-28 py-1" value={s.heure_arrivee} disabled={!modifiable || ['absent', 'absence_justifiee', 'mission'].includes(s.statut)} onChange={(e) => maj('heure_arrivee', e.target.value)} />
                        </td>
                        <td className="px-4 py-2">
                          <input className="champ py-1" value={s.observations} disabled={!modifiable} onChange={(e) => maj('observations', e.target.value)} placeholder="—" />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Carte>
        </>
      )}
    </div>
  )
}

function AValider({ onChange }: { onChange: () => void }) {
  const notifier = useNotifier()
  const l = useListe<any>('/presences', { q: '', validation: 'en_attente' })
  const [ids, setIds] = useState<number[]>([])

  const traiter = async (decision: 'validee' | 'rejetee') => {
    try {
      const r = await api.post('/presences/validation', { ids, decision })
      notifier(r.data.message)
      setIds([])
      l.recharger()
      onChange()
    } catch (e) {
      notifier(messageErreur(e), 'erreur')
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="w-full sm:w-72">
          <Recherche valeur={l.filtres.q} onChange={(v) => l.filtrer('q', v)} placeholder="Agent, matricule…" />
        </div>
        <div className="ml-auto flex gap-2">
          <button className="btn btn-primaire" disabled={!ids.length} onClick={() => traiter('validee')}>
            <Icone nom="valider" className="h-4 w-4" /> Valider la sélection ({ids.length})
          </button>
          <button className="btn btn-danger" disabled={!ids.length} onClick={() => traiter('rejetee')}>
            Rejeter (absent)
          </button>
        </div>
      </div>
      <Carte corpsClassName="p-0">
        <Tableau
          lignes={l.lignes}
          chargement={l.chargement}
          vide="Aucun pointage en attente de validation."
          selection={{ ids, basculer: (id) => setIds((x) => (x.includes(id) ? x.filter((i) => i !== id) : [...x, id])), tout: setIds }}
          colonnes={[
            { titre: 'Date', rendu: (p) => dateFr(p.date) },
            { titre: 'Agent', rendu: (p) => <div><p className="font-semibold">{p.agent?.nom_complet}</p><p className="text-xs text-slate-500">{p.agent?.fonction?.libelle}</p></div> },
            { titre: 'Établissement', rendu: (p) => p.etablissement?.nom },
            { titre: 'Arrivée', rendu: (p) => heure(p.heure_arrivee) },
            { titre: 'Départ', rendu: (p) => heure(p.heure_depart) },
            { titre: 'Situation', rendu: (p) => <Statut code={p.statut} libelle={p.statut_libelle} /> },
            { titre: 'Localisation', rendu: (p) => (p.latitude ? <span className="text-xs text-marque-700">Position jointe</span> : <span className="text-xs text-slate-400">—</span>) },
          ]}
        />
        <Pagination page={l.donnees} onPage={l.setPage} onParPage={l.changerParPage} />
      </Carte>
    </>
  )
}

function Historique() {
  const { listes } = useSession()
  const l = useListe<any>('/presences', { q: '', statut: '', etablissement_id: '', date_debut: debutMois(), date_fin: aujourdhui() })

  const exporter = async () => {
    const r = await api.get('/presences', { params: { ...l.filtres, par_page: 5000 } })
    exporterCsv('presences.csv', ['Date', 'Matricule', 'Agent', 'Établissement', 'Arrivée', 'Départ', 'Situation', 'Validation', 'Mode', 'Observation'], r.data.data.map((p: any) => [p.date, p.agent?.matricule, p.agent?.nom_complet, p.etablissement?.nom, heure(p.heure_arrivee), heure(p.heure_depart), p.statut_libelle, p.validation, p.mode, p.observations]))
  }

  return (
    <>
      <BarreFiltres>
        <Recherche valeur={l.filtres.q} onChange={(v) => l.filtrer('q', v)} placeholder="Agent, matricule…" />
        <Selecteur valeur={l.filtres.statut} onChange={(v) => l.filtrer('statut', v)} vide="Toutes les situations" options={versOptions(listes?.enums.statuts_presence)} />
        <Selecteur valeur={l.filtres.etablissement_id} onChange={(v) => l.filtrer('etablissement_id', v)} vide="Tous les établissements" options={(listes?.etablissements ?? []).map((e) => ({ valeur: e.id, libelle: e.nom as string }))} />
        <input type="date" className="champ" value={l.filtres.date_debut} onChange={(e) => l.filtrer('date_debut', e.target.value)} aria-label="Du" />
        <div className="flex gap-2">
          <input type="date" className="champ" value={l.filtres.date_fin} onChange={(e) => l.filtrer('date_fin', e.target.value)} aria-label="Au" />
          <button className="btn btn-secondaire" title="Exporter" onClick={exporter}>
            <Icone nom="telecharger" className="h-4 w-4" />
          </button>
        </div>
      </BarreFiltres>
      <Carte corpsClassName="p-0">
        <Tableau
          lignes={l.lignes}
          chargement={l.chargement}
          vide="Aucune présence sur la période."
          colonnes={[
            { titre: 'Date', rendu: (p) => dateFr(p.date) },
            { titre: 'Agent', rendu: (p) => <div><p className="font-semibold">{p.agent?.nom_complet}</p><p className="text-xs text-slate-500">{p.agent?.matricule}</p></div> },
            { titre: 'Établissement', rendu: (p) => p.etablissement?.nom },
            { titre: 'Arrivée', rendu: (p) => heure(p.heure_arrivee) },
            { titre: 'Départ', rendu: (p) => heure(p.heure_depart) },
            { titre: 'Situation', rendu: (p) => <Statut code={p.statut} libelle={p.statut_libelle} /> },
            { titre: 'Validation', rendu: (p) => <Statut code={p.validation} libelle={{ en_attente: 'À valider', validee: 'Validée', rejetee: 'Rejetée' }[p.validation as string]} /> },
            { titre: 'Mode', rendu: (p) => <span className="text-xs text-slate-500">{p.mode === 'pointage' ? 'Pointage agent' : 'Saisie chef'}</span> },
          ]}
        />
        <Pagination page={l.donnees} onPage={l.setPage} onParPage={l.changerParPage} />
      </Carte>
    </>
  )
}

function Statistiques() {
  const [periode, setPeriode] = useState({ date_debut: debutMois(), date_fin: aujourdhui() })
  const [d, setD] = useState<any>(null)
  useEffect(() => {
    setD(null)
    api.get('/presences/statistiques', { params: periode }).then((r) => setD(r.data))
  }, [periode])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label>
          <span className="mb-1 block text-xs font-semibold">Du</span>
          <input type="date" className="champ w-auto" value={periode.date_debut} onChange={(e) => setPeriode({ ...periode, date_debut: e.target.value })} />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold">Au</span>
          <input type="date" className="champ w-auto" value={periode.date_fin} onChange={(e) => setPeriode({ ...periode, date_fin: e.target.value })} />
        </label>
      </div>
      {!d ? (
        <Chargement />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <Carte titre="Taux de présence par établissement">
            <Barres donnees={d.data.map((e: any) => ({ libelle: e.etablissement, valeur: e.taux_presence }))} suffixe=" %" />
          </Carte>
          <Carte titre="Détail" corpsClassName="p-0">
            <Tableau
              lignes={d.data}
              cle={(e: any) => e.etablissement_id}
              colonnes={[
                { titre: 'Établissement', rendu: (e: any) => e.etablissement },
                { titre: 'Présences', rendu: (e: any) => e.present },
                { titre: 'Retards', rendu: (e: any) => e.retard },
                { titre: 'Absences', rendu: (e: any) => <span className="font-semibold text-red-600">{e.absent}</span> },
                { titre: 'Justifiées', rendu: (e: any) => e.absence_justifiee + e.mission },
                { titre: 'Taux', rendu: (e: any) => <strong>{e.taux_presence} %</strong> },
              ]}
            />
          </Carte>
        </div>
      )}
    </div>
  )
}
