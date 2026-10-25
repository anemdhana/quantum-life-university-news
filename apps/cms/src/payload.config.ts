import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Issues } from './collections/Issues'
import { JnanodayamReadings } from './collections/JnanodayamReadings'
import { Media } from './collections/Media'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const serverURL = process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'

export default buildConfig({
  serverURL,
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' · QLU News',
    },
  },
  collections: [Users, Media, Issues, JnanodayamReadings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  cors: [
    'http://localhost:4321',
    'http://127.0.0.1:4321',
    process.env.PUBLIC_WEB_URL || '',
  ].filter(Boolean),
  csrf: [
    'http://localhost:4321',
    'http://127.0.0.1:4321',
    process.env.PUBLIC_WEB_URL || '',
  ].filter(Boolean),
  sharp,
  plugins: [],
})
