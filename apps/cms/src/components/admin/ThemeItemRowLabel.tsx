'use client'

import { useAllFormFields, useFormFields, useRowLabel } from '@payloadcms/ui'
import { reduceFieldsToValues } from 'payload/shared'
import { useMemo } from 'react'

import type { EditLang } from '../../lib/sectionAdmin'

type ThemeItemLike = {
  titleTe?: string | null
  titleEn?: string | null
}

export function ThemeItemRowLabel() {
  const { data, path } = useRowLabel<ThemeItemLike>()
  const editLang = useFormFields(([fields]): EditLang =>
    fields.editLang?.value === 'te' ? 'te' : 'en',
  )
  const [fields] = useAllFormFields()

  const label = useMemo(() => {
    const match = typeof path === 'string' ? /sections\.(\d+)\.themeItems\.(\d+)$/.exec(path) : null
    const sectionIndex = match ? Number(match[1]) : -1
    const itemIndex = match ? Number(match[2]) : -1
    const doc = reduceFieldsToValues(fields, true) as {
      sections?: Array<{ themeItems?: ThemeItemLike[] }>
    }
    const fromForm =
      sectionIndex >= 0 && itemIndex >= 0
        ? doc.sections?.[sectionIndex]?.themeItems?.[itemIndex]
        : undefined
    const title = (editLang === 'te' ? fromForm?.titleTe || data?.titleTe : fromForm?.titleEn || data?.titleEn)?.trim()
    const n = itemIndex >= 0 ? itemIndex + 1 : ''
    return title ? `${n}. ${title}` : `Theme ${n || ''}`.trim()
  }, [data, editLang, fields, path])

  return <span>{label}</span>
}
