'use client'

import { useField } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const STYLE_ID = 'qlu-issue-doc-meta-style'

function ensureStyles() {
  if (typeof document === 'undefined') return
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = STYLE_ID
    document.head.appendChild(style)
  }
  style.textContent = `
    .qlu-doc-meta-controls {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-shrink: 0;
      margin-left: auto;
    }
    .qlu-doc-meta-controls__lang {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      margin: 0;
      white-space: nowrap;
    }
    .qlu-doc-meta-controls__lang-label {
      margin: 0;
      color: var(--theme-elevation-500);
      font-size: 0.8rem;
      white-space: nowrap;
    }
    .qlu-doc-meta-controls__lang select {
      margin: 0;
      max-width: 10.5rem;
      height: 1.75rem;
      padding: 0 0.4rem;
      border: 1px solid var(--theme-elevation-150);
      border-radius: 3px;
      background: var(--theme-bg);
      color: inherit;
      font-size: 0.8rem;
    }
    .qlu-doc-meta-controls__published {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      margin: 0;
      cursor: pointer;
      white-space: nowrap;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .qlu-doc-meta-controls__published input {
      margin: 0;
    }
  `
}

/**
 * Renders Editing language + Published into the doc-controls meta row
 * (same row as Last Modified / Created).
 */
export function IssueDocMetaControls() {
  const { value: editLang, setValue: setEditLang } = useField<string>({ path: 'editLang' })
  const { value: published, setValue: setPublished } = useField<boolean>({ path: 'published' })
  const [metaEl, setMetaEl] = useState<HTMLElement | null>(null)

  useEffect(() => {
    ensureStyles()
    const find = () => {
      const el = document.querySelector<HTMLElement>('.doc-controls__meta')
      setMetaEl(el)
    }
    find()
    const t = window.setTimeout(find, 100)
    return () => window.clearTimeout(t)
  }, [])

  if (!metaEl) return null

  return createPortal(
    <li className="doc-controls__list-item qlu-doc-meta-controls">
      <label className="qlu-doc-meta-controls__lang">
        <span className="qlu-doc-meta-controls__lang-label">Editing language:</span>
        <select
          value={editLang === 'te' ? 'te' : 'en'}
          onChange={(e) => setEditLang(e.target.value)}
          aria-label="Editing language"
        >
          <option value="en">English</option>
          <option value="te">తెలుగు (Telugu)</option>
        </select>
      </label>
      <label className="qlu-doc-meta-controls__published">
        <input
          type="checkbox"
          checked={Boolean(published)}
          onChange={(e) => setPublished(e.target.checked)}
        />
        Published
      </label>
    </li>,
    metaEl,
  )
}
