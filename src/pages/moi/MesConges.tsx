import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useSession } from '../../context/AuthContext'
import { useNotifier } from '../../context/NotificationContext'
import { api, erreursChamps, messageErreur } from '../../lib/api'
import { aujourdhui, dateFr } from '../../lib/format'
import { Alerte, BoutonIcone, Carte, CarteStat, Champ, Chargement, EnTetePage, EtatVide, Modale, Selecteur, Statut, versOptions } from '../../components/ui/Elements'
import Icone from '../../components/ui/Icone'

export default function MesConges() {
  const { listes, peut } = useSession()
  const notifier = useNotifier()
  const [d, setD] = useState<any>(null)
  const [ouvert, setOuvert] = useState(false)
  const [f, setF] = useState({ type: 'annuel', date_debut: aujourdhui(), date_fin: aujourdhui(), motif: '' })
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)

  const charger = useCallback(() => {
    api.get('/moi/conges').then((r) => setD(r.data)).catch((e) => setErreur(messageErreur(e)))
  }, [])
  useEffect(charger, [charger])

  const soumettre = async (e: FormEvent) => {
    e.preventDefault()
    setEnvoi(true)
    setErreurs({})
    setErreur(null)
    try {
      await api.post('/moi/conges', f)
      notifier('Demande envoyée à votre chef d\'établissement.')
      setOuvert(false)
      setF({ type: 'annuel', date_debut: aujourdhui(), date_fin: aujourdhui(), motif: '' })
      charger()
    } catch (err) {
      setErreurs(erreursChamps(err))
      setErreur(messageErreur(err))
    } finally {
      setEnvoi(false)
    }
  }

  const retirer = async (id: number) => {
    try {
      await api.delete(`/moi/conges/${id}`)
      notifier('Demande retirée.')
      charger()
    } catch (e) {
      notifier(messageErreur(e), 'erreur')
    }
  }

  if (!d) return erreur ? <Alerte ton="rouge">{erreur}</Alerte> : <Chargement />

  return (
    <div>
      <EnTetePage
        titre="Mes congés"
        sousTitre="Demandes de congé et d'autorisation d'absence. Circuit : avis du chef d'établissement puis décision de l'académie ou de la DRH."
        icone="soleil"
        actions={
          peut('CONGE_DEMANDER') && (
            <button className="btn btn-primaire" onClick={() => setOuvert(true)}>
              <Icone nom="plus" className="h-4 w-4" /> Nouvelle demande
            </button>
          )
        }
      />
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <CarteStat libelle="Droit annuel" valeur={`${d.solde_annuel.droit} j`} icone="calendrier" />
        <CarteStat libelle="Congé annuel pris" valeur={`${d.solde_annuel.pris} j`} icone="soleil" ton="jaune" />
        <CarteStat libelle="Solde restant" valeur={`${d.solde_annuel.restant} j`} icone="coche" ton="bleu" />
      </div>
      <Carte corpsClassName="p-0">
        {!d.data.length ? (
          <EtatVide texte="Aucune demande de congé." icone="soleil" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Période</th>
                  <th className="px-4 py-2.5">Jours</th>
                  <th className="px-4 py-2.5">Motif</th>
                  <th className="px-4 py-2.5">Statut</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {d.data.map((c: any) => (
                  <tr key={c.id} className="border-b border-slate-100">
                    <td className="px-4 py-2.5 font-medium">{c.type_libelle}</td>
                    <td className="px-4 py-2.5">
                      {dateFr(c.date_debut)} → {dateFr(c.date_fin)}
                    </td>
                    <td className="px-4 py-2.5">{c.nombre_jours}</td>
                    <td className="max-w-xs truncate px-4 py-2.5 text-slate-600" title={c.motif}>
                      {c.motif}
                      {c.commentaire_decision && <span className="block text-xs text-slate-500">Décision : {c.commentaire_decision}</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <Statut code={c.statut} libelle={c.statut_libelle} />
                    </td>
                    <td className="px-4 py-2.5 text-right">{c.statut === 'soumise' && <BoutonIcone icone="poubelle" titre="Retirer la demande" ton="rouge" onClick={() => retirer(c.id)} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Carte>

      <Modale
        ouverte={ouvert}
        titre="Nouvelle demande de congé"
        onFermer={() => setOuvert(false)}
        pied={
          <>
            <button className="btn btn-secondaire" onClick={() => setOuvert(false)}>
              Annuler
            </button>
            <button className="btn btn-primaire" form="form-conge" disabled={envoi}>
              {envoi ? 'Envoi…' : 'Envoyer la demande'}
            </button>
          </>
        }
      >
        <form id="form-conge" onSubmit={soumettre} className="grid gap-4 sm:grid-cols-2">
          {erreur && (
            <div className="sm:col-span-2">
              <Alerte ton="rouge">{erreur}</Alerte>
            </div>
          )}
          <Champ libelle="Type de congé" requis className="sm:col-span-2" erreur={erreurs.type}>
            <Selecteur valeur={f.type} vide={false} onChange={(v) => setF({ ...f, type: v })} options={versOptions(listes?.enums.types_conge)} />
          </Champ>
          <Champ libelle="Du" requis erreur={erreurs.date_debut}>
            <input type="date" className="champ" min={aujourdhui()} value={f.date_debut} onChange={(e) => setF({ ...f, date_debut: e.target.value, date_fin: e.target.value > f.date_fin ? e.target.value : f.date_fin })} required />
          </Champ>
          <Champ libelle="Au" requis erreur={erreurs.date_fin}>
            <input type="date" className="champ" min={f.date_debut} value={f.date_fin} onChange={(e) => setF({ ...f, date_fin: e.target.value })} required />
          </Champ>
          <Champ libelle="Motif" requis className="sm:col-span-2" erreur={erreurs.motif}>
            <textarea className="champ min-h-24" value={f.motif} onChange={(e) => setF({ ...f, motif: e.target.value })} required />
          </Champ>
        </form>
      </Modale>
    </div>
  )
}
