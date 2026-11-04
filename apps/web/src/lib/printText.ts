/** Preserve textarea newlines as block paragraphs for Print view. */
export function linesToParagraphs(raw: string): string[] {
  return raw
    .replace(/\r\n/g, '\n')
    .split(/\n/)
    .map((l) => l.trimEnd())
    .reduce<string[]>((acc, line) => {
      if (line.trim() === '') {
        // keep a blank paragraph marker for extra spacing between bullets/lines
        if (acc.length && acc[acc.length - 1] !== '') acc.push('')
        return acc
      }
      acc.push(line.trim())
      return acc
    }, [])
}
