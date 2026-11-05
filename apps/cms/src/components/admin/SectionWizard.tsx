'use client'

import { useAllFormFields, useForm, useFormFields } from '@payloadcms/ui'
import { reduceFieldsToValues } from 'payload/shared'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { PDF_SECTION_TITLES } from '../../lib/magazineSections'
import {
  countCoverContent,
  countSectionEntries,
  entryLabel,
  formatCoverAdminLabel,
  formatSectionAdminLabel,
  WIZARD_COVER_KEY,
  WIZARD_NAV_KEYS,
  WIZARD_SECTION_KEYS,
  type CoverFieldsLike,
  type EditLang,
  type SectionRowLike,
  type WizardPaneKey,
} from '../../lib/sectionAdmin'

const STYLE_ID = 'qlu-section-wizard-style'
const STORAGE_KEY = 'qlu-issue-wizard-pane'

function ensureWizardStyles() {
  if (typeof document === 'undefined') return
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = STYLE_ID
    document.head.appendChild(style)
  }
  style.textContent = `
    body.qlu-section-wizard-on .document-fields--has-sidebar {
      --main-width: 100% !important;
      --main-border: none !important;
      --main-field-margin: 0 !important;
    }
    body.qlu-section-wizard-on .document-fields__sidebar-wrap {
      display: none !important;
    }
    body.qlu-section-wizard-on .document-fields__edit {
      padding-right: var(--gutter-h) !important;
    }

    body.qlu-section-wizard-on .render-fields:has(> .qlu-section-wizard) {
      display: grid;
      grid-template-columns: minmax(14.5rem, 17rem) minmax(0, 1fr);
      grid-template-rows: auto minmax(0, 1fr);
      gap: 0.85rem 1.25rem;
      align-items: start;
      width: 100%;
    }

    body.qlu-section-wizard-on .render-fields > .qlu-section-wizard {
      grid-column: 1;
      grid-row: 1 / span 2;
      position: sticky;
      top: calc(var(--doc-controls-height, 4rem) + 0.75rem);
      align-self: start;
      margin: 0;
      z-index: 1;
      width: 100%;
    }

    body.qlu-section-wizard-on .render-fields > .qlu-section-right-chrome {
      grid-column: 2;
      grid-row: 1;
      min-width: 0;
      width: 100%;
    }

    body.qlu-section-wizard-on .render-fields > .qlu-issue-cover-pane,
    body.qlu-section-wizard-on .render-fields > #field-sections,
    body.qlu-section-wizard-on .render-fields > .array-field {
      grid-column: 2;
      grid-row: 2;
      min-width: 0;
      width: 100%;
      max-width: none;
      margin: 0;
    }

    body.qlu-section-wizard-on[data-qlu-wizard-pane="cover"] .render-fields > #field-sections,
    body.qlu-section-wizard-on[data-qlu-wizard-pane="cover"] .render-fields > .array-field,
    body.qlu-section-wizard-on[data-qlu-wizard-pane="cover"] .render-fields > .qlu-section-right-chrome {
      display: none !important;
    }

    body.qlu-section-wizard-on[data-qlu-wizard-pane="section"] .render-fields > .qlu-issue-cover-pane {
      display: none !important;
    }

    body.qlu-section-wizard-on[data-qlu-wizard-pane="section"][data-qlu-wizard-empty="true"] .render-fields > #field-sections,
    body.qlu-section-wizard-on[data-qlu-wizard-pane="section"][data-qlu-wizard-empty="true"] .render-fields > .array-field {
      display: none !important;
    }

    .qlu-section-wizard {
      margin: 0;
      padding: 0.85rem 0.75rem;
      border: 1px solid var(--theme-elevation-150);
      border-radius: 4px;
      background: var(--theme-elevation-50);
      max-height: calc(100vh - var(--doc-controls-height, 4rem) - 2rem);
      overflow: auto;
    }

    .qlu-section-wizard__header {
      padding: 0 0.35rem 0.7rem;
      border-bottom: 1px solid var(--theme-elevation-150);
      margin-bottom: 0.55rem;
    }
    .qlu-section-wizard__title { margin: 0 0 0.2rem; font-size: 0.9rem; font-weight: 600; }
    .qlu-section-wizard__hint { margin: 0; color: var(--theme-elevation-600); font-size: 0.72rem; line-height: 1.35; }

    .qlu-section-wizard__steps { display: flex; flex-direction: column; gap: 0.3rem; }

    .qlu-section-wizard__step {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: start;
      gap: 0.15rem 0.5rem;
      width: 100%;
      margin: 0;
      padding: 0.55rem;
      border: 1px solid transparent;
      border-radius: 4px;
      background: transparent;
      color: inherit;
      text-align: left;
      cursor: pointer;
    }
    .qlu-section-wizard__step:hover { background: var(--theme-elevation-100); }
    .qlu-section-wizard__step.is-active {
      border-color: var(--theme-success-500, #3fa86b);
      background: color-mix(in srgb, var(--theme-success-500, #3fa86b) 12%, var(--theme-bg));
    }
    .qlu-section-wizard__step-num { font-size: 0.72rem; font-weight: 700; opacity: 0.7; padding-top: 0.1rem; }
    .qlu-section-wizard__step-title { font-size: 0.78rem; line-height: 1.3; font-weight: 600; }
    .qlu-section-wizard__step-count { font-size: 0.72rem; font-weight: 600; opacity: 0.75; white-space: nowrap; padding-top: 0.1rem; }

    .qlu-section-wizard__footer {
      display: flex;
      gap: 0.4rem;
      margin-top: 0.7rem;
      padding-top: 0.65rem;
      border-top: 1px solid var(--theme-elevation-150);
    }
    .qlu-section-wizard__footer button {
      flex: 1; margin: 0; padding: 0.4rem 0.5rem;
      border: 1px solid var(--theme-elevation-200); border-radius: 4px;
      background: var(--theme-bg); color: inherit; font-size: 0.75rem; cursor: pointer;
    }
    .qlu-section-wizard__footer button:disabled { opacity: 0.45; cursor: not-allowed; }

    .qlu-section-right-chrome {
      border: 1px solid var(--theme-elevation-150);
      border-radius: 4px;
      background: var(--theme-elevation-50);
      padding: 0.85rem 1rem;
    }
    .qlu-section-right-chrome__title {
      margin: 0 0 0.65rem;
      font-size: 1rem;
      font-weight: 600;
      line-height: 1.35;
    }
    .qlu-section-right-chrome__entries {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      align-items: center;
    }
    .qlu-section-right-chrome__entry {
      margin: 0;
      padding: 0.35rem 0.65rem;
      border: 1px solid var(--theme-elevation-200);
      border-radius: 4px;
      background: var(--theme-bg);
      color: inherit;
      font-size: 0.78rem;
      cursor: pointer;
      max-width: 14rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .qlu-section-right-chrome__entry.is-active {
      border-color: var(--theme-success-500, #3fa86b);
      box-shadow: inset 0 0 0 1px var(--theme-success-500, #3fa86b);
      font-weight: 600;
    }
    .qlu-section-right-chrome__add,
    .qlu-section-right-chrome__remove {
      margin: 0;
      padding: 0.35rem 0.7rem;
      border-radius: 4px;
      font-size: 0.78rem;
      cursor: pointer;
    }
    .qlu-section-right-chrome__add {
      border: 1px dashed var(--theme-elevation-400);
      background: var(--theme-bg);
      color: inherit;
    }
    .qlu-section-right-chrome__remove {
      border: 1px solid var(--theme-error-500, #c4554d);
      background: transparent;
      color: var(--theme-error-500, #c4554d);
      margin-left: auto;
    }
    .qlu-section-right-chrome__empty {
      margin: 0;
      color: var(--theme-elevation-600);
      font-size: 0.85rem;
      line-height: 1.45;
    }
    .qlu-section-right-chrome__empty-actions {
      margin-top: 0.75rem;
    }

    body.qlu-section-wizard-on .qlu-issue-cover-pane {
      border: 1px solid var(--theme-elevation-150);
      border-radius: 4px;
      background: var(--theme-bg);
      padding: 1rem 1.1rem 1.15rem;
    }
    body.qlu-section-wizard-on .qlu-issue-cover-pane > .group-field__wrap > .group-field__header {
      display: none;
    }

    body.qlu-section-wizard-on .array-field:has(> .array-field__draggable-rows [id^="sections-row-"]) > .array-field__header,
    body.qlu-section-wizard-on .array-field:has(> .array-field__draggable-rows [id^="sections-row-"]) > .array-field__add-row {
      display: none !important;
    }

    body.qlu-section-wizard-on [id^="sections-row-"]:not([data-qlu-wizard-active="true"]) {
      display: none !important;
    }
    body.qlu-section-wizard-on [id^="sections-row-"][data-qlu-wizard-active="true"] {
      display: block !important;
      width: 100%;
    }
    body.qlu-section-wizard-on [id^="sections-row-"][data-qlu-wizard-active="true"] > .collapsible > .collapsible__toggle-wrap {
      display: none !important;
    }
    body.qlu-section-wizard-on [id^="sections-row-"][data-qlu-wizard-active="true"] > .collapsible {
      border: 1px solid var(--theme-elevation-150);
      border-radius: 4px;
      background: var(--theme-bg);
      width: 100%;
    }
    body.qlu-section-wizard-on [id^="sections-row-"][data-qlu-wizard-active="true"] .collapsible__content,
    body.qlu-section-wizard-on [id^="sections-row-"][data-qlu-wizard-active="true"] .rah-static,
    body.qlu-section-wizard-on [id^="sections-row-"][data-qlu-wizard-active="true"] .rah-animating {
      height: auto !important;
      min-height: 1px !important;
      overflow: visible !important;
      opacity: 1 !important;
      visibility: visible !important;
    }
    body.qlu-section-wizard-on [id^="sections-row-"][data-qlu-wizard-active="true"] .array-field__fields {
      display: block !important;
      padding: 1rem 1.1rem 1.15rem;
      width: 100%;
    }
    body.qlu-section-wizard-on .qlu-section-pane-title {
      margin: 0 0 0.85rem;
      padding-bottom: 0.65rem;
      border-bottom: 1px solid var(--theme-elevation-150);
      font-size: 0.95rem;
      font-weight: 600;
      line-height: 1.35;
    }

    @media (max-width: 900px) {
      body.qlu-section-wizard-on .render-fields:has(> .qlu-section-wizard) {
        grid-template-columns: 1fr;
        grid-template-rows: auto;
      }
      body.qlu-section-wizard-on .render-fields > .qlu-section-wizard,
      body.qlu-section-wizard-on .render-fields > .qlu-section-right-chrome,
      body.qlu-section-wizard-on .render-fields > .qlu-issue-cover-pane,
      body.qlu-section-wizard-on .render-fields > #field-sections,
      body.qlu-section-wizard-on .render-fields > .array-field {
        grid-column: 1;
        grid-row: auto;
        position: static;
      }
      .qlu-section-wizard { max-height: none; }
    }
  `
}

function ensurePaneTitle(container: HTMLElement | null, label: string) {
  if (!container) return
  let title = container.querySelector<HTMLElement>(':scope > .qlu-section-pane-title')
  if (!title) {
    title = document.createElement('h3')
    title.className = 'qlu-section-pane-title'
    container.insertBefore(title, container.firstChild)
  }
  title.textContent = label
}

function readSectionIndexMap(
  fields: Record<string, { value?: unknown; rows?: { id: string; collapsed?: boolean }[] }>,
) {
  const rows = fields.sections?.rows || []
  const map: Array<{ index: number; id?: string; key: string }> = []
  const max = Math.max(rows.length, 24)
  for (let i = 0; i < max; i++) {
    const key = fields[`sections.${i}.key`]?.value
    if (typeof key === 'string' && key) {
      map.push({ index: i, id: rows[i]?.id, key })
    } else if (i < rows.length) {
      map.push({ index: i, id: rows[i]?.id, key: '' })
    } else {
      break
    }
  }
  return map
}

function readStoredPane(): WizardPaneKey {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw === WIZARD_COVER_KEY) return WIZARD_COVER_KEY
    if (raw && WIZARD_NAV_KEYS.includes(raw as WizardPaneKey)) return raw as WizardPaneKey
  } catch {
    /* ignore */
  }
  return WIZARD_COVER_KEY
}

export function SectionWizard() {
  const editLang = useFormFields(([fields]): EditLang =>
    fields.editLang?.value === 'te' ? 'te' : 'en',
  )
  const [fields] = useAllFormFields()
  const { addFieldRow, removeFieldRow, dispatchFields } = useForm()

  const formData = useMemo(() => {
    return reduceFieldsToValues(fields, true, true) as CoverFieldsLike & {
      sections?: SectionRowLike[]
    }
  }, [fields])

  const sections = useMemo(
    () => (Array.isArray(formData.sections) ? formData.sections : []),
    [formData.sections],
  )

  const indexMap = useMemo(
    () =>
      readSectionIndexMap(
        fields as Record<string, { value?: unknown; rows?: { id: string; collapsed?: boolean }[] }>,
      ),
    [fields],
  )

  const [activeKey, setActiveKey] = useState<WizardPaneKey>(WIZARD_COVER_KEY)
  const [activeEntryPos, setActiveEntryPos] = useState(0)

  useEffect(() => {
    setActiveKey(readStoredPane())
  }, [])

  const entriesForActive = useMemo(() => {
    if (activeKey === WIZARD_COVER_KEY) return []
    return indexMap
      .map((row, posWithinAll) => ({ ...row, posWithinAll }))
      .filter((row) => row.key === activeKey)
      .map((row, entryPos) => ({
        ...row,
        entryPos,
        label: entryLabel(sections[row.index], editLang, entryPos),
      }))
  }, [activeKey, editLang, indexMap, sections])

  useEffect(() => {
    if (activeEntryPos >= entriesForActive.length) {
      setActiveEntryPos(Math.max(0, entriesForActive.length - 1))
    }
  }, [activeEntryPos, entriesForActive.length])

  const steps = useMemo(() => {
    const coverCount = countCoverContent(formData, editLang)
    const coverTitle = editLang === 'te' ? 'సంచిక & ముఖచిత్రం' : 'Issue & cover'
    const coverStep = {
      key: WIZARD_COVER_KEY as WizardPaneKey,
      num: '00',
      title: coverTitle,
      count: coverCount,
      label: formatCoverAdminLabel(editLang, coverCount),
    }

    const sectionSteps = WIZARD_SECTION_KEYS.map((key) => {
      const count = countSectionEntries(indexMap, key)
      const meta = PDF_SECTION_TITLES[key]
      return {
        key: key as WizardPaneKey,
        num: meta.num,
        title: editLang === 'te' ? meta.te : meta.en,
        count,
        label: formatSectionAdminLabel(key, editLang, count),
      }
    })

    return [coverStep, ...sectionSteps]
  }, [editLang, formData, indexMap])

  const activeStep = steps.find((s) => s.key === activeKey) || steps[0]
  const activeStepIndex = Math.max(
    0,
    WIZARD_NAV_KEYS.findIndex((k) => k === activeStep.key),
  )
  const isCover = activeStep.key === WIZARD_COVER_KEY
  const activeEntry = entriesForActive[activeEntryPos] || null
  const isEmptySection = !isCover && entriesForActive.length === 0

  const goTo = useCallback((key: WizardPaneKey) => {
    setActiveKey(key)
    setActiveEntryPos(0)
    try {
      sessionStorage.setItem(STORAGE_KEY, key)
    } catch {
      /* ignore */
    }
  }, [])

  const addEntry = useCallback(() => {
    if (isCover) return
    const key = activeStep.key
    const nextPos = entriesForActive.length
    addFieldRow({
      path: 'sections',
      schemaPath: 'sections',
      subFieldState: {
        key: { value: key, initialValue: key, valid: true },
      },
    })
    setActiveEntryPos(nextPos)
  }, [activeStep.key, addFieldRow, entriesForActive.length, isCover])

  const removeEntry = useCallback(() => {
    if (!activeEntry) return
    removeFieldRow({ path: 'sections', rowIndex: activeEntry.index })
    setActiveEntryPos((pos) => Math.max(0, pos - 1))
  }, [activeEntry, removeFieldRow])

  const goPrev = useCallback(() => {
    goTo(WIZARD_NAV_KEYS[Math.max(0, activeStepIndex - 1)])
  }, [activeStepIndex, goTo])

  const goNext = useCallback(() => {
    goTo(WIZARD_NAV_KEYS[Math.min(WIZARD_NAV_KEYS.length - 1, activeStepIndex + 1)])
  }, [activeStepIndex, goTo])

  useEffect(() => {
    if (isCover || !activeEntry?.id) return
    const rows = (fields.sections?.rows || []) as { id: string; collapsed?: boolean }[]
    if (!rows.length) return

    const needsUpdate = rows.some((row) => {
      const shouldBeCollapsed = row.id !== activeEntry.id
      return Boolean(row.collapsed) !== shouldBeCollapsed
    })
    if (!needsUpdate) return

    dispatchFields({
      type: 'SET_ROW_COLLAPSED',
      path: 'sections',
      updatedRows: rows.map((row) => ({
        ...row,
        collapsed: row.id !== activeEntry.id,
      })),
    })
  }, [activeEntry?.id, dispatchFields, fields.sections?.rows, isCover])

  useEffect(() => {
    ensureWizardStyles()
    document.body.classList.add('qlu-section-wizard-on')
    return () => {
      document.body.classList.remove('qlu-section-wizard-on')
      document.body.removeAttribute('data-qlu-wizard-pane')
      document.body.removeAttribute('data-qlu-wizard-empty')
      document.querySelectorAll<HTMLElement>('[data-qlu-wizard-row]').forEach((el) => {
        delete el.dataset.qluWizardRow
        delete el.dataset.qluWizardActive
      })
      document.querySelectorAll('.qlu-section-pane-title').forEach((el) => el.remove())
    }
  }, [])

  useEffect(() => {
    document.body.dataset.qluWizardPane = isCover ? 'cover' : 'section'
    document.body.dataset.qluWizardEmpty = isEmptySection ? 'true' : 'false'

    const apply = () => {
      if (isCover) {
        const cover =
          document.querySelector<HTMLElement>('.qlu-issue-cover-pane .group-field__wrap') ||
          document.querySelector<HTMLElement>('.qlu-issue-cover-pane')
        ensurePaneTitle(cover, activeStep.label)
        document.querySelectorAll<HTMLElement>('[id^="sections-row-"]').forEach((row) => {
          delete row.dataset.qluWizardActive
        })
        return
      }

      const activeIndex = activeEntry?.index
      const max = Math.max(indexMap.length, sections.length, 12)
      for (let i = 0; i < max; i++) {
        const row = document.getElementById(`sections-row-${i}`)
        if (!row) continue
        row.dataset.qluWizardRow = 'true'
        if (activeIndex === i) {
          row.dataset.qluWizardActive = 'true'
          const label = activeEntry
            ? `${activeStep.label.replace(/\s*\(\d+\)\s*$/, '')} · ${activeEntry.label}`
            : activeStep.label
          ensurePaneTitle(row.querySelector('.array-field__fields'), label)
        } else {
          delete row.dataset.qluWizardActive
        }
      }
    }

    apply()
    const timers = [50, 250, 600].map((ms) => window.setTimeout(apply, ms))
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [
    activeEntry,
    activeStep.label,
    indexMap.length,
    isCover,
    isEmptySection,
    sections.length,
  ])

  return (
    <>
      <div className="qlu-section-wizard">
        <div className="qlu-section-wizard__header">
          <p className="qlu-section-wizard__title">Magazine</p>
          <p className="qlu-section-wizard__hint">
            Pick a section — add multiple entries on the right
          </p>
        </div>

        <div className="qlu-section-wizard__steps" role="tablist" aria-label="Magazine panes">
          {steps.map((step) => (
            <button
              key={step.key}
              type="button"
              role="tab"
              aria-selected={step.key === activeStep.key}
              className={`qlu-section-wizard__step${step.key === activeStep.key ? ' is-active' : ''}`}
              onClick={() => goTo(step.key)}
              title={step.label}
            >
              <span className="qlu-section-wizard__step-num">{step.num}</span>
              <span className="qlu-section-wizard__step-title">{step.title}</span>
              <span className="qlu-section-wizard__step-count">({step.count})</span>
            </button>
          ))}
        </div>

        <div className="qlu-section-wizard__footer">
          <button type="button" disabled={activeStepIndex === 0} onClick={goPrev}>
            Previous
          </button>
          <button
            type="button"
            disabled={activeStepIndex >= WIZARD_NAV_KEYS.length - 1}
            onClick={goNext}
          >
            Next
          </button>
        </div>
      </div>

      {!isCover ? (
        <div className="qlu-section-right-chrome">
          <p className="qlu-section-right-chrome__title">{activeStep.label}</p>

          {isEmptySection ? (
            <>
              <p className="qlu-section-right-chrome__empty">
                No entries yet for this section. Add one to write a headline, PDF slots, body, and
                images. You can add more entries afterward.
              </p>
              <div className="qlu-section-right-chrome__empty-actions">
                <button type="button" className="qlu-section-right-chrome__add" onClick={addEntry}>
                  + Add entry
                </button>
              </div>
            </>
          ) : (
            <div className="qlu-section-right-chrome__entries">
              {entriesForActive.map((entry) => (
                <button
                  key={`${entry.id || entry.index}`}
                  type="button"
                  className={`qlu-section-right-chrome__entry${
                    entry.entryPos === activeEntryPos ? ' is-active' : ''
                  }`}
                  onClick={() => setActiveEntryPos(entry.entryPos)}
                  title={entry.label}
                >
                  {entry.entryPos + 1}. {entry.label}
                </button>
              ))}
              <button type="button" className="qlu-section-right-chrome__add" onClick={addEntry}>
                + Add entry
              </button>
              {activeEntry ? (
                <button
                  type="button"
                  className="qlu-section-right-chrome__remove"
                  onClick={removeEntry}
                >
                  Remove
                </button>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </>
  )
}
