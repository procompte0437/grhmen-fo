import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useSession } from '../../context/AuthContext'
import { useNotifier } from '../../context/NotificationContext'
import { api, erreursChamps, messageErreur } from '../../lib/api'
import { aujourdhui, dateFr, dateHeure } from '../../lib/format'
import { FenetreDecision, type DemandeDecision } from '../../components/ui/Decision'
import { Alerte, BarreFiltres, BoutonIcone, Carte, Champ, EnTetePage, Modale, Onglets, Recherche, Selecteur, Statut } from '../../components/ui/Elements'
import { Pagination, Tableau, useListe } from '../../components/ui/Tableau'

export default function DebutsCours() {
  const { peut, badges, rafraichirBadges } = useSession()
  const [onglet, setOnglet] = useState(peut('DEBUT_COURS_CONFIRMER') ? 'a_confirmer' : 'sans_debut')

  return (
    <div>
      <EnTetePage titre="Débuts des cours" icone="livre" sousTitre="Suivi des enseignants qui ont effectivement commencé à faire cours, et de ceux qui n'ont pas encore commencé." />
      <Onglets
        actif={onglet}
        onChange={setOnglet}
        onglets={[
          ...(peut('DEBUT_COURS_CONFIRMER') ? [{ cle: 'a_confirmer', libelle: 'À confirmer', compteur: badges.DEBUTS_COURS }] : []),
          { cle: 'sans_debut', libelle: 'Enseignants sans début des cours' },
          { cle: 'historique', libelle: 'Historique' },
        ]}
      />
      {onglet === 'a_confirmer' && <ListeDebuts statut="declare" onChange={rafraichirBadges} />}
      {onglet === 'sans_debut' && <SansDebut />}
      {onglet === 'historique' && <ListeDebuts statut="" onChange={rafraichirBadges} />}
    </div>
  )
}

function ListeDebuts({ statut, onChange }: { statut: string; onChange: () => void }) {
  const { peut } = useSession()
  const l = useListe<any>('/debuts-cours', { q: '', statut })
  const [decision, setDecision] = useState<DemandeDecision | null>(null)

  return (
    <>
      <BarreFiltres>
        <Recherche valeur={l.filtres.q} onChange={(v) => l.filtrer('q', v)} placeholder="Enseignant, matricule, classe…" />
        {!statut && <Selecteur valeur={l.filtres.statut} onChange={(v) => l.filtrer('statut', v)} vide="Tous les statuts" options={[{ valeur: 'declare', libelle: 'À confirmer' }, { valeur: 'confirme', libelle: 'Confirmés' }, { valeur: 'rejete', libelle: 'Rejetés' }]} />}
      </BarreFiltres>
      {l.erreur && <Alerte ton="rouge">{l.erreur}</Alerte>}
      <Carte corpsClassName="p-0">
        <Tableau
          lignes={l.lignes}
          chargement={l.chargement}
          vide="Aucun début des cours à afficher."
          colonnes={[
            { titre: 'Enseignant', rendu: (d) => <div><p className="font-semibold">{d.agent?.nom_complet}</p><p className="text-xs text-slate-500">{d.agent?.matricule}</p></div> },
            { titre: 'Établissement', rendu: (d) => d.etablissement?.nom },
            { titre: 'Discipline', rendu: (d) => d.discipline?.libelle ?? '—' },
            { titre: 'Classes', rendu: (d) => <span className="text-xs">{d.classes}</span> },
            { titre: 'Volume', rendu: (d) => `${d.volume_horaire ?? '—'} h/sem.` },
            { titre: 'Premier cours', rendu: (d) => dateFr(d.date_debut) },
            { titre: 'Statut', rendu: (d) => <div><Statut code={d.statut} libelle={d.statut_libelle} />{d.date_traitement && <p className="mt-0.5 text-[11px] text-slate-500">{d.valideur?.name} · {dateHeure(d.date_traitement)}</p>}{d.motif_rejet && <p className="text-[11px] text-red-600">{d.motif_rejet}</p>}</div> },
            {
              titre: '',
              className: 'text-right',
              rendu: (d) =>
                d.statut === 'declare' &&
                peut('DEBUT_COURS_CONFIRMER') && (
                  <div className="flex justify-end gap-1">
                    <button
                      className="btn btn-primaire px-2.5 py-1 text-xs"
                      onClick={() =>
                        setDecision({
                          titre: 'Confirmer le début des cours',
                          message: `J'atteste que ${d.agent?.nom_complet} fait cours depuis le ${dateFr(d.date_debut)} (${d.classes}).`,
                          libelleBouton: 'Confirmer',
                          succes: 'Début des cours confirmé.',
                          action: () => api.post(`/debuts-cours/${d.id}/confirmer`),
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
                          titre: 'Rejeter le début des cours',
                          message: `La déclaration de ${d.agent?.nom_complet} sera rejetée.`,
                          libelleBouton: 'Rejeter',
                          danger: true,
                          libelleMotif: 'Motif du rejet',
                          motifRequis: true,
                          succes: 'Déclaration rejetée.',
                          action: (motif) => api.post(`/debuts-cours/${d.id}/rejeter`, { motif }),
                        })
                      }
                    />
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

function SansDebut() {
  const { peut, listes } = useSession()
  const notifier = useNotifier()
  const [lignes, setLignes] = useState<any[] | null>(null)
  const [cible, setCible] = useState<any>(null)
  const [f, setF] = useState({ date_debut: aujourdhui(), classes: '', volume_horaire: '', discipline_id: '', confirmer: true })
  const [erreurs, setErreurs] = useState<Record<string, string>>({})

  const charger = useCallback(() => {
    api.get('/debuts-cours/sans-debut').then((r) => setLignes(r.data.data)).catch((e) => notifier(messageErreur(e), 'erreur'))
  }, [notifier])
  useEffect(charger, [charger])

  const enregistrer = async (e: FormEvent) => {
    e.preventDefault()
    setErreurs({})
    try {
      await api.post('/debuts-cours', { ...f, agent_id: cible.id, volume_horaire: Number(f.volume_horaire) || null, discipline_id: f.discipline_id || null })
      notifier('Début des cours enregistré.')
      setCible(null)
      charger()
    } catch (err) {
      setErreurs(erreursChamps(err))
      notifier(messageErreur(err), 'erreur')
    }
  }

  return (
    <>
      <div className="mb-4">
        <Alerte ton="bleu">Enseignants en service (prise de service confirmée) qui n'ont encore déclaré aucun début des cours pour l'année scolaire en cours.</Alerte>
      </div>
      <Carte corpsClassName="p-0">
        <Tableau
          lignes={lignes ?? []}
          chargement={lignes === null}
          vide="Tous les enseignants en service ont commencé leurs cours."
          colonnes={[
            { titre: 'Enseignant', rendu: (a) => <div><p className="font-semibold">{a.nom_complet}</p><p className="text-xs text-slate-500">{a.matricule}</p></div> },
            { titre: 'Établissement', rendu: (a) => a.etablissement?.nom },
            { titre: 'Discipline', rendu: (a) => a.discipline?.libelle ?? '—' },
            { titre: 'Catégorie', rendu: (a) => a.categorie_libelle },
            {
              titre: '',
              className: 'text-right',
              rendu: (a) =>
                peut('DEBUT_COURS_ENREGISTRER') && (
                  <button className="btn btn-primaire px-2.5 py-1 text-xs" onClick={() => { setCible(a); setF({ date_debut: aujourdhui(), classes: '', volume_horaire: '', discipline_id: String(a.discipline_id ?? ''), confirmer: peut('DEBUT_COURS_CONFIRMER') }) }}>
                    Constater le début des cours
                  </button>
                ),
            },
          ]}
        />
      </Carte>
      <Modale
        ouverte={!!cible}
        titre={`Début des cours — ${cible?.nom_complet ?? ''}`}
        onFermer={() => setCible(null)}
        pied={
          <>
            <button className="btn btn-secondaire" onClick={() => setCible(null)}>Annuler</button>
            <button className="btn btn-primaire" form="form-dc">Enregistrer</button>
          </>
        }
      >
        <form id="form-dc" onSubmit={enregistrer} className="grid gap-4 sm:grid-cols-2">
          <Champ libelle="Date du premier cours" requis erreur={erreurs.date_debut}>
            <input type="date" className="champ" max={aujourdhui()} value={f.date_debut} onChange={(e) => setF({ ...f, date_debut: e.target.value })} required />
          </Champ>
          <Champ libelle="Discipline">
            <Selecteur valeur={f.discipline_id} onChange={(v) => setF({ ...f, discipline_id: v })} options={(listes?.disciplines ?? []).map((x) => ({ valeur: x.id, libelle: x.libelle as string }))} />
          </Champ>
          <Champ libelle="Classes tenues" requis erreur={erreurs.classes}>
            <input className="champ" value={f.classes} onChange={(e) => setF({ ...f, classes: e.target.value })} required placeholder="6e A, 5e B" />
          </Champ>
          <Champ libelle="Volume horaire (h / semaine)" requis erreur={erreurs.volume_horaire}>
            <input type="number" min={1} max={40} className="champ" value={f.volume_horaire} onChange={(e) => setF({ ...f, volume_horaire: e.target.value })} required />
          </Champ>
          {peut('DEBUT_COURS_CONFIRMER') && (
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={f.confirmer} onChange={(e) => setF({ ...f, confirmer: e.target.checked })} /> Confirmer immédiatement
            </label>
          )}
        </form>
      </Modale>
    </>
  )
}
