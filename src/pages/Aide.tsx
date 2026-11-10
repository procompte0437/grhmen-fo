import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useSession } from '../context/AuthContext'
import { Alerte, Carte, Pastille } from '../components/ui/Elements'
import Icone from '../components/ui/Icone'
import { MINISTERE } from '../lib/ministere'
import { chargerEmbleme, telechargerPdf, type Bloc } from '../lib/pdf'

interface Section {
  titre?: string
  etapes?: string[]
  alerte?: { titre: string; texte: string }
  cartes?: { titre: string; texte: string; ton: string }[]
  faq?: { question: string; reponse: string }[]
}

interface Chapitre {
  cle: string
  titre: string
  icone: string
  /** Profils pour lesquels ce chapitre est mis en avant. */
  profils: string[]
  sections: Section[]
}

function Etapes({ items }: { items: string[] }) {
  return (
    <ol className="space-y-2.5">
      {items.map((t, i) => (
        <li key={i} className="flex gap-3 text-[13.5px] leading-relaxed text-slate-700">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-marque-800 text-[11px] font-bold text-white">{i + 1}</span>
          <span><Riche texte={t} /></span>
        </li>
      ))}
    </ol>
  )
}

const M = ({ children }: { children: ReactNode }) => <strong className="font-semibold text-marque-900">{children}</strong>

function Riche({ texte }: { texte: string }) {
  return (
    <>
      {texte.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? <M key={i}>{p.slice(2, -2)}</M> : <span key={i}>{p}</span>,
      )}
    </>
  )
}

const brut = (s: string) => s.replace(/\*\*/g, '')

const CHAPITRES: Chapitre[] = [
  {
    cle: 'demarrer',
    titre: 'Bien démarrer',
    icone: 'fusee',
    profils: ['*'],
    sections: [
      {
        etapes: [
          "Ouvrez GRHMEN et identifiez-vous avec votre **adresse e-mail** ou votre **matricule**, puis votre mot de passe.",
          "À la première connexion, l'application vous demande de **choisir un mot de passe personnel** (8 caractères minimum).",
          "Le **menu latéral** n'affiche que les écrans autorisés pour votre profil. Les nombres en jaune signalent les dossiers qui attendent votre action.",
          "Le **tableau de bord** résume la situation de votre périmètre et liste « À traiter » les tâches en attente : cliquez sur une tuile pour y aller directement.",
          "L'**établissement consulté** et l'**année scolaire**, en haut de l'écran, limitent les listes affichées.",
          "Votre nom, en haut à droite, donne accès à ce guide, au changement de mot de passe et à la déconnexion.",
        ],
      },
      {
        alerte: {
          titre: 'Périmètre des données',
          texte: "Chaque profil voit un périmètre précis : tout le ministère (administrateur, DRH, gestionnaire), une province (directeur d'académie), un établissement (proviseur, censeur, directeur d'école) ou uniquement ses propres données (enseignant, agent).",
        },
      },
    ],
  },
  {
    cle: 'enseignant',
    titre: 'Enseignant ou agent : mon espace',
    icone: 'dossier',
    profils: ['ENSEIGNANT', 'AGENT_ADMIN', 'CHEF_ETAB', 'CENSEUR'],
    sections: [
      {
        titre: 'Déclarer ma prise de service',
        etapes: [
          "Après une affectation, un bandeau vous invite à déclarer votre prise de service. Ouvrez **Ma prise de service**.",
          "Vérifiez l'établissement, la décision et la date d'effet, puis indiquez la **date à laquelle vous avez rejoint le poste**.",
          "Cliquez sur **Déclarer ma prise de service**. L'administrateur, la DRH, le gestionnaire RH, le chef d'établissement ou le censeur confirme la déclaration. Le **certificat de prise de service** devient alors imprimable.",
        ],
      },
      {
        titre: 'Déclarer mon début des cours (enseignants)',
        etapes: [
          "Une fois la prise de service confirmée, renseignez la **date du premier cours**, les **classes tenues** et le **volume horaire** hebdomadaire.",
          "Le censeur ou le chef d'établissement confirme votre début des cours.",
        ],
      },
      {
        titre: 'Pointer ma présence au poste',
        etapes: [
          "Chaque jour, ouvrez **Mon pointage** et cliquez sur **Pointer mon arrivée** à votre arrivée, puis **Pointer mon départ** en fin de journée.",
          "Une arrivée plus de **15 minutes** après l'ouverture de l'établissement est comptée en retard. Si vous l'autorisez, votre position est jointe au pointage.",
          "Le bilan du mois (taux de présence, retards, absences) et l'historique sont affichés sous l'horloge.",
        ],
      },
      {
        titre: 'Demander un congé',
        etapes: [
          "Dans **Mes congés**, cliquez sur **Nouvelle demande**, choisissez le type, les dates et le motif.",
          "Circuit : avis du chef d'établissement, puis décision de l'académie ou de la DRH. Vous pouvez retirer une demande tant qu'elle n'est pas traitée.",
          "Votre solde de congé annuel est affiché en haut de l'écran.",
        ],
      },
    ],
  },
  {
    cle: 'etablissement',
    titre: "Proviseur, censeur, directeur d'école : attester le service",
    icone: 'ecole',
    profils: ['CHEF_ETAB', 'CENSEUR'],
    sections: [
      {
        titre: 'Enregistrer ou confirmer les prises de service',
        etapes: [
          "**Prises de service › Agents attendus** liste les agents affectés dans votre établissement qui ne se sont pas encore présentés, avec le délai écoulé (en rouge au-delà de 30 jours).",
          "Cliquez sur **Enregistrer la prise de service**, indiquez la date (au plus tôt la date d'effet) et cochez **Confirmer immédiatement** pour attester la présence en une fois.",
          "**À confirmer** reçoit les déclarations déjà faites par l'agent. Vérifiez sa présence, puis **Confirmer** ou **Rejeter** avec un motif.",
          "Un chef d'établissement ou un censeur n'enregistre que les agents de son propre établissement.",
        ],
      },
      {
        titre: 'Suivre le début des cours',
        etapes: [
          "**Débuts des cours › À confirmer** : confirmez les déclarations des enseignants.",
          "L'onglet **Enseignants sans début des cours** repère ceux qui n'ont pas encore commencé ; vous pouvez constater le début des cours vous-même.",
        ],
      },
      {
        titre: 'Tenir la feuille de présence',
        etapes: [
          "Ouvrez **Présences au poste › Feuille d'appel** : tout le personnel en service apparaît, avec les pointages déjà faits.",
          "Pour chaque agent, choisissez **P** présent, **R** retard, **A** absent, **J** absence justifiée ou **M** mission. Le bouton « Marquer les non renseignés présents » accélère la saisie.",
          "Cliquez sur **Enregistrer et attester la feuille** : les présences sont validées sous votre nom.",
          "L'onglet **Pointages à valider** permet de valider ou rejeter en masse les pointages des agents.",
        ],
      },
      {
        titre: 'Signaler une cessation et donner un avis de congé',
        etapes: [
          "Depuis **Cessations de service** ou la fiche de l'agent, cliquez sur **Signaler une cessation** (abandon de poste, décès…). L'autorité compétente la valide.",
          "Dans **Congés et absences**, émettez un avis **favorable** ou **défavorable** sur chaque demande.",
        ],
      },
    ],
  },
  {
    cle: 'drh',
    titre: 'DRH, gestionnaire, académie : gérer le personnel',
    icone: 'personnes',
    profils: ['DRH', 'GESTIONNAIRE_RH', 'DAP', 'ADMIN'],
    sections: [
      {
        titre: 'Dossiers du personnel',
        etapes: [
          "**Personnel** : recherchez par nom ou matricule, filtrez (catégorie, statut, établissement, province, discipline, sexe) et exportez la liste en CSV (Excel).",
          "**Nouvel agent** : renseignez l'état civil et la situation administrative (corps, grade, échelon, fonction, discipline).",
          "La **fiche agent** réunit identité, affectations, prises de service, débuts des cours, présences, congés et cessations. Elle permet de modifier, affecter, créer le compte de connexion et signaler une cessation.",
        ],
      },
      {
        titre: 'Affecter un agent',
        etapes: [
          "Cliquez sur **Nouvelle affectation** (ou **Affecter** depuis la fiche), choisissez l'établissement, la nature (mutation, nomination…), la décision et la date d'effet.",
          "L'agent passe « en attente de prise de service » et apparaît dans les agents attendus de l'établissement. Le filtre « sans prise de service > 30 jours » repère les retards.",
          "Une affectation en attente peut être modifiée ou annulée : l'agent retrouve alors son poste précédent.",
        ],
      },
      {
        titre: 'Enregistrer une prise de service',
        etapes: [
          "L'administrateur, la DRH et le gestionnaire RH enregistrent la prise de service depuis **Prises de service › Agents attendus**, pour l'établissement choisi dans la barre du haut.",
          "Cliquez sur **Enregistrer la prise de service**, indiquez la date de prise de service (au plus tôt la date d'effet de l'affectation) et cochez **Confirmer immédiatement** si l'agent a rejoint son poste.",
          "L'onglet **À confirmer** ne liste que les déclarations déjà faites, en particulier celles de l'agent lui-même. Confirmez-les ou rejetez-les avec un motif.",
          "Le chef d'établissement dispose du même bouton, limité aux agents de son établissement. Le certificat est imprimable une fois la prise confirmée.",
        ],
      },
      {
        titre: 'Cessations de service',
        etapes: [
          "**Générer pour non-prise de service** : une cessation est signalée pour chaque agent qui ne s'est pas présenté au-delà du délai choisi (30 jours par défaut).",
          "**Valider** une cessation clôt l'affectation et met à jour la situation de l'agent (suspendu, retraité, décédé…). Le **certificat de cessation de service** est imprimable.",
        ],
      },
      {
        titre: 'Congés, rapports et établissements',
        etapes: [
          "**Congés et absences** : approuvez ou rejetez les demandes ; les jours approuvés sont automatiquement portés en absence justifiée.",
          "**Rapports et statistiques** : effectifs par province, pyramide des âges, départs à la retraite à 62 ans, taux de présence, non-prises de service, taux d'encadrement. Export CSV, export PDF et impression.",
          "**Établissements** : fiche de chaque structure avec son personnel et ses indicateurs du jour.",
        ],
      },
    ],
  },
  {
    cle: 'habilitations',
    titre: 'Administrateur : profils et habilitations',
    icone: 'bouclier',
    profils: ['ADMIN'],
    sections: [
      {
        cartes: [
          { titre: "Option d'accès", texte: 'Un élément du menu latéral : Personnel, Présences au poste…', ton: 'vert' },
          { titre: 'Option de gestion', texte: 'Une action dans un écran : créer un agent, enregistrer une prise de service…', ton: 'jaune' },
          { titre: 'Profil', texte: "Un ensemble d'options et un périmètre, attribué à chaque utilisateur.", ton: 'bleu' },
        ],
      },
      {
        etapes: [
          "Ouvrez **Profils et habilitations** et choisissez un profil dans la liste de gauche.",
          "Cochez les **options d'accès** (menu) et les **options de gestion** (actions). Cocher une action coche automatiquement l'écran correspondant.",
          "Cliquez sur **Enregistrer les habilitations** : le changement s'applique immédiatement, le menu des utilisateurs concernés est mis à jour.",
          "**Nouveau profil** : définissez son code, son libellé et son **périmètre** (national, provincial, établissement, personnel).",
          "**Utilisateurs** : créez un compte, rattachez-le à un dossier agent, attribuez un profil, désactivez ou réinitialisez le mot de passe (un mot de passe temporaire est affiché).",
          "**Référentiels** : provinces, corps, grades, disciplines, fonctions, années scolaires. **Journal d'audit** : toutes les opérations, avec l'auteur, la date et l'adresse IP.",
        ],
      },
    ],
  },
  {
    cle: 'faq',
    titre: 'Questions fréquentes',
    icone: 'aide',
    profils: ['*'],
    sections: [
      {
        faq: [
          { question: "Je ne vois pas un écran dans le menu.", reponse: "Votre profil n'a pas l'option d'accès correspondante. Demandez l'habilitation à l'administrateur." },
          { question: 'Je ne peux pas pointer.', reponse: "Le pointage n'est possible qu'après la confirmation de votre prise de service dans votre établissement." },
          { question: 'Mon pointage est « à valider ».', reponse: "Le censeur ou le chef de service valide les pointages ; il apparaîtra « validé » dans votre historique." },
          { question: "J'ai oublié mon mot de passe.", reponse: "L'administrateur peut le réinitialiser : un mot de passe temporaire vous sera communiqué, à changer à la connexion." },
          { question: "Un agent affecté ne s'est jamais présenté.", reponse: "Il apparaît dans Prises de service › Agents attendus. L'administrateur, la DRH, le gestionnaire RH ou le chef de son établissement peut enregistrer sa prise de service. Au-delà du délai, une cessation pour non-prise de service peut être générée." },
        ],
      },
    ],
  },
]

function rendu(section: Section) {
  return (
    <div className="space-y-3">
      {section.titre && <h3 className="font-semibold text-slate-900">{section.titre}</h3>}
      {section.etapes && <Etapes items={section.etapes} />}
      {section.alerte && <Alerte ton="bleu" titre={section.alerte.titre}>{section.alerte.texte}</Alerte>}
      {section.cartes && (
        <div className="grid gap-3 sm:grid-cols-3">
          {section.cartes.map((c) => (
            <div key={c.titre} className="rounded-lg border border-[#e6e4dc] bg-creme-50 p-3">
              <Pastille ton={c.ton}>{c.titre}</Pastille>
              <p className="mt-2 text-[13px] text-slate-600">{c.texte}</p>
            </div>
          ))}
        </div>
      )}
      {section.faq && (
        <dl className="space-y-4 text-[13.5px]">
          {section.faq.map((item) => (
            <div key={item.question} className="rounded-lg border border-[#e6e4dc] bg-white p-3">
              <dt className="font-semibold text-slate-900">{item.question}</dt>
              <dd className="mt-1 text-slate-600">{item.reponse}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

function blocsPdf(chapitres: Chapitre[], profil: string): Bloc[] {
  const blocs: Bloc[] = [
    { type: 'texte', texte: `${MINISTERE.nom}. Profil consulté : ${profil}.` },
  ]
  for (const chapitre of chapitres) {
    blocs.push({ type: 'titre', texte: chapitre.titre })
    for (const section of chapitre.sections) {
      if (section.titre) blocs.push({ type: 'sousTitre', texte: section.titre })
      section.etapes?.forEach((etape, i) => blocs.push({ type: 'texte', texte: `${i + 1}. ${brut(etape)}` }))
      if (section.alerte) blocs.push({ type: 'texte', texte: `${section.alerte.titre} — ${section.alerte.texte}` })
      section.cartes?.forEach((c) => blocs.push({ type: 'texte', texte: `${c.titre} : ${c.texte}` }))
      section.faq?.forEach((item) => {
        blocs.push({ type: 'sousTitre', texte: item.question })
        blocs.push({ type: 'texte', texte: item.reponse })
      })
    }
  }
  return blocs
}

export default function Aide() {
  const { utilisateur } = useSession()
  const code = utilisateur?.profil?.code ?? ''
  const pourMoi = useMemo(() => CHAPITRES.filter((c) => c.profils.includes(code) && !c.profils.includes('*')).map((c) => c.cle), [code])
  const [ouverts, setOuverts] = useState<string[]>(['demarrer', ...pourMoi])
  const [pdf, setPdf] = useState(false)
  const [erreurPdf, setErreurPdf] = useState<string | null>(null)
  const basculer = (cle: string) => setOuverts((o) => (o.includes(cle) ? o.filter((x) => x !== cle) : [...o, cle]))

  const ordonnes = [...CHAPITRES].sort((a, b) => Number(pourMoi.includes(b.cle)) - Number(pourMoi.includes(a.cle)) || 0)

  const telecharger = async () => {
    setPdf(true)
    setErreurPdf(null)
    try {
      const logo = await chargerEmbleme()
      telechargerPdf('guide-utilisateur-grhmen.pdf', 'Guide utilisateur', blocsPdf(ordonnes, utilisateur?.profil?.libelle ?? ''), logo)
    } catch {
      setErreurPdf("Le PDF n'a pas pu être préparé. Réessayez dans un instant.")
    } finally {
      setPdf(false)
    }
  }

  return (
    <div className="guide-corps">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#e6e4dc] bg-white px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-4">
          <img src="/logo/embleme-men.png" alt="Emblème du Ministère de l'Éducation nationale" className="h-16 w-auto shrink-0 rounded-[3px] ring-1 ring-slate-200" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-marque-800">République Gabonaise · {MINISTERE.sigle}</p>
            <h1 className="text-[26px] font-bold leading-tight text-slate-900">Guide utilisateur</h1>
            <p className="mt-1 max-w-3xl text-[13px] text-slate-600">
              Mode d'emploi de GRHMEN. Les chapitres de votre profil (<strong>{utilisateur?.profil?.libelle}</strong>) sont présentés en premier.
            </p>
          </div>
        </div>
        <div className="no-print flex flex-wrap items-center gap-2">
          <button className="btn btn-secondaire" onClick={() => setOuverts(CHAPITRES.map((c) => c.cle))}>Tout déplier</button>
          <button className="btn btn-primaire" onClick={() => void telecharger()} disabled={pdf}>
            <Icone nom="telecharger" className="h-4 w-4" /> {pdf ? 'Préparation…' : 'Télécharger le PDF'}
          </button>
          <button className="btn btn-secondaire" onClick={() => { setOuverts(CHAPITRES.map((c) => c.cle)); window.setTimeout(() => window.print(), 150) }}>
            <Icone nom="imprimer" className="h-4 w-4" /> Imprimer
          </button>
        </div>
      </div>

      {erreurPdf && <div className="mb-4"><Alerte ton="rouge">{erreurPdf}</Alerte></div>}

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
              {ouvert && (
                <div className="space-y-5 border-t border-[#efede6] px-5 py-5">
                  {c.sections.map((section, i) => <div key={section.titre ?? i}>{rendu(section)}</div>)}
                </div>
              )}
            </Carte>
          )
        })}
      </div>
    </div>
  )
}
