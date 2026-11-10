import { dateHeure } from '../../lib/format'
import { BarreFiltres, Carte, EnTetePage, Pastille, Recherche, Selecteur } from '../../components/ui/Elements'
import { Pagination, Tableau, useListe } from '../../components/ui/Tableau'

const MODULES = ['auth', 'personnel', 'affectations', 'prises_service', 'debuts_cours', 'presences', 'cessations', 'conges', 'etablissements', 'referentiels', 'utilisateurs', 'profils', 'options', 'systeme']

export default function Journal() {
  const l = useListe<any>('/journal', { q: '', module: '', date_debut: '', date_fin: '' })
  return (
    <div>
      <EnTetePage titre="Journal d'audit" icone="historique" sousTitre="Traçabilité de toutes les opérations : qui a fait quoi, quand et depuis quelle adresse." />
      <BarreFiltres>
        <Recherche valeur={l.filtres.q} onChange={(v) => l.filtrer('q', v)} placeholder="Description, action…" />
        <Selecteur valeur={l.filtres.module} onChange={(v) => l.filtrer('module', v)} vide="Tous les modules" options={MODULES.map((m) => ({ valeur: m, libelle: m.replace('_', ' ') }))} />
        <input type="date" className="champ" value={l.filtres.date_debut} onChange={(e) => l.filtrer('date_debut', e.target.value)} aria-label="Du" />
        <input type="date" className="champ" value={l.filtres.date_fin} onChange={(e) => l.filtrer('date_fin', e.target.value)} aria-label="Au" />
      </BarreFiltres>
      <Carte corpsClassName="p-0">
        <Tableau
          lignes={l.lignes}
          chargement={l.chargement}
          colonnes={[
            { titre: 'Date', rendu: (j) => <span className="whitespace-nowrap text-xs">{dateHeure(j.created_at)}</span> },
            { titre: 'Utilisateur', rendu: (j) => <span className="text-sm">{j.utilisateur?.name ?? 'Système'}</span> },
            { titre: 'Module', rendu: (j) => <Pastille ton="bleu">{j.module}</Pastille> },
            { titre: 'Action', rendu: (j) => <Pastille>{j.action}</Pastille> },
            { titre: 'Description', rendu: (j) => <span className="text-sm text-slate-700">{j.description}</span> },
            { titre: 'Adresse IP', rendu: (j) => <span className="font-mono text-xs text-slate-500">{j.adresse_ip ?? '—'}</span> },
          ]}
        />
        <Pagination page={l.donnees} onPage={l.setPage} />
      </Carte>
    </div>
  )
}
