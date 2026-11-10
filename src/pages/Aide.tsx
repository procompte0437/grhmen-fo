import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '../context/AuthContext'
import { Alerte, Carte, EnTetePage, Pastille } from '../components/ui/Elements'
import Icone from '../components/ui/Icone'

interface Chapitre {
  cle: string
  titre: string
  icone: string
  /** Profils pour lesquels ce chapitre est mis en avant. */
  profils: string[]
  contenu: ReactNode
}

function Etapes({ items }: { items: ReactNode[] }) {
  return (
    <ol className="space-y-2.5">
      {items.map((t, i) => (
        <li key={i} className="flex gap-3 text-[13.5px] leading-relaxed text-slate-700">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-marque-800 text-[11px] font-bold text-white">{i + 1}</span>
          <span>{t}</span>
        </li>
      ))}
    </ol>
  )
}

const M = ({ children }: { children: ReactNode }) => <strong className="font-semibold text-marque-900">{children}</strong>

const CHAPITRES: Chapitre[] = [
  {
    cle: 'demarrer',
    titre: 'Bien démarrer',
    icone: 'fusee',
    profils: ['*'],
    contenu: (
      <div className="space-y-4">
        <Etapes
          items={[
            <>Ouvrez GRHMEN et identifiez-vous avec votre <M>adresse e-mail</M> ou votre <M>matricule</M>, puis votre mot de passe.</>,
            <>À la première connexion, l'application vous demande de <M>choisir un mot de passe personnel</M> (8 caractères minimum).</>,
            <>Le <M>menu latéral</M> n'affiche que les écrans autorisés pour votre profil. Les nombres en jaune signalent les dossiers qui attendent votre action.</>,
            <>Le <M>tableau de bord</M> résume la situation de votre périmètre et liste « À traiter » les tâches en attente : cliquez sur une tuile pour y aller directement.</>,
            <>Votre nom, en haut à droite, donne accès à ce guide, au changement de mot de passe et à la déconnexion.</>,
          ]}
        />
        <Alerte ton="bleu" titre="Périmètre des données">
          Chaque profil voit un périmètre précis : tout le ministère (DRH, gestionnaire), une province (directeur d'académie), un établissement (proviseur, censeur, directeur d'école) ou uniquement ses propres données (enseignant, agent).
        </Alerte>
      </div>
    ),
  },
  {
    cle: 'enseignant',
    titre: 'Enseignant ou agent : mon espace',
    icone: 'dossier',
    profils: ['ENSEIGNANT', 'AGENT_ADMIN', 'CHEF_ETAB', 'CENSEUR'],
    contenu: (
      <div className="space-y-5">
        <div>
          <h3 className="mb-2 font-semibold text-slate-900">Déclarer ma prise de service</h3>
          <Etapes
            items={[
              <>Après une affectation, un bandeau vous invite à déclarer votre prise de service. Ouvrez <M>Ma prise de service</M>.</>,
              <>Vérifiez l'établissement, la décision et la date d'effet, puis indiquez la <M>date à laquelle vous avez rejoint le poste</M>.</>,
              <>Cliquez sur <M>Déclarer ma prise de service</M>. Le proviseur ou le censeur la confirme ; vous pouvez ensuite imprimer votre <M>certificat de prise de service</M>.</>,
            ]}
          />
        </div>
        <div>
          <h3 className="mb-2 font-semibold text-slate-900">Déclarer mon début des cours (enseignants)</h3>
          <Etapes items={[<>Une fois la prise de service confirmée, renseignez la <M>date du premier cours</M>, les <M>classes tenues</M> et le <M>volume horaire</M> hebdomadaire.</>, <>Le censeur confirme votre début des cours.</>]} />
        </div>
        <div>
          <h3 className="mb-2 font-semibold text-slate-900">Pointer ma présence au poste</h3>
          <Etapes
            items={[
              <>Chaque jour, ouvrez <M>Mon pointage</M> et cliquez sur <M>Pointer mon arrivée</M> à votre arrivée, puis <M>Pointer mon départ</M> en fin de journée.</>,
              <>Une arrivée plus de <M>15 minutes</M> après l'ouverture de l'établissement est comptée en retard. Si vous l'autorisez, votre position est jointe au pointage.</>,
              <>Le bilan du mois (taux de présence, retards, absences) et l'historique sont affichés sous l'horloge.</>,
            ]}
          />
        </div>
        <div>
          <h3 className="mb-2 font-semibold text-slate-900">Demander un congé</h3>
          <Etapes items={[<>Dans <M>Mes congés</M>, cliquez sur <M>Nouvelle demande</M>, choisissez le type, les dates et le motif.</>, <>Circuit : avis du chef d'établissement, puis décision de l'académie ou de la DRH. Vous pouvez retirer une demande tant qu'elle n'est pas traitée.</>, <>Votre solde de congé annuel est affiché en haut de l'écran.</>]} />
        </div>
      </div>
    ),
  },
  {
    cle: 'etablissement',
    titre: 'Proviseur, censeur, directeur d\'école : attester le service',
    icone: 'ecole',
    profils: ['CHEF_ETAB', 'CENSEUR'],
    contenu: (
      <div className="space-y-5">
        <div>
          <h3 className="mb-2 font-semibold text-slate-900">Confirmer les prises de service</h3>
          <Etapes
            items={[
              <><M>Prises de service › À confirmer</M> : vérifiez la présence effective de l'agent, puis cliquez sur <M>Confirmer</M> (ou <M>Rejeter</M> avec un motif).</>,
              <>L'onglet <M>Agents attendus</M> liste les agents affectés qui ne se sont pas encore présentés, avec le délai écoulé (en rouge au-delà de 30 jours).</>,
              <>Si l'agent n'a pas de compte, cliquez sur <M>Enregistrer la prise de service</M> pour la saisir et la confirmer en une fois.</>,
            ]}
          />
        </div>
        <div>
          <h3 className="mb-2 font-semibold text-slate-900">Suivre le début des cours</h3>
          <Etapes items={[<><M>Débuts des cours › À confirmer</M> : confirmez les déclarations des enseignants.</>, <>L'onglet <M>Enseignants sans début des cours</M> repère ceux qui n'ont pas encore commencé ; vous pouvez constater le début des cours vous-même.</>]} />
        </div>
        <div>
          <h3 className="mb-2 font-semibold text-slate-900">Tenir la feuille de présence</h3>
          <Etapes
            items={[
              <>Ouvrez <M>Présences au poste › Feuille d'appel</M> : tout le personnel en service apparaît, avec les pointages déjà faits.</>,
              <>Pour chaque agent, choisissez <M>P</M> présent, <M>R</M> retard, <M>A</M> absent, <M>J</M> absence justifiée ou <M>M</M> mission. Le bouton « Marquer les non renseignés présents » accélère la saisie.</>,
              <>Cliquez sur <M>Enregistrer et attester la feuille</M> : les présences sont validées sous votre nom.</>,
              <>L'onglet <M>Pointages à valider</M> permet de valider ou rejeter en masse les pointages des agents.</>,
            ]}
          />
        </div>
        <div>
          <h3 className="mb-2 font-semibold text-slate-900">Signaler une cessation et donner un avis de congé</h3>
          <Etapes items={[<>Depuis <M>Cessations de service</M> ou la fiche de l'agent, cliquez sur <M>Signaler une cessation</M> (abandon de poste, décès…). L'autorité compétente la valide.</>, <>Dans <M>Congés et absences</M>, émettez un avis <M>favorable</M> ou <M>défavorable</M> sur chaque demande.</>]} />
        </div>
      </div>
    ),
  },
  {
    cle: 'drh',
    titre: 'DRH, gestionnaire, académie : gérer le personnel',
    icone: 'personnes',
    profils: ['DRH', 'GESTIONNAIRE_RH', 'DAP', 'ADMIN'],
    contenu: (
      <div className="space-y-5">
        <div>
          <h3 className="mb-2 font-semibold text-slate-900">Dossiers du personnel</h3>
          <Etapes
            items={[
              <><M>Personnel</M> : recherchez par nom ou matricule, filtrez (catégorie, statut, établissement, province, discipline, sexe) et exportez la liste en CSV (Excel).</>,
              <><M>Nouvel agent</M> : renseignez l'état civil et la situation administrative (corps, grade, échelon, fonction, discipline).</>,
              <>La <M>fiche agent</M> réunit identité, affectations, prises de service, débuts des cours, présences, congés et cessations. Elle permet de modifier, affecter, créer le compte de connexion et signaler une cessation.</>,
            ]}
          />
        </div>
        <div>
          <h3 className="mb-2 font-semibold text-slate-900">Affecter un agent</h3>
          <Etapes items={[<>Cliquez sur <M>Nouvelle affectation</M> (ou <M>Affecter</M> depuis la fiche), choisissez l'établissement, la nature (mutation, nomination…), la décision et la date d'effet.</>, <>L'agent passe « en attente de prise de service » et apparaît dans les agents attendus de l'établissement. Le filtre « sans prise de service &gt; 30 jours » repère les retards.</>, <>Une affectation en attente peut être modifiée ou annulée : l'agent retrouve alors son poste précédent.</>]} />
        </div>
        <div>
          <h3 className="mb-2 font-semibold text-slate-900">Cessations de service</h3>
          <Etapes items={[<><M>Générer pour non-prise de service</M> : une cessation est signalée pour chaque agent qui ne s'est pas présenté au-delà du délai choisi (30 jours par défaut).</>, <><M>Valider</M> une cessation clôt l'affectation et met à jour la situation de l'agent (suspendu, retraité, décédé…). Le <M>certificat de cessation de service</M> est imprimable.</>]} />
        </div>
        <div>
          <h3 className="mb-2 font-semibold text-slate-900">Congés, rapports et établissements</h3>
          <Etapes items={[<><M>Congés et absences</M> : approuvez ou rejetez les demandes ; les jours approuvés sont automatiquement portés en absence justifiée.</>, <><M>Rapports et statistiques</M> : effectifs par province, pyramide des âges, départs à la retraite, taux de présence, non-prises de service, taux d'encadrement. Export et impression.</>, <><M>Établissements</M> : fiche de chaque structure avec son personnel et ses indicateurs du jour.</>]} />
        </div>
      </div>
    ),
  },
  {
    cle: 'habilitations',
    titre: 'Administrateur : profils et habilitations',
    icone: 'bouclier',
    profils: ['ADMIN'],
    contenu: (
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ['Option d\'accès', 'Un élément du menu latéral : Personnel, Présences au poste…', 'vert'],
            ['Option de gestion', 'Une action dans un écran : créer un agent, confirmer une prise de service…', 'jaune'],
            ['Profil', 'Un ensemble d\'options et un périmètre, attribué à chaque utilisateur.', 'bleu'],
          ].map(([t, d, ton]) => (
            <div key={t} className="rounded-lg border border-[#e6e4dc] bg-creme-50 p-3">
              <Pastille ton={ton}>{t}</Pastille>
              <p className="mt-2 text-[13px] text-slate-600">{d}</p>
            </div>
          ))}
        </div>
        <Etapes
          items={[
            <>Ouvrez <M>Profils et habilitations</M> et choisissez un profil dans la liste de gauche.</>,
            <>Cochez les <M>options d'accès</M> (menu) et les <M>options de gestion</M> (actions). Cocher une action coche automatiquement l'écran correspondant.</>,
            <>Cliquez sur <M>Enregistrer les habilitations</M> : le changement s'applique immédiatement, le menu des utilisateurs concernés est mis à jour.</>,
            <><M>Nouveau profil</M> : définissez son code, son libellé et son <M>périmètre</M> (national, provincial, établissement, personnel).</>,
            <><M>Utilisateurs</M> : créez un compte, rattachez-le à un dossier agent, attribuez un profil, désactivez ou réinitialisez le mot de passe (un mot de passe temporaire est affiché).</>,
            <><M>Référentiels</M> : provinces, corps, grades, disciplines, fonctions, années scolaires. <M>Journal d'audit</M> : toutes les opérations, avec l'auteur, la date et l'adresse IP.</>,
          ]}
        />
      </div>
    ),
  },
  {
    cle: 'faq',
    titre: 'Questions fréquentes',
    icone: 'aide',
    profils: ['*'],
    contenu: (
      <dl className="space-y-4 text-[13.5px]">
        {[
          ['Je ne vois pas un écran dans le menu.', 'Votre profil n\'a pas l\'option d\'accès correspondante. Demandez l\'habilitation à l\'administrateur.'],
          ['Je ne peux pas pointer.', 'Le pointage n\'est possible qu\'après la confirmation de votre prise de service dans votre établissement.'],
          ['Mon pointage est « à valider ».', 'Le censeur ou le chef de service valide les pointages ; il apparaîtra « validé » dans votre historique.'],
          ['J\'ai oublié mon mot de passe.', 'L\'administrateur peut le réinitialiser : un mot de passe temporaire vous sera communiqué, à changer à la connexion.'],
          ['Un agent affecté ne s\'est jamais présenté.', 'Il reste dans les « agents attendus ». Au-delà du délai, la DRH ou l\'académie génère la cessation pour non-prise de service.'],
        ].map(([q, r]) => (
          <div key={q} className="rounded-lg border border-[#e6e4dc] bg-white p-3">
            <dt className="font-semibold text-slate-900">{q}</dt>
            <dd className="mt-1 text-slate-600">{r}</dd>
          </div>
        ))}
      </dl>
    ),
  },
]

export default function Aide() {
  const { utilisateur } = useSession()
  const code = utilisateur?.profil?.code ?? ''
  const pourMoi = useMemo(() => CHAPITRES.filter((c) => c.profils.includes(code) && !c.profils.includes('*')).map((c) => c.cle), [code])
  const [ouverts, setOuverts] = useState<string[]>(['demarrer', ...pourMoi])
  const basculer = (cle: string) => setOuverts((o) => (o.includes(cle) ? o.filter((x) => x !== cle) : [...o, cle]))

  const ordonnes = [...CHAPITRES].sort((a, b) => Number(pourMoi.includes(b.cle)) - Number(pourMoi.includes(a.cle)) || 0)

  return (
    <div>
      <EnTetePage
        titre="Guide utilisateur"
        icone="aide"
        sousTitre={<>Mode d'emploi de GRHMEN. Les chapitres de votre profil (<strong>{utilisateur?.profil?.libelle}</strong>) sont présentés en premier.</>}
        actions={
          <>
            <button className="btn btn-secondaire no-print" onClick={() => setOuverts(CHAPITRES.map((c) => c.cle))}>Tout déplier</button>
            <button className="btn btn-primaire no-print" onClick={() => { setOuverts(CHAPITRES.map((c) => c.cle)); window.setTimeout(() => window.print(), 150) }}>
              <Icone nom="imprimer" className="h-4 w-4" /> Imprimer le guide
            </button>
          </>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(utilisateur?.options_acces ?? []).slice(0, 8).map((o) => (
          <Link key={o.code} to={o.route} className="carte flex items-center gap-3 p-3 hover:border-marque-700/40">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-marque-800 text-white"><Icone nom={o.icone} className="h-4 w-4" /></span>
            <span className="text-[13.5px] font-semibold text-slate-800">{o.libelle}</span>
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        {ordonnes.map((c) => {
          const ouvert = ouverts.includes(c.cle)
          return (
            <Carte key={c.cle} corpsClassName="p-0">
              <button type="button" onClick={() => basculer(c.cle)} className="flex w-full items-center gap-3 px-5 py-4 text-left">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-menthe-100 text-marque-800"><Icone nom={c.icone} className="h-[18px] w-[18px]" /></span>
                <span className="titre-serif flex-1 text-[17px] font-bold text-slate-900">{c.titre}</span>
                {pourMoi.includes(c.cle) && <Pastille ton="jaune">Votre profil</Pastille>}
                <Icone nom="chevron" className={`no-print h-4 w-4 text-slate-400 transition ${ouvert ? 'rotate-90' : ''}`} />
              </button>
              {ouvert && <div className="border-t border-[#efede6] px-5 py-5">{c.contenu}</div>}
            </Carte>
          )
        })}
      </div>
    </div>
  )
}
