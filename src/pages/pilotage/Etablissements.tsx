import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSession } from '../../context/AuthContext'
import { useNotifier } from '../../context/NotificationContext'
import { api, erreursChamps, messageErreur } from '../../lib/api'
import { FenetreDecision, type DemandeDecision } from '../../components/ui/Decision'
import { Alerte, BarreFiltres, BoutonIcone, Carte, CarteStat, Champ, Chargement, EnTetePage, Modale, Pastille, Recherche, Selecteur, Statut, versOptions } from '../../components/ui/Elements'
import Icone from '../../components/ui/Icone'
import { Pagination, Tableau, useListe } from '../../components/ui/Tableau'

const VIDE = { code: '', nom: '', type: 'lycee', province_id: '', ville: '', adresse: '', telephone: '', email: '', effectif_eleves: '', heure_debut: '07:30', heure_fin: '17:00', actif: true as boolean }

function FormulaireEtablissement({ etab, ouvert, onFermer, onEnregistre }: { etab?: any; ouvert: boolean; onFermer: () => void; onEnregistre: () => void }) {
  const { listes } = useSession()
  const notifier = useNotifier()
  const [f, setF] = useState<any>(VIDE)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    if (!ouvert) return
    setErreurs({})
    setErreur(null)
    setF(etab ? { ...VIDE, ...Object.fromEntries(Object.entries(etab).map(([k, v]) => [k, v ?? ''])), heure_debut: etab.heure_debut?.slice(0, 5), heure_fin: etab.heure_fin?.slice(0, 5), actif: !!etab.actif } : VIDE)
  }, [ouvert, etab?.id])

  const soumettre = async (e: FormEvent) => {
    e.preventDefault()
    const charge: any = {}
    Object.keys(VIDE).forEach((k) => (charge[k] = f[k] === '' ? null : f[k]))
    try {
      if (etab) await api.put(`/etablissements/${etab.id}`, charge)
      else await api.post('/etablissements', charge)
      notifier(etab ? 'Établissement modifié.' : 'Établissement créé.')
      onEnregistre()
    } catch (err) {
      setErreurs(erreursChamps(err))
      setErreur(messageErreur(err))
    }
  }

  const c = (k: string) => ({ value: f[k] ?? '', onChange: (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value }) })

  return (
    <Modale ouverte={ouvert} large titre={etab ? `Modifier — ${etab.nom}` : 'Nouvel établissement / structure'} onFermer={onFermer} pied={<><button className="btn btn-secondaire" onClick={onFermer}>Annuler</button><button className="btn btn-primaire" form="form-etab">Enregistrer</button></>}>
      <form id="form-etab" onSubmit={soumettre} className="grid gap-4 sm:grid-cols-3">
        {erreur && <div className="sm:col-span-3"><Alerte ton="rouge">{erreur}</Alerte></div>}
        <Champ libelle="Code" requis erreur={erreurs.code}><input className="champ" {...c('code')} required /></Champ>
        <Champ libelle="Nom" requis className="sm:col-span-2" erreur={erreurs.nom}><input className="champ" {...c('nom')} required /></Champ>
        <Champ libelle="Type" requis><Selecteur vide={false} valeur={f.type} onChange={(v) => setF({ ...f, type: v })} options={versOptions(listes?.enums.types_etablissement)} /></Champ>
        <Champ libelle="Province" requis erreur={erreurs.province_id}><Selecteur valeur={f.province_id} onChange={(v) => setF({ ...f, province_id: v })} options={(listes?.provinces ?? []).map((p) => ({ valeur: p.id, libelle: p.nom as string }))} /></Champ>
        <Champ libelle="Ville"><input className="champ" {...c('ville')} /></Champ>
        <Champ libelle="Adresse" className="sm:col-span-2"><input className="champ" {...c('adresse')} /></Champ>
        <Champ libelle="Effectif d'élèves" erreur={erreurs.effectif_eleves}><input type="number" min={0} className="champ" {...c('effectif_eleves')} /></Champ>
        <Champ libelle="Téléphone"><input className="champ" {...c('telephone')} /></Champ>
        <Champ libelle="E-mail" erreur={erreurs.email}><input type="email" className="champ" {...c('email')} /></Champ>
        <div className="grid grid-cols-2 gap-2">
          <Champ libelle="Ouverture"><input type="time" className="champ" {...c('heure_debut')} /></Champ>
          <Champ libelle="Fermeture"><input type="time" className="champ" {...c('heure_fin')} /></Champ>
        </div>
        <label className="flex items-center gap-2 text-sm sm:col-span-3"><input type="checkbox" checked={f.actif} onChange={(e) => setF({ ...f, actif: e.target.checked })} /> Établissement actif</label>
      </form>
    </Modale>
  )
}

export default function Etablissements() {
  const { listes, peut } = useSession()
  const navigate = useNavigate()
  const l = useListe<any>('/etablissements', { q: '', type: '', province_id: '' })
  const [formulaire, setFormulaire] = useState<{ ouvert: boolean; etab?: any }>({ ouvert: false })
  const [decision, setDecision] = useState<DemandeDecision | null>(null)

  return (
    <div>
      <EnTetePage titre="Établissements et structures" icone="ecole" sousTitre="Écoles, collèges, lycées, académies provinciales et directions centrales du ministère." actions={peut('ETAB_CREER') && <button className="btn btn-primaire" onClick={() => setFormulaire({ ouvert: true })}><Icone nom="plus" className="h-4 w-4" /> Nouvel établissement</button>} />
      <BarreFiltres>
        <Recherche valeur={l.filtres.q} onChange={(v) => l.filtrer('q', v)} placeholder="Nom, code, ville…" />
        <Selecteur valeur={l.filtres.type} onChange={(v) => l.filtrer('type', v)} vide="Tous les types" options={versOptions(listes?.enums.types_etablissement)} />
        <Selecteur valeur={l.filtres.province_id} onChange={(v) => l.filtrer('province_id', v)} vide="Toutes les provinces" options={(listes?.provinces ?? []).map((p) => ({ valeur: p.id, libelle: p.nom as string }))} />
      </BarreFiltres>
      <Carte corpsClassName="p-0">
        <Tableau
          lignes={l.lignes}
          chargement={l.chargement}
          surLigne={(e) => navigate(`/etablissements/${e.id}`)}
          colonnes={[
            { titre: 'Code', rendu: (e) => <span className="font-mono text-xs font-semibold">{e.code}</span> },
            { titre: 'Établissement', rendu: (e) => <div><p className="font-semibold">{e.nom}</p><p className="text-xs text-slate-500">{e.ville}</p></div> },
            { titre: 'Type', rendu: (e) => <Pastille ton={['direction_centrale', 'academie'].includes(e.type) ? 'violet' : 'bleu'}>{e.type_libelle}</Pastille> },
            { titre: 'Province', rendu: (e) => e.province?.nom },
            { titre: 'Personnel', rendu: (e) => <strong>{e.effectif_personnel}</strong> },
            { titre: 'Élèves', rendu: (e) => e.effectif_eleves?.toLocaleString('fr-FR') ?? '—' },
            { titre: 'État', rendu: (e) => <Statut code={e.actif ? 'actif' : 'inactif'} libelle={e.actif ? 'Actif' : 'Inactif'} /> },
            {
              titre: '',
              className: 'text-right',
              rendu: (e) => (
                <div className="flex justify-end gap-1" onClick={(ev) => ev.stopPropagation()}>
                  {peut('ETAB_MODIFIER') && <BoutonIcone icone="crayon" titre="Modifier" onClick={() => setFormulaire({ ouvert: true, etab: e })} />}
                  {peut('ETAB_SUPPRIMER') && <BoutonIcone icone="poubelle" titre="Supprimer" ton="rouge" onClick={() => setDecision({ titre: 'Supprimer l\'établissement', message: `Supprimer définitivement « ${e.nom} » ? Impossible s'il a du personnel.`, libelleBouton: 'Supprimer', danger: true, succes: 'Établissement supprimé.', action: () => api.delete(`/etablissements/${e.id}`) })} />}
                </div>
              ),
            },
          ]}
        />
        <Pagination page={l.donnees} onPage={l.setPage} onParPage={l.changerParPage} />
      </Carte>
      <FormulaireEtablissement ouvert={formulaire.ouvert} etab={formulaire.etab} onFermer={() => setFormulaire({ ouvert: false })} onEnregistre={() => { setFormulaire({ ouvert: false }); l.recharger() }} />
      <FenetreDecision demande={decision} onFermer={() => setDecision(null)} onTermine={l.recharger} />
    </div>
  )
}

export function FicheEtablissement() {
  const { id } = useParams()
  const [d, setD] = useState<any>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  useEffect(() => {
    api.get(`/etablissements/${id}`).then((r) => setD(r.data)).catch((e) => setErreur(messageErreur(e)))
  }, [id])
  if (erreur) return <Alerte ton="rouge">{erreur}</Alerte>
  if (!d) return <Chargement />
  const e = d.data
  const i = d.indicateurs
  return (
    <div>
      <EnTetePage titre={e.nom} icone="ecole" sousTitre={`${e.type_libelle} · ${e.ville ?? ''} · ${e.province?.nom} · ${e.code}`} actions={<Link to="/etablissements" className="btn btn-secondaire">← Retour</Link>} />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-6">
        <CarteStat libelle="Personnel actif" valeur={i.effectif} />
        <CarteStat libelle="Enseignants" valeur={i.enseignants} ton="bleu" />
        <CarteStat libelle="Femmes" valeur={i.femmes} ton="violet" />
        <CarteStat libelle="Élèves" valeur={e.effectif_eleves?.toLocaleString('fr-FR') ?? '—'} ton="gris" />
        <CarteStat libelle="Présents aujourd'hui" valeur={i.presents_aujourdhui} ton="vert" />
        <CarteStat libelle="Attendus (prise de service)" valeur={i.en_attente_prise_service} ton="jaune" />
      </div>
      <Carte titre={`Personnel (${d.agents.length})`} corpsClassName="p-0">
        <Tableau
          lignes={d.agents}
          colonnes={[
            { titre: 'Matricule', rendu: (a: any) => <span className="font-mono text-xs">{a.matricule}</span> },
            { titre: 'Agent', rendu: (a: any) => <Link className="font-semibold hover:underline" to={`/personnel/${a.id}`}>{a.nom_complet}</Link> },
            { titre: 'Fonction', rendu: (a: any) => a.fonction?.libelle },
            { titre: 'Discipline', rendu: (a: any) => a.discipline?.libelle ?? '—' },
            { titre: 'Grade', rendu: (a: any) => a.grade?.code ?? '—' },
            { titre: 'Statut', rendu: (a: any) => <Statut code={a.statut} libelle={a.statut_libelle} /> },
          ]}
        />
      </Carte>
    </div>
  )
}
