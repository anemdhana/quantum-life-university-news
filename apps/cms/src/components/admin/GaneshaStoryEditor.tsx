'use client'

import { useField, useFormFields } from '@payloadcms/ui'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { markdownToSections, sectionsToMarkdown, type StorySection } from '../../lib/storySections'

const STYLE_ID = 'qlu-ganesha-story-editor-style'
const STORAGE_KEY = 'qlu-ganesha-story-section-index'

type EditLang = 'te' | 'en'

function ensureStyles() {
  if (typeof document === 'undefined') return
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = STYLE_ID
    document.head.appendChild(style)
  }
  style.textContent = `
    .qlu-gs-shell {
      display: grid;
      grid-template-columns: minmax(14.5rem, 17rem) minmax(0, 1fr);
      gap: 0.85rem 1.25rem;
      align-items: start;
      width: 100%;
      margin: 0 0 1rem;
    }
    .qlu-gs-nav {
      margin: 0;
      padding: 0.85rem 0.75rem;
      border: 1px solid var(--theme-elevation-150);
      border-radius: 4px;
      background: var(--theme-elevation-50);
      max-height: calc(100vh - var(--doc-controls-height, 4rem) - 2rem);
      overflow: auto;
      position: sticky;
      top: calc(var(--doc-controls-height, 4rem) + 0.75rem);
    }
    .qlu-gs-nav__title { margin: 0 0 0.2rem; font-size: 0.9rem; font-weight: 600; }
    .qlu-gs-nav__hint { margin: 0 0 0.65rem; color: var(--theme-elevation-600); font-size: 0.72rem; line-height: 1.35; }
    .qlu-gs-nav__steps { display: flex; flex-direction: column; gap: 0.3rem; }
    .qlu-gs-nav__step {
      display: flex; flex-direction: column; gap: 0.12rem; width: 100%; margin: 0;
      padding: 0.45rem 0.5rem; border: 1px solid transparent; border-radius: 3px;
      background: transparent; color: inherit; text-align: left; cursor: pointer;
    }
    .qlu-gs-nav__step:hover { background: var(--theme-elevation-100); }
    .qlu-gs-nav__step.is-active { border-color: var(--theme-elevation-250); background: var(--theme-bg); }
    .qlu-gs-nav__num { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.04em; color: var(--theme-elevation-500); }
    .qlu-gs-nav__label { font-size: 0.82rem; font-weight: 600; line-height: 1.3; }
    .qlu-gs-nav__actions { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.75rem; padding-top: 0.65rem; border-top: 1px solid var(--theme-elevation-150); }
    .qlu-gs-nav__actions button {
      margin: 0; padding: 0.3rem 0.5rem; border: 1px solid var(--theme-elevation-150);
      border-radius: 3px; background: var(--theme-bg); color: inherit; font-size: 0.72rem; cursor: pointer;
    }
    .qlu-gs-nav__actions .is-danger { border-color: var(--theme-error-500, #c4554d); color: var(--theme-error-500, #c4554d); }
    .qlu-gs-main { min-width: 0; display: flex; flex-direction: column; gap: 0.85rem; }
    .qlu-gs-card {
      border: 1px solid var(--theme-elevation-150); border-radius: 4px;
      background: var(--theme-bg); padding: 1rem 1.1rem 1.15rem;
    }
    .qlu-gs-card__heading {
      margin: 0 0 0.85rem; padding-bottom: 0.65rem; border-bottom: 1px solid var(--theme-elevation-150);
      font-size: 0.95rem; font-weight: 600; line-height: 1.35;
    }
    .qlu-gs-field { display: flex; flex-direction: column; gap: 0.35rem; margin: 0 0 0.9rem; }
    .qlu-gs-field:last-child { margin-bottom: 0; }
    .qlu-gs-field label { margin: 0; font-size: 0.8rem; font-weight: 600; }
    .qlu-gs-field input, .qlu-gs-field textarea {
      width: 100%; margin: 0; padding: 0.55rem 0.65rem; border: 1px solid var(--theme-elevation-150);
      border-radius: 3px; background: var(--theme-input-bg, var(--theme-bg)); color: inherit; font: inherit; line-height: 1.45;
    }
    .qlu-gs-field textarea { min-height: 14rem; resize: vertical; }
    .qlu-gs-empty { margin: 0; color: var(--theme-elevation-600); font-size: 0.85rem; line-height: 1.45; }
    @media (max-width: 900px) {
      .qlu-gs-shell { grid-template-columns: 1fr; }
      .qlu-gs-nav { position: static; max-height: none; }
    }
  `
}

function readStoredIndex(): number {
  try {
    const n = Number(sessionStorage.getItem(STORAGE_KEY))
    if (Number.isFinite(n) && n >= 0) return Math.floor(n)
  } catch {
    /* ignore */
  }
  return 0
}

export function GaneshaStoryEditor() {
  const editLang = useFormFields(([fields]): EditLang =>
    fields.editLang?.value === 'te' ? 'te' : 'en',
  )

  const { value: titleTe, setValue: setTitleTe } = useField<string>({ path: 'titleTe' })
  const { value: titleEn, setValue: setTitleEn } = useField<string>({ path: 'titleEn' })
  const { value: taglineTe, setValue: setTaglineTe } = useField<string>({ path: 'taglineTe' })
  const { value: taglineEn, setValue: setTaglineEn } = useField<string>({ path: 'taglineEn' })
  const { value: bodyTe, setValue: setBodyTe } = useField<string>({ path: 'bodyMarkdownTe' })
  const { value: bodyEn, setValue: setBodyEn } = useField<string>({ path: 'bodyMarkdownEn' })

  const dayTitle = editLang === 'te' ? titleTe || '' : titleEn || ''
  const setDayTitle = editLang === 'te' ? setTitleTe : setTitleEn
  const tagline = editLang === 'te' ? taglineTe || '' : taglineEn || ''
  const setTagline = editLang === 'te' ? setTaglineTe : setTaglineEn
  const bodyMd = editLang === 'te' ? bodyTe : bodyEn
  const setBodyMd = editLang === 'te' ? setBodyTe : setBodyEn

  const sections = useMemo(() => markdownToSections(bodyMd), [bodyMd])
  const [activeIndex, setActiveIndex] = useState(0)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftBody, setDraftBody] = useState('')
  const hydratedPane = useRef('')

  useEffect(() => {
    setActiveIndex(readStoredIndex())
  }, [])

  useEffect(() => {
    if (!sections.length) {
      setActiveIndex(0)
      return
    }
    if (activeIndex >= sections.length) setActiveIndex(sections.length - 1)
  }, [activeIndex, sections.length])

  const loadDraft = useCallback(
    (index: number) => {
      const s = sections[index]
      setDraftTitle(s?.title || '')
      setDraftBody(s?.body || '')
    },
    [sections],
  )

  useEffect(() => {
    const pane = `${editLang}:${activeIndex}`
    if (hydratedPane.current === pane) return
    hydratedPane.current = pane
    loadDraft(activeIndex)
  }, [activeIndex, editLang, loadDraft])

  useEffect(() => {
    const pane = `${editLang}:${activeIndex}`
    if (!sections.length || hydratedPane.current !== pane) return
    if (draftTitle || draftBody) return
    loadDraft(activeIndex)
  }, [activeIndex, draftBody, draftTitle, editLang, loadDraft, sections])

  useEffect(() => {
    ensureStyles()
  }, [])

  const goTo = useCallback((index: number) => {
    setActiveIndex(index)
    try {
      sessionStorage.setItem(STORAGE_KEY, String(index))
    } catch {
      /* ignore */
    }
  }, [])

  const writeSections = useCallback(
    (next: StorySection[], focusIndex?: number) => {
      setBodyMd(sectionsToMarkdown(next))
      if (typeof focusIndex === 'number') {
        const s = next[focusIndex]
        setDraftTitle(s?.title || '')
        setDraftBody(s?.body || '')
        hydratedPane.current = `${editLang}:${focusIndex}`
        goTo(focusIndex)
      }
    },
    [editLang, goTo, setBodyMd],
  )

  const commitDraft = useCallback(
    (title: string, body: string) => {
      if (!sections.length) return
      const next = sections.map((s, i) => (i === activeIndex ? { title, body } : s))
      writeSections(next)
    },
    [activeIndex, sections, writeSections],
  )

  const active = sections[activeIndex] || null

  const addSection = () => {
    const next = [
      ...sections,
      {
        title: editLang === 'te' ? `విభాగం ${sections.length + 1}` : `Section ${sections.length + 1}`,
        body: '',
      },
    ]
    writeSections(next, next.length - 1)
  }

  const removeSection = () => {
    if (!sections.length) return
    writeSections(
      sections.filter((_, i) => i !== activeIndex),
      Math.max(0, activeIndex - 1),
    )
  }

  const moveSection = (dir: -1 | 1) => {
    const target = activeIndex + dir
    if (target < 0 || target >= sections.length) return
    const next = [...sections]
    const tmp = next[activeIndex]
    next[activeIndex] = next[target]
    next[target] = tmp
    writeSections(next, target)
  }

  return (
    <div className="qlu-gs-shell">
      <div className="qlu-gs-nav">
        <p className="qlu-gs-nav__title">
          {editLang === 'te' ? 'కథ విభాగాలు' : 'Story sections'}
        </p>
        <p className="qlu-gs-nav__hint">
          {editLang === 'te'
            ? 'ప్రచురణ ### శీర్షికలు — Astro పేజీలో అలాగే కనిపిస్తాయి'
            : 'Same ### sections as the illustrated publication page'}
        </p>
        <div className="qlu-gs-nav__steps" role="navigation" aria-label="Sections">
          {sections.length === 0 ? (
            <p className="qlu-gs-nav__hint">
              {editLang === 'te' ? 'విభాగాలు లేవు — క్రింద జోడించండి.' : 'No sections yet — add one below.'}
            </p>
          ) : (
            sections.map((s, i) => (
              <button
                key={`${i}-${s.title}`}
                type="button"
                className={`qlu-gs-nav__step${i === activeIndex ? ' is-active' : ''}`}
                onClick={() => goTo(i)}
              >
                <span className="qlu-gs-nav__num">{String(i + 1).padStart(2, '0')}</span>
                <span className="qlu-gs-nav__label">{s.title || `Section ${i + 1}`}</span>
              </button>
            ))
          )}
        </div>
        <div className="qlu-gs-nav__actions">
          <button type="button" onClick={addSection}>
            {editLang === 'te' ? '+ విభాగం' : '+ Section'}
          </button>
          <button type="button" onClick={() => moveSection(-1)} disabled={activeIndex <= 0}>
            ↑
          </button>
          <button
            type="button"
            onClick={() => moveSection(1)}
            disabled={activeIndex >= sections.length - 1}
          >
            ↓
          </button>
          <button
            type="button"
            className="is-danger"
            onClick={removeSection}
            disabled={!sections.length}
          >
            {editLang === 'te' ? 'తొలగించు' : 'Remove'}
          </button>
        </div>
      </div>

      <div className="qlu-gs-main">
        <div className="qlu-gs-card">
          <h3 className="qlu-gs-card__heading">{editLang === 'te' ? 'కథ' : 'Story'}</h3>
          <div className="qlu-gs-field">
            <label htmlFor="qlu-gs-title">{editLang === 'te' ? 'శీర్షిక' : 'Title'}</label>
            <input
              id="qlu-gs-title"
              value={dayTitle}
              onChange={(e) => setDayTitle(e.target.value)}
              lang={editLang}
            />
          </div>
          <div className="qlu-gs-field">
            <label htmlFor="qlu-gs-tagline">{editLang === 'te' ? 'ఉపశీర్షిక' : 'Tagline'}</label>
            <input
              id="qlu-gs-tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              lang={editLang}
            />
          </div>
        </div>

        <div className="qlu-gs-card">
          {active ? (
            <>
              <h3 className="qlu-gs-card__heading">
                {String(activeIndex + 1).padStart(2, '0')} ·{' '}
                {draftTitle || active.title || `Section ${activeIndex + 1}`}
              </h3>
              <div className="qlu-gs-field">
                <label htmlFor="qlu-gs-sec-title">
                  {editLang === 'te' ? 'విభాగం శీర్షిక' : 'Section title'}
                </label>
                <input
                  id="qlu-gs-sec-title"
                  value={draftTitle}
                  onChange={(e) => {
                    setDraftTitle(e.target.value)
                    commitDraft(e.target.value, draftBody)
                  }}
                  lang={editLang}
                />
              </div>
              <div className="qlu-gs-field">
                <label htmlFor="qlu-gs-sec-body">
                  {editLang === 'te' ? 'పాఠ్యం (Markdown)' : 'Body (Markdown)'}
                </label>
                <textarea
                  id="qlu-gs-sec-body"
                  value={draftBody}
                  onChange={(e) => {
                    setDraftBody(e.target.value)
                    commitDraft(draftTitle, e.target.value)
                  }}
                  lang={editLang}
                />
              </div>
            </>
          ) : (
            <>
              <h3 className="qlu-gs-card__heading">{editLang === 'te' ? 'విభాగం' : 'Section'}</h3>
              <p className="qlu-gs-empty">
                {editLang === 'te'
                  ? 'ఎడమ వైపు నుంచి విభాగం జోడించి సరిదిద్దండి.'
                  : 'Add a section from the left to edit this story.'}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
