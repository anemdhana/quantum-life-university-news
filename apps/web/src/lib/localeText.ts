import type { Lang } from './payload'
import { isLexicalEmpty, lexicalToHtml } from './richText'

/** Prefer active language; if empty, fall back to the other (common while only one lang is filled). */
export function pickLocalized(
  lang: Lang,
  te: string | null | undefined,
  en: string | null | undefined,
): string {
  const primary = (lang === 'te' ? te : en)?.trim() || ''
  if (primary) return primary
  return (lang === 'te' ? en : te)?.trim() || ''
}

export function pickLocalizedLexical(lang: Lang, te: unknown, en: unknown): unknown {
  const primary = lang === 'te' ? te : en
  const fallback = lang === 'te' ? en : te
  if (!isLexicalEmpty(primary)) return primary
  if (!isLexicalEmpty(fallback)) return fallback
  return primary ?? fallback ?? null
}

export function localizedBodyHtml(lang: Lang, te: unknown, en: unknown): string {
  return lexicalToHtml(pickLocalizedLexical(lang, te, en))
}
