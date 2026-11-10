import { useCallback, useEffect, useState } from 'react'
import { useSession } from '../../context/AuthContext'
import { useNotifier } from '../../context/NotificationContext'
import { api, messageErreur } from '../../lib/api'
import { aujourdhui, dateFr, dateLongue, heure } from '../../lib/format'
import { Alerte, Carte, CarteStat, Chargement, EnTetePage, EtatVide, Statut } from '../../components/ui/Elements'
import Icone from '../../components/ui/Icone'

function moisCourant() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function MonPointage() {
  const { peut, listes } = useSession()
  const notifier = useNotifier()
  const [mois, setMois] = useState(moisCourant())
  const [d, setD] = useState<any>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const [horloge, setHorloge] = useState(new Date())

  useEffect(() => {
    const t = window.setInterval(() => setHorloge(new Date()), 1000)
    return () => window.clearInterval(t)
  }, [])

  const charger = useCallback(() => {
    api
      .get('/moi/presences', { params: { mois } })
      .then((r) => setD(r.data))
      .catch((e) => setErreur(messageErreur(e)))
  }, [mois])

  useEffect(charger, [charger])

  const position = (): Promise<{ latitude?: number; longitude?: number }> =>
    new Promise((resolve) => {
      if (!navigator.geolocation) return resolve({})
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
        () => resolve({}),
        { timeout: 4000, maximumAge: 60000 },
      )
    })

  const pointer = async (type: 'arrivee' | 'depart') => {
    setEnvoi(true)
    try {
      const geo = await position()
      const r = await api.post('/moi/pointage', { type, ...geo })
      notifier(type === 'arrivee' ? `Arrivée enregistrée à ${heure(r.data.data.heure_arrivee)}${r.data.data.statut === 'retard' ? ' (retard)' : ''}.` : `Départ enregistré à ${heure(r.data.data.heure_depart)}.`)
      charger()
    } catch (e) {
      notifier(messageErreur(e), 'erreur')
    } finally {
      setEnvoi(false)
    }
  }

  if (!d) {
    return (
      <div>
        <EnTetePage titre="Mon pointage" sousTitre="Pointez votre arrivée et votre départ au poste. Le censeur ou le chef de service valide vos pointages." icone="horloge" />
        {erreur ? <Alerte ton="rouge">{erreur}</Alerte> : <Carte><Chargement /></Carte>}
      </div>
    )
  }

  const j = d.aujourdhui
  const s = d.synthese
  const etab = d.agent?.etablissement

  return (
    <div>
      <EnTetePage titre="Mon pointage" sousTitre="Pointez votre arrivée et votre départ au poste. Le censeur ou le chef de service valide vos pointages." icone="horloge" />

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <div className="carte overflow-hidden">
          <div className="bg-gradient-to-br from-marque-800 to-marque-950 px-6 py-7 text-white">
            <p className="text-sm capitalize text-marque-100/80">{dateLongue(new Date().toISOString())}</p>
            <p className="mt-1 text-5xl font-extrabold tabular-nums tracking-tight">{horloge.toLocaleTimeString('fr-FR')}</p>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-marque-100/85">
              <Icone nom="localisation" className="h-4 w-4" /> {etab?.nom ?? 'Aucun poste'} · horaires {heure(etab?.heure_debut)} – {heure(etab?.heure_fin)}
            </p>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-xs font-semibold uppercase text-slate-500">Arrivée</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{heure(j?.heure_arrivee)}</p>
              {j?.statut && <div className="mt-1"><Statut code={j.statut} libelle={j.statut_libelle} /></div>}
            </div>
            <div className="rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-xs font-semibold uppercase text-slate-500">Départ</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{heure(j?.heure_depart)}</p>
              {j?.validation && <div className="mt-1"><Statut code={j.validation} libelle={{ en_attente: 'À valider', validee: 'Validé', rejetee: 'Rejeté' }[j.validation as string]} /></div>}
            </div>
            {peut('PRESENCE_POINTER') && (
              <>
                <button type="button" className="btn btn-primaire py-3.5 text-base" disabled={envoi || !!j?.heure_arrivee || ['absence_justifiee', 'mission'].includes(j?.statut)} onClick={() => pointer('arrivee')}>
                  <Icone nom="valider" /> Pointer mon arrivée
                </button>
                <button type="button" className="btn btn-bleu py-3.5 text-base" disabled={envoi || !j?.heure_arrivee || !!j?.heure_depart} onClick={() => pointer('depart')}>
                  <Icone nom="deconnexion" /> Pointer mon départ
                </button>
              </>
            )}
          </div>
          {listes?.feries?.[aujourdhui()] && <p className="mx-6 mb-3 rounded-lg bg-ciel-100 px-3 py-2 text-sm font-medium text-ciel-600">Aujourd'hui est un jour férié : {listes.feries[aujourdhui()]}.</p>}
          <p className="px-6 pb-5 text-xs text-slate-500">Une arrivée plus de 15 minutes après l'heure d'ouverture est enregistrée comme un retard. Votre position est jointe au pointage si vous l'autorisez.</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-700">Bilan du mois</h2>
            <input type="month" className="champ w-auto" value={mois} onChange={(e) => setMois(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CarteStat libelle="Taux de présence" valeur={`${s.taux_presence} %`} icone="coche" />
            <CarteStat libelle="Jours ouvrés" valeur={d.jours_ouvres} icone="calendrier" ton="bleu" />
            <CarteStat libelle="Retards" valeur={s.retard} icone="horloge" ton="jaune" />
            <CarteStat libelle="Absences" valeur={s.absent} detail={`${s.absence_justifiee} justifiée(s)`} icone="alerte" ton="rouge" />
          </div>
        </div>
      </div>

      <Carte titre="Historique du mois" className="mt-5" corpsClassName="p-0">
        {!d.data.length ? (
          <EtatVide texte="Aucun pointage sur ce mois." icone="horloge" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Arrivée</th>
                  <th className="px-4 py-2.5">Départ</th>
                  <th className="px-4 py-2.5">Situation</th>
                  <th className="px-4 py-2.5">Validation</th>
                  <th className="px-4 py-2.5">Observations</th>
                </tr>
              </thead>
              <tbody>
                {d.data.map((p: any) => (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="px-4 py-2.5 font-medium">{dateFr(p.date)}</td>
                    <td className="px-4 py-2.5">{heure(p.heure_arrivee)}</td>
                    <td className="px-4 py-2.5">{heure(p.heure_depart)}</td>
                    <td className="px-4 py-2.5"><Statut code={p.statut} libelle={p.statut_libelle} /></td>
                    <td className="px-4 py-2.5"><Statut code={p.validation} libelle={{ en_attente: 'À valider', validee: 'Validée', rejetee: 'Rejetée' }[p.validation as string]} /></td>
                    <td className="px-4 py-2.5 text-slate-500">{p.observations ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Carte>
    </div>
  )
}
