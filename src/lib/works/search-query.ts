// Turns what a reader types into a safe PostgreSQL full-text query.
//
// "quiet  assassin" -> "quiet & assassin:*"
//
// Only letters, numbers and marks survive, so the result can never contain
// tsquery operators typed by the user. The last word gets ":*" so results
// appear while someone is still typing ("assas" matches "assassin").
// The query is always sent to the database as a parameter, never pasted into SQL.

const MAX_TERMS = 8;
const MAX_TERM_LENGTH = 40;

export function searchTerms(input: string): string[] {
  return input
    .normalize("NFC")
    .toLowerCase()
    .split(/[^\p{L}\p{N}\p{M}]+/u)
    .filter(Boolean)
    .map((term) => term.slice(0, MAX_TERM_LENGTH))
    .slice(0, MAX_TERMS);
}

export function toPrefixTsQuery(input: string): string | null {
  const terms = searchTerms(input);
  if (terms.length === 0) return null;
  return terms.map((term, index) => (index === terms.length - 1 ? `${term}:*` : term)).join(" & ");
}
