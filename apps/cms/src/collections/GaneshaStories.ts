import type { CollectionConfig } from 'payload'

/** Collection slug kept as `ganesha-stories` for existing data; admin/public brand is Stories. */
export const GaneshaStories: CollectionConfig = {
  slug: 'ganesha-stories',
  labels: {
    singular: 'Story',
    plural: 'Stories',
  },
  admin: {
    useAsTitle: 'titleEn',
    defaultColumns: ['sortOrder', 'titleEn', 'label', 'published', 'updatedAt'],
    group: 'Stories',
    description: 'Stories and deeper understandings — use Label to tag themes (e.g. Sri Ganesha Tattva).',
    listSearchableFields: ['titleEn', 'titleTe', 'label', 'slug', 'speaker'],
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
      defaultValue: 'te',
      options: [
        { label: 'English', value: 'en' },
        { label: 'తెలుగు (Telugu)', value: 'te' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'label',
      type: 'text',
      label: 'Label',
      defaultValue: 'Sri Ganesha Tattva',
      admin: {
        position: 'sidebar',
        description: 'Theme tag for search/filter later (not a site section). e.g. Sri Ganesha Tattva',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
        description: 'URL slug, e.g. vakratunda-matsarasura',
      },
    },
    {
      name: 'sortOrder',
      type: 'number',
      required: true,
      defaultValue: 1,
      min: 1,
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
      name: 'jnanodayamDay',
      type: 'number',
      label: 'Jnanodayam day',
      admin: { position: 'sidebar' },
    },
    {
      name: 'speaker',
      type: 'text',
      admin: { position: 'sidebar' },
    },
    {
      name: 'videoUrl',
      type: 'text',
      label: 'YouTube URL',
      admin: { position: 'sidebar' },
    },
    {
      name: 'storyEditor',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/admin/GaneshaStoryEditor#GaneshaStoryEditor',
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
      name: 'taglineTe',
      type: 'text',
      label: 'Tagline (Telugu)',
      admin: { hidden: true },
    },
    {
      name: 'taglineEn',
      type: 'text',
      label: 'Tagline (English)',
      admin: { hidden: true },
    },
    {
      name: 'bodyMarkdownTe',
      type: 'textarea',
      label: 'Body Markdown (Telugu)',
      maxLength: 1_000_000,
      admin: { hidden: true },
    },
    {
      name: 'bodyMarkdownEn',
      type: 'textarea',
      label: 'Body Markdown (English)',
      maxLength: 1_000_000,
      admin: { hidden: true },
    },
  ],
  timestamps: true,
}
