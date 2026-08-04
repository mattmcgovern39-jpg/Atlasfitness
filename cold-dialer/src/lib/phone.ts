// Phone normalization + a best-effort NANP area-code -> US/Canada time
// zone lookup. This is a heuristic, not authoritative — it exists so the
// dialer can warn "it's 6am for this lead" before you call, not to be a
// source of truth. Users can always override a lead's time zone by hand.

/** Strip everything but digits and a leading "+". Used as the dedupe key. */
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';

  // Collapse US/Canada numbers to a consistent 10 or 11 digit form so
  // "(555) 123-4567", "555-123-4567" and "15551234567" all dedupe together.
  if (!hasPlus && digits.length === 11 && digits.startsWith('1')) {
    return digits;
  }
  if (!hasPlus && digits.length === 10) {
    return `1${digits}`;
  }
  return hasPlus ? `+${digits}` : digits;
}

export function isValidPhone(raw: string): boolean {
  const normalized = normalizePhone(raw);
  const digits = normalized.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

/** Format a normalized phone for display: +1 (555) 123-4567 */
export function formatPhone(normalized: string): string {
  const plus = normalized.startsWith('+') ? '+' : '';
  const digits = normalized.replace(/\D/g, '');

  if (digits.length === 11 && digits.startsWith('1')) {
    const d = digits.slice(1);
    return `+1 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return `${plus}${digits}`;
}

/** tel: URI for click-to-call. */
export function telHref(normalized: string): string {
  const digits = normalized.replace(/[^\d+]/g, '');
  return `tel:${digits}`;
}

function extractNanpAreaCode(normalized: string): string | null {
  const digits = normalized.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1, 4);
  if (digits.length === 10) return digits.slice(0, 3);
  return null;
}

type ZoneKey =
  | 'America/New_York'
  | 'America/Chicago'
  | 'America/Denver'
  | 'America/Phoenix'
  | 'America/Los_Angeles'
  | 'America/Anchorage'
  | 'Pacific/Honolulu';

// Best-effort NANP area code -> IANA time zone. Not exhaustive; codes not
// listed simply return null and the UI won't show a local-time warning.
const AREA_CODE_ZONES: Record<string, ZoneKey> = {
  // Eastern
  '201': 'America/New_York', '202': 'America/New_York', '203': 'America/New_York',
  '207': 'America/New_York', '212': 'America/New_York', '215': 'America/New_York',
  '216': 'America/New_York', '234': 'America/New_York', '240': 'America/New_York',
  '267': 'America/New_York', '301': 'America/New_York', '302': 'America/New_York',
  '304': 'America/New_York', '305': 'America/New_York', '315': 'America/New_York',
  '330': 'America/New_York', '336': 'America/New_York', '339': 'America/New_York',
  '351': 'America/New_York', '352': 'America/New_York', '386': 'America/New_York',
  '401': 'America/New_York', '404': 'America/New_York', '407': 'America/New_York',
  '410': 'America/New_York', '412': 'America/New_York', '413': 'America/New_York',
  '419': 'America/New_York', '434': 'America/New_York', '440': 'America/New_York',
  '443': 'America/New_York', '470': 'America/New_York', '475': 'America/New_York',
  '478': 'America/New_York', '484': 'America/New_York', '500': 'America/New_York',
  '508': 'America/New_York', '516': 'America/New_York', '517': 'America/New_York',
  '518': 'America/New_York', '561': 'America/New_York', '570': 'America/New_York',
  '571': 'America/New_York', '585': 'America/New_York', '586': 'America/New_York',
  '603': 'America/New_York', '607': 'America/New_York', '610': 'America/New_York',
  '614': 'America/New_York', '616': 'America/New_York', '617': 'America/New_York',
  '631': 'America/New_York', '646': 'America/New_York', '678': 'America/New_York',
  '681': 'America/New_York', '689': 'America/New_York', '703': 'America/New_York',
  '704': 'America/New_York', '706': 'America/New_York', '716': 'America/New_York',
  '717': 'America/New_York', '718': 'America/New_York', '724': 'America/New_York',
  '727': 'America/New_York', '732': 'America/New_York', '734': 'America/New_York',
  '740': 'America/New_York', '754': 'America/New_York', '757': 'America/New_York',
  '761': 'America/New_York', '762': 'America/New_York', '770': 'America/New_York',
  '772': 'America/New_York', '774': 'America/New_York', '781': 'America/New_York',
  '786': 'America/New_York', '804': 'America/New_York', '813': 'America/New_York',
  '814': 'America/New_York', '828': 'America/New_York', '843': 'America/New_York',
  '845': 'America/New_York', '848': 'America/New_York', '850': 'America/Chicago',
  '854': 'America/New_York', '856': 'America/New_York', '857': 'America/New_York',
  '859': 'America/New_York', '860': 'America/New_York', '862': 'America/New_York',
  '863': 'America/New_York', '864': 'America/New_York', '865': 'America/New_York',
  '904': 'America/New_York', '908': 'America/New_York', '910': 'America/New_York',
  '912': 'America/New_York', '914': 'America/New_York', '917': 'America/New_York',
  '919': 'America/New_York', '929': 'America/New_York', '937': 'America/New_York',
  '941': 'America/New_York', '954': 'America/New_York', '959': 'America/New_York',
  '973': 'America/New_York', '978': 'America/New_York', '980': 'America/New_York',
  '984': 'America/New_York', '985': 'America/Chicago',

  // Central
  '205': 'America/Chicago', '210': 'America/Chicago', '214': 'America/Chicago',
  '217': 'America/Chicago', '218': 'America/Chicago', '219': 'America/Chicago',
  '224': 'America/Chicago', '225': 'America/Chicago', '228': 'America/Chicago',
  '251': 'America/Chicago', '254': 'America/Chicago', '256': 'America/Chicago',
  '262': 'America/Chicago', '281': 'America/Chicago', '308': 'America/Chicago',
  '309': 'America/Chicago', '312': 'America/Chicago', '314': 'America/Chicago',
  '316': 'America/Chicago', '318': 'America/Chicago', '319': 'America/Chicago',
  '320': 'America/Chicago', '325': 'America/Chicago', '331': 'America/Chicago',
  '334': 'America/Chicago', '337': 'America/Chicago', '346': 'America/Chicago',
  '361': 'America/Chicago', '380': 'America/New_York', '402': 'America/Chicago',
  '405': 'America/Chicago', '409': 'America/Chicago', '414': 'America/Chicago',
  '417': 'America/Chicago', '430': 'America/Chicago', '432': 'America/Chicago',
  '469': 'America/Chicago', '479': 'America/Chicago', '501': 'America/Chicago',
  '504': 'America/Chicago', '507': 'America/Chicago', '512': 'America/Chicago',
  '515': 'America/Chicago', '531': 'America/Chicago', '534': 'America/Chicago',
  '539': 'America/Chicago', '563': 'America/Chicago', '573': 'America/Chicago',
  '580': 'America/Chicago', '601': 'America/Chicago', '605': 'America/Chicago',
  '608': 'America/Chicago', '612': 'America/Chicago', '618': 'America/Chicago',
  '620': 'America/Chicago', '629': 'America/Chicago', '630': 'America/Chicago',
  '636': 'America/Chicago', '641': 'America/Chicago', '651': 'America/Chicago',
  '660': 'America/Chicago', '662': 'America/Chicago', '682': 'America/Chicago',
  '701': 'America/Chicago', '712': 'America/Chicago', '713': 'America/Chicago',
  '715': 'America/Chicago', '731': 'America/Chicago', '763': 'America/Chicago',
  '769': 'America/Chicago', '773': 'America/Chicago', '779': 'America/Chicago',
  '785': 'America/Chicago', '806': 'America/Chicago', '815': 'America/Chicago',
  '816': 'America/Chicago', '817': 'America/Chicago', '830': 'America/Chicago',
  '832': 'America/Chicago', '847': 'America/Chicago', '870': 'America/Chicago',
  '901': 'America/Chicago', '903': 'America/Chicago', '913': 'America/Chicago',
  '915': 'America/Denver', '918': 'America/Chicago', '920': 'America/Chicago',
  '931': 'America/Chicago', '936': 'America/Chicago', '940': 'America/Chicago',
  '956': 'America/Chicago', '972': 'America/Chicago', '979': 'America/Chicago',

  // Mountain
  '208': 'America/Denver', '303': 'America/Denver', '307': 'America/Denver',
  '385': 'America/Denver', '406': 'America/Denver', '435': 'America/Denver',
  '505': 'America/Denver', '575': 'America/Denver', '719': 'America/Denver',
  '720': 'America/Denver', '801': 'America/Denver', '970': 'America/Denver',

  // Mountain, no DST
  '480': 'America/Phoenix', '520': 'America/Phoenix', '602': 'America/Phoenix',
  '623': 'America/Phoenix', '928': 'America/Phoenix',

  // Pacific
  '206': 'America/Los_Angeles', '209': 'America/Los_Angeles', '213': 'America/Los_Angeles',
  '253': 'America/Los_Angeles', '279': 'America/Los_Angeles', '310': 'America/Los_Angeles',
  '323': 'America/Los_Angeles', '360': 'America/Los_Angeles', '408': 'America/Los_Angeles',
  '415': 'America/Los_Angeles', '424': 'America/Los_Angeles', '425': 'America/Los_Angeles',
  '442': 'America/Los_Angeles', '458': 'America/Los_Angeles', '503': 'America/Los_Angeles',
  '509': 'America/Los_Angeles', '510': 'America/Los_Angeles', '530': 'America/Los_Angeles',
  '541': 'America/Los_Angeles', '559': 'America/Los_Angeles', '562': 'America/Los_Angeles',
  '564': 'America/Los_Angeles', '619': 'America/Los_Angeles', '626': 'America/Los_Angeles',
  '650': 'America/Los_Angeles', '657': 'America/Los_Angeles', '661': 'America/Los_Angeles',
  '669': 'America/Los_Angeles', '702': 'America/Los_Angeles', '707': 'America/Los_Angeles',
  '714': 'America/Los_Angeles', '725': 'America/Los_Angeles', '747': 'America/Los_Angeles',
  '760': 'America/Los_Angeles', '775': 'America/Los_Angeles', '805': 'America/Los_Angeles',
  '818': 'America/Los_Angeles', '831': 'America/Los_Angeles', '858': 'America/Los_Angeles',
  '909': 'America/Los_Angeles', '916': 'America/Los_Angeles', '925': 'America/Los_Angeles',
  '949': 'America/Los_Angeles', '951': 'America/Los_Angeles', '971': 'America/Los_Angeles',

  // Alaska / Hawaii
  '907': 'America/Anchorage',
  '808': 'Pacific/Honolulu',
};

/** Best-effort IANA time zone for a NANP phone number, or null if unknown. */
export function guessTimezone(normalized: string): string | null {
  const areaCode = extractNanpAreaCode(normalized);
  if (!areaCode) return null;
  return AREA_CODE_ZONES[areaCode] ?? null;
}
