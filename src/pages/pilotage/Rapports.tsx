import { useEffect, useState } from 'react'
import { useSession } from '../../context/AuthContext'
import { api, messageErreur } from '../../lib/api'
import { useAnnee } from '../../lib/annee'
import { age, dateFr, exporterCsv, nombre } from '../../lib/format'
import { telechargerPdf } from '../../lib/pdf'
import { Alerte, Barres, Carte, CarteStat, Chargement, EnTetePage } from '../../components/ui/Elements'
import Icone from '../../components/ui/Icone'
import { Tableau } from '../../components/ui/Tableau'

export default function Rapports() {
  const { peut } = useSession()
  const { annee, reference } = useAnnee()
  const [periode, setPeriode] = useState({ date_debut: annee?.date_debut ?? reference.slice(0, 8) + '01', date_fin: reference })
  const [d, setD] = useState<any>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    setD(null)
    api.get('/rapports/synthese', { params: periode }).then((r) => setD(r.data)).catch((e) => setErreur(messageErreur(e)))
  }, [periode])

  const exporter = () => {
    exporterCsv('rapport-effectifs-par-province.csv', ['Province', 'Total', 'Enseignants', 'Administratifs', 'Femmes'], d.par_province.map((p: any) => [p.province, p.total, p.enseignants, p.administratifs, p.femmes]))
    exporterCsv('rapport-etablissements.csv', ['Établissement', 'Type', 'Personnel', 'Élèves', 'Élèves par agent'], d.etablissements.map((e: any) => [e.etablissement, e.type, e.effectif, e.eleves, e.ratio]))
    exporterCsv('rapport-non-prise-service.csv', ['Matricule', 'Agent', 'Établissement', 'Date d\'effet', 'Jours écoulés'], d.non_prise_service.map((a: any) => [a.agent?.matricule, a.agent?.nom_complet, a.etablissement?.nom, a.date_effet, a.jours_depuis_effet]))
    exporterCsv('rapport-departs-retraite.csv', ['Matricule', 'Agent', 'Naissance', 'Âge', 'Limite d\'âge (62 ans)', 'Établissement'], d.departs_retraite.map((a: any) => [a.matricule, a.nom_complet, a.date_naissance, age(a.date_naissance), a.date_limite, a.etablissement?.nom]))
  }

  const exporterPdf = () => {
    const pct = (part: number, total: number) => (total ? `${Math.round((part * 100) / total)} %` : '0 %')
    telechargerPdf(`rapport-grhmen-${periode.date_fin}.pdf`, 'Rapports et statistiques', [
      { type: 'texte', texte: `Période du ${dateFr(periode.date_debut)} au ${dateFr(periode.date_fin)}${annee ? ` · Année scolaire ${annee.libelle}` : ''}` },
      { type: 'texte', texte: `Effectif actif : ${nombre(d.effectif_actif)}    Présence : ${d.presences.taux_presence} %    Absence : ${d.presences.taux_absence} %    Non-prises de service : ${d.non_prise_service.length}    Départs à prévoir (62 ans) : ${d.departs_retraite.length}` },
      { type: 'titre', texte: 'Effectifs par province' },
      { type: 'tableau', entetes: ['Province', 'Total', 'Enseignants', 'Administratifs', 'Femmes'], largeurs: [3, 1, 1.5, 1.6, 1.8], lignes: d.par_province.map((p: any) => [p.province, String(p.total), String(p.enseignants), String(p.administratifs), `${p.femmes} (${pct(p.femmes, p.total)})`]) },
      { type: 'titre', texte: 'Pyramide des âges' },
      { type: 'tableau', entetes: ['Hommes', 'Tranche', 'Femmes'], largeurs: [1, 2, 1], lignes: d.pyramide_ages.map((t: any) => [String(t.hommes), t.tranche, String(t.femmes)]) },
      { type: 'titre', texte: 'Enseignants par discipline' },
      { type: 'tableau', entetes: ['Discipline', 'Effectif'], largeurs: [3, 1], lignes: d.par_discipline.map((x: any) => [x.discipline, String(x.total)]) },
      { type: 'titre', texte: 'Effectifs par grade' },
      { type: 'tableau', entetes: ['Grade', 'Effectif'], largeurs: [3, 1], lignes: d.par_grade.map((x: any) => [x.grade, String(x.total)]) },
      { type: 'titre', texte: 'Agents affectés n\'ayant pas pris service' },
      { type: 'tableau', entetes: ['Agent', 'Matricule', 'Établissement', 'Nature', 'Effet', 'Délai'], largeurs: [2.2, 1.2, 2.4, 1.6, 1.2, 0.8], lignes: d.non_prise_service.map((a: any) => [a.agent?.nom_complet ?? '—', a.agent?.matricule ?? '—', a.etablissement?.nom ?? '—', a.nature_libelle ?? '—', dateFr(a.date_effet), `${Math.max(0, a.jours_depuis_effet)} j`]) },
      { type: 'titre', texte: 'Départs à la retraite à prévoir (62 ans)' },
      { type: 'tableau', entetes: ['Agent', 'Matricule', 'Naissance', 'Âge', 'Limite d\'âge', 'Établissement'], largeurs: [2.2, 1.1, 1.2, 0.7, 1.5, 2.2], lignes: d.departs_retraite.map((a: any) => [a.nom_complet, a.matricule, dateFr(a.date_naissance), `${age(a.date_naissance) ?? '—'}`, a.limite_atteinte ? `Atteinte le ${dateFr(a.date_limite)}` : dateFr(a.date_limite), a.etablissement?.nom ?? '—']) },
      { type: 'titre', texte: 'Taux d\'encadrement des établissements' },
      { type: 'tableau', entetes: ['Établissement', 'Personnel', 'Élèves', 'Élèves / agent'], largeurs: [3, 1, 1, 1.3], lignes: d.etablissements.filter((e: any) => e.eleves).map((e: any) => [e.etablissement, String(e.effectif), nombre(e.eleves), e.ratio ?? '—']) },
      { type: 'titre', texte: 'Cessations de service depuis le début de l\'année' },
      { type: 'tableau', entetes: ['Motif', 'Statut', 'Nombre'], largeurs: [3, 2, 1], lignes: d.cessations_annee.map((c: any) => [c.type, c.statut, String(c.total)]) },
    ])
  }

  return (
    <div>
      <EnTetePage
        titre="Rapports et statistiques"
        icone="graphique"
        sousTitre="Effectifs, pyramide des âges, départs à la retraite, assiduité et non-prises de service."
        actions={
          <>
            <input type="date" className="champ w-auto" value={periode.date_debut} onChange={(e) => setPeriode({ ...periode, date_debut: e.target.value })} aria-label="Du" />
            <input type="date" className="champ w-auto" value={periode.date_fin} onChange={(e) => setPeriode({ ...periode, date_fin: e.target.value })} aria-label="Au" />
            {peut('RAPPORT_EXPORTER') && d && <button className="btn btn-secondaire" onClick={exporter}><Icone nom="telecharger" className="h-4 w-4" /> Exporter (CSV)</button>}
            {peut('RAPPORT_EXPORTER') && d && <button className="btn btn-secondaire" onClick={exporterPdf}><Icone nom="telecharger" className="h-4 w-4" /> Exporter en PDF</button>}
            <button className="btn btn-secondaire" onClick={() => window.print()}><Icone nom="imprimer" className="h-4 w-4" /> Imprimer</button>
          </>
        }
      />
      {erreur && <Alerte ton="rouge">{erreur}</Alerte>}
      {!d && !erreur && <Carte><Chargement /></Carte>}
      {d && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <CarteStat libelle="Effectif actif" valeur={nombre(d.effectif_actif)} icone="personnes" />
            <CarteStat libelle="Taux de présence (période)" valeur={`${d.presences.taux_presence} %`} detail={`Taux d'absence : ${d.presences.taux_absence} %`} icone="coche" ton="bleu" />
            <CarteStat libelle="Non-prises de service" valeur={d.non_prise_service.length} icone="drapeau" ton="jaune" />
            <CarteStat libelle="Départs à la retraite proches" valeur={d.departs_retraite.length} detail="61 ans et plus — limite d'âge à 62 ans" icone="calendrier" ton="rouge" />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Carte titre="Effectifs par province" corpsClassName="p-0">
              <Tableau
                lignes={d.par_province}
                cle={(p: any) => p.province}
                colonnes={[
                  { titre: 'Province', rendu: (p: any) => <strong>{p.province}</strong> },
                  { titre: 'Total', rendu: (p: any) => p.total },
                  { titre: 'Enseignants', rendu: (p: any) => p.enseignants },
                  { titre: 'Administratifs', rendu: (p: any) => p.administratifs },
                  { titre: 'Femmes', rendu: (p: any) => `${p.femmes} (${p.total ? Math.round((p.femmes * 100) / p.total) : 0} %)` },
                ]}
              />
            </Carte>
            <Carte titre="Pyramide des âges">
              <div className="space-y-2.5">
                {d.pyramide_ages.map((t: any) => {
                  const max = Math.max(1, ...d.pyramide_ages.flatMap((x: any) => [x.hommes, x.femmes]))
                  return (
                    <div key={t.tranche} className="grid grid-cols-[1fr_6rem_1fr] items-center gap-2 text-sm">
                      <div className="flex justify-end"><span className="h-5 rounded-l-md bg-ciel-500 text-right text-[11px] font-bold leading-5 text-white" style={{ width: `${(t.hommes / max) * 100}%`, minWidth: t.hommes ? '1.5rem' : 0 }}>{t.hommes || ''}&nbsp;</span></div>
                      <span className="text-center text-xs font-semibold text-slate-600">{t.tranche}</span>
                      <div><span className="block h-5 rounded-r-md bg-pink-500 pl-1 text-[11px] font-bold leading-5 text-white" style={{ width: `${(t.femmes / max) * 100}%`, minWidth: t.femmes ? '1.5rem' : 0 }}>{t.femmes || ''}</span></div>
                    </div>
                  )
                })}
                <div className="flex justify-between pt-1 text-xs text-slate-500"><span>◀ Hommes</span><span>Femmes ▶</span></div>
              </div>
            </Carte>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Carte titre="Enseignants par discipline">
              <Barres donnees={d.par_discipline.map((x: any) => ({ libelle: x.discipline, valeur: x.total }))} />
            </Carte>
            <Carte titre="Effectifs par grade">
              <Barres donnees={d.par_grade.map((x: any) => ({ libelle: x.grade, valeur: x.total }))} couleur="bg-ciel-500" />
            </Carte>
          </div>

          <Carte titre="Agents affectés n'ayant pas pris service" corpsClassName="p-0">
            <Tableau
              lignes={d.non_prise_service}
              vide="Aucune non-prise de service."
              colonnes={[
                { titre: 'Agent', rendu: (a: any) => <div><p className="font-semibold">{a.agent?.nom_complet}</p><p className="text-xs text-slate-500">{a.agent?.matricule}</p></div> },
                { titre: 'Établissement', rendu: (a: any) => a.etablissement?.nom },
                { titre: 'Nature', rendu: (a: any) => a.nature_libelle },
                { titre: 'Date d\'effet', rendu: (a: any) => dateFr(a.date_effet) },
                { titre: 'Délai', rendu: (a: any) => <span className={`font-semibold ${a.jours_depuis_effet > 30 ? 'text-red-600' : 'text-amber-700'}`}>{Math.max(0, a.jours_depuis_effet)} j</span> },
              ]}
            />
          </Carte>

          <div className="grid gap-5 xl:grid-cols-2">
            <Carte titre="Départs à la retraite à prévoir (62 ans)" corpsClassName="p-0">
              <Tableau
                lignes={d.departs_retraite}
                vide="Aucun départ prévu."
                colonnes={[
                  { titre: 'Agent', rendu: (a: any) => <div><p className="font-semibold">{a.nom_complet}</p><p className="text-xs text-slate-500">{a.matricule}</p></div> },
                  { titre: 'Naissance', rendu: (a: any) => `${dateFr(a.date_naissance)} (${age(a.date_naissance)} ans)` },
                  { titre: 'Limite d\'âge', rendu: (a: any) => a.limite_atteinte ? <span className="font-semibold text-red-700">Atteinte le {dateFr(a.date_limite)}</span> : <span>Le {dateFr(a.date_limite)}</span> },
                  { titre: 'Établissement', rendu: (a: any) => a.etablissement?.nom },
                ]}
              />
            </Carte>
            <Carte titre="Taux d'encadrement des établissements" corpsClassName="p-0">
              <Tableau
                lignes={d.etablissements.filter((e: any) => e.eleves)}
                cle={(e: any) => e.etablissement}
                colonnes={[
                  { titre: 'Établissement', rendu: (e: any) => e.etablissement },
                  { titre: 'Personnel', rendu: (e: any) => e.effectif },
                  { titre: 'Élèves', rendu: (e: any) => e.eleves?.toLocaleString('fr-FR') },
                  { titre: 'Élèves / agent', rendu: (e: any) => <strong className={e.ratio > 150 ? 'text-red-600' : ''}>{e.ratio ?? '—'}</strong> },
                ]}
              />
            </Carte>
          </div>

          <Carte titre="Cessations de service depuis le début de l'année" corpsClassName="p-0">
            <Tableau lignes={d.cessations_annee} cle={(c: any) => c.type + c.statut} vide="Aucune cessation cette année." colonnes={[{ titre: 'Motif', rendu: (c: any) => c.type }, { titre: 'Statut', rendu: (c: any) => c.statut }, { titre: 'Nombre', rendu: (c: any) => <strong>{c.total}</strong> }]} />
          </Carte>
        </div>
      )}
    </div>
  )
}
