import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '../../context/AuthContext'
import { useNotifier } from '../../context/NotificationContext'
import { api, erreursChamps, messageErreur } from '../../lib/api'
import { aujourdhui, dateFr, dateHeure } from '../../lib/format'
import { Alerte, Carte, Champ, Chargement, EnTetePage, Selecteur, Statut } from '../../components/ui/Elements'
import Icone from '../../components/ui/Icone'

export default function MesServices() {
  const { peut, listes, rafraichirBadges } = useSession()
  const notifier = useNotifier()
  const [d, setD] = useState<any>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [ps, setPs] = useState({ date_prise_service: aujourdhui(), observations: '' })
  const [dc, setDc] = useState({ date_debut: aujourdhui(), classes: '', volume_horaire: '', discipline_id: '', observations: '' })
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [envoi, setEnvoi] = useState(false)

  const charger = useCallback(() => {
    api
      .get('/moi/services')
      .then((r) => {
        setD(r.data)
        setDc((x) => ({ ...x, discipline_id: String(r.data.agent?.discipline_id ?? '') }))
      })
      .catch((e) => setErreur(messageErreur(e)))
  }, [])

  useEffect(charger, [charger])

  const declarerPs = async (e: FormEvent) => {
    e.preventDefault()
    setEnvoi(true)
    setErreurs({})
    try {
      await api.post('/moi/prise-service', ps)
      notifier('Prise de service déclarée. Elle doit maintenant être confirmée par votre chef d\'établissement.')
      rafraichirBadges()
      charger()
    } catch (err) {
      setErreurs(erreursChamps(err))
      notifier(messageErreur(err), 'erreur')
    } finally {
      setEnvoi(false)
    }
  }

  const declarerDc = async (e: FormEvent) => {
    e.preventDefault()
    setEnvoi(true)
    setErreurs({})
    try {
      await api.post('/moi/debut-cours', { ...dc, volume_horaire: Number(dc.volume_horaire) || null, discipline_id: dc.discipline_id || null })
      notifier('Début des cours déclaré. Le censeur doit le confirmer.')
      charger()
    } catch (err) {
      setErreurs(erreursChamps(err))
      notifier(messageErreur(err), 'erreur')
    } finally {
      setEnvoi(false)
    }
  }

  if (erreur) return <Alerte ton="rouge">{erreur}</Alerte>
  if (!d) return <Chargement />

  const aff = d.affectation
  const prise = d.prise_service
  const debut = d.debut_cours
  const peutDeclarerPs = aff?.statut === 'en_attente_prise_service' && (!prise || prise.statut === 'rejetee') && peut('PRISE_SERVICE_DECLARER')
  const peutDeclarerDc = d.est_enseignant && aff?.statut === 'en_service' && (!debut || debut.statut === 'rejete') && peut('DEBUT_COURS_DECLARER')

  return (
    <div>
      <EnTetePage titre="Ma prise de service" sousTitre="Déclarez votre prise de service à votre nouveau poste puis votre début effectif des cours." icone="drapeau" />

      <div className="grid gap-5 lg:grid-cols-3">
        <Carte titre="Mon affectation en cours" className="lg:col-span-1">
          {!aff ? (
            <p className="text-sm text-slate-500">Aucune affectation en cours.</p>
          ) : (
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Établissement</dt>
                <dd className="font-semibold">{aff.etablissement?.nom}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Nature</dt>
                <dd>{aff.nature_libelle}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Décision</dt>
                <dd>
                  {aff.numero_decision ?? '—'} du {dateFr(aff.date_decision)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Date d'effet</dt>
                <dd>{dateFr(aff.date_effet)}</dd>
              </div>
              {aff.etablissement_origine && (
                <div>
                  <dt className="text-xs text-slate-500">Poste précédent</dt>
                  <dd>{aff.etablissement_origine.nom}</dd>
                </div>
              )}
              <div className="pt-1">
                <Statut code={aff.statut} libelle={aff.statut_libelle} />
              </div>
            </dl>
          )}
        </Carte>

        <div className="space-y-5 lg:col-span-2">
          <Carte titre="1. Prise de service">
            {prise && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm">
                <div>
                  <p>
                    Prise de service n° <strong>{prise.numero}</strong> du {dateFr(prise.date_prise_service)}
                  </p>
                  {prise.date_traitement && (
                    <p className="text-xs text-slate-500">
                      Traitée le {dateHeure(prise.date_traitement)} par {prise.valideur?.name ?? '—'}
                    </p>
                  )}
                  {prise.motif_rejet && <p className="text-xs text-red-700">Motif du rejet : {prise.motif_rejet}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Statut code={prise.statut} libelle={prise.statut_libelle} />
                  {prise.statut === 'confirmee' && (
                    <Link to={`/certificats/prise-service/${prise.id}`} className="btn btn-secondaire px-2.5 py-1 text-xs">
                      <Icone nom="imprimer" className="h-4 w-4" /> Certificat
                    </Link>
                  )}
                </div>
              </div>
            )}
            {peutDeclarerPs ? (
              <form onSubmit={declarerPs} className="grid gap-4 sm:grid-cols-2">
                <Champ libelle="Date de prise de service" requis erreur={erreurs.date_prise_service} aide={`Au plus tôt le ${dateFr(aff.date_effet)}`}>
                  <input type="date" className="champ" value={ps.date_prise_service} min={aff.date_effet} max={aujourdhui()} onChange={(e) => setPs({ ...ps, date_prise_service: e.target.value })} required />
                </Champ>
                <Champ libelle="Observations" className="sm:col-span-2">
                  <textarea className="champ min-h-20" value={ps.observations} onChange={(e) => setPs({ ...ps, observations: e.target.value })} placeholder="Ex. : arrivé(e) au poste le matin, reçu(e) par le proviseur." />
                </Champ>
                <div className="sm:col-span-2 flex justify-end">
                  <button className="btn btn-primaire" disabled={envoi}>
                    <Icone nom="drapeau" className="h-4 w-4" /> Déclarer ma prise de service
                  </button>
                </div>
              </form>
            ) : (
              !prise && <p className="text-sm text-slate-500">Aucune prise de service à déclarer pour le moment.</p>
            )}
            {prise?.statut === 'declaree' && <Alerte ton="bleu">Votre déclaration est en attente de confirmation par le chef d'établissement ou le censeur.</Alerte>}
          </Carte>

          {d.est_enseignant && (
            <Carte titre="2. Début effectif des cours">
              {debut && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm">
                  <div>
                    <p>
                      Cours débutés le <strong>{dateFr(debut.date_debut)}</strong> — {debut.discipline?.libelle} · {debut.classes} · {debut.volume_horaire} h/semaine
                    </p>
                    {debut.motif_rejet && <p className="text-xs text-red-700">Motif du rejet : {debut.motif_rejet}</p>}
                  </div>
                  <Statut code={debut.statut} libelle={debut.statut_libelle} />
                </div>
              )}
              {peutDeclarerDc ? (
                <form onSubmit={declarerDc} className="grid gap-4 sm:grid-cols-2">
                  <Champ libelle="Date du premier cours" requis erreur={erreurs.date_debut}>
                    <input type="date" className="champ" value={dc.date_debut} max={aujourdhui()} onChange={(e) => setDc({ ...dc, date_debut: e.target.value })} required />
                  </Champ>
                  <Champ libelle="Discipline enseignée">
                    <Selecteur valeur={dc.discipline_id} onChange={(v) => setDc({ ...dc, discipline_id: v })} options={(listes?.disciplines ?? []).map((x) => ({ valeur: x.id, libelle: x.libelle as string }))} />
                  </Champ>
                  <Champ libelle="Classes tenues" requis erreur={erreurs.classes} aide="Ex. : 2nde A, 1ère C, Tle D">
                    <input className="champ" value={dc.classes} onChange={(e) => setDc({ ...dc, classes: e.target.value })} required />
                  </Champ>
                  <Champ libelle="Volume horaire hebdomadaire (heures)" requis erreur={erreurs.volume_horaire}>
                    <input type="number" min={1} max={40} className="champ" value={dc.volume_horaire} onChange={(e) => setDc({ ...dc, volume_horaire: e.target.value })} required />
                  </Champ>
                  <Champ libelle="Observations" className="sm:col-span-2">
                    <textarea className="champ min-h-16" value={dc.observations} onChange={(e) => setDc({ ...dc, observations: e.target.value })} />
                  </Champ>
                  <div className="sm:col-span-2 flex justify-end">
                    <button className="btn btn-primaire" disabled={envoi}>
                      <Icone nom="livre" className="h-4 w-4" /> Déclarer le début des cours
                    </button>
                  </div>
                </form>
              ) : (
                !debut && <p className="text-sm text-slate-500">Le début des cours pourra être déclaré une fois votre prise de service confirmée.</p>
              )}
            </Carte>
          )}
        </div>
      </div>
    </div>
  )
}
