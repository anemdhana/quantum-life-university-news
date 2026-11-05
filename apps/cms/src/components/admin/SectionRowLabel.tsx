'use client'

import { useAllFormFields, useFormFields, useRowLabel } from '@payloadcms/ui'
import { reduceFieldsToValues } from 'payload/shared'
import { useMemo } from 'react'

import {
  countSectionContent,
  formatSectionAdminLabel,
  type EditLang,
  type SectionRowLike,
} from '../../lib/sectionAdmin'

export function SectionRowLabel() {
  const { data, path } = useRowLabel<SectionRowLike>()
  const editLang = useFormFields(([fields]): EditLang =>
    fields.editLang?.value === 'te' ? 'te' : 'en',
  )
  const [fields] = useAllFormFields()

  const label = useMemo(() => {
    const doc = reduceFieldsToValues(fields, true) as { sections?: SectionRowLike[] }
    const match = typeof path === 'string' ? /\.(\d+)$/.exec(path) : null
    const index = match ? Number(match[1]) : -1
    const fromForm =
      index >= 0 && Array.isArray(doc.sections) ? doc.sections[index] : undefined
    const row = {
      ...data,
      ...fromForm,
      key: fromForm?.key ?? data?.key,
    }
    const count = countSectionContent(row, editLang)
    return formatSectionAdminLabel(row.key, editLang, count)
  }, [fields, data, editLang, path])

  return <span>{label}</span>
}
