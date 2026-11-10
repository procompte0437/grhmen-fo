import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, messageErreur } from '../lib/api'
import { dateFr, dateLongue } from '../lib/format'
import { Alerte, Chargement } from '../components/ui/Elements'
import Icone from '../components/ui/Icone'

/** Certificats officiels imprimables : prise de service et cessation de service. */
export default function Certificat() {
  const { type, id } = useParams()
  const navigate = useNavigate()
  const [d, setD] = useState<any>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const estPrise = type === 'prise-service'

  useEffect(() => {
    api
      .get(estPrise ? `/prises-service/${id}` : `/cessations/${id}`)
      .then((r) => setD(r.data.data))
      .catch((e) => setErreur(messageErreur(e)))
  }, [id, estPrise])

  if (!d) {
    return (
      <div>
        <div className="no-print mb-4">
          <button className="btn btn-secondaire" onClick={() => navigate(-1)}>← Retour</button>
        </div>
        {erreur ? <Alerte ton="rouge">{erreur}</Alerte> : <div className="carte mx-auto max-w-3xl"><Chargement /></div>}
      </div>
    )
  }
  const a = d.agent

  return (
    <div>
      <div className="no-print mb-4 flex justify-between gap-2">
        <button className="btn btn-secondaire" onClick={() => navigate(-1)}>← Retour</button>
        <button className="btn btn-primaire" onClick={() => window.print()}><Icone nom="imprimer" className="h-4 w-4" /> Imprimer</button>
      </div>
      <article className="zone-impression carte mx-auto max-w-3xl bg-white p-10 font-serif text-[15px] leading-relaxed text-slate-900">
        <header className="grid grid-cols-2 gap-6 text-center text-xs uppercase leading-snug">
          <div>
            <p className="font-bold">Ministère de l'Éducation nationale, de l'Instruction civique et de la Formation professionnelle</p>
            <p>Secrétariat Général</p>
            <p>Direction Générale des Ressources Humaines</p>
            <p className="mt-2 font-bold normal-case">{d.etablissement?.nom}</p>
          </div>
          <div>
            <p className="font-bold">République gabonaise</p>
            <p className="normal-case italic">Union – Travail – Justice</p>
            <img src="/logo/sceau-gabon.png" alt="Sceau de la République gabonaise" className="mx-auto mt-2 h-14 w-14" />
            <div className="mx-auto mt-2 flex h-2 w-24 overflow-hidden rounded-sm">
              <span className="flex-1 bg-marque-700" /><span className="flex-1 bg-soleil-400" /><span className="flex-1 bg-ciel-500" />
            </div>
          </div>
        </header>
        <p className="mt-6 text-right text-sm">N° {d.numero}</p>
        <h1 className="mt-6 text-center text-2xl font-bold uppercase tracking-wide underline underline-offset-4">{estPrise ? 'Certificat de prise de service' : 'Certificat de cessation de service'}</h1>

        <div className="mt-8 space-y-4">
          <p>
            Je soussigné(e), <strong>{(estPrise ? d.valideur?.name : d.valideur?.name ?? d.signaleur?.name) ?? '……………………'}</strong>, {estPrise ? `chef d'établissement / censeur de ${d.etablissement?.nom}` : 'autorité compétente'}, certifie que :
          </p>
          <table className="w-full text-sm">
            <tbody>
              {[
                ['Nom et prénom(s)', a?.nom_complet],
                ['Matricule', a?.matricule],
                ['Grade', a?.grade ? `${a.grade.code} — ${a.grade.libelle}` : '—'],
                ['Fonction', a?.fonction?.libelle ?? '—'],
                ...(estPrise ? [['Discipline', a?.discipline?.libelle ?? '—']] : []),
                ['Établissement', d.etablissement?.nom],
                ...(estPrise
                  ? [['Nature de l\'affectation', d.affectation?.nature ? d.affectation.nature.replace('_', ' ') : '—'], ['Décision', `${d.affectation?.numero_decision ?? '—'}, effet le ${dateFr(d.affectation?.date_effet)}`]]
                  : [['Motif', d.type_libelle]]),
              ].map(([l, v]) => (
                <tr key={l as string}>
                  <td className="w-56 py-1 pr-4 align-top text-slate-600">{l}</td>
                  <td className="py-1 font-semibold">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {estPrise ? (
            <p>
              a effectivement pris service dans cet établissement le <strong>{dateLongue(d.date_prise_service)}</strong>.
            </p>
          ) : (
            <>
              <p>
                a cessé ses fonctions à compter du <strong>{dateLongue(d.date_cessation)}</strong>.
              </p>
              {d.motif && <p className="text-sm italic text-slate-700">Observations : {d.motif}</p>}
              {d.statut !== 'validee' && <p className="rounded border border-dashed border-red-400 p-2 text-center text-sm font-bold uppercase text-red-700">Document provisoire — cessation {d.statut_libelle.toLowerCase()}</p>}
            </>
          )}
          <p>En foi de quoi, le présent certificat est délivré à l'intéressé(e) pour servir et valoir ce que de droit.</p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-8 text-sm">
          <div />
          <div className="text-center">
            <p>Fait à {d.etablissement?.ville ?? 'Libreville'}, le {dateFr(d.date_traitement ?? d.date_validation ?? new Date().toISOString())}</p>
            <p className="mt-1 font-semibold">{estPrise ? 'Le Chef d\'établissement' : 'L\'Autorité compétente'}</p>
            <div className="mx-auto mt-16 w-48 border-t border-slate-400" />
            <p className="mt-1">{d.valideur?.name}</p>
          </div>
        </div>
        <p className="mt-10 border-t pt-2 text-center text-[11px] text-slate-500">Document généré par GRHMEN — Ministère de l'Éducation nationale · Immeuble des 9 étages, Libreville · (+241) 01 72 28 30</p>
      </article>
    </div>
  )
}
