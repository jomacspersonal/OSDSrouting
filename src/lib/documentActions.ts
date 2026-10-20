
import { supabase } from './supabase'
import {
  buildRoutingParticulars,
  INSTRUCTIONS,
  QUICK_STATUSES,
} from './routing'

type DocumentFormValues = {
  doc_date: string
  doc_type: string | null
  tracking_no: string | null
  file_name: string | null
  particulars: string
  value: number | null
  route: string[]
  route_status: string | null
  date_routed: string | null
  routing_particulars: string | null
}

function nullableString(value: FormDataEntryValue | null) {
  const text = typeof value === 'string' ? value.trim() : ''
  return text || null
}

function parseDocumentForm(formData: FormData): DocumentFormValues {
  const rawValue = formData.get('value')
  const valueText = typeof rawValue === 'string' ? rawValue.trim() : ''

  return {
    doc_date: String(formData.get('doc_date') ?? ''),
    doc_type: nullableString(formData.get('doc_type')),
    tracking_no: nullableString(formData.get('tracking_no')),
    file_name: nullableString(formData.get('file_name')),
    particulars: String(formData.get('particulars') ?? '').trim(),
    value: valueText === '' ? null : Number(valueText),
    route: formData.getAll('route').filter(
      (item): item is string => typeof item === 'string',
    ),
    route_status: nullableString(formData.get('route_status')),
    date_routed: nullableString(formData.get('date_routed')),
    routing_particulars: nullableString(
      formData.get('routing_particulars'),
    ),
  }
}

function getManilaDate() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value ?? ''

  return `${part('year')}-${part('month')}-${part('day')}`
}

function ensureValidDocument(values: DocumentFormValues) {
  if (!values.doc_date) {
    throw new Error('Document date is required.')
  }

  if (!values.doc_type) {
    throw new Error('Please select a document type.')
  }

  if (!values.particulars) {
    throw new Error('Particulars are required.')
  }

  if (values.value !== null && !Number.isFinite(values.value)) {
    throw new Error('Please enter a valid document value.')
  }
  
}

export async function createDocument(formData: FormData) {
  const values = parseDocumentForm(formData)
  ensureValidDocument(values)

  const { error } = await supabase.from('documents').insert({
    doc_date: values.doc_date,
    doc_type: values.doc_type,
    tracking_no: values.tracking_no,
    file_name: values.file_name,
    particulars: values.particulars,
    value: values.value,
    route: ['OSDS'],
  })

  if (error) throw new Error(error.message)
}

export async function updateDocument(id: string, formData: FormData) {
  const values = parseDocumentForm(formData)
  ensureValidDocument(values)

  const { error } = await supabase
    .from('documents')
    .update({
      doc_date: values.doc_date,
      doc_type: values.doc_type,
      tracking_no: values.tracking_no,
      file_name: values.file_name,
      particulars: values.particulars,
      value: values.value,
      route: values.route,
      route_status: values.route_status,
      date_routed: values.date_routed,
      routing_particulars: values.routing_particulars,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function routeDocumentSimple(
  id: string,
  formData: FormData,
) {
  const office = String(formData.get('route') ?? '').trim()

  if (!office) {
    throw new Error('Please select a destination office.')
  }

  const submittedStatus = String(formData.get('route_status') ?? '')
  const routeStatus = QUICK_STATUSES.includes(submittedStatus)
    ? submittedStatus
    : 'SIGNED'

  const particulars = String(
    formData.get('routing_particulars') ?? '',
  ).trim()

  const { error } = await supabase
    .from('documents')
    .update({
      route: [office],
      route_status: routeStatus,
      date_routed: getManilaDate(),
      routing_particulars: particulars || null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function routeWithInstruction(
  id: string,
  formData: FormData,
) {
  const picked = formData.getAll('route').filter(
    (item): item is string => typeof item === 'string',
  )

  const units = formData.getAll('unit').filter(
    (item): item is string => typeof item === 'string',
  )

  const instructions = formData
    .getAll('instruction')
    .filter(
      (item): item is string =>
        typeof item === 'string' && INSTRUCTIONS.includes(item),
    )

  const remarks = String(formData.get('remarks') ?? '').trim()

  const route = [
    ...new Set([...picked, ...units.map((unit) => unit.split(':')[0])]),
  ]

  if (route.length === 0) {
    throw new Error('Please select at least one receiving office or unit.')
  }

  const { error } = await supabase
    .from('documents')
    .update({
      route,
      route_units: units,
      instructions,
      remarks: remarks || null,
      route_status: 'WITH INSTRUCTION',
      date_routed: getManilaDate(),
      routing_particulars: buildRoutingParticulars(
        picked,
        units,
        instructions,
        remarks,
      ),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function archiveDocument(id: string) {
  const { error } = await supabase
    .from('documents')
    .update({ route_status: 'ARCHIVED' })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function deleteDocument(id: string) {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}
