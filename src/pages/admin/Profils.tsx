import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSession } from '../../context/AuthContext'
import { useNotifier } from '../../context/NotificationContext'
import { api, erreursChamps, messageErreur } from '../../lib/api'
import { FenetreDecision, type DemandeDecision } from '../../components/ui/Decision'
import { Alerte, BoutonIcone, Carte, Champ, Chargement, EnTetePage, EtatVide, Modale, Pastille, Selecteur, versOptions } from '../../components/ui/Elements'
import Icone from '../../components/ui/Icone'

/**
 * Profils et habilitations : on attribue au profil des options d'accès (éléments du menu latéral)
 * et des options de gestion (actions dans les écrans). Les utilisateurs héritent des options de leur profil.
 */
export default function Profils() {
  const { peut, listes, rafraichir } = useSession()
  const notifier = useNotifier()
  const [profils, setProfils] = useState<any[] | null>(null)
  const [arbre, setArbre] = useState<any[]>([])
  const [selection, setSelection] = useState<any>(null)
  const [coches, setCoches] = useState<Set<number>>(new Set())
  const [initiales, setInitiales] = useState<Set<number>>(new Set())
  const [edition, setEdition] = useState<any | null>(null)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [decision, setDecision] = useState<DemandeDecision | null>(null)
  const [envoi, setEnvoi] = useState(false)

  const chargerProfils = useCallback(() => api.get('/profils').then((r) => setProfils(r.data.data)), [])
  useEffect(() => {
    chargerProfils()
    api.get('/options').then((r) => setArbre(r.data.data))
  }, [chargerProfils])

  const choisir = async (p: any) => {
    setSelection(p)
    const r = await api.get(`/profils/${p.id}`)
    const s = new Set<number>(r.data.option_ids)
    setCoches(s)
    setInitiales(new Set(s))
  }

  useEffect(() => {
    if (profils?.length && !selection) choisir(profils[0])
  }, [profils, selection])

  const groupes = useMemo(() => {
    const m = new Map<string, any[]>()
    arbre.forEach((o) => m.set(o.groupe, [...(m.get(o.groupe) ?? []), o]))
    return [...m.entries()]
  }, [arbre])

  const modifie = coches.size !== initiales.size || [...coches].some((id) => !initiales.has(id))
  const editable = peut('PROFIL_HABILITER')

  const basculerAcces = (o: any) => {
    const s = new Set(coches)
    if (s.has(o.id)) {
      s.delete(o.id)
      o.enfants.forEach((e: any) => s.delete(e.id))
    } else s.add(o.id)
    setCoches(s)
  }
  const basculerGestion = (o: any, e: any) => {
    const s = new Set(coches)
    if (s.has(e.id)) s.delete(e.id)
    else {
      s.add(e.id)
      s.add(o.id)
    }
    setCoches(s)
  }
  const toutModule = (o: any, valeur: boolean) => {
    const s = new Set(coches)
    ;[o, ...o.enfants].forEach((x: any) => (valeur ? s.add(x.id) : s.delete(x.id)))
    setCoches(s)
  }

  const enregistrer = async () => {
    setEnvoi(true)
    try {
      const r = await api.put(`/profils/${selection.id}/options`, { option_ids: [...coches] })
      const s = new Set<number>(r.data.option_ids)
      setCoches(s)
      setInitiales(new Set(s))
      notifier(`Habilitations du profil « ${selection.libelle} » enregistrées. Elles s'appliquent dès la prochaine action des utilisateurs.`)
      chargerProfils()
      rafraichir()
    } catch (e) {
      notifier(messageErreur(e), 'erreur')
    } finally {
      setEnvoi(false)
    }
  }

  const soumettreProfil = async (e: FormEvent) => {
    e.preventDefault()
    setErreurs({})
    try {
      const r = edition.id ? await api.put(`/profils/${edition.id}`, edition) : await api.post('/profils', edition)
      notifier('Profil enregistré.')
      setEdition(null)
      await chargerProfils()
      choisir(r.data.data)
    } catch (err) {
      setErreurs(erreursChamps(err))
      notifier(messageErreur(err), 'erreur')
    }
  }

  if (!profils) {
    return (
      <div>
        <EnTetePage
          titre="Profils et habilitations"
          icone="bouclier"
          sousTitre="Attribuez les options d'accès (menu latéral) et les options de gestion (actions) à chaque profil ; les utilisateurs reçoivent un profil."
        />
        <Carte><Chargement /></Carte>
      </div>
    )
  }

  const nbAcces = arbre.filter((o) => coches.has(o.id)).length
  const nbGestion = arbre.flatMap((o) => o.enfants).filter((e: any) => coches.has(e.id)).length

  return (
    <div>
      <EnTetePage
        titre="Profils et habilitations"
        icone="bouclier"
        sousTitre="Attribuez les options d'accès (menu latéral) et les options de gestion (actions) à chaque profil ; les utilisateurs reçoivent un profil."
        actions={peut('PROFIL_CREER') && <button className="btn btn-primaire" onClick={() => { setErreurs({}); setEdition({ code: '', libelle: '', description: '', portee: 'etablissement' }) }}><Icone nom="plus" className="h-4 w-4" /> Nouveau profil</button>}
      />
      <div className="grid gap-5 lg:grid-cols-[20rem_1fr]">
        <Carte titre="Profils" corpsClassName="p-2">
          <ul className="space-y-1">
            {profils.map((p) => (
              <li key={p.id}>
                <button type="button" onClick={() => choisir(p)} className={`w-full rounded-xl px-3 py-2.5 text-left transition ${selection?.id === p.id ? 'bg-marque-800 text-white' : 'hover:bg-slate-50'}`}>
                  <p className="text-sm font-semibold">{p.libelle}</p>
                  <p className={`text-xs ${selection?.id === p.id ? 'text-marque-100' : 'text-slate-500'}`}>
                    {p.code} · {p.utilisateurs_count} utilisateur(s) · {p.options_count} option(s)
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </Carte>

        {selection ? (
          <div className="space-y-4">
            <div className="carte flex flex-wrap items-start justify-between gap-3 p-4">
              <div>
                <h2 className="text-lg font-bold">{selection.libelle} {selection.systeme && <Pastille ton="violet">Système</Pastille>}</h2>
                <p className="text-sm text-slate-500">{selection.description}</p>
                <p className="mt-1 text-xs text-slate-600">Périmètre : <strong>{listes?.enums.portees?.[selection.portee]}</strong> · {nbAcces} option(s) d'accès · {nbGestion} option(s) de gestion</p>
              </div>
              <div className="flex gap-1">
                {peut('PROFIL_MODIFIER') && <BoutonIcone icone="crayon" titre="Modifier le profil" onClick={() => { setErreurs({}); setEdition({ ...selection }) }} />}
                {peut('PROFIL_SUPPRIMER') && !selection.systeme && <BoutonIcone icone="poubelle" titre="Supprimer le profil" ton="rouge" onClick={() => setDecision({ titre: 'Supprimer le profil', message: `Supprimer le profil « ${selection.libelle} » ?`, libelleBouton: 'Supprimer', danger: true, succes: 'Profil supprimé.', action: () => api.delete(`/profils/${selection.id}`).then(() => { setSelection(null); chargerProfils() }) })} />}
              </div>
            </div>

            {editable && modifie && (
              <div className="sticky top-20 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
                <span>Modifications non enregistrées.</span>
                <div className="flex gap-2">
                  <button className="btn btn-secondaire" onClick={() => setCoches(new Set(initiales))}>Annuler</button>
                  <button className="btn btn-primaire" onClick={enregistrer} disabled={envoi}>{envoi ? 'Enregistrement…' : 'Enregistrer les habilitations'}</button>
                </div>
              </div>
            )}

            {groupes.map(([groupe, options]) => (
              <Carte key={groupe} titre={groupe} corpsClassName="p-0">
                <ul className="divide-y divide-slate-100">
                  {options.map((o: any) => (
                    <li key={o.id} className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="flex items-center gap-3">
                          <input type="checkbox" className="h-4 w-4 accent-marque-800" disabled={!editable} checked={coches.has(o.id)} onChange={() => basculerAcces(o)} />
                          <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                            <Icone nom={o.icone} className="h-4 w-4 text-marque-700" /> {o.libelle}
                          </span>
                          <Pastille ton="vert">Accès</Pastille>
                        </label>
                        {editable && o.enfants.length > 0 && (
                          <div className="flex gap-2 text-xs">
                            <button type="button" className="font-semibold text-marque-800 hover:underline" onClick={() => toutModule(o, true)}>Tout cocher</button>
                            <button type="button" className="text-slate-500 hover:underline" onClick={() => toutModule(o, false)}>Tout décocher</button>
                          </div>
                        )}
                      </div>
                      {o.enfants.length > 0 && (
                        <div className="mt-2 grid gap-1.5 pl-7 sm:grid-cols-2">
                          {o.enfants.map((e: any) => (
                            <label key={e.id} className={`flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm ${coches.has(e.id) ? 'bg-marque-50' : ''}`}>
                              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-marque-800" disabled={!editable} checked={coches.has(e.id)} onChange={() => basculerGestion(o, e)} />
                              <span>
                                <span className="text-slate-700">{e.libelle}</span>
                                <span className="block font-mono text-[10.5px] text-slate-400">{e.code}</span>
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </Carte>
            ))}
          </div>
        ) : (
          <EtatVide texte="Choisissez un profil." />
        )}
      </div>

      <Modale ouverte={!!edition} titre={edition?.id ? 'Modifier le profil' : 'Nouveau profil'} onFermer={() => setEdition(null)} pied={<><button className="btn btn-secondaire" onClick={() => setEdition(null)}>Annuler</button><button className="btn btn-primaire" form="form-profil">Enregistrer</button></>}>
        {edition && (
          <form id="form-profil" onSubmit={soumettreProfil} className="space-y-4">
            {Object.keys(erreurs).length > 0 && <Alerte ton="rouge">{Object.values(erreurs).join(' ')}</Alerte>}
            <Champ libelle="Code" requis aide="Majuscules, chiffres et _ (ex. INSPECTEUR)" erreur={erreurs.code}>
              <input className="champ uppercase" value={edition.code} onChange={(e) => setEdition({ ...edition, code: e.target.value.toUpperCase() })} required />
            </Champ>
            <Champ libelle="Libellé" requis erreur={erreurs.libelle}><input className="champ" value={edition.libelle} onChange={(e) => setEdition({ ...edition, libelle: e.target.value })} required /></Champ>
            <Champ libelle="Périmètre des données" requis aide="Province, établissement ou données personnelles. Les profils nationaux voient tous les établissements grâce au droit « Voir tous les établissements du ministère », que l'on peut décocher dans les habilitations.">
              <Selecteur vide={false} valeur={edition.portee} onChange={(v) => setEdition({ ...edition, portee: v })} options={versOptions(listes?.enums.portees)} />
            </Champ>
            <Champ libelle="Description"><textarea className="champ min-h-20" value={edition.description ?? ''} onChange={(e) => setEdition({ ...edition, description: e.target.value })} /></Champ>
          </form>
        )}
      </Modale>
      <FenetreDecision demande={decision} onFermer={() => setDecision(null)} />
    </div>
  )
}
