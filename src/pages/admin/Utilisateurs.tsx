import { useEffect, useState, type FormEvent } from 'react'
import { useSession } from '../../context/AuthContext'
import { useNotifier } from '../../context/NotificationContext'
import { api, erreursChamps, messageErreur } from '../../lib/api'
import { dateHeure } from '../../lib/format'
import SelecteurAgent from '../../components/formulaires/SelecteurAgent'
import { FenetreDecision, type DemandeDecision } from '../../components/ui/Decision'
import { Alerte, BarreFiltres, BoutonIcone, Carte, Champ, EnTetePage, Modale, Pastille, Recherche, Selecteur, Statut } from '../../components/ui/Elements'
import Icone from '../../components/ui/Icone'
import { Pagination, Tableau, useListe } from '../../components/ui/Tableau'

const VIDE = { name: '', email: '', matricule: '', telephone: '', profil_id: '', agent_id: '', etablissement_id: '', province_id: '', etat: 'actif' }

export default function Utilisateurs() {
  const { listes, peut, utilisateur } = useSession()
  const notifier = useNotifier()
  const l = useListe<any>('/utilisateurs', { q: '', profil_id: '', etat: '' })
  const [edition, setEdition] = useState<any | null>(null)
  const [agent, setAgent] = useState<any>(null)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreur, setErreur] = useState<string | null>(null)
  const [motDePasse, setMotDePasse] = useState<{ nom: string; mdp: string } | null>(null)
  const [decision, setDecision] = useState<DemandeDecision | null>(null)

  useEffect(() => {
    if (!agent || edition?.id) return
    setEdition((e: any) => ({ ...e, agent_id: agent.id, name: e.name || `${agent.prenom} ${agent.nom}`, matricule: agent.matricule, telephone: agent.telephone ?? '', etablissement_id: agent.etablissement_id ?? '', province_id: agent.etablissement?.province_id ?? '', email: e.email || agent.email || '' }))
  }, [agent, edition?.id])

  const ouvrir = (u?: any) => {
    setErreurs({})
    setErreur(null)
    setAgent(u?.agent ?? null)
    setEdition(u ? { id: u.id, ...Object.fromEntries(Object.keys(VIDE).map((k) => [k, u[k] ?? ''])) } : { ...VIDE })
  }

  const soumettre = async (e: FormEvent) => {
    e.preventDefault()
    const charge: any = {}
    Object.keys(VIDE).forEach((k) => (charge[k] = edition[k] === '' ? null : edition[k]))
    try {
      if (edition.id) {
        await api.put(`/utilisateurs/${edition.id}`, charge)
        notifier('Utilisateur modifié.')
      } else {
        const r = await api.post('/utilisateurs', charge)
        setMotDePasse({ nom: r.data.data.name, mdp: r.data.mot_de_passe_temporaire })
      }
      setEdition(null)
      l.recharger()
    } catch (err) {
      setErreurs(erreursChamps(err))
      setErreur(messageErreur(err))
    }
  }

  const portee = listes?.profils.find((p) => String(p.id) === String(edition?.profil_id))?.portee as string | undefined

  return (
    <div>
      <EnTetePage titre="Utilisateurs" icone="utilisateur" sousTitre="Comptes de connexion. Chaque utilisateur reçoit un profil qui détermine son menu, ses actions et son périmètre." actions={peut('UTILISATEUR_CREER') && <button className="btn btn-primaire" onClick={() => ouvrir()}><Icone nom="plus" className="h-4 w-4" /> Nouvel utilisateur</button>} />
      <BarreFiltres>
        <Recherche valeur={l.filtres.q} onChange={(v) => l.filtrer('q', v)} placeholder="Nom, e-mail, matricule…" />
        <Selecteur valeur={l.filtres.profil_id} onChange={(v) => l.filtrer('profil_id', v)} vide="Tous les profils" options={(listes?.profils ?? []).map((p) => ({ valeur: p.id, libelle: p.libelle as string }))} />
        <Selecteur valeur={l.filtres.etat} onChange={(v) => l.filtrer('etat', v)} vide="Tous les états" options={[{ valeur: 'actif', libelle: 'Actifs' }, { valeur: 'inactif', libelle: 'Inactifs' }]} />
      </BarreFiltres>
      {motDePasse && <div className="mb-4"><Alerte ton="vert" titre="Compte créé">Mot de passe temporaire de {motDePasse.nom} : <code className="rounded bg-white px-2 py-0.5 font-bold">{motDePasse.mdp}</code> — à changer à la première connexion.</Alerte></div>}
      <Carte corpsClassName="p-0">
        <Tableau
          lignes={l.lignes}
          chargement={l.chargement}
          colonnes={[
            { titre: 'Utilisateur', rendu: (u) => <div><p className="font-semibold">{u.name}</p><p className="text-xs text-slate-500">{u.email}{u.matricule ? ` · ${u.matricule}` : ''}</p></div> },
            { titre: 'Profil', rendu: (u) => <Pastille ton="vert">{u.profil?.libelle ?? '—'}</Pastille> },
            { titre: 'Périmètre', rendu: (u) => <span className="text-xs">{u.etablissement?.nom ?? u.province?.nom ?? 'National'}</span> },
            { titre: 'Dossier agent', rendu: (u) => (u.agent ? <span className="text-xs">{u.agent.matricule}</span> : <span className="text-xs text-slate-400">—</span>) },
            { titre: 'Dernière connexion', rendu: (u) => <span className="text-xs">{dateHeure(u.derniere_connexion)}</span> },
            { titre: 'État', rendu: (u) => <Statut code={u.etat} libelle={u.etat === 'actif' ? 'Actif' : 'Inactif'} /> },
            {
              titre: '',
              className: 'text-right',
              rendu: (u) => (
                <div className="flex justify-end gap-1">
                  {peut('UTILISATEUR_MODIFIER') && <BoutonIcone icone="crayon" titre="Modifier" onClick={() => ouvrir(u)} />}
                  {peut('UTILISATEUR_REINITIALISER') && <BoutonIcone icone="cle" titre="Réinitialiser le mot de passe" ton="bleu" onClick={() => setDecision({ titre: 'Réinitialiser le mot de passe', message: `Un nouveau mot de passe temporaire sera généré pour ${u.name}.`, libelleBouton: 'Réinitialiser', succes: 'Mot de passe réinitialisé.', action: () => api.post(`/utilisateurs/${u.id}/reinitialiser`).then((r) => setMotDePasse({ nom: u.name, mdp: r.data.mot_de_passe_temporaire })) })} />}
                  {peut('UTILISATEUR_SUPPRIMER') && u.id !== utilisateur?.id && <BoutonIcone icone="poubelle" titre="Supprimer" ton="rouge" onClick={() => setDecision({ titre: 'Supprimer l\'utilisateur', message: `Supprimer le compte de ${u.name} ? Le dossier agent éventuel est conservé.`, libelleBouton: 'Supprimer', danger: true, succes: 'Utilisateur supprimé.', action: () => api.delete(`/utilisateurs/${u.id}`) })} />}
                </div>
              ),
            },
          ]}
        />
        <Pagination page={l.donnees} onPage={l.setPage} />
      </Carte>

      <Modale ouverte={!!edition} large titre={edition?.id ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'} onFermer={() => setEdition(null)} pied={<><button className="btn btn-secondaire" onClick={() => setEdition(null)}>Annuler</button><button className="btn btn-primaire" form="form-user">Enregistrer</button></>}>
        {edition && (
          <form id="form-user" onSubmit={soumettre} className="grid gap-4 sm:grid-cols-2">
            {erreur && <div className="sm:col-span-2"><Alerte ton="rouge">{erreur}</Alerte></div>}
            <Champ libelle="Dossier agent rattaché" className="sm:col-span-2" aide="Facultatif : un compte rattaché à un agent donne accès à « Mon espace » (pointage, prise de service, congés)." erreur={erreurs.agent_id}>
              <SelecteurAgent valeur={agent} onChange={(a) => { setAgent(a); if (!a) setEdition({ ...edition, agent_id: '' }) }} />
            </Champ>
            <Champ libelle="Nom affiché" requis erreur={erreurs.name}><input className="champ" value={edition.name} onChange={(e) => setEdition({ ...edition, name: e.target.value })} required /></Champ>
            <Champ libelle="E-mail" requis erreur={erreurs.email}><input type="email" className="champ" value={edition.email} onChange={(e) => setEdition({ ...edition, email: e.target.value })} required /></Champ>
            <Champ libelle="Matricule (identifiant)" erreur={erreurs.matricule}><input className="champ" value={edition.matricule} onChange={(e) => setEdition({ ...edition, matricule: e.target.value })} /></Champ>
            <Champ libelle="Téléphone"><input className="champ" value={edition.telephone} onChange={(e) => setEdition({ ...edition, telephone: e.target.value })} /></Champ>
            <Champ libelle="Profil" requis erreur={erreurs.profil_id}><Selecteur valeur={edition.profil_id} onChange={(v) => setEdition({ ...edition, profil_id: v })} options={(listes?.profils ?? []).map((p) => ({ valeur: p.id, libelle: p.libelle as string }))} /></Champ>
            <Champ libelle="État"><Selecteur vide={false} valeur={edition.etat} onChange={(v) => setEdition({ ...edition, etat: v })} options={[{ valeur: 'actif', libelle: 'Actif' }, { valeur: 'inactif', libelle: 'Inactif (connexion bloquée)' }]} /></Champ>
            {(portee === 'etablissement' || portee === 'personnel' || !portee) && (
              <Champ libelle="Établissement de rattachement" erreur={erreurs.etablissement_id}><Selecteur valeur={edition.etablissement_id} onChange={(v) => setEdition({ ...edition, etablissement_id: v })} options={(listes?.etablissements ?? []).map((e) => ({ valeur: e.id, libelle: e.nom as string }))} /></Champ>
            )}
            {portee === 'provincial' && (
              <Champ libelle="Province (académie)" requis erreur={erreurs.province_id}><Selecteur valeur={edition.province_id} onChange={(v) => setEdition({ ...edition, province_id: v })} options={(listes?.provinces ?? []).map((p) => ({ valeur: p.id, libelle: p.nom as string }))} /></Champ>
            )}
            {portee && <p className="sm:col-span-2 text-xs text-slate-500">Périmètre du profil : <strong>{listes?.enums.portees?.[portee as string]}</strong></p>}
          </form>
        )}
      </Modale>
      <FenetreDecision demande={decision} onFermer={() => setDecision(null)} onTermine={l.recharger} />
    </div>
  )
}
