import type { CollectionConfig } from 'payload'

import { SECTION_OPTIONS } from '../lib/magazineSections'

export const Issues: CollectionConfig = {
  slug: 'issues',
  admin: {
    useAsTitle: 'month',
    defaultColumns: ['month', 'titleEn', 'published', 'updatedAt'],
    group: 'Magazine',
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true
      return { published: { equals: true } }
    },
  },
  fields: [
    {
      name: 'month',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Issue id YYYY-MM (e.g. 2026-10)',
      },
      validate: (value: string | null | undefined) => {
        if (!value || !/^\d{4}-\d{2}$/.test(value)) {
          return 'Use YYYY-MM'
        }
        return true
      },
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
      name: 'published',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'sections',
      type: 'array',
      labels: { singular: 'Section', plural: 'Sections' },
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'key',
          type: 'select',
          required: true,
          options: SECTION_OPTIONS,
        },
        {
          name: 'headingTe',
          type: 'text',
          label: 'Heading (Telugu)',
        },
        {
          name: 'headingEn',
          type: 'text',
          label: 'Heading (English)',
        },
        {
          name: 'bodyTe',
          type: 'richText',
          label: 'Body (Telugu)',
        },
        {
          name: 'bodyEn',
          type: 'richText',
          label: 'Body (English)',
        },
        {
          name: 'images',
          type: 'array',
          labels: { singular: 'Image', plural: 'Images' },
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              required: true,
            },
            {
              name: 'align',
              type: 'select',
              defaultValue: 'center',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
                { label: 'Right', value: 'right' },
                { label: 'Full width', value: 'full' },
              ],
            },
            {
              name: 'size',
              type: 'select',
              defaultValue: 'md',
              options: [
                { label: 'Small', value: 'sm' },
                { label: 'Medium', value: 'md' },
                { label: 'Large', value: 'lg' },
                { label: 'Full', value: 'full' },
              ],
            },
            {
              name: 'captionTe',
              type: 'text',
              label: 'Caption (Telugu)',
            },
            {
              name: 'captionEn',
              type: 'text',
              label: 'Caption (English)',
            },
            {
              name: 'altTe',
              type: 'text',
              label: 'Alt (Telugu)',
            },
            {
              name: 'altEn',
              type: 'text',
              label: 'Alt (English)',
            },
          ],
        },
      ],
    },
  ],
}
