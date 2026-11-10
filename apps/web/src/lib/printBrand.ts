import type { Lang } from './payload'

/** Official mark with black background removed (transparent PNG) */
export const QLU_LOGO_SRC = '/qlu-logo.png'

export function qluOrgName(lang: Lang): string {
  return lang === 'te' ? 'క్వాంటం లైఫ్ యూనివర్సిటీ' : 'Quantum Life University'
}

export function qluMagazineLabel(lang: Lang): string {
  return lang === 'te' ? 'నెలవారీ వార్తాపత్రిక' : 'Monthly Newsletter'
}

/** Front-cover mast right title */
export function qluCoverTitle(lang: Lang): string {
  return lang === 'te' ? 'ఆధ్యాత్మిక సమాచార సంచిక' : 'Spiritual Information Magazine'
}

const MONTH_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const MONTH_TE = [
  'జనవరి',
  'ఫిబ్రవరి',
  'మార్చి',
  'ఏప్రిల్',
  'మే',
  'జూన్',
  'జూలై',
  'ఆగస్టు',
  'సెప్టెంబర్',
  'అక్టోబర్',
  'నవంబర్',
  'డిసెంబర్',
]

/** Header stamp: full month name + year (e.g. అక్టోబర్ 2026 / October 2026) */
export function qluIssueStamp(month: string, lang: Lang, year?: string): string {
  const m = (month || '').trim()
  const match = /^(\d{4})-(\d{2})/.exec(m)
  if (match) {
    const y = match[1]
    const idx = Math.max(0, Math.min(11, Number(match[2]) - 1))
    const name = lang === 'te' ? MONTH_TE[idx] : MONTH_EN[idx]
    return `${name} ${y}`
  }
  const y = (year || m.slice(0, 4) || '').trim()
  return y ? `${m} · ${y}` : m
}
