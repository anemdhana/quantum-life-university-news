import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import './styles.css'

export default async function HomePage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  return (
    <div
      style={{
        fontFamily: 'system-ui, sans-serif',
        maxWidth: '40rem',
        margin: '3rem auto',
        padding: '0 1.25rem',
        lineHeight: 1.5,
      }}
    >
      <h1 style={{ fontSize: '1.5rem' }}>QLU News CMS</h1>
      <p>
        Public site: <a href="http://localhost:4321">http://localhost:4321</a> (Astro)
      </p>
      <p>
        Admin: <a href="/admin">/admin</a>
        {user ? ` · signed in as ${user.email}` : ' · create first user or use seed admin'}
      </p>
      <p>
        API: <a href="/api/issues">/api/issues</a> ·{' '}
        <a href="/api/jnanodayam-readings">/api/jnanodayam-readings</a>
      </p>
    </div>
  )
}
