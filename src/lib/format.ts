export function dateFr(v?: string | null): string {
  if (!v) return '—'
  const d = new Date(v.length === 10 ? v + 'T00:00:00' : v)
  if (Number.isNaN(d.getTime())) return v
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function dateLongue(v?: string | null): string {
  if (!v) return '—'
  const d = new Date(v.length === 10 ? v + 'T00:00:00' : v)
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export function dateHeure(v?: string | null): string {
  if (!v) return '—'
  const d = new Date(v)
  return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function heure(v?: string | null): string {
  return v ? v.slice(0, 5) : '—'
}

export function aujourdhui(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function decalerJours(jours: number, base = new Date()): string {
  const d = new Date(base)
  d.setDate(d.getDate() + jours)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function debutMois(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export function nombre(n?: number | null): string {
  return (n ?? 0).toLocaleString('fr-FR')
}

export function age(dateNaissance?: string | null): number | null {
  if (!dateNaissance) return null
  const n = new Date(dateNaissance)
  const a = new Date()
  let r = a.getFullYear() - n.getFullYear()
  if (a.getMonth() < n.getMonth() || (a.getMonth() === n.getMonth() && a.getDate() < n.getDate())) r--
  return r
}

export function nomAgent(a?: { nom?: string; prenom?: string; nom_complet?: string } | null): string {
  if (!a) return '—'
  return a.nom_complet ?? `${(a.nom ?? '').toUpperCase()} ${a.prenom ?? ''}`.trim()
}

export function initiales(nom?: string | null): string {
  if (!nom) return '?'
  return nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0]?.toUpperCase())
    .join('')
}

/** Export CSV (séparateur « ; », lisible directement par Excel en français). */
export function exporterCsv(nomFichier: string, entetes: string[], lignes: (string | number | null | undefined)[][]) {
  const echapper = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const contenu = [entetes, ...lignes].map((l) => l.map(echapper).join(';')).join('\r\n')
  const blob = new Blob(['﻿' + contenu], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomFichier
  a.click()
  URL.revokeObjectURL(url)
}
