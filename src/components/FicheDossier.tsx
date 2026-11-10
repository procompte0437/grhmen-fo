import { useState, type ReactNode } from 'react'
import { age, dateFr, heure, initiales } from '../lib/format'
import { Carte, EtatVide, Onglets, Statut } from './ui/Elements'

const SITUATIONS: Record<string, string> = { celibataire: 'Célibataire', marie: 'Marié(e)', divorce: 'Divorcé(e)', veuf: 'Veuf / veuve', union_libre: 'Union libre' }

function Ligne({ libelle, valeur }: { libelle: string; valeur: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2 text-sm last:border-0">
      <dt className="text-slate-500">{libelle}</dt>
      <dd className="text-right font-medium text-slate-800">{valeur || '—'}</dd>
    </div>
  )
}

/** Dossier individuel de l'agent : identité, carrière, présences, cessations et congés. */
export default function FicheDossier({ dossier, actions }: { dossier: any; actions?: ReactNode }) {
  const [onglet, setOnglet] = useState('identite')
  const a = dossier.agent
  const s = dossier.synthese_presence_mois

  return (
    <div className="space-y-5">
      <div className="carte flex flex-wrap items-center gap-4 p-5">
        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white ${a.sexe === 'F' ? 'bg-pink-600' : 'bg-ciel-600'}`}>{initiales(`${a.prenom} ${a.nom}`)}</div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-slate-900">{a.nom_complet}</h2>
          <p className="text-sm text-slate-500">
            Matricule <strong className="text-slate-700">{a.matricule}</strong> · {a.categorie_libelle} · {a.fonction?.libelle ?? '—'}
            {a.discipline ? ` · ${a.discipline.libelle}` : ''}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {a.etablissement?.nom ?? 'Sans poste'} {a.etablissement?.province ? `(${a.etablissement.province.nom})` : ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Statut code={a.statut} libelle={a.statut_libelle} />
          {actions}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Présences (mois)', s.present, 'text-marque-800'],
          ['Retards (mois)', s.retard, 'text-amber-700'],
          ['Absences (mois)', s.absent, 'text-red-700'],
          ['Justifiées (mois)', s.absence_justifiee, 'text-ciel-600'],
        ].map(([l, v, c]) => (
          <div key={l as string} className="carte p-3 text-center">
            <p className={`text-2xl font-bold ${c}`}>{v as number}</p>
            <p className="text-xs text-slate-500">{l}</p>
          </div>
        ))}
      </div>

      <Onglets
        actif={onglet}
        onChange={setOnglet}
        onglets={[
          { cle: 'identite', libelle: 'Identité et carrière' },
          { cle: 'affectations', libelle: `Affectations (${a.affectations.length})` },
          { cle: 'services', libelle: 'Prises de service et cours' },
          { cle: 'presences', libelle: 'Présences récentes' },
          { cle: 'conges', libelle: `Congés (${a.conges.length})` },
          { cle: 'cessations', libelle: `Cessations (${a.cessations.length})` },
        ]}
      />

      {onglet === 'identite' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Carte titre="État civil">
            <dl>
              <Ligne libelle="Nom" valeur={a.nom} />
              <Ligne libelle="Prénom(s)" valeur={a.prenom} />
              <Ligne libelle="Sexe" valeur={a.sexe === 'F' ? 'Féminin' : 'Masculin'} />
              <Ligne libelle="Date de naissance" valeur={a.date_naissance ? `${dateFr(a.date_naissance)} (${age(a.date_naissance)} ans)` : null} />
              <Ligne libelle="Lieu de naissance" valeur={a.lieu_naissance} />
              <Ligne libelle="Nationalité" valeur={a.nationalite} />
              <Ligne libelle="Situation matrimoniale" valeur={SITUATIONS[a.situation_matrimoniale] ?? a.situation_matrimoniale} />
              <Ligne libelle="Enfants à charge" valeur={String(a.nombre_enfants ?? 0)} />
              <Ligne libelle="Pièce d'identité" valeur={a.numero_piece} />
              <Ligne libelle="Téléphone" valeur={a.telephone} />
              <Ligne libelle="E-mail" valeur={a.email} />
              <Ligne libelle="Adresse" valeur={a.adresse} />
            </dl>
          </Carte>
          <Carte titre="Situation administrative">
            <dl>
              <Ligne libelle="Catégorie" valeur={a.categorie_libelle} />
              <Ligne libelle="Corps" valeur={a.corps?.libelle} />
              <Ligne libelle="Grade / échelon" valeur={a.grade ? `${a.grade.code} — échelon ${a.echelon ?? '—'}` : null} />
              <Ligne libelle="Fonction" valeur={a.fonction?.libelle} />
              <Ligne libelle="Discipline" valeur={a.discipline?.libelle} />
              <Ligne libelle="Diplôme" valeur={a.diplome} />
              <Ligne libelle="Date de recrutement" valeur={dateFr(a.date_recrutement)} />
              <Ligne libelle="Établissement" valeur={a.etablissement?.nom} />
              <Ligne libelle="Compte utilisateur" valeur={a.utilisateur ? `${a.utilisateur.email} (${a.utilisateur.profil?.libelle ?? '—'})` : 'Aucun'} />
              <Ligne libelle="Observations" valeur={a.observations} />
            </dl>
          </Carte>
        </div>
      )}

      {onglet === 'affectations' && (
        <Carte corpsClassName="p-0">
          {!a.affectations.length ? (
            <EtatVide texte="Aucune affectation." />
          ) : (
            <ol className="divide-y divide-slate-100">
              {a.affectations.map((af: any) => (
                <li key={af.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div>
                    <p className="font-semibold text-slate-800">
                      {af.nature_libelle} — {af.etablissement?.nom}
                    </p>
                    <p className="text-xs text-slate-500">
                      Décision {af.numero_decision ?? '—'} du {dateFr(af.date_decision)} · effet le {dateFr(af.date_effet)}
                      {af.etablissement_origine ? ` · venant de ${af.etablissement_origine.nom}` : ''}
                    </p>
                  </div>
                  <Statut code={af.statut} libelle={af.statut_libelle} />
                </li>
              ))}
            </ol>
          )}
        </Carte>
      )}

      {onglet === 'services' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Carte titre="Prises de service" corpsClassName="p-0">
            {!a.prises_service.length ? (
              <EtatVide texte="Aucune prise de service." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {a.prises_service.map((p: any) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <div>
                      <p className="font-medium">{p.etablissement?.nom}</p>
                      <p className="text-xs text-slate-500">
                        {p.numero} · le {dateFr(p.date_prise_service)}
                      </p>
                    </div>
                    <Statut code={p.statut} libelle={p.statut_libelle} />
                  </li>
                ))}
              </ul>
            )}
          </Carte>
          <Carte titre="Débuts des cours" corpsClassName="p-0">
            {!a.debuts_cours.length ? (
              <EtatVide texte="Aucun début des cours déclaré." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {a.debuts_cours.map((dc: any) => (
                  <li key={dc.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <div>
                      <p className="font-medium">
                        {dc.discipline?.libelle ?? '—'} · {dc.classes}
                      </p>
                      <p className="text-xs text-slate-500">
                        {dc.etablissement?.nom} · le {dateFr(dc.date_debut)} · {dc.volume_horaire} h/sem.
                      </p>
                    </div>
                    <Statut code={dc.statut} libelle={dc.statut_libelle} />
                  </li>
                ))}
              </ul>
            )}
          </Carte>
        </div>
      )}

      {onglet === 'presences' && (
        <Carte corpsClassName="p-0">
          {!dossier.presences_recentes.length ? (
            <EtatVide texte="Aucune présence enregistrée sur les 60 derniers jours." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Arrivée</th>
                    <th className="px-4 py-2">Départ</th>
                    <th className="px-4 py-2">Situation</th>
                    <th className="px-4 py-2">Validation</th>
                  </tr>
                </thead>
                <tbody>
                  {dossier.presences_recentes.map((p: any) => (
                    <tr key={p.id} className="border-b border-slate-100">
                      <td className="px-4 py-2">{dateFr(p.date)}</td>
                      <td className="px-4 py-2">{heure(p.heure_arrivee)}</td>
                      <td className="px-4 py-2">{heure(p.heure_depart)}</td>
                      <td className="px-4 py-2">
                        <Statut code={p.statut} libelle={p.statut_libelle} />
                      </td>
                      <td className="px-4 py-2">
                        <Statut code={p.validation} libelle={{ en_attente: 'À valider', validee: 'Validée', rejetee: 'Rejetée' }[p.validation as string]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Carte>
      )}

      {onglet === 'conges' && (
        <Carte corpsClassName="p-0">
          {!a.conges.length ? (
            <EtatVide texte="Aucune demande de congé." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {a.conges.map((c: any) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div>
                    <p className="font-medium">{c.type_libelle}</p>
                    <p className="text-xs text-slate-500">
                      Du {dateFr(c.date_debut)} au {dateFr(c.date_fin)} · {c.nombre_jours} jour(s) ouvré(s)
                    </p>
                  </div>
                  <Statut code={c.statut} libelle={c.statut_libelle} />
                </li>
              ))}
            </ul>
          )}
        </Carte>
      )}

      {onglet === 'cessations' && (
        <Carte corpsClassName="p-0">
          {!a.cessations.length ? (
            <EtatVide texte="Aucune cessation de service." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {a.cessations.map((c: any) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div>
                    <p className="font-medium">
                      {c.type_libelle} — {c.numero}
                    </p>
                    <p className="text-xs text-slate-500">
                      Le {dateFr(c.date_cessation)} · {c.etablissement?.nom}
                    </p>
                  </div>
                  <Statut code={c.statut} libelle={c.statut_libelle} />
                </li>
              ))}
            </ul>
          )}
        </Carte>
      )}
    </div>
  )
}
