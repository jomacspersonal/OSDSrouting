export type Child = { label: string; code?: string }
export type Group = { code: string; label: string; children?: Child[] }
export const QUICK_STATUSES = ['FOR REVISION', 'SIGNED', 'UNSIGNED','FOR DISSEMINATION']
export const GROUPS: Group[] = [
  { code: 'ASDS', label: 'ASDS' },
  { code: 'LEGAL', label: 'LEGAL' },
  { code: 'ICT', label: 'ICT' },
  {
    code: 'ADMIN',
    label: 'ADMIN & GEN SERVICES',
    children: [
      { label: 'HR', code: 'PERSONNEL' },
      { label: 'PROPERTY & SUPPLY', code: 'SUPPLY' },
      { label: 'RECORDS', code: 'RECORDS' },
      { label: 'CASH', code: 'CASH' },
      { label: 'PROCUREMENT', code: 'PROCUREMENT' },
    ],
  },
  { code: 'ACCOUNTING', label: 'ACCOUNTING' },
  { code: 'BUDGET', label: 'BUDGET' },
  {
    code: 'CID',
    label: 'CID CHIEF',
    children: ['EPS', 'LRMDS', 'ALS', 'PSDS'].map(label => ({ label })),
  },
  {
    code: 'SGOD',
    label: 'SGOD CHIEF',
    children: [
      'EPS', 'PLANNING & RESEARCH', 'M&E', 'HRD', 'SOCIAL MOBILIZATION',
      'EDUCATIONAL FACILITIES', 'DRRM', 'SCHOOL HEALTH AND NUTRITION', 'YOUTH FORMATION',
    ].map(label => ({ label })),
  },
  { code: 'SCHOOL HEAD', label: 'SCHOOL HEAD' },
]

export const INSTRUCTIONS = [
  'For Initial',
  'For Filing',
  'For your information',
  'For Compliance',
  'For your participation',
  'For Comment/Recommendation',
  'For note & return',
  'For investigation/verification/validation',
  'For Appropriate Action',
  'Please give preferential attention',
  'Urgent/Expedite Action',
  'Please prepare reply/indorsement',
  'For information dissemination',
  'Please come for conference',
]

// Builds the text for the "Routing Particulars" column, like your spreadsheet:
//   PROCUREMENT ; LRMDS / FOR COMMENT/RECOMMENDATION — remarks
export function buildRoutingParticulars(
  picked: string[],
  units: string[],
  instructions: string[],
  remarks: string,
) {
  // EPS exists under both CID and SGOD, so those get the office name in front
  const counts: Record<string, number> = {}
  GROUPS.forEach(g => g.children?.forEach(c => {
    if (!c.code) counts[c.label] = (counts[c.label] ?? 0) + 1
  }))

  const subs: string[] = []
  for (const g of GROUPS) {
    for (const c of g.children ?? []) {
      if (c.code && picked.includes(c.code)) subs.push(c.label)
      if (!c.code && units.includes(`${g.code}:${c.label}`)) {
        subs.push(counts[c.label] > 1 ? `${g.code} ${c.label}` : c.label)
      }
    }
  }

  const left = subs.join(' ; ')
  const right = instructions.map(i => i.toUpperCase()).join(' ; ')
  const main = [left, right].filter(Boolean).join(' / ')
  return [main, remarks].filter(Boolean).join(' — ') || null
}