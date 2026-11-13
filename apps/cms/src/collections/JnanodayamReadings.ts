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
    components: {
      edit: {
        beforeDocumentControls: ['/components/admin/IssueDocMetaControls#IssueDocMetaControls'],
      },
    },
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true
      return { published: { equals: true } }
    },
  },
  fields: [
    {
      name: 'editLang',
      type: 'select',
      label: 'Editing language',
      defaultValue: 'en',
      options: [
        { label: 'English', value: 'en' },
        { label: 'తెలుగు (Telugu)', value: 'te' },
      ],
      admin: {
        // Form state; visible UI is IssueDocMetaControls in the doc-controls meta row.
        position: 'sidebar',
      },
    },
    {
      name: 'series',
      type: 'select',
      required: true,
      defaultValue: 'devi-navaratri',
      options: [{ label: 'Devi Navaratrula Jnanam', value: 'devi-navaratri' }],
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
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      admin: { position: 'sidebar' },
    },
    {
      name: 'chapterEditor',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/admin/ReadingChapterEditor#ReadingChapterEditor',
        },
      },
    },
    {
      name: 'titleTe',
      type: 'text',
      required: true,
      label: 'Title (Telugu)',
      admin: { hidden: true },
    },
    {
      name: 'titleEn',
      type: 'text',
      required: true,
      label: 'Title (English)',
      admin: { hidden: true },
    },
    {
      name: 'subtitleTe',
      type: 'text',
      label: 'Day subtitle (Telugu)',
      admin: { hidden: true },
    },
    {
      name: 'subtitleEn',
      type: 'text',
      label: 'Day subtitle (English)',
      admin: { hidden: true },
    },
    {
      name: 'bodyHtmlTe',
      type: 'textarea',
      label: 'Body HTML (Telugu)',
      maxLength: 1_000_000,
      admin: {
        // Edited via ReadingChapterEditor (same h2/p chapters as Astro).
        hidden: true,
      },
    },
    {
      name: 'bodyHtmlEn',
      type: 'textarea',
      label: 'Body HTML (English)',
      maxLength: 1_000_000,
      admin: { hidden: true },
    },
  ],
  timestamps: true,
}
