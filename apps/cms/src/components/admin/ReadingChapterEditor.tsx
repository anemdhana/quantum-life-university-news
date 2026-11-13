'use client'

import { useField, useFormFields } from '@payloadcms/ui'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  chaptersToHtml,
  htmlToChapters,
  parasToText,
  textToParas,
  type ReadingChapter,
} from '../../lib/readingChapters'

const STYLE_ID = 'qlu-reading-editor-style'
const STORAGE_KEY = 'qlu-reading-chapter-index'

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
    .qlu-reading-shell {
      display: grid;
      grid-template-columns: minmax(14.5rem, 17rem) minmax(0, 1fr);
      gap: 0.85rem 1.25rem;
      align-items: start;
      width: 100%;
      margin: 0 0 1rem;
    }

    .qlu-reading-editor {
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

    .qlu-reading-editor__header {
      padding: 0 0.35rem 0.7rem;
      border-bottom: 1px solid var(--theme-elevation-150);
      margin-bottom: 0.55rem;
    }
    .qlu-reading-editor__title { margin: 0 0 0.2rem; font-size: 0.9rem; font-weight: 600; }
    .qlu-reading-editor__hint { margin: 0; color: var(--theme-elevation-600); font-size: 0.72rem; line-height: 1.35; }

    .qlu-reading-editor__steps { display: flex; flex-direction: column; gap: 0.3rem; }

    .qlu-reading-editor__step {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.15rem;
      width: 100%;
      margin: 0;
      padding: 0.45rem 0.5rem;
      border: 1px solid transparent;
      border-radius: 3px;
      background: transparent;
      color: inherit;
      text-align: left;
      cursor: pointer;
    }
    .qlu-reading-editor__step:hover {
      background: var(--theme-elevation-100);
    }
    .qlu-reading-editor__step.is-active {
      border-color: var(--theme-elevation-250);
      background: var(--theme-bg);
    }
    .qlu-reading-editor__step-num {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      color: var(--theme-elevation-500);
    }
    .qlu-reading-editor__step-label {
      font-size: 0.82rem;
      font-weight: 600;
      line-height: 1.3;
    }
    .qlu-reading-editor__step-meta {
      font-size: 0.7rem;
      color: var(--theme-elevation-600);
    }

    .qlu-reading-editor__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      margin-top: 0.75rem;
      padding-top: 0.65rem;
      border-top: 1px solid var(--theme-elevation-150);
    }
    .qlu-reading-editor__actions button {
      margin: 0;
      padding: 0.3rem 0.5rem;
      border: 1px solid var(--theme-elevation-150);
      border-radius: 3px;
      background: var(--theme-bg);
      color: inherit;
      font-size: 0.72rem;
      cursor: pointer;
    }
    .qlu-reading-editor__actions button:hover:not(:disabled) {
      background: var(--theme-elevation-100);
    }
    .qlu-reading-editor__actions button:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .qlu-reading-editor__actions .is-danger {
      border-color: var(--theme-error-500, #c4554d);
      color: var(--theme-error-500, #c4554d);
    }

    .qlu-reading-main {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .qlu-reading-day,
    .qlu-reading-spread {
      border: 1px solid var(--theme-elevation-150);
      border-radius: 4px;
      background: var(--theme-bg);
      padding: 1rem 1.1rem 1.15rem;
    }
    .qlu-reading-day__heading,
    .qlu-reading-spread__heading {
      margin: 0 0 0.85rem;
      padding-bottom: 0.65rem;
      border-bottom: 1px solid var(--theme-elevation-150);
      font-size: 0.95rem;
      font-weight: 600;
      line-height: 1.35;
    }
    .qlu-reading-spread__empty {
      margin: 0;
      color: var(--theme-elevation-600);
      font-size: 0.85rem;
      line-height: 1.45;
    }
    .qlu-reading-field {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      margin: 0 0 0.9rem;
    }
    .qlu-reading-field:last-child { margin-bottom: 0; }
    .qlu-reading-field label {
      margin: 0;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .qlu-reading-field input,
    .qlu-reading-field textarea {
      width: 100%;
      margin: 0;
      padding: 0.55rem 0.65rem;
      border: 1px solid var(--theme-elevation-150);
      border-radius: 3px;
      background: var(--theme-input-bg, var(--theme-bg));
      color: inherit;
      font: inherit;
      line-height: 1.45;
    }
    .qlu-reading-field textarea {
      min-height: 16rem;
      resize: vertical;
    }
    .qlu-reading-field__hint {
      margin: 0;
      color: var(--theme-elevation-600);
      font-size: 0.72rem;
      line-height: 1.35;
    }

    @media (max-width: 900px) {
      .qlu-reading-shell {
        grid-template-columns: 1fr;
      }
      .qlu-reading-editor {
        position: static;
        max-height: none;
      }
    }
  `
}

function readStoredIndex(): number {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    const n = Number(raw)
    if (Number.isFinite(n) && n >= 0) return Math.floor(n)
  } catch {
    /* ignore */
  }
  return 0
}

function withMeta(ch: { title: string; paras: string[] }): ReadingChapter {
  const words = ch.paras.join(' ').split(/\s+/).filter(Boolean).length
  return {
    title: ch.title,
    paras: ch.paras,
    words,
    minutes: Math.max(1, Math.round(words / 200) || 1),
  }
}

export function ReadingChapterEditor() {
  const editLang = useFormFields(([fields]): EditLang =>
    fields.editLang?.value === 'te' ? 'te' : 'en',
  )

  const { value: titleTe, setValue: setTitleTe } = useField<string>({ path: 'titleTe' })
  const { value: titleEn, setValue: setTitleEn } = useField<string>({ path: 'titleEn' })
  const { value: subtitleTe, setValue: setSubtitleTe } = useField<string>({ path: 'subtitleTe' })
  const { value: subtitleEn, setValue: setSubtitleEn } = useField<string>({ path: 'subtitleEn' })
  const { value: bodyTe, setValue: setBodyTe } = useField<string>({ path: 'bodyHtmlTe' })
  const { value: bodyEn, setValue: setBodyEn } = useField<string>({ path: 'bodyHtmlEn' })

  const dayTitle = editLang === 'te' ? titleTe || '' : titleEn || ''
  const setDayTitle = editLang === 'te' ? setTitleTe : setTitleEn
  const daySubtitle = editLang === 'te' ? subtitleTe || '' : subtitleEn || ''
  const setDaySubtitle = editLang === 'te' ? setSubtitleTe : setSubtitleEn
  const bodyHtml = editLang === 'te' ? bodyTe : bodyEn
  const setBodyHtml = editLang === 'te' ? setBodyTe : setBodyEn

  const chapters = useMemo(() => htmlToChapters(bodyHtml), [bodyHtml])
  const [activeIndex, setActiveIndex] = useState(0)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftBody, setDraftBody] = useState('')
  const hydratedPane = useRef('')

  useEffect(() => {
    setActiveIndex(readStoredIndex())
  }, [])

  useEffect(() => {
    if (!chapters.length) {
      setActiveIndex(0)
      return
    }
    if (activeIndex >= chapters.length) {
      setActiveIndex(chapters.length - 1)
    }
  }, [activeIndex, chapters.length])

  const loadDraft = useCallback(
    (index: number) => {
      const ch = chapters[index]
      setDraftTitle(ch?.title || '')
      setDraftBody(ch ? parasToText(ch.paras) : '')
    },
    [chapters],
  )

  useEffect(() => {
    const pane = `${editLang}:${activeIndex}`
    if (hydratedPane.current === pane) return
    hydratedPane.current = pane
    loadDraft(activeIndex)
  }, [activeIndex, editLang, loadDraft])

  useEffect(() => {
    const pane = `${editLang}:${activeIndex}`
    if (!chapters.length) return
    if (hydratedPane.current !== pane) return
    if (draftTitle || draftBody) return
    loadDraft(activeIndex)
  }, [activeIndex, chapters, draftBody, draftTitle, editLang, loadDraft])

  useEffect(() => {
    ensureStyles()
    document.body.classList.add('qlu-reading-editor-on')
    return () => {
      document.body.classList.remove('qlu-reading-editor-on')
    }
  }, [])

  const goTo = useCallback((index: number) => {
    setActiveIndex(index)
    try {
      sessionStorage.setItem(STORAGE_KEY, String(index))
    } catch {
      /* ignore */
    }
  }, [])

  const writeChapters = useCallback(
    (next: Array<{ title: string; paras: string[] }>, focusIndex?: number) => {
      setBodyHtml(chaptersToHtml(next))
      if (typeof focusIndex === 'number') {
        const ch = next[focusIndex]
        setDraftTitle(ch?.title || '')
        setDraftBody(ch ? parasToText(ch.paras) : '')
        hydratedPane.current = `${editLang}:${focusIndex}`
        goTo(focusIndex)
      }
    },
    [editLang, goTo, setBodyHtml],
  )

  const commitDraft = useCallback(
    (title: string, body: string) => {
      if (!chapters.length) return
      const next = chapters.map((ch, i) =>
        i === activeIndex
          ? { title, paras: textToParas(body) }
          : { title: ch.title, paras: ch.paras },
      )
      writeChapters(next)
    },
    [activeIndex, chapters, writeChapters],
  )

  const active = chapters[activeIndex] || null

  const onSectionTitleChange = (title: string) => {
    setDraftTitle(title)
    commitDraft(title, draftBody)
  }

  const onSectionBodyChange = (text: string) => {
    setDraftBody(text)
    commitDraft(draftTitle, text)
  }

  const addChapter = () => {
    const next = [
      ...chapters.map((ch) => ({ title: ch.title, paras: ch.paras })),
      {
        title: editLang === 'te' ? `విభాగం ${chapters.length + 1}` : `Section ${chapters.length + 1}`,
        paras: [],
      },
    ]
    writeChapters(next, next.length - 1)
  }

  const removeChapter = () => {
    if (!chapters.length) return
    const next = chapters
      .filter((_, i) => i !== activeIndex)
      .map((ch) => ({ title: ch.title, paras: ch.paras }))
    writeChapters(next, Math.max(0, activeIndex - 1))
  }

  const moveChapter = (dir: -1 | 1) => {
    const target = activeIndex + dir
    if (target < 0 || target >= chapters.length) return
    const next = chapters.map((ch) => ({ title: ch.title, paras: ch.paras }))
    const tmp = next[activeIndex]
    next[activeIndex] = next[target]
    next[target] = tmp
    writeChapters(next, target)
  }

  const totalMinutes = chapters.reduce((sum, ch) => sum + withMeta(ch).minutes, 0)

  return (
    <div className="qlu-reading-shell">
      <div className="qlu-reading-editor">
        <div className="qlu-reading-editor__header">
          <p className="qlu-reading-editor__title">
            {editLang === 'te' ? 'విభాగాలు / స్ప్రెడ్‌లు' : 'Sections / spreads'}
          </p>
          <p className="qlu-reading-editor__hint">
            {editLang === 'te'
              ? `అస్ట్రో రీడర్ వలె · ~${totalMinutes || 0} ని`
              : `Same chapters as the Astro reader · ~${totalMinutes || 0} min`}
          </p>
        </div>

        <div className="qlu-reading-editor__steps" role="navigation" aria-label="Sections">
          {chapters.length === 0 ? (
            <p className="qlu-reading-editor__hint" style={{ padding: '0.35rem' }}>
              {editLang === 'te' ? 'విభాగాలు లేవు — క్రింద జోడించండి.' : 'No sections yet — add one below.'}
            </p>
          ) : (
            chapters.map((ch, i) => {
              const meta = withMeta(ch)
              return (
                <button
                  key={`${i}-${ch.title}`}
                  type="button"
                  className={`qlu-reading-editor__step${i === activeIndex ? ' is-active' : ''}`}
                  onClick={() => goTo(i)}
                >
                  <span className="qlu-reading-editor__step-num">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="qlu-reading-editor__step-label">
                    {ch.title || `Section ${i + 1}`}
                  </span>
                  <span className="qlu-reading-editor__step-meta">
                    ~{meta.minutes} min · {meta.words} words
                  </span>
                </button>
              )
            })
          )}
        </div>

        <div className="qlu-reading-editor__actions">
          <button type="button" onClick={addChapter}>
            {editLang === 'te' ? '+ విభాగం' : '+ Section'}
          </button>
          <button type="button" onClick={() => moveChapter(-1)} disabled={activeIndex <= 0}>
            ↑
          </button>
          <button
            type="button"
            onClick={() => moveChapter(1)}
            disabled={activeIndex >= chapters.length - 1}
          >
            ↓
          </button>
          <button
            type="button"
            className="is-danger"
            onClick={removeChapter}
            disabled={!chapters.length}
          >
            {editLang === 'te' ? 'తొలగించు' : 'Remove'}
          </button>
        </div>
      </div>

      <div className="qlu-reading-main">
        <div className="qlu-reading-day">
          <h3 className="qlu-reading-day__heading">
            {editLang === 'te' ? 'రోజు' : 'Day'}
          </h3>
          <div className="qlu-reading-field">
            <label htmlFor="qlu-reading-day-title">
              {editLang === 'te' ? 'శీర్షిక' : 'Title'}
            </label>
            <input
              id="qlu-reading-day-title"
              value={dayTitle}
              onChange={(e) => setDayTitle(e.target.value)}
              lang={editLang}
            />
          </div>
          <div className="qlu-reading-field">
            <label htmlFor="qlu-reading-day-subtitle">
              {editLang === 'te' ? 'ఉపశీర్షిక' : 'Subtitle'}
            </label>
            <input
              id="qlu-reading-day-subtitle"
              value={daySubtitle}
              onChange={(e) => setDaySubtitle(e.target.value)}
              lang={editLang}
            />
          </div>
        </div>

        <div className="qlu-reading-spread">
          {active ? (
            <>
              <h3 className="qlu-reading-spread__heading">
                {String(activeIndex + 1).padStart(2, '0')} ·{' '}
                {draftTitle || active.title || `Section ${activeIndex + 1}`}
              </h3>
              <div className="qlu-reading-field">
                <label htmlFor="qlu-reading-section-title">
                  {editLang === 'te' ? 'విభాగం శీర్షిక' : 'Section title'}
                </label>
                <input
                  id="qlu-reading-section-title"
                  value={draftTitle}
                  onChange={(e) => onSectionTitleChange(e.target.value)}
                  lang={editLang}
                />
              </div>
              <div className="qlu-reading-field">
                <label htmlFor="qlu-reading-section-body">
                  {editLang === 'te' ? 'పాఠ్యం' : 'Body text'}
                </label>
                <textarea
                  id="qlu-reading-section-body"
                  value={draftBody}
                  onChange={(e) => onSectionBodyChange(e.target.value)}
                  lang={editLang}
                />
                <p className="qlu-reading-field__hint">
                  {editLang === 'te'
                    ? 'పేరాలు మధ్య ఖాళీ లైన్ ఉంచండి. సేవ్ చేస్తే Astro రీడర్‌లో అదే స్ప్రెడ్ కనిపిస్తుంది.'
                    : 'Separate paragraphs with a blank line. Saved HTML matches the Astro reader spreads.'}
                </p>
              </div>
            </>
          ) : (
            <>
              <h3 className="qlu-reading-spread__heading">
                {editLang === 'te' ? 'విభాగం' : 'Section'}
              </h3>
              <p className="qlu-reading-spread__empty">
                {editLang === 'te'
                  ? 'ఎడమ వైపు నుంచి ఒక విభాగం జోడించి సరిదిద్దండి.'
                  : 'Add a section from the left to edit this day’s spreads.'}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
