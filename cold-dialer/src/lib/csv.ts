import Papa from 'papaparse';

export const IMPORTABLE_FIELDS = [
  'first_name',
  'last_name',
  'company',
  'title',
  'phone',
  'email',
  'address',
  'city',
  'state',
  'postal_code',
  'country',
  'notes',
] as const;

export type ImportableField = (typeof IMPORTABLE_FIELDS)[number];

export const FIELD_LABELS: Record<ImportableField, string> = {
  first_name: 'First Name',
  last_name: 'Last Name',
  company: 'Company',
  title: 'Job Title',
  phone: 'Phone (required)',
  email: 'Email',
  address: 'Address',
  city: 'City',
  state: 'State',
  postal_code: 'Postal Code',
  country: 'Country',
  notes: 'Notes',
};

// Header synonyms used to auto-guess a column mapping so the user usually
// doesn't have to map anything by hand.
const SYNONYMS: Record<ImportableField, string[]> = {
  first_name: ['first name', 'firstname', 'first', 'given name'],
  last_name: ['last name', 'lastname', 'last', 'surname', 'family name'],
  company: ['company', 'company name', 'organization', 'org', 'business'],
  title: ['title', 'job title', 'position', 'role'],
  phone: ['phone', 'phone number', 'mobile', 'cell', 'telephone', 'tel', 'direct dial', 'work phone'],
  email: ['email', 'e-mail', 'email address'],
  address: ['address', 'street', 'street address'],
  city: ['city', 'town'],
  state: ['state', 'province', 'region'],
  postal_code: ['zip', 'zip code', 'postal code', 'postcode'],
  country: ['country'],
  notes: ['notes', 'note', 'comments', 'description'],
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[_-]/g, ' ').replace(/\s+/g, ' ');
}

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
  errors: string[];
}

/** Parse CSV text with header detection. Caps rows to keep memory bounded. */
export function parseCsvText(text: string, maxRows = 50000): ParsedCsv {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const errors = result.errors.slice(0, 20).map((e) => `Row ${e.row ?? '?'}: ${e.message}`);
  const headers = result.meta.fields ?? [];
  const rows = result.data.slice(0, maxRows);

  if (result.data.length > maxRows) {
    errors.push(`File has more than ${maxRows} rows; only the first ${maxRows} were read.`);
  }

  return { headers, rows, errors };
}

/** Best-effort auto mapping from CSV headers to our lead fields. */
export function guessColumnMapping(headers: string[]): Record<ImportableField, string | null> {
  const mapping = Object.fromEntries(
    IMPORTABLE_FIELDS.map((f) => [f, null])
  ) as Record<ImportableField, string | null>;

  for (const field of IMPORTABLE_FIELDS) {
    const synonyms = SYNONYMS[field];
    const match = headers.find((h) => synonyms.includes(normalizeHeader(h)));
    if (match) mapping[field] = match;
  }

  return mapping;
}

/** Apply a header->field mapping to a raw row, producing a lead-shaped record. */
export function applyMapping(
  row: Record<string, string>,
  mapping: Record<ImportableField, string | null>
): Record<ImportableField, string> {
  const out = {} as Record<ImportableField, string>;
  for (const field of IMPORTABLE_FIELDS) {
    const header = mapping[field];
    out[field] = header ? (row[header] ?? '').trim() : '';
  }
  return out;
}

/**
 * Guard against CSV formula injection (=, +, -, @, tab, CR at cell start)
 * when a value is later opened in Excel/Sheets from an exported CSV.
 * https://owasp.org/www-community/attacks/CSV_Injection
 */
export function sanitizeForCsvExport(value: string | null | undefined): string {
  const v = value ?? '';
  if (/^[=+\-@\t\r]/.test(v)) {
    return `'${v}`;
  }
  return v;
}
