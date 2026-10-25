/** Fixed magazine section keys — mirrors qlu-monthly-newsletter folder packs. */

export const SECTION_DIRS = [
  '00-masthead',
  '01-themes',
  '02-highlight-classes',
  '03-experiences',
  '04-visits',
  '05-vanya',
  '06-campus',
  '07-upcoming',
  '08-closing',
] as const

export type SectionDir = (typeof SECTION_DIRS)[number]

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

export const SECTION_OPTIONS = SECTION_KEYS.map((value) => ({
  label: value,
  value,
}))

export const SECTION_HEADINGS: Record<
  SectionKey,
  { te: string; en: string }
> = {
  masthead: { te: '', en: '' },
  themes: {
    te: 'ఆ నెలలో కవర్ అయిన థీమ్స్ సారాంశం',
    en: 'Summary of the themes covered in that month',
  },
  'highlight-classes': {
    te: 'నెలలో హైలైట్ క్లాసులు',
    en: 'Highlight classes of the month',
  },
  experiences: {
    te: 'పాల్గొన్నవారి కొన్ని అనుభవాలు',
    en: 'Few Experiences from Participants',
  },
  visits: {
    te: 'డా. న్యూటన్ యొక్క ఇతర ప్రాంతాల సందర్శనలు / క్లాసులు',
    en: "Dr. Newton's visits and classes in other places",
  },
  vanya: {
    te: 'వన్య మైత్రేయ హైలైట్స్',
    en: 'Vanya Maitreya Highlights',
  },
  campus: {
    te: 'గోలోక, సహస్రార మరియు QLU అప్‌డేట్స్',
    en: 'Goloka, Sahasrara and QLU Updates',
  },
  upcoming: {
    te: 'రాబోయే కార్యక్రమాలు / ప్రకటనలు',
    en: 'Upcoming Programs/Announcements',
  },
  closing: { te: 'ముగింపు', en: 'Closing' },
}

export const EMPTY_SECTION = {
  te: 'ఈ నెలలో ప్రత్యేక నివేదిక లేదు.',
  en: 'No special report this month.',
}

export function folderToKey(folder: string): SectionKey {
  const slug = folder.replace(/^\d+-/, '') as SectionKey
  if (!(SECTION_KEYS as readonly string[]).includes(slug)) {
    throw new Error(`Unknown section folder: ${folder}`)
  }
  return slug
}
