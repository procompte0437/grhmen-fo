/** Petit générateur PDF (Helvetica, WinAnsi) pour télécharger un rapport sans bibliothèque externe. */

export type Bloc =
  | { type: 'titre'; texte: string }
  | { type: 'sousTitre'; texte: string }
  | { type: 'texte'; texte: string }
  | { type: 'tableau'; entetes: string[]; lignes: string[][]; largeurs: number[] }

export interface LogoPdf {
  jpeg: Uint8Array
  largeur: number
  hauteur: number
}

const PAGE_L = 595
const PAGE_H = 842
const MARGE = 40
const BAS = 46

const WIN: Record<string, number> = {
  '€': 0x80, 'Œ': 0x8c, 'œ': 0x9c, 'Ÿ': 0x9f,
  '¡': 0xa1, '¢': 0xa2, '£': 0xa3, '¥': 0xa5, '§': 0xa7, '©': 0xa9, '«': 0xab, '¬': 0xac, '®': 0xae, '°': 0xb0, '±': 0xb1, '»': 0xbb,
  'À': 0xc0, 'Á': 0xc1, 'Â': 0xc2, 'Ã': 0xc3, 'Ä': 0xc4, 'Å': 0xc5, 'Æ': 0xc6, 'Ç': 0xc7,
  'È': 0xc8, 'É': 0xc9, 'Ê': 0xca, 'Ë': 0xcb, 'Ì': 0xcc, 'Í': 0xcd, 'Î': 0xce, 'Ï': 0xcf,
  'Ñ': 0xd1, 'Ò': 0xd2, 'Ó': 0xd3, 'Ô': 0xd4, 'Õ': 0xd5, 'Ö': 0xd6, 'Ø': 0xd8,
  'Ù': 0xd9, 'Ú': 0xda, 'Û': 0xdb, 'Ü': 0xdc, 'Ý': 0xdd,
  'à': 0xe0, 'á': 0xe1, 'â': 0xe2, 'ã': 0xe3, 'ä': 0xe4, 'å': 0xe5, 'æ': 0xe6, 'ç': 0xe7,
  'è': 0xe8, 'é': 0xe9, 'ê': 0xea, 'ë': 0xeb, 'ì': 0xec, 'í': 0xed, 'î': 0xee, 'ï': 0xef,
  'ñ': 0xf1, 'ò': 0xf2, 'ó': 0xf3, 'ô': 0xf4, 'õ': 0xf5, 'ö': 0xf6, 'ø': 0xf8,
  'ù': 0xf9, 'ú': 0xfa, 'û': 0xfb, 'ü': 0xfc, 'ý': 0xfd, 'ÿ': 0xff,
}

function octets(s: string): number[] {
  const sortie: number[] = []
  for (const ch of s.normalize('NFC')) {
    const code = ch.codePointAt(0) ?? 63
    if (code < 128) sortie.push(code)
    else if (WIN[ch]) sortie.push(WIN[ch])
    else if (ch === '’' || ch === '‘' || ch === '´') sortie.push(0x27)
    else if (ch === '–' || ch === '—') sortie.push(0x2d)
    else if (ch === '…') sortie.push(0x2e, 0x2e, 0x2e)
    else if (ch === '\u00a0') sortie.push(0x20)
    else sortie.push(0x3f)
  }
  return sortie
}

function literal(s: string): number[] {
  const corps = octets(s).flatMap((b) => (b === 0x28 || b === 0x29 || b === 0x5c ? [0x5c, b] : [b]))
  return [0x28, ...corps, 0x29]
}

function ascii(s: string): number[] {
  return [...s].map((c) => c.charCodeAt(0))
}

function concat(...parts: number[][]): number[] {
  return parts.flat()
}

function largeur(s: string, taille: number, gras = false): number {
  return octets(s).length * taille * (gras ? 0.52 : 0.47)
}

function couper(s: string, taille: number, max: number, gras = false): string {
  if (largeur(s, taille, gras) <= max) return s
  let t = s
  while (t.length > 1 && largeur(t + '…', taille, gras) > max) t = t.slice(0, -1)
  return t + '…'
}

function decouperMots(s: string, taille: number, max: number, gras = false): string[] {
  const mots = s.split(/\s+/).filter(Boolean)
  const lignes: string[] = []
  let courante = ''
  for (const mot of mots) {
    const essai = courante ? `${courante} ${mot}` : mot
    if (largeur(essai, taille, gras) <= max) courante = essai
    else {
      if (courante) lignes.push(courante)
      courante = largeur(mot, taille, gras) <= max ? mot : couper(mot, taille, max, gras)
    }
  }
  if (courante) lignes.push(courante)
  return lignes.length ? lignes : ['']
}

/** Charge l'emblème et le convertit en JPEG pour l'intégrer au PDF. */
export function chargerEmbleme(src = '/logo/embleme-men.png'): Promise<LogoPdf> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas indisponible'))
        return
      }
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(async (blob) => {
        if (!blob) {
          reject(new Error('Emblème illisible'))
          return
        }
        resolve({ jpeg: new Uint8Array(await blob.arrayBuffer()), largeur: canvas.width, hauteur: canvas.height })
      }, 'image/jpeg', 0.92)
    }
    img.onerror = () => reject(new Error('Emblème introuvable'))
    img.src = src
  })
}

class Flux {
  private ops: number[] = []
  y = PAGE_H - MARGE

  commande(s: string) {
    this.ops.push(...ascii(s + '\n'))
  }

  texte(s: string, x: number, y: number, taille: number, gras = false, couleur: [number, number, number] = [0.11, 0.16, 0.14]) {
    const police = gras ? 'F2' : 'F1'
    this.commande(`${couleur[0]} ${couleur[1]} ${couleur[2]} rg`)
    this.commande(`BT /${police} ${taille} Tf 1 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)} Tm`)
    this.ops.push(...literal(s), ...ascii(' Tj\n'), ...ascii('ET\n'))
  }

  rect(x: number, y: number, w: number, h: number, fond: [number, number, number]) {
    this.commande(`${fond[0]} ${fond[1]} ${fond[2]} rg`)
    this.commande(`${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re f`)
  }

  ligne(x1: number, y: number, x2: number) {
    this.commande('0.86 0.85 0.82 RG 0.4 w')
    this.commande(`${x1.toFixed(1)} ${y.toFixed(1)} m ${x2.toFixed(1)} ${y.toFixed(1)} l S`)
  }

  bytes(): number[] {
    return this.ops
  }
}

function entetePage(f: Flux, titre: string, page: number, total: number, logo?: LogoPdf) {
  const barre = logo ? 36 : 28
  f.rect(0, PAGE_H - barre, PAGE_L, barre, [0.08, 0.34, 0.23])
  let xTexte = MARGE
  if (logo) {
    let h = 26
    let w = h * (logo.largeur / logo.hauteur)
    if (w > 78) {
      w = 78
      h = w * (logo.hauteur / logo.largeur)
    }
    const x = 8
    const y = PAGE_H - barre + (barre - h) / 2
    f.rect(x - 1, y - 1, w + 2, h + 2, [1, 1, 1])
    f.commande(`q\n${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/Im1 Do\nQ`)
    xTexte = x + w + 10
  }
  f.texte("GRHMEN  ·  Ministère de l'Éducation nationale", xTexte, PAGE_H - (logo ? 22 : 18), 9, true, [1, 1, 1])
  f.texte(titre, MARGE, PAGE_H - (logo ? 56 : 48), 13, true, [0.08, 0.24, 0.16])
  f.texte(`Page ${page} / ${total}`, PAGE_L - MARGE - 52, 22, 8, false, [0.4, 0.42, 0.4])
}

function filigrane(logo: LogoPdf): number[] {
  const w = 250
  const h = w * (logo.hauteur / logo.largeur)
  const x = (PAGE_L - w) / 2
  const y = (PAGE_H - h) / 2
  return ascii(`q\n/GS1 gs\n${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/Im1 Do\nQ\n`)
}

export function telechargerPdf(nomFichier: string, titre: string, blocs: Bloc[], logo?: LogoPdf) {
  const utiles = PAGE_L - MARGE * 2
  const origine = logo ? PAGE_H - 80 : PAGE_H - 74
  const pages: Flux[] = []
  let f = new Flux()
  pages.push(f)
  f.y = origine

  const nouvelle = () => {
    f = new Flux()
    pages.push(f)
    f.y = origine + 4
  }

  const assurer = (h: number) => {
    if (f.y - h < BAS) nouvelle()
  }

  for (const bloc of blocs) {
    if (bloc.type === 'titre') {
      assurer(28)
      f.y -= 8
      f.texte(bloc.texte, MARGE, f.y, 12, true, [0.08, 0.34, 0.23])
      f.y -= 6
      f.ligne(MARGE, f.y, PAGE_L - MARGE)
      f.y -= 14
    } else if (bloc.type === 'sousTitre') {
      assurer(18)
      f.texte(bloc.texte, MARGE, f.y, 10, true, [0.1, 0.16, 0.13])
      f.y -= 15
    } else if (bloc.type === 'texte') {
      for (const ligne of decouperMots(bloc.texte, 9, utiles)) {
        assurer(14)
        f.texte(ligne, MARGE, f.y, 9, false, [0.25, 0.28, 0.26])
        f.y -= 13
      }
      f.y -= 3
    } else {
      const cols = bloc.largeurs
      const somme = cols.reduce((a, b) => a + b, 0)
      const largeurs = cols.map((c) => (c / somme) * utiles)
      const dessinerEntete = () => {
        assurer(18)
        f.rect(MARGE, f.y - 4, utiles, 16, [0.93, 0.95, 0.94])
        let x = MARGE + 4
        bloc.entetes.forEach((h, i) => {
          f.texte(couper(h, 8, largeurs[i] - 8, true), x, f.y, 8, true, [0.2, 0.28, 0.24])
          x += largeurs[i]
        })
        f.y -= 18
      }
      dessinerEntete()
      if (!bloc.lignes.length) {
        assurer(16)
        f.texte('Aucune donnée.', MARGE + 4, f.y, 9)
        f.y -= 16
      }
      bloc.lignes.forEach((ligne, n) => {
        if (f.y - 16 < BAS) {
          nouvelle()
          dessinerEntete()
        }
        if (n % 2 === 1) f.rect(MARGE, f.y - 4, utiles, 16, [0.97, 0.97, 0.96])
        let x = MARGE + 4
        ligne.forEach((cell, i) => {
          f.texte(couper(String(cell ?? '—'), 8, largeurs[i] - 8), x, f.y, 8)
          x += largeurs[i]
        })
        f.y -= 16
      })
      f.y -= 8
    }
  }

  pages.forEach((p, i) => entetePage(p, titre, i + 1, pages.length, logo))

  const objets: number[][] = []
  const ajouter = (b: number[]) => {
    objets.push(b)
    return objets.length
  }

  ajouter(ascii('<< /Type /Catalog /Pages 2 0 R >>'))
  const kidsPlaceholder = objets.length
  ajouter(ascii(''))
  ajouter(ascii('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'))
  ajouter(ascii('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'))
  const idGs = logo ? ajouter(ascii('<< /Type /ExtGState /ca 0.1 /CA 0.1 >>')) : 0
  const idImage = logo
    ? ajouter(concat(
        ascii(`<< /Type /XObject /Subtype /Image /Width ${logo.largeur} /Height ${logo.hauteur} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logo.jpeg.length} >>\nstream\n`),
        Array.from(logo.jpeg),
        ascii('\nendstream'),
      ))
    : 0
  const ressources = logo
    ? `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> /XObject << /Im1 ${idImage} 0 R >> /ExtGState << /GS1 ${idGs} 0 R >> >>`
    : '/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >>'

  const pageIds: number[] = []
  pages.forEach((p) => {
    const contenu = logo ? [...filigrane(logo), ...p.bytes(), 10] : [...p.bytes(), 10]
    const idFlux = ajouter(concat(ascii(`<< /Length ${contenu.length} >>\nstream\n`), contenu, ascii('endstream')))
    const idPage = ajouter(ascii(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_L} ${PAGE_H}] /Contents ${idFlux} 0 R ${ressources} >>`))
    pageIds.push(idPage)
  })
  objets[kidsPlaceholder] = ascii(`<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] >>`)

  const morceaux: number[][] = [ascii('%PDF-1.4\n')]
  const offsets: number[] = [0]
  let curseur = morceaux[0].length
  objets.forEach((obj, i) => {
    offsets.push(curseur)
    const entete = ascii(`${i + 1} 0 obj\n`)
    const fin = ascii('\nendobj\n')
    morceaux.push(entete, obj, fin)
    curseur += entete.length + obj.length + fin.length
  })
  const xrefPos = curseur
  const lignes = [`xref\n0 ${objets.length + 1}\n`, '0000000000 65535 f \n']
  for (let i = 1; i < offsets.length; i++) lignes.push(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`)
  lignes.push(`trailer\n<< /Size ${objets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`)
  morceaux.push(ascii(lignes.join('')))

  const total = morceaux.reduce((n, p) => n + p.length, 0)
  const pdf = new Uint8Array(total)
  let pos = 0
  morceaux.forEach((p) => {
    pdf.set(p, pos)
    pos += p.length
  })

  const blob = new Blob([pdf], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomFichier
  a.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}
