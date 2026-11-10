const chemins: Record<string, string> = {
  tableau: 'M3 13h8V3H3zm0 8h8v-6H3zm10 0h8V11h-8zm0-18v6h8V3z',
  dossier: 'M4 4h5l2 2h9a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  drapeau: 'M5 21V4m0 0h11l-2 4 2 4H5',
  horloge: 'M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  soleil: 'M12 3v2m0 14v2m9-9h-2M5 12H3m15.4-6.4-1.4 1.4M7 17l-1.4 1.4m12.8 0L17 17M7 7 5.6 5.6M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
  personnes: 'M17 20v-2a4 4 0 0 0-3-3.9M9 14a4 4 0 0 0-4 4v2m14-12a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM12 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm9 12v-2a4 4 0 0 0-2-3.4',
  fleches: 'M7 16V4m0 0L3 8m4-4 4 4m6 0v12m0 0 4-4m-4 4-4-4',
  livre: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zm0 0v16m4-13h7',
  coche: 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  stop: 'M18.4 5.6 5.6 18.4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  ecole: 'M3 10 12 4l9 6M5 9v10h14V9M9 19v-5h6v5',
  graphique: 'M4 20V10m6 10V4m6 16v-7m4 7H2',
  liste: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  utilisateur: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM4 21a8 8 0 0 1 16 0',
  bouclier: 'M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6zm-3 9 2 2 4-4',
  historique: 'M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5m4-1v5l3 2',
  plus: 'M12 5v14M5 12h14',
  crayon: 'M15.2 5.2l3.6 3.6M4 20l4.5-1 10.3-10.3a2.5 2.5 0 0 0-3.5-3.5L5 15.5z',
  poubelle: 'M4 7h16M10 11v6m4-6v6M5 7l1 13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-13M9 7V4h6v3',
  oeil: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  recherche: 'M21 21l-4.3-4.3M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z',
  deconnexion: 'M15 17l5-5-5-5m5 5H9m3 9H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7',
  menu: 'M4 6h16M4 12h16M4 18h16',
  fermer: 'M6 6l12 12M18 6 6 18',
  telecharger: 'M12 4v12m0 0-4-4m4 4 4-4M4 20h16',
  imprimer: 'M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7z',
  cle: 'M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm-3 3v11m0-4h3m-3 3h2',
  valider: 'M5 13l4 4L19 7',
  refuser: 'M6 6l12 12M18 6 6 18',
  alerte: 'M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  chevron: 'M9 6l6 6-6 6',
  localisation: 'M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  calendrier: 'M8 3v4m8-4v4M3 10h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z',
  eclair: 'M13 3 4 14h7l-1 7 9-11h-7z',
  aide: 'M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3m.1 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  fusee: 'M12 15l-3-3m3 3 4.5-1.5C20 11 21 6 21 3c-3 0-8 1-10.5 4.5L9 12m3 3v5l3-2v-4.5M9 12H4l2-3h4.5M5 19c1-2 3-3 3-3',
}

export default function Icone({ nom, className = 'h-5 w-5' }: { nom: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={chemins[nom] ?? chemins.liste} />
    </svg>
  )
}
