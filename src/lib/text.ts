// Minimal common-prefix/suffix diff between two strings. Used so a contentEditable
// edit only replaces the span that actually changed, preserving marks and blocks
// outside it (rather than rewriting the whole segment on every keystroke).
export function diffRange(previous: string, next: string): { prefix: number; suffix: number } {
  let prefix = 0
  while (prefix < previous.length && prefix < next.length && previous[prefix] === next[prefix]) prefix += 1
  let suffix = 0
  while (
    suffix < previous.length - prefix
    && suffix < next.length - prefix
    && previous[previous.length - 1 - suffix] === next[next.length - 1 - suffix]
  ) suffix += 1
  return { prefix, suffix }
}
