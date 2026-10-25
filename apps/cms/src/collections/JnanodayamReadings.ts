import type { CollectionConfig } from 'payload'

export const JnanodayamReadings: CollectionConfig = {
  slug: 'jnanodayam-readings',
  labels: {
    singular: 'Jnanodayam reading',
    plural: 'Jnanodayam readings',
  },
  admin: {
    useAsTitle: 'titleEn',
    defaultColumns: ['series', 'day', 'titleEn', 'published', 'updatedAt'],
    group: 'Jnanodayam',
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true
      return { published: { equals: true } }
    },
  },
  fields: [
    {
      name: 'series',
      type: 'select',
      required: true,
      defaultValue: 'devi-navaratri',
      options: [
        { label: 'Devi Navaratrula Jnanam', value: 'devi-navaratri' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'day',
      type: 'number',
      required: true,
      min: 1,
      max: 31,
      admin: { position: 'sidebar' },
    },
    {
      name: 'published',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'subtitleTe',
      type: 'text',
      label: 'Day subtitle (Telugu)',
    },
    {
      name: 'subtitleEn',
      type: 'text',
      label: 'Day subtitle (English)',
    },
    {
      name: 'titleTe',
      type: 'text',
      required: true,
      label: 'Title (Telugu)',
    },
    {
      name: 'titleEn',
      type: 'text',
      required: true,
      label: 'Title (English)',
    },
    {
      name: 'bodyHtmlTe',
      type: 'textarea',
      label: 'Body HTML (Telugu)',
      maxLength: 1_000_000,
      admin: {
        description: 'Trusted HTML from seed/import (h2 + paragraphs).',
        rows: 12,
      },
    },
    {
      name: 'bodyHtmlEn',
      type: 'textarea',
      label: 'Body HTML (English)',
      maxLength: 1_000_000,
      admin: {
        description: 'Trusted HTML from seed/import (h2 + paragraphs).',
        rows: 12,
      },
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      admin: { position: 'sidebar' },
    },
  ],
  timestamps: true,
}
