import type { CollectionConfig, Field } from 'payload'

import { applyMarkdownPasteToSections } from '../lib/applyMarkdownPaste'
import { SECTION_OPTIONS } from '../lib/magazineSections'
import { PDF_PH } from '../lib/pdfPlaceholders'

const editLang = (data?: Record<string, unknown> | null) =>
  data?.editLang === 'te' ? 'te' : 'en'

const isTe = (data: Record<string, unknown> = {}) => editLang(data) === 'te'
const isEn = (data: Record<string, unknown> = {}) => editLang(data) === 'en'

/** Payload 3 conditions: (data, siblingData, ctx) — siblingData is the adjacent object/row. */
const keyIs =
  (key: string) =>
  (_data: unknown, siblingData: Record<string, unknown> = {}) =>
    siblingData?.key === key

/** One language at a time — pair of Te/En fields with shared label */
const langPair = (opts: {
  nameTe: string
  nameEn: string
  label: string
  type?: 'text' | 'textarea'
  rows?: number
  phTe?: string
  phEn?: string
  required?: boolean
  extraCondition?: (
    data: Record<string, unknown>,
    siblingData: Record<string, unknown>,
  ) => boolean
}): Field[] => {
  const type = opts.type || 'textarea'
  const base = (lang: 'te' | 'en'): Field => {
    const name = lang === 'te' ? opts.nameTe : opts.nameEn
    const ph = lang === 'te' ? opts.phTe : opts.phEn
    const langOk = lang === 'te' ? isTe : isEn
    const condition = (
      data: Record<string, unknown> = {},
      siblingData: Record<string, unknown> = {},
    ) => {
      if (opts.extraCondition && !opts.extraCondition(data, siblingData)) return false
      return langOk(data)
    }
    if (type === 'text') {
      return {
        name,
        type: 'text',
        label: opts.label,
        required: opts.required,
        admin: { placeholder: ph, condition },
      }
    }
    return {
      name,
      type: 'textarea',
      label: opts.label,
      required: opts.required,
      admin: { rows: opts.rows ?? 3, placeholder: ph, condition },
    }
  }
  return [base('te'), base('en')]
}

const sharedText = (name: string, label: string, placeholder?: string): Field => ({
  name,
  type: 'text',
  label,
  admin: { placeholder },
})

/** Long article shown on in-site story page (newsletter keeps the short blurb). */
const fullStoryFields = (): Field[] =>
  langPair({
    nameTe: 'fullStoryTe',
    nameEn: 'fullStoryEn',
    label: 'Full story (Markdown)',
    rows: 10,
    phTe: 'పూర్తి కథ మార్క్‌డౌన్‌లో… (న్యూస్‌లెటర్‌లో చిన్న బ్లర్బ్ మాత్రమే)',
    phEn: 'Full article in Markdown… (newsletter shows only the short blurb)',
  })

const storyUrlField = (): Field => ({
  name: 'storyUrl',
  type: 'text',
  label: 'External story URL (optional)',
  admin: {
    placeholder: 'https://…',
    description:
      'Only if the full story is off-site. Prefer “Full story” above for an in-site Read more page.',
  },
})

/** Newsletter short item: full story text + optional external URL */
const storyLinkFields = (): Field[] => [...fullStoryFields(), storyUrlField()]

const campusFullStoryFields = (prefix: string, label: string): Field[] =>
  langPair({
    nameTe: `${prefix}FullStoryTe`,
    nameEn: `${prefix}FullStoryEn`,
    label: `${label} · Full story`,
    rows: 8,
    phTe: 'పూర్తి కథ…',
    phEn: 'Full article…',
    extraCondition: keyIs('campus'),
  })

const campusUrlField = (name: string, label: string): Field => ({
  name,
  type: 'text',
  label,
  admin: {
    placeholder: 'https://…',
    description: 'Optional off-site link. Prefer Full story text for in-site Read more.',
    condition: keyIs('campus'),
  },
})

export const Issues: CollectionConfig = {
  slug: 'issues',
  admin: {
    useAsTitle: 'month',
    defaultColumns: ['month', 'titleEn', 'published', 'updatedAt'],
    group: 'Magazine',
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
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        await applyMarkdownPasteToSections(data, req)
        return data
      },
    ],
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
        // Kept in sidebar for form state; visible UI is IssueDocMetaControls in doc-controls meta row.
        position: 'sidebar',
      },
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
      name: 'sectionWizard',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/admin/SectionWizard#SectionWizard',
        },
      },
    },
    {
      type: 'group',
      label: false,
      admin: {
        hideGutter: true,
        className: 'qlu-issue-cover-pane',
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
          label: 'Issue title',
          admin: {
            condition: isTe,
            placeholder: 'నెలవారీ పత్రిక శీర్షిక',
          },
          validate: (
            value: string | null | undefined,
            { data }: { data?: Record<string, unknown> },
          ) => {
            if (editLang(data) === 'te' && !value?.trim()) {
              return 'Issue title is required'
            }
            return true
          },
        },
        {
          name: 'titleEn',
          type: 'text',
          label: 'Issue title',
          admin: {
            condition: isEn,
            placeholder: 'Monthly newsletter title',
          },
          validate: (
            value: string | null | undefined,
            { data }: { data?: Record<string, unknown> },
          ) => {
            if (editLang(data) === 'en' && !value?.trim()) {
              return 'Issue title is required'
            }
            return true
          },
        },
        {
          type: 'collapsible',
          label: 'Print cover (PDF layout slots)',
          admin: {
            initCollapsed: false,
            description:
              'Page 1 of the PDF template: cover image + copy slots. Brand chrome stays fixed in Print view.',
          },
          fields: [
            {
              name: 'coverImage',
              type: 'upload',
              relationTo: 'media',
              label: 'Front cover image',
              admin: {
                description:
                  'Hero / logo art for Print page 1 (same role as the image on the PDF cover).',
              },
            },
            ...langPair({
              nameTe: 'taglineTe',
              nameEn: 'taglineEn',
              label: 'Tagline',
              type: 'text',
              phTe: PDF_PH.cover.taglineTe,
              phEn: PDF_PH.cover.taglineEn,
            }),
            ...langPair({
              nameTe: 'foundersLineTe',
              nameEn: 'foundersLineEn',
              label: 'Founders line',
              type: 'text',
              phTe: PDF_PH.cover.foundersLineTe,
              phEn: PDF_PH.cover.foundersLineEn,
            }),
            ...langPair({
              nameTe: 'foundersSubTe',
              nameEn: 'foundersSubEn',
              label: 'Founders subtitle',
              type: 'text',
              phTe: PDF_PH.cover.foundersSubTe,
              phEn: PDF_PH.cover.foundersSubEn,
            }),
            ...langPair({
              nameTe: 'invitationTe',
              nameEn: 'invitationEn',
              label: 'Cover invitation',
              rows: 4,
              phTe: PDF_PH.cover.invitationTe,
              phEn: PDF_PH.cover.invitationEn,
            }),
            ...langPair({
              nameTe: 'coverKickerTe',
              nameEn: 'coverKickerEn',
              label: 'Cover kicker (month line)',
              type: 'text',
              phTe: PDF_PH.cover.coverKickerTe,
              phEn: PDF_PH.cover.coverKickerEn,
            }),
          ],
        },
      ],
    },
    {
      name: 'sections',
      type: 'array',
      labels: { singular: 'Section', plural: 'Sections' },
      admin: {
        // Keep open so wizard right-pane fields (slots, body, images) are editable.
        initCollapsed: false,
        isSortable: false,
        components: {
          RowLabel: '/components/admin/SectionRowLabel#SectionRowLabel',
        },
      },
      fields: [
        {
          name: 'key',
          type: 'select',
          required: true,
          options: SECTION_OPTIONS,
          admin: {
            // Section is chosen from the left wizard pane; key stays in data for Print/seed.
            hidden: true,
          },
        },
        ...langPair({
          nameTe: 'headingTe',
          nameEn: 'headingEn',
          label: 'Headline',
          type: 'text',
          phTe: 'ఉదా: జ్ఞానోదయం — 583వ రోజు | పత్రీజీ జ్ఞానసారం…',
          phEn:
            'e.g. Jnanodayam — Day 583 | … (shows as main title; PDF section name stays in the eyebrow)',
        }),
        {
          name: 'asCard',
          type: 'checkbox',
          label: 'Show as card',
          defaultValue: false,
          admin: {
            condition: keyIs('themes'),
            description:
              'Print: section headline + lead above a grid; each Theme Item is its own card (Markdown blurbs). Optional first Images row shows above the cards.',
          },
        },

        // themes
        {
          type: 'collapsible',
          label: 'PDF slots · Monthly Wisdom & Key Teachings',
          admin: {
            condition: keyIs('themes'),
            initCollapsed: false,
            description: 'Fixed Print title. Fill editorial lead + theme rows.',
          },
          fields: [
            ...langPair({
              nameTe: 'leadTe',
              nameEn: 'leadEn',
              label: 'Editorial lead (Markdown)',
              rows: 6,
              phTe: PDF_PH.themes.leadTe,
              phEn: PDF_PH.themes.leadEn,
              extraCondition: keyIs('themes'),
            }),
            {
              name: 'themeItemsNav',
              type: 'ui',
              admin: {
                condition: keyIs('themes'),
                components: {
                  Field: '/components/admin/ThemeItemsTabs#ThemeItemsTabs',
                },
              },
            },
            {
              name: 'themeItems',
              type: 'array',
              labels: { singular: 'Theme', plural: 'Themes' },
              admin: {
                condition: keyIs('themes'),
                className: 'qlu-theme-items-array',
                initCollapsed: false,
                components: {
                  RowLabel: '/components/admin/ThemeItemRowLabel#ThemeItemRowLabel',
                },
              },
              fields: [
                ...langPair({
                  nameTe: 'titleTe',
                  nameEn: 'titleEn',
                  label: 'Theme title',
                  type: 'text',
                  phTe: PDF_PH.themes.themeTitleTe,
                  phEn: PDF_PH.themes.themeTitleEn,
                }),
                ...langPair({
                  nameTe: 'blurbTe',
                  nameEn: 'blurbEn',
                  label: 'Theme blurb (Markdown)',
                  rows: 6,
                  phTe: 'మార్క్‌డౌన్ సపోర్ట్: **బొద్దు**, జాబితాలు, పేరాలు…',
                  phEn: 'Markdown supported: **bold**, lists, paragraphs…',
                }),
                ...storyLinkFields(),
              ],
            },
          ],
        },

        // classes
        {
          type: 'collapsible',
          label: 'PDF slots · Featured Classes & Insights',
          admin: {
            condition: keyIs('highlight-classes'),
            initCollapsed: false,
          },
          fields: [
            {
              name: 'classItems',
              type: 'array',
              labels: { singular: 'Class', plural: 'Classes' },
              fields: [
                ...langPair({
                  nameTe: 'titleTe',
                  nameEn: 'titleEn',
                  label: 'Class title',
                  type: 'text',
                  phTe: PDF_PH.classes.titleTe,
                  phEn: PDF_PH.classes.titleEn,
                }),
                sharedText('speaker', 'Speaker', PDF_PH.classes.speaker),
                sharedText('date', 'Date (if confirmed)', PDF_PH.classes.date),
                ...langPair({
                  nameTe: 'insightTe',
                  nameEn: 'insightEn',
                  label: 'Insight',
                  rows: 2,
                  phTe: PDF_PH.classes.insightTe,
                  phEn: PDF_PH.classes.insightEn,
                }),
                ...storyLinkFields(),
              ],
            },
          ],
        },

        // experiences
        {
          type: 'collapsible',
          label: 'PDF slots · Voices of Transformation',
          admin: {
            condition: keyIs('experiences'),
            initCollapsed: false,
          },
          fields: [
            {
              name: 'stories',
              type: 'array',
              labels: { singular: 'Story', plural: 'Stories' },
              fields: [
                sharedText('name', 'Participant name', PDF_PH.stories.name),
                sharedText('location', 'Location (optional)', PDF_PH.stories.location),
                ...langPair({
                  nameTe: 'bodyTe',
                  nameEn: 'bodyEn',
                  label: 'Story',
                  rows: 5,
                  phTe: PDF_PH.stories.bodyTe,
                  phEn: PDF_PH.stories.bodyEn,
                }),
                ...storyLinkFields(),
              ],
            },
          ],
        },

        // visits
        {
          type: 'collapsible',
          label: 'PDF slots · Dr. Newton’s Spiritual Outreach',
          admin: {
            condition: keyIs('visits'),
            initCollapsed: false,
          },
          fields: [
            {
              name: 'visitItems',
              type: 'array',
              labels: { singular: 'Visit', plural: 'Visits' },
              fields: [
                sharedText('date', 'Date', PDF_PH.visits.date),
                sharedText('place', 'Place', PDF_PH.visits.place),
                ...langPair({
                  nameTe: 'noteTe',
                  nameEn: 'noteEn',
                  label: 'Note',
                  rows: 3,
                  phTe: PDF_PH.visits.noteTe,
                  phEn: PDF_PH.visits.noteEn,
                }),
                ...storyLinkFields(),
              ],
            },
          ],
        },

        // vanya
        {
          type: 'collapsible',
          label: 'PDF slots · Vanya Maitreya Highlights',
          admin: {
            condition: keyIs('vanya'),
            initCollapsed: false,
          },
          fields: [
            {
              name: 'featureItems',
              type: 'array',
              labels: { singular: 'Feature', plural: 'Features' },
              fields: [
                ...langPair({
                  nameTe: 'titleTe',
                  nameEn: 'titleEn',
                  label: 'Feature title',
                  type: 'text',
                  phTe: PDF_PH.vanya.titleTe,
                  phEn: PDF_PH.vanya.titleEn,
                }),
                ...langPair({
                  nameTe: 'bodyTe',
                  nameEn: 'bodyEn',
                  label: 'Feature body',
                  rows: 4,
                  phTe: PDF_PH.vanya.bodyTe,
                  phEn: PDF_PH.vanya.bodyEn,
                }),
                ...storyLinkFields(),
              ],
            },
          ],
        },

        // campus
        {
          type: 'collapsible',
          label: 'PDF slots · Goloka / Sahasrara / QLU',
          admin: {
            condition: keyIs('campus'),
            initCollapsed: false,
          },
          fields: [
            ...langPair({
              nameTe: 'golokaTe',
              nameEn: 'golokaEn',
              label: 'Goloka update',
              rows: 3,
              phTe: PDF_PH.campus.golokaTe,
              phEn: PDF_PH.campus.golokaEn,
              extraCondition: keyIs('campus'),
            }),
            ...campusFullStoryFields('goloka', 'Goloka'),
            campusUrlField('golokaUrl', 'Goloka external URL (optional)'),
            ...langPair({
              nameTe: 'sahasraraTe',
              nameEn: 'sahasraraEn',
              label: 'Sahasrara update',
              rows: 3,
              phTe: PDF_PH.campus.sahasraraTe,
              phEn: PDF_PH.campus.sahasraraEn,
              extraCondition: keyIs('campus'),
            }),
            ...campusFullStoryFields('sahasrara', 'Sahasrara'),
            campusUrlField('sahasraraUrl', 'Sahasrara external URL (optional)'),
            ...langPair({
              nameTe: 'qluTe',
              nameEn: 'qluEn',
              label: 'QLU update',
              rows: 3,
              phTe: PDF_PH.campus.qluTe,
              phEn: PDF_PH.campus.qluEn,
              extraCondition: keyIs('campus'),
            }),
            ...campusFullStoryFields('qlu', 'QLU'),
            campusUrlField('qluUrl', 'QLU external URL (optional)'),
          ],
        },

        // upcoming
        {
          type: 'collapsible',
          label: 'PDF slots · Upcoming Events & Announcements',
          admin: {
            condition: keyIs('upcoming'),
            initCollapsed: false,
          },
          fields: [
            {
              name: 'eventItems',
              type: 'array',
              labels: { singular: 'Event', plural: 'Events' },
              fields: [
                sharedText('when', 'Date / time', PDF_PH.events.when),
                ...langPair({
                  nameTe: 'titleTe',
                  nameEn: 'titleEn',
                  label: 'Programme title',
                  type: 'text',
                  phTe: PDF_PH.events.titleTe,
                  phEn: PDF_PH.events.titleEn,
                }),
                ...langPair({
                  nameTe: 'venueTe',
                  nameEn: 'venueEn',
                  label: 'Venue / platform',
                  type: 'text',
                  phTe: PDF_PH.events.venueTe,
                  phEn: PDF_PH.events.venueEn,
                }),
                ...langPair({
                  nameTe: 'detailsTe',
                  nameEn: 'detailsEn',
                  label: 'Details',
                  rows: 2,
                  phTe: PDF_PH.events.detailsTe,
                  phEn: PDF_PH.events.detailsEn,
                }),
                ...storyLinkFields(),
              ],
            },
          ],
        },

        {
          name: 'bodyTeMd',
          type: 'textarea',
          label: 'Paste Markdown',
          admin: {
            rows: 8,
            condition: isTe,
            description: 'On Save → Body. Cleared after save. Use for bullets / freeform under PDF slots.',
            placeholder: 'Paste Telugu .md here…',
          },
        },
        {
          name: 'bodyTe',
          type: 'richText',
          label: 'Body',
          admin: {
            condition: isTe,
            description:
              'Freeform body (lists, paragraphs). Shows in all views; in Print it appears under the PDF slots when both are filled.',
          },
        },
        {
          name: 'bodyEnMd',
          type: 'textarea',
          label: 'Paste Markdown',
          admin: {
            rows: 8,
            condition: isEn,
            description: 'On Save → Body. Cleared after save. Use for bullets / freeform under PDF slots.',
            placeholder: 'Paste English .md here…',
          },
        },
        {
          name: 'bodyEn',
          type: 'richText',
          label: 'Body',
          admin: {
            condition: isEn,
            description:
              'Freeform body (lists, paragraphs). Shows in all views; in Print it appears under the PDF slots when both are filled.',
          },
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
            ...langPair({
              nameTe: 'captionTe',
              nameEn: 'captionEn',
              label: 'Caption',
              type: 'text',
            }),
            ...langPair({
              nameTe: 'altTe',
              nameEn: 'altEn',
              label: 'Alt text',
              type: 'text',
            }),
          ],
        },
      ],
    },
  ],
}

