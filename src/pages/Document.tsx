import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api, messageErreur } from '../lib/api'
import { age, dateFr, dateLongue } from '../lib/format'
import DocumentOfficiel, { TableauIdentite } from '../components/documents/DocumentOfficiel'
import { Alerte, Carte, Chargement } from '../components/ui/Elements'
import Icone from '../components/ui/Icone'

/** Libellés des documents officiels, aussi utilisés pour les boutons d'édition. */
export const DOCUMENTS: Record<string, string> = {
  'prise-service': 'Certificat de prise de service',
  'debut-cours': 'Procès-verbal de début des cours',
  affectation: "Notification d'affectation",
  conge: 'Demande et titre de congé',
  cessation: 'Certificat de cessation de service',
  retraite: 'Notification de départ à la retraite',
  'attestation-travail': 'Attestation de travail',
  'fiche-agent': 'Fiche de renseignements individuels',
  'etat-absences': 'État mensuel des absences au poste',
}

const SITUATIONS: Record<string, string> = { celibataire: 'Célibataire', marie: 'Marié(e)', divorce: 'Divorcé(e)', veuf: 'Veuf / veuve', union_libre: 'Union libre' }

const civ = (a: any) => (a?.sexe === 'F' ? 'Madame' : 'Monsieur')
const ne = (a: any) => (a?.sexe === 'F' ? 'née' : 'né')
const interesse = (a: any) => (a?.sexe === 'F' ? "l'intéressée" : "l'intéressé")
const annee = (d?: string | null) => (d ? d.slice(0, 4) : String(new Date().getFullYear()))
const ref = (prefixe: string, id: number | string, date?: string | null) => `${prefixe}-${annee(date)}-${String(id).padStart(5, '0')}/MEN/SG/DGRH`

function identite(a: any, extra: [string, ReactNode][] = []): [string, ReactNode][] {
  return [
    ['Nom et prénom(s)', a?.nom_complet],
    ['Matricule solde', a?.matricule],
    ['Corps', a?.corps?.libelle],
    ['Grade / échelon', a?.grade ? `${a.grade.code} — ${a.grade.libelle}${a.echelon ? `, échelon ${a.echelon}` : ''}` : null],
    ['Fonction', a?.fonction?.libelle],
    ...extra,
  ]
}

function Rendu({ type, d }: { type: string; d: any }) {
  switch (type) {
    case 'prise-service': {
      const a = d.agent
      return (
        <DocumentOfficiel
          numero={`${d.numero}/MEN/SG/DGRH`}
          sousService={d.etablissement?.nom}
          titre="Certificat de prise de service"
          lieu={d.etablissement?.ville}
          date={d.date_traitement ?? d.created_at}
          filigrane={d.statut !== 'confirmee' ? 'Provisoire' : null}
          signataires={[{ qualite: "L'intéressé(e)", nom: a?.nom_complet }, { qualite: "Le Chef d'établissement", nom: d.valideur?.name }]}
          ampliations={['Intéressé(e)', 'Direction Générale des Ressources Humaines', "Direction d'académie provinciale", 'Service de la solde', 'Archives']}
        >
          <p>Je soussigné(e), Chef de l'établissement <strong>{d.etablissement?.nom}</strong>, certifie que :</p>
          <TableauIdentite lignes={identite(a, [['Discipline', a?.discipline?.libelle], ['Établissement d\'origine', d.affectation?.etablissement_origine?.nom ?? 'Première affectation'], ['Décision d\'affectation', d.affectation?.numero_decision ? `${d.affectation.numero_decision} (effet le ${dateFr(d.affectation.date_effet)})` : null]])} />
          <p>
            a effectivement pris service dans mon établissement le <strong>{dateLongue(d.date_prise_service)}</strong>.
          </p>
          <p>En foi de quoi, le présent certificat lui est délivré pour servir et valoir ce que de droit, notamment pour la mise en route de sa solde.</p>
        </DocumentOfficiel>
      )
    }
    case 'debut-cours': {
      const a = d.agent
      return (
        <DocumentOfficiel
          numero={ref('DC', d.id, d.date_debut)}
          sousService={d.etablissement?.nom}
          titre="Procès-verbal de début des cours"
          sousTitre={d.annee ? `Année scolaire ${d.annee}` : undefined}
          lieu={d.etablissement?.ville}
          date={d.date_traitement ?? d.created_at}
          filigrane={d.statut !== 'confirme' ? 'Provisoire' : null}
          signataires={[{ qualite: "L'Enseignant(e)", nom: a?.nom_complet }, { qualite: "Le Censeur / Le Chef d'établissement", nom: d.valideur?.name }]}
        >
          <p>
            Le Censeur de l'établissement <strong>{d.etablissement?.nom}</strong> constate que l'enseignant(e) ci-dessous désigné(e) a effectivement commencé ses enseignements :
          </p>
          <TableauIdentite lignes={identite(a, [['Discipline enseignée', d.discipline?.libelle ?? a?.discipline?.libelle], ['Classes tenues', d.classes], ['Volume horaire hebdomadaire', d.volume_horaire ? `${d.volume_horaire} heures` : null], ['Date du premier cours', dateLongue(d.date_debut)]])} />
          {d.observations && <p className="italic">Observations : {d.observations}</p>}
          <p>Le présent procès-verbal est établi pour servir et valoir ce que de droit.</p>
        </DocumentOfficiel>
      )
    }
    case 'affectation': {
      const a = d.agent
      return (
        <DocumentOfficiel
          numero={d.numero_decision ?? ref('AF', d.id, d.date_decision)}
          titre="Notification d'affectation"
          sousTitre={d.annee_scolaire?.libelle ? `Année scolaire ${d.annee_scolaire.libelle}` : undefined}
          date={d.date_decision ?? d.created_at}
          filigrane={d.statut === 'annulee' ? 'Annulée' : null}
          signataires={[{ qualite: 'Le Directeur Général des Ressources Humaines', mention: 'Pour le Ministre et par délégation,' }]}
          ampliations={['Intéressé(e)', `Chef d'établissement — ${d.etablissement?.nom}`, ...(d.etablissement_origine ? [`Chef d'établissement — ${d.etablissement_origine.nom}`] : []), `Direction d'académie provinciale${d.etablissement?.province?.nom ? ` (${d.etablissement.province.nom})` : ''}`, 'Service de la solde', 'Archives']}
        >
          <p>
            {civ(a)} <strong>{a?.nom_complet}</strong>, matricule <strong>{a?.matricule}</strong>, est informé(e) qu'il/elle fait l'objet de la mesure suivante :
          </p>
          <TableauIdentite
            lignes={[
              ['Nature de la mesure', d.nature_libelle],
              ['Décision', d.numero_decision ? `N° ${d.numero_decision}${d.date_decision ? ` du ${dateFr(d.date_decision)}` : ''}` : null],
              ['Établissement d\'origine', d.etablissement_origine?.nom ?? '—'],
              ['Nouvelle affectation', `${d.etablissement?.nom}${d.etablissement?.ville ? ` (${d.etablissement.ville})` : ''}`],
              ['Fonction', d.fonction?.libelle ?? a?.fonction?.libelle],
              ['Discipline', d.discipline?.libelle ?? a?.discipline?.libelle],
              ['Date d\'effet', dateLongue(d.date_effet)],
            ]}
          />
          <p>
            {interesse(a).charAt(0).toUpperCase() + interesse(a).slice(1)} est tenu(e) de rejoindre son nouveau poste et d'y prendre service dans les meilleurs délais. Le chef de l'établissement d'accueil établira le certificat de prise de service. À défaut de prise de service dans les délais réglementaires, une procédure de cessation de service pourra être engagée.
          </p>
        </DocumentOfficiel>
      )
    }
    case 'conge': {
      const a = d.agent
      const decide = ['approuvee', 'rejetee'].includes(d.statut)
      return (
        <DocumentOfficiel
          numero={ref('CG', d.id, d.date_debut)}
          titre={d.statut === 'approuvee' ? 'Titre de congé' : 'Demande de congé'}
          sousTitre={d.type_libelle}
          lieu={d.etablissement?.ville}
          date={d.date_decision ?? d.created_at}
          filigrane={d.statut === 'rejetee' ? 'Rejetée' : !decide ? 'En instruction' : null}
          signataires={[{ qualite: 'Le Directeur Général des Ressources Humaines', mention: 'Pour le Ministre et par délégation,', nom: d.decision_nom }]}
        >
          <TableauIdentite lignes={identite(a, [['Établissement / service', d.etablissement?.nom]])} />
          <div className="rounded border border-slate-300 p-3">
            <p className="font-semibold uppercase underline">1. Demande de l'agent</p>
            <p className="mt-1">
              Type : <strong>{d.type_libelle}</strong> — du <strong>{dateFr(d.date_debut)}</strong> au <strong>{dateFr(d.date_fin)}</strong> inclus, soit <strong>{d.nombre_jours} jour(s) ouvré(s)</strong>.
            </p>
            {d.motif && <p className="mt-1">Motif : {d.motif}</p>}
            <p className="mt-1 text-[13px] text-slate-600">Demande déposée le {dateFr(d.created_at)}.</p>
          </div>
          <div className="rounded border border-slate-300 p-3">
            <p className="font-semibold uppercase underline">2. Avis du chef d'établissement</p>
            <p className="mt-1">
              {d.statut === 'soumise' ? 'En attente.' : d.statut === 'avis_defavorable' ? 'Avis défavorable' : d.avis_nom || d.avis_chef ? 'Avis favorable' : '—'}
              {d.avis_chef ? ` — ${d.avis_chef}` : ''}
              {d.avis_nom ? ` (${d.avis_nom})` : ''}
            </p>
          </div>
          <div className="rounded border border-slate-300 p-3">
            <p className="font-semibold uppercase underline">3. Décision</p>
            <p className="mt-1">
              {d.statut === 'approuvee' ? (
                <>
                  Le congé est <strong>accordé</strong>. {interesse(a).charAt(0).toUpperCase() + interesse(a).slice(1)} reprendra son service le <strong>{dateLongue(d.date_reprise)}</strong>.
                </>
              ) : d.statut === 'rejetee' ? (
                <>La demande est <strong>rejetée</strong>.</>
              ) : (
                'En attente de décision.'
              )}
              {d.commentaire_decision ? ` ${d.commentaire_decision}` : ''}
            </p>
          </div>
        </DocumentOfficiel>
      )
    }
    case 'cessation': {
      const a = d.agent
      return (
        <DocumentOfficiel
          numero={`${d.numero}/MEN/SG/DGRH`}
          titre="Certificat de cessation de service"
          sousTitre={d.type_libelle}
          date={d.date_validation ?? d.created_at}
          filigrane={d.statut !== 'validee' ? (d.statut === 'annulee' ? 'Annulée' : 'Provisoire') : null}
          signataires={[{ qualite: 'Le Directeur Général des Ressources Humaines', mention: 'Pour le Ministre et par délégation,', nom: d.valideur?.name }]}
          ampliations={['Intéressé(e)', `Chef d'établissement — ${d.etablissement?.nom ?? ''}`, "Direction d'académie provinciale", 'Service de la solde (suspension du traitement)', 'Archives']}
        >
          <p>Le Directeur Général des Ressources Humaines certifie que :</p>
          <TableauIdentite lignes={identite(a, [['Établissement', d.etablissement?.nom], ['Motif de la cessation', d.type_libelle]])} />
          <p>
            a cessé ses fonctions à compter du <strong>{dateLongue(d.date_cessation)}</strong>.
          </p>
          {d.motif && <p className="italic">Exposé des faits : {d.motif}</p>}
          <p>En foi de quoi, le présent certificat est délivré pour servir et valoir ce que de droit.</p>
        </DocumentOfficiel>
      )
    }
    case 'retraite': {
      const a = d.agent
      return (
        <DocumentOfficiel
          numero={ref('RT', a.id, d.date_depart)}
          titre="Notification de départ à la retraite"
          signataires={[{ qualite: 'Le Directeur Général des Ressources Humaines', mention: 'Pour le Ministre et par délégation,' }]}
          ampliations={['Intéressé(e)', `Chef d'établissement — ${a?.etablissement?.nom ?? ''}`, "Direction d'académie provinciale", 'Service de la solde', 'Caisse des pensions', 'Archives']}
        >
          <p>
            {civ(a)} <strong>{a?.nom_complet}</strong>, {ne(a)} le {dateFr(a?.date_naissance)}
            {a?.lieu_naissance ? ` à ${a.lieu_naissance}` : ''}, est informé(e) de son admission à faire valoir ses droits à la retraite.
          </p>
          <TableauIdentite
            lignes={identite(a, [
              ['Établissement / service', a?.etablissement?.nom],
              ['Date de recrutement', dateFr(a?.date_recrutement)],
              ['Ancienneté de service', d.anciennete != null ? `${d.anciennete} ans` : null],
              ['Limite d\'âge', `${d.age_limite} ans${d.date_limite_age ? `, atteinte le ${dateFr(d.date_limite_age)}` : ''}`],
              ['Date de départ à la retraite', dateLongue(d.date_depart)],
            ])}
          />
          <p>
            À compter de cette date, {interesse(a)} cessera ses fonctions et sera radié(e) des effectifs du ministère. Il/elle est invité(e) à constituer son dossier de pension auprès des services compétents dans les meilleurs délais.
          </p>
        </DocumentOfficiel>
      )
    }
    case 'attestation-travail': {
      const a = d.agent
      return (
        <DocumentOfficiel
          numero={ref('AT', a.id)}
          titre="Attestation de travail"
          signataires={[{ qualite: 'Le Directeur Général des Ressources Humaines', mention: 'Pour le Ministre et par délégation,' }]}
        >
          <p>Le Directeur Général des Ressources Humaines du Ministère de l'Éducation nationale, de l'Instruction civique et de la Formation professionnelle atteste que :</p>
          <p>
            {civ(a)} <strong>{a?.nom_complet}</strong>, {ne(a)} le {dateFr(a?.date_naissance)}
            {a?.lieu_naissance ? ` à ${a.lieu_naissance}` : ''}, matricule solde <strong>{a?.matricule}</strong>,
          </p>
          <TableauIdentite lignes={[['Catégorie', a?.categorie_libelle], ['Corps', a?.corps?.libelle], ['Grade / échelon', a?.grade ? `${a.grade.code}${a.echelon ? `, échelon ${a.echelon}` : ''}` : null], ['Fonction', a?.fonction?.libelle], ['Affectation actuelle', a?.etablissement?.nom], ['En fonction depuis le', dateFr(a?.date_recrutement)], ['Situation', a?.statut_libelle]]} />
          <p>
            est employé(e) au sein du ministère{d.anciennete != null ? ` depuis ${d.anciennete} an(s)` : ''} et y exerce à ce jour.
          </p>
          <p>En foi de quoi, la présente attestation lui est délivrée pour servir et valoir ce que de droit.</p>
        </DocumentOfficiel>
      )
    }
    case 'fiche-agent': {
      const a = d.agent
      return (
        <DocumentOfficiel
          numero={ref('FR', a.id)}
          titre="Fiche de renseignements individuels"
          signataires={[{ qualite: "L'Agent(e)", nom: a?.nom_complet, mention: 'Certifié exact,' }, { qualite: "Le Chef d'établissement / de service", mention: 'Vu,' }]}
        >
          <p className="font-semibold uppercase underline">I. État civil</p>
          <TableauIdentite
            lignes={[
              ['Nom et prénom(s)', a?.nom_complet],
              ['Sexe', a?.sexe === 'F' ? 'Féminin' : 'Masculin'],
              ['Date et lieu de naissance', `${dateFr(a?.date_naissance)}${a?.lieu_naissance ? ` à ${a.lieu_naissance}` : ''}${a?.date_naissance ? ` (${age(a.date_naissance)} ans)` : ''}`],
              ['Nationalité', a?.nationalite],
              ['Situation matrimoniale', SITUATIONS[a?.situation_matrimoniale] ?? a?.situation_matrimoniale],
              ['Enfants à charge', String(a?.nombre_enfants ?? 0)],
              ["Pièce d'identité", a?.numero_piece],
              ['Téléphone / e-mail', [a?.telephone, a?.email].filter(Boolean).join(' · ')],
              ['Adresse', a?.adresse],
            ]}
          />
          <p className="font-semibold uppercase underline">II. Situation administrative</p>
          <TableauIdentite
            lignes={[
              ['Matricule solde', a?.matricule],
              ['Catégorie', a?.categorie_libelle],
              ['Corps', a?.corps?.libelle],
              ['Grade / échelon', a?.grade ? `${a.grade.code} — ${a.grade.libelle}${a.echelon ? `, échelon ${a.echelon}` : ''}` : null],
              ['Fonction', a?.fonction?.libelle],
              ['Discipline', a?.discipline?.libelle],
              ['Diplôme le plus élevé', a?.diplome],
              ['Date de recrutement', dateFr(a?.date_recrutement)],
              ['Première prise de service', dateFr(d.premiere_prise_service)],
              ['Affectation actuelle', a?.etablissement ? `${a.etablissement.nom}${a.etablissement.province?.nom ? ` (${a.etablissement.province.nom})` : ''}` : null],
              ['Situation', a?.statut_libelle],
            ]}
          />
          <p className="font-semibold uppercase underline">III. Parcours (affectations)</p>
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="border border-slate-300 px-2 py-1">Date d'effet</th>
                <th className="border border-slate-300 px-2 py-1">Établissement</th>
                <th className="border border-slate-300 px-2 py-1">Nature</th>
                <th className="border border-slate-300 px-2 py-1">Décision</th>
              </tr>
            </thead>
            <tbody>
              {(a?.affectations ?? []).map((af: any) => (
                <tr key={af.id}>
                  <td className="border border-slate-300 px-2 py-1">{dateFr(af.date_effet)}</td>
                  <td className="border border-slate-300 px-2 py-1">{af.etablissement?.nom}</td>
                  <td className="border border-slate-300 px-2 py-1">{af.nature_libelle}</td>
                  <td className="border border-slate-300 px-2 py-1">{af.numero_decision ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DocumentOfficiel>
      )
    }
    case 'etat-absences': {
      const e = d.etablissement
      return (
        <DocumentOfficiel
          numero={ref('EA', `${e.id}${d.mois.replace('-', '')}`, `${d.mois}-01`)}
          sousService={e.nom}
          titre="État mensuel des absences au poste"
          sousTitre={`Mois de ${d.libelle_mois}`}
          lieu={e.ville}
          signataires={[{ qualite: "Le Chef d'établissement", mention: 'Certifié sincère et véritable,' }, { qualite: "Le Directeur d'académie provinciale", mention: 'Vu et transmis,' }]}
          ampliations={['Secrétariat Général', 'Direction Générale des Ressources Humaines', 'Service de la solde', 'Archives']}
        >
          <p className="text-[13px]">
            Établi en application de la note circulaire n° 0841/MENETP/SG/SGA2 du 24 mars 2015 relative à la collecte des états mensuels d'absences au poste, à transmettre au Secrétariat Général au plus tard le{' '}
            <strong>{dateFr(d.date_limite_transmission)}</strong>.
          </p>
          <TableauIdentite lignes={[['Établissement', `${e.nom} — ${e.ville ?? ''}`], ['Province', e.province?.nom], ['Jours ouvrés du mois', `${d.jours_ouvres}${Object.keys(d.feries ?? {}).length ? ` (jours fériés : ${Object.values(d.feries).join(', ')})` : ''}`], ['Effectif en service', String(d.totaux.effectif)], ['Agents absents au moins un jour', String(d.totaux.agents_absents)]]} />
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="border border-slate-300 px-2 py-1">N°</th>
                <th className="border border-slate-300 px-2 py-1">Matricule</th>
                <th className="border border-slate-300 px-2 py-1">Nom et prénom(s)</th>
                <th className="border border-slate-300 px-2 py-1">Fonction</th>
                <th className="border border-slate-300 px-2 py-1 text-center">Prés.</th>
                <th className="border border-slate-300 px-2 py-1 text-center">Ret.</th>
                <th className="border border-slate-300 px-2 py-1 text-center">Abs.</th>
                <th className="border border-slate-300 px-2 py-1 text-center">Just.</th>
                <th className="border border-slate-300 px-2 py-1">Dates d'absence</th>
              </tr>
            </thead>
            <tbody>
              {d.lignes.map((l: any, i: number) => (
                <tr key={l.agent.id} className={l.absent > 0 ? 'bg-red-50/60' : ''}>
                  <td className="border border-slate-300 px-2 py-1">{i + 1}</td>
                  <td className="border border-slate-300 px-2 py-1">{l.agent.matricule}</td>
                  <td className="border border-slate-300 px-2 py-1 font-semibold">{l.agent.nom_complet}</td>
                  <td className="border border-slate-300 px-2 py-1">{l.agent.fonction?.libelle}</td>
                  <td className="border border-slate-300 px-2 py-1 text-center">{l.present}</td>
                  <td className="border border-slate-300 px-2 py-1 text-center">{l.retard}</td>
                  <td className="border border-slate-300 px-2 py-1 text-center font-bold">{l.absent}</td>
                  <td className="border border-slate-300 px-2 py-1 text-center">{l.absence_justifiee}</td>
                  <td className="border border-slate-300 px-2 py-1">{l.dates_absence.join(', ')}</td>
                </tr>
              ))}
              <tr className="bg-slate-100 font-bold">
                <td colSpan={5} className="border border-slate-300 px-2 py-1 text-right">Totaux</td>
                <td className="border border-slate-300 px-2 py-1 text-center">{d.totaux.retards}</td>
                <td className="border border-slate-300 px-2 py-1 text-center">{d.totaux.absences}</td>
                <td colSpan={2} className="border border-slate-300 px-2 py-1" />
              </tr>
            </tbody>
          </table>
        </DocumentOfficiel>
      )
    }
    default:
      return <Alerte ton="rouge">Document inconnu.</Alerte>
  }
}

/** Page d'édition d'un document officiel : aperçu A4 et impression. */
export default function Document() {
  const { type = '', id } = useParams()
  const [params] = useSearchParams()
  const mois = params.get('mois')
  const navigate = useNavigate()
  const [d, setD] = useState<any>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    setD(null)
    setErreur(null)
    api
      .get(`/documents/${type}/${id}`, { params: mois ? { mois } : {} })
      .then((r) => setD(r.data.data))
      .catch((e) => setErreur(messageErreur(e)))
  }, [type, id, mois])

  useEffect(() => {
    document.title = `${DOCUMENTS[type] ?? 'Document'} — GRHMEN`
    return () => {
      document.title = "GRHMEN — Ressources humaines de l'Éducation nationale"
    }
  }, [type])

  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-2">
        <button className="btn btn-secondaire" onClick={() => navigate(-1)}>
          ← Retour
        </button>
        <p className="titre-serif text-lg font-bold text-slate-800">{DOCUMENTS[type] ?? 'Document'}</p>
        <button className="btn btn-primaire" onClick={() => window.print()} disabled={!d}>
          <Icone nom="imprimer" className="h-4 w-4" /> Imprimer / PDF
        </button>
      </div>
      {erreur && <Alerte ton="rouge">{erreur}</Alerte>}
      {!d && !erreur && (
        <Carte className="mx-auto max-w-[52rem]">
          <Chargement texte="Préparation du document…" />
        </Carte>
      )}
      {d && <Rendu type={type} d={d} />}
    </div>
  )
}
