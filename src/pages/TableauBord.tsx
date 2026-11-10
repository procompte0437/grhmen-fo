import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '../context/AuthContext'
import { api, messageErreur } from '../lib/api'
import { dateFr, dateLongue, heure, nomAgent, nombre } from '../lib/format'
import { Alerte, Barres, Carte, CarteStat, Chargement, EnTetePage, Statut } from '../components/ui/Elements'
import Icone from '../components/ui/Icone'

const LIBELLES_A_TRAITER: Record<string, [string, string]> = {
  PRISES_SERVICE: ['Prises de service à confirmer', '/prises-service'],
  DEBUTS_COURS: ['Débuts des cours à confirmer', '/debuts-cours'],
  PRESENCES: ['Pointages de présence à valider', '/presences'],
  CESSATIONS: ['Cessations de service à valider', '/cessations'],
  CONGES: ['Demandes de congé à traiter', '/conges'],
  MES_SERVICES: ['Prise de service à déclarer', '/mes-services'],
}

export default function TableauBord() {
  const { utilisateur, etablissement } = useSession()
  const [d, setD] = useState<any>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    api
      .get('/tableau-de-bord')
      .then((r) => setD(r.data))
      .catch((e) => setErreur(messageErreur(e)))
  }, [])

  const salutation = new Date().getHours() < 13 ? 'Bonjour' : 'Bonsoir'

  return (
    <div>
      <EnTetePage
        titre={`${salutation}, ${utilisateur?.name.split(' ')[0]}`}
        sousTitre={<span className="capitalize">{dateLongue(new Date().toISOString())}{d?.annee_scolaire ? ` · Année scolaire ${d.annee_scolaire}` : ''}{etablissement && utilisateur?.profil?.portee !== 'personnel' ? ` · ${etablissement.nom}` : ''}</span>}
      />
      {erreur && <Alerte ton="rouge">{erreur}</Alerte>}
      {!d && !erreur && <Carte><Chargement /></Carte>}
      {d?.type === 'personnel' && <TableauPersonnel d={d} />}
      {d?.type === 'gestion' && <TableauGestion d={d} />}
    </div>
  )
}

function ATraiter({ a }: { a: Record<string, number> }) {
  const elements = Object.entries(a ?? {}).filter(([, n]) => n > 0)
  if (!elements.length)
    return (
      <div className="flex items-center gap-3 rounded-xl bg-marque-50 px-4 py-3 text-sm text-marque-900">
        <Icone nom="coche" /> Rien en attente : tout est à jour.
      </div>
    )
  return (
    <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {elements.map(([code, n]) => (
        <li key={code}>
          <Link to={LIBELLES_A_TRAITER[code]?.[1] ?? '/'} className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 hover:bg-amber-100">
            <span>{LIBELLES_A_TRAITER[code]?.[0] ?? code}</span>
            <span className="flex items-center gap-1 text-lg font-bold">
              {n} <Icone nom="chevron" className="h-4 w-4" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function TableauGestion({ d }: { d: any }) {
  const i = d.indicateurs
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CarteStat libelle="Personnel en activité" valeur={nombre(i.effectif_actif)} detail={`${nombre(i.enseignants)} enseignants · ${nombre(i.administratifs)} administratifs`} icone="personnes" />
        <CarteStat libelle={d.annee_active === false ? `Présents le ${dateFr(d.date_reference)}` : "Présents aujourd'hui"} valeur={`${i.taux_presence_jour} %`} detail={`${nombre(i.presents_aujourdhui)} présents · ${nombre(i.retards_aujourdhui)} retards · ${nombre(i.non_pointes_aujourdhui)} non pointés`} icone="horloge" ton="bleu" />
        <CarteStat libelle="En attente de prise de service" valeur={nombre(i.affectations_en_attente)} detail={`${nombre(i.non_prise_service_30j)} au-delà de 30 jours`} icone="drapeau" ton="jaune" />
        <CarteStat libelle="Établissements et structures" valeur={nombre(i.etablissements)} detail={`${nombre(i.cessations_a_valider)} cessation(s) à valider · ${nombre(i.conges_en_cours)} en congé`} icone="ecole" ton="violet" />
      </div>

      <Carte titre="À traiter">
        <ATraiter a={d.a_traiter} />
      </Carte>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Carte titre="Présence au poste — 10 derniers jours ouvrés">
          <div className="flex h-56 items-end gap-2">
            {d.evolution_presences.map((j: any) => (
              <div key={j.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className="text-[11px] font-semibold text-slate-600">{j.taux !== null ? `${Math.round(j.taux)}%` : '—'}</span>
                <div className="flex w-full max-w-10 flex-col-reverse overflow-hidden rounded-md bg-slate-100" style={{ height: '75%' }}>
                  {j.taux !== null && <div className="bg-marque-700" style={{ height: `${j.taux}%` }} title={`${j.present} présents, ${j.retard} retards, ${j.absent} absents`} />}
                </div>
                <span className="text-[10.5px] text-slate-500">{dateFr(j.date).slice(0, 5)}</span>
              </div>
            ))}
          </div>
        </Carte>
        <Carte titre="Répartition du personnel actif">
          <Barres donnees={d.repartition.categories.map((c: any) => ({ libelle: c.libelle, valeur: c.total }))} />
          <div className="mt-5 grid grid-cols-2 gap-3 text-center text-sm">
            <div className="rounded-xl bg-ciel-100/70 py-3">
              <p className="text-2xl font-bold text-ciel-600">{nombre(d.repartition.sexe.hommes)}</p>
              <p className="text-slate-600">Hommes</p>
            </div>
            <div className="rounded-xl bg-pink-50 py-3">
              <p className="text-2xl font-bold text-pink-700">{nombre(d.repartition.sexe.femmes)}</p>
              <p className="text-slate-600">Femmes</p>
            </div>
          </div>
        </Carte>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Carte titre="Situation administrative">
          <Barres donnees={d.repartition.statuts.filter((s: any) => s.total > 0).map((s: any) => ({ libelle: s.libelle, valeur: s.total }))} couleur="bg-ciel-500" />
        </Carte>
        <Carte titre="Dernières affectations" actions={<Link to="/affectations" className="text-xs font-semibold text-marque-800 hover:underline">Tout voir</Link>} corpsClassName="p-0">
          <ul className="divide-y divide-slate-100">
            {d.dernieres_affectations.map((a: any) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-800">{nomAgent(a.agent)}</p>
                  <p className="truncate text-xs text-slate-500">
                    {a.nature_libelle} → {a.etablissement?.nom} · effet le {dateFr(a.date_effet)}
                  </p>
                </div>
                <Statut code={a.statut} libelle={a.statut_libelle} />
              </li>
            ))}
          </ul>
        </Carte>
      </div>
    </div>
  )
}

function TableauPersonnel({ d }: { d: any }) {
  if (!d.agent) return <Alerte>Votre compte n'est rattaché à aucun dossier agent. Contactez le service des ressources humaines.</Alerte>
  const s = d.synthese_mois
  const aff = d.affectation
  return (
    <div className="space-y-5">
      {d.a_traiter?.MES_SERVICES > 0 && (
        <Alerte titre="Prise de service à déclarer">
          Vous êtes affecté(e) à <strong>{aff?.etablissement?.nom}</strong> depuis le {dateFr(aff?.date_effet)}.{' '}
          <Link to="/mes-services" className="font-semibold underline">
            Déclarer ma prise de service
          </Link>
        </Alerte>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CarteStat libelle="Pointage du jour" valeur={d.aujourdhui?.heure_arrivee ? heure(d.aujourdhui.heure_arrivee) : 'Non pointé'} detail={d.aujourdhui?.heure_depart ? `Départ ${heure(d.aujourdhui.heure_depart)}` : d.aujourdhui ? d.aujourdhui.statut_libelle : 'Pensez à pointer votre arrivée'} icone="horloge" ton={d.aujourdhui ? 'vert' : 'jaune'} />
        <CarteStat libelle="Taux de présence du mois" valeur={`${s.taux_presence} %`} detail={`${s.present} présences · ${s.retard} retards · ${s.absent} absences`} icone="coche" ton="bleu" />
        <CarteStat libelle="Poste actuel" valeur={<span className="text-base">{d.agent.etablissement?.nom ?? '—'}</span>} detail={d.agent.fonction?.libelle} icone="ecole" ton="violet" />
        <CarteStat libelle="Situation" valeur={<span className="text-base">{aff?.statut_libelle ?? d.agent.statut_libelle}</span>} detail={aff ? `${aff.nature_libelle} · effet ${dateFr(aff.date_effet)}` : undefined} icone="drapeau" />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Carte titre="Accès rapides" className="lg:col-span-1">
          <div className="grid gap-2">
            <Link to="/mon-pointage" className="btn btn-primaire justify-start py-3">
              <Icone nom="horloge" /> Pointer ma présence
            </Link>
            <Link to="/mes-services" className="btn btn-secondaire justify-start py-3">
              <Icone nom="drapeau" /> Ma prise de service et mes cours
            </Link>
            <Link to="/mes-conges" className="btn btn-secondaire justify-start py-3">
              <Icone nom="soleil" /> Demander un congé
            </Link>
            <Link to="/mon-dossier" className="btn btn-secondaire justify-start py-3">
              <Icone nom="dossier" /> Consulter mon dossier
            </Link>
          </div>
        </Carte>
        <Carte titre="Ma carrière en cours" className="lg:col-span-2">
          <ol className="relative space-y-4 border-l-2 border-slate-200 pl-5">
            <Etape fait={!!aff} titre="Affectation" texte={aff ? `${aff.nature_libelle} à ${aff.etablissement?.nom}, effet le ${dateFr(aff.date_effet)}` : 'Aucune affectation en cours'} />
            <Etape fait={d.prise_service?.statut === 'confirmee'} attente={d.prise_service?.statut === 'declaree'} titre="Prise de service" texte={d.prise_service ? `${d.prise_service.statut_libelle} — le ${dateFr(d.prise_service.date_prise_service)}` : 'À déclarer'} />
            {d.agent.categorie !== 'administratif' && (
              <Etape fait={d.debut_cours?.statut === 'confirme'} attente={d.debut_cours?.statut === 'declare'} titre="Début des cours" texte={d.debut_cours ? `${d.debut_cours.statut_libelle} — le ${dateFr(d.debut_cours.date_debut)} (${d.debut_cours.classes})` : 'À déclarer après la confirmation de la prise de service'} />
            )}
          </ol>
        </Carte>
      </div>
    </div>
  )
}

function Etape({ fait, attente, titre, texte }: { fait: boolean; attente?: boolean; titre: string; texte: string }) {
  return (
    <li>
      <span className={`absolute -left-[9px] mt-1 h-4 w-4 rounded-full border-2 border-white ${fait ? 'bg-marque-700' : attente ? 'bg-amber-400' : 'bg-slate-300'}`} />
      <p className="text-sm font-semibold text-slate-800">{titre}</p>
      <p className="text-sm text-slate-500">{texte}</p>
    </li>
  )
}
