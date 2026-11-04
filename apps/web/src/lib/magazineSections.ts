/** Section keys + PDF Print titles — keep in sync with apps/cms/src/lib/magazineSections.ts */

export const SECTION_KEYS = [
  'masthead',
  'themes',
  'highlight-classes',
  'experiences',
  'visits',
  'vanya',
  'campus',
  'upcoming',
  'closing',
] as const

export type SectionKey = (typeof SECTION_KEYS)[number]

export const PDF_SECTION_TITLES: Record<
  SectionKey,
  { te: string; en: string; num: string; blurbTe: string; blurbEn: string }
> = {
  masthead: { te: 'ముఖచిత్రం', en: 'Cover', num: '00', blurbTe: '', blurbEn: '' },
  themes: {
    te: 'ఈ నెల ఆధ్యాత్మిక జ్ఞానసారం',
    en: 'Monthly Wisdom & Key Teachings',
    num: '01',
    blurbTe: 'నెల మధ్య ఆలోచనలు మరియు పాఠాలు',
    blurbEn: 'The month’s central ideas and lessons',
  },
  'highlight-classes': {
    te: 'ఈ నెల విశిష్ట తరగతులు – జ్ఞానాంశాలు',
    en: 'Featured Classes & Insights',
    num: '02',
    blurbTe: 'ఎంచుకున్న క్లాసులు మరియు తీసుకోవలసినవి',
    blurbEn: 'Selected classes and their practical takeaways',
  },
  experiences: {
    te: 'ఆత్మపరివర్తన అనుభవాలు',
    en: 'Voices of Transformation',
    num: '03',
    blurbTe: 'పాల్గొన్నవారి అనుభవాలు మరియు ప్రతిబింబాలు',
    blurbEn: 'Participant experiences and reflections',
  },
  visits: {
    te: 'డా. న్యూటన్ గారి ఆధ్యాత్మిక జ్ఞానప్రచారం',
    en: "Dr. Newton’s Spiritual Outreach",
    num: '04',
    blurbTe: 'నమోదైన సందర్శనలు మరియు బోధనా సమావేశాలు',
    blurbEn: 'Documented visits and teaching sessions',
  },
  vanya: {
    te: 'వన్య మైత్రేయ విశేషాలు',
    en: 'Vanya Maitreya Highlights',
    num: '05',
    blurbTe: 'నిర్ధారిత కార్యకలాపాలు మరియు ప్రతిబింబాలు',
    blurbEn: 'Verified activities and reflections',
  },
  campus: {
    te: 'గోలోక, సహస్రార మరియు QLU విశేషాలు',
    en: 'Updates from Goloka, Sahasrara & QLU',
    num: '06',
    blurbTe: 'సంస్థాగత మరియు సమాజ అభివృద్ధులు',
    blurbEn: 'Institutional and community developments',
  },
  upcoming: {
    te: 'రాబోయే ఆధ్యాత్మిక కార్యక్రమాలు – ప్రకటనలు',
    en: 'Upcoming Events & Announcements',
    num: '07',
    blurbTe: 'నిర్ధారిత తేదీలు మరియు కార్యక్రమ సమాచారం',
    blurbEn: 'Confirmed dates and programme information',
  },
  closing: { te: 'ముగింపు', en: 'Closing', num: '08', blurbTe: '', blurbEn: '' },
}

export const PDF_CONTENTS_KEYS: SectionKey[] = [
  'themes',
  'highlight-classes',
  'experiences',
  'visits',
  'vanya',
  'campus',
  'upcoming',
]

/** Shown when a main section has no content (TE + EN). */
export const EMPTY_SECTION = {
  te: 'ఈ నెలలో ఈ విభాగానికి ప్రత్యేక అప్‌డేట్ లేదు.',
  en: 'No updates for this section this month.',
}

export function isSectionKey(value: unknown): value is SectionKey {
  return typeof value === 'string' && (SECTION_KEYS as readonly string[]).includes(value)
}
