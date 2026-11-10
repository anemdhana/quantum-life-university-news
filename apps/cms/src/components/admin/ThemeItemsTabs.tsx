'use client'

import { useAllFormFields, useForm, useFormFields } from '@payloadcms/ui'
import { reduceFieldsToValues } from 'payload/shared'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import type { EditLang } from '../../lib/sectionAdmin'

const STYLE_ID = 'qlu-theme-items-tabs-style'
const STORAGE_KEY = 'qlu-theme-items-tab'

type ThemeItemLike = {
  id?: string
  titleTe?: string | null
  titleEn?: string | null
  blurbTe?: string | null
  blurbEn?: string | null
}

function ensureStyles() {
  if (typeof document === 'undefined') return
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = STYLE_ID
    document.head.appendChild(style)
  }
  style.textContent = `
    .qlu-theme-items-tabs {
      margin: 0 0 0.65rem;
      padding: 0.7rem 0.75rem 0.75rem;
      border: 1px solid var(--theme-elevation-150);
      border-radius: 4px;
      background: var(--theme-elevation-50);
    }
    .qlu-theme-items-tabs__header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.55rem;
    }
    .qlu-theme-items-tabs__title {
      margin: 0;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .qlu-theme-items-tabs__hint {
      margin: 0;
      color: var(--theme-elevation-600);
      font-size: 0.72rem;
      line-height: 1.35;
    }
    .qlu-theme-items-tabs__row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.35rem;
    }
    .qlu-theme-items-tabs__tab {
      appearance: none;
      border: 1px solid var(--theme-elevation-150);
      background: var(--theme-bg);
      color: var(--theme-text);
      border-radius: 999px;
      padding: 0.28rem 0.7rem;
      font-size: 0.78rem;
      line-height: 1.3;
      cursor: pointer;
      max-width: 14rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .qlu-theme-items-tabs__tab:hover {
      border-color: var(--theme-elevation-250);
    }
    .qlu-theme-items-tabs__tab.is-active {
      border-color: var(--theme-elevation-400);
      background: var(--theme-elevation-100);
      font-weight: 600;
    }
    .qlu-theme-items-tabs__add,
    .qlu-theme-items-tabs__remove {
      appearance: none;
      border: 1px dashed var(--theme-elevation-250);
      background: transparent;
      color: var(--theme-elevation-800);
      border-radius: 999px;
      padding: 0.28rem 0.7rem;
      font-size: 0.78rem;
      cursor: pointer;
    }
    .qlu-theme-items-tabs__remove {
      border-style: solid;
      color: var(--theme-error-500, #b42318);
      margin-left: auto;
    }
    .qlu-theme-items-tabs__empty {
      margin: 0.15rem 0 0;
      color: var(--theme-elevation-600);
      font-size: 0.78rem;
    }

    /* Hide Payload array chrome; show only the active theme row */
    .array-field.qlu-theme-items-array > .array-field__header,
    .array-field.qlu-theme-items-array > .array-field__add-row {
      display: none !important;
    }
    .array-field.qlu-theme-items-array [id*="-themeItems-row-"]:not([data-qlu-theme-active="true"]) {
      display: none !important;
    }
    .array-field.qlu-theme-items-array [id*="-themeItems-row-"][data-qlu-theme-active="true"] {
      display: block !important;
      width: 100%;
    }
    .array-field.qlu-theme-items-array [id*="-themeItems-row-"][data-qlu-theme-active="true"] > .collapsible > .collapsible__toggle-wrap {
      display: none !important;
    }
    .array-field.qlu-theme-items-array [id*="-themeItems-row-"][data-qlu-theme-active="true"] > .collapsible {
      border: 1px solid var(--theme-elevation-150);
      border-radius: 4px;
      background: var(--theme-bg);
      width: 100%;
    }
    .array-field.qlu-theme-items-array [id*="-themeItems-row-"][data-qlu-theme-active="true"] .collapsible__content,
    .array-field.qlu-theme-items-array [id*="-themeItems-row-"][data-qlu-theme-active="true"] .rah-static,
    .array-field.qlu-theme-items-array [id*="-themeItems-row-"][data-qlu-theme-active="true"] .rah-animating {
      height: auto !important;
      min-height: 1px !important;
      overflow: visible !important;
      opacity: 1 !important;
      visibility: visible !important;
    }
    .array-field.qlu-theme-items-array [id*="-themeItems-row-"][data-qlu-theme-active="true"] .array-field__fields {
      display: block !important;
      padding: 1rem 1.1rem 1.15rem;
      width: 100%;
    }
  `
}

function themeLabel(item: ThemeItemLike | undefined, index: number, lang: EditLang): string {
  const title = (lang === 'te' ? item?.titleTe : item?.titleEn)?.trim()
  if (title) return title
  const blurb = (lang === 'te' ? item?.blurbTe : item?.blurbEn)?.trim()
  if (blurb) {
    const first = blurb.split(/\n+/)[0]?.replace(/[*_`#>\-\[\]()]/g, '').trim()
    if (first) return first.slice(0, 36) + (first.length > 36 ? '…' : '')
  }
  return `Theme ${index + 1}`
}

type Props = {
  path?: string
}

export function ThemeItemsTabs(props: Props) {
  const path = props.path || ''
  const sectionMatch = /^sections\.(\d+)\./.exec(path)
  const sectionIndex = sectionMatch ? Number(sectionMatch[1]) : -1
  const itemsPath = sectionIndex >= 0 ? `sections.${sectionIndex}.themeItems` : ''
  const rowIdPrefix = sectionIndex >= 0 ? `sections-${sectionIndex}-themeItems-row-` : ''

  const { addFieldRow, removeFieldRow, dispatchFields } = useForm()
  const editLang = useFormFields(([fields]): EditLang =>
    fields.editLang?.value === 'te' ? 'te' : 'en',
  )
  const [fields] = useAllFormFields()
  const [activeIndex, setActiveIndex] = useState(0)

  const items = useMemo(() => {
    if (sectionIndex < 0) return [] as ThemeItemLike[]
    const doc = reduceFieldsToValues(fields, true) as {
      sections?: Array<{ themeItems?: ThemeItemLike[] }>
    }
    return doc.sections?.[sectionIndex]?.themeItems || []
  }, [fields, sectionIndex])

  const rows = (sectionIndex >= 0 ? fields[itemsPath]?.rows : undefined) as
    | { id: string; collapsed?: boolean }[]
    | undefined

  useEffect(() => {
    if (sectionIndex < 0) return
    try {
      const raw = sessionStorage.getItem(`${STORAGE_KEY}:${sectionIndex}`)
      const n = raw ? Number(raw) : 0
      if (Number.isFinite(n) && n >= 0) setActiveIndex(n)
    } catch {
      /* ignore */
    }
  }, [sectionIndex])

  useEffect(() => {
    if (!items.length) {
      setActiveIndex(0)
      return
    }
    if (activeIndex > items.length - 1) setActiveIndex(items.length - 1)
  }, [activeIndex, items.length])

  const selectTab = useCallback(
    (index: number) => {
      setActiveIndex(index)
      if (sectionIndex < 0) return
      try {
        sessionStorage.setItem(`${STORAGE_KEY}:${sectionIndex}`, String(index))
      } catch {
        /* ignore */
      }
    },
    [sectionIndex],
  )

  const addItem = useCallback(() => {
    if (!itemsPath) return
    const next = items.length
    addFieldRow({
      path: itemsPath,
      schemaPath: 'sections.themeItems',
    })
    selectTab(next)
  }, [addFieldRow, items.length, itemsPath, selectTab])

  const removeItem = useCallback(() => {
    if (!itemsPath || !items.length) return
    removeFieldRow({ path: itemsPath, rowIndex: activeIndex })
    selectTab(Math.max(0, activeIndex - 1))
  }, [activeIndex, items.length, itemsPath, removeFieldRow, selectTab])

  useEffect(() => {
    ensureStyles()
  }, [])

  useEffect(() => {
    if (!rows?.length || !itemsPath) return
    const activeId = rows[activeIndex]?.id
    if (!activeId) return
    const needsUpdate = rows.some((row) => {
      const shouldBeCollapsed = row.id !== activeId
      return Boolean(row.collapsed) !== shouldBeCollapsed
    })
    if (!needsUpdate) return
    dispatchFields({
      type: 'SET_ROW_COLLAPSED',
      path: itemsPath,
      updatedRows: rows.map((row) => ({
        ...row,
        collapsed: row.id !== activeId,
      })),
    })
  }, [activeIndex, dispatchFields, itemsPath, rows])

  useEffect(() => {
    if (!rowIdPrefix) return
    const apply = () => {
      for (let i = 0; i < Math.max(items.length, rows?.length || 0, 12); i++) {
        const row = document.getElementById(`${rowIdPrefix}${i}`)
        if (!row) continue
        if (i === activeIndex) row.dataset.qluThemeActive = 'true'
        else delete row.dataset.qluThemeActive
      }
    }
    apply()
    const timers = [50, 250, 600].map((ms) => window.setTimeout(apply, ms))
    return () => {
      timers.forEach((t) => window.clearTimeout(t))
      document.querySelectorAll<HTMLElement>(`[id^="${rowIdPrefix}"]`).forEach((row) => {
        delete row.dataset.qluThemeActive
      })
    }
  }, [activeIndex, items.length, rowIdPrefix, rows?.length])

  if (sectionIndex < 0) return null

  return (
    <div className="qlu-theme-items-tabs">
      <div className="qlu-theme-items-tabs__header">
        <p className="qlu-theme-items-tabs__title">Theme items</p>
        <p className="qlu-theme-items-tabs__hint">Tabs side by side — jump without scrolling</p>
      </div>

      {items.length ? (
        <div className="qlu-theme-items-tabs__row" role="tablist" aria-label="Theme items">
          {items.map((item, index) => (
            <button
              key={rows?.[index]?.id || `theme-${index}`}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              className={`qlu-theme-items-tabs__tab${index === activeIndex ? ' is-active' : ''}`}
              onClick={() => selectTab(index)}
              title={themeLabel(item, index, editLang)}
            >
              {index + 1}. {themeLabel(item, index, editLang)}
            </button>
          ))}
          <button type="button" className="qlu-theme-items-tabs__add" onClick={addItem}>
            + Add
          </button>
          <button type="button" className="qlu-theme-items-tabs__remove" onClick={removeItem}>
            Remove
          </button>
        </div>
      ) : (
        <>
          <p className="qlu-theme-items-tabs__empty">No theme items yet.</p>
          <div className="qlu-theme-items-tabs__row">
            <button type="button" className="qlu-theme-items-tabs__add" onClick={addItem}>
              + Add theme
            </button>
          </div>
        </>
      )}
    </div>
  )
}
