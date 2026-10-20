
import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Archive,
  FilePlus2,
  FileText,
  MessageSquareText,
  Pencil,
  Search,
  Send,
  Trash2,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  archiveDocument,
  createDocument,
  deleteDocument,
  routeDocumentSimple,
  routeWithInstruction,
} from '../lib/documentActions'
import ModalButton from '../components/ModalButton'
import DocumentForm from '../components/DocumentForm'
import QuickRouteForm from '../components/QuickRouteForm'
import ActionSlipForm from '../components/ActionSlipForm'

type Office = {
  code: string
  color: string
}

type DocumentRow = {
  id: string
  doc_date: string
  doc_type: string | null
  tracking_no: string | null
  file_name: string | null
  particulars: string
  value: number | null
  route: string[] | null
  route_status: string | null
  date_routed: string | null
  routing_particulars: string | null
  created_at: string
}

type Tab = 'dashboard' | 'current' | 'routed' | 'archived'

const TABS: { key: Tab; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'current', label: 'Current' },
  { key: 'routed', label: 'Routed' },
  { key: 'archived', label: 'Archived' },
]



function displayDate(value: string | null | undefined) {
  if (!value) return ''

  const parts = value.slice(0, 10).split('-')
  if (parts.length !== 3) return value

  return `${parts[1]}/${parts[2]}/${parts[0]}`
}

function officeColor(code: string, offices: Office[]) {
  return offices.find((office) => office.code === code)?.color ?? '#64748b'
}

export default function DocumentsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedView = searchParams.get('view') as Tab | null
  const view: Tab = TABS.some((tab) => tab.key === requestedView)
    ? requestedView!
    : 'dashboard'

  const query = searchParams.get('q') ?? ''

  const [documents, setDocuments] = useState<DocumentRow[]>([])
  const [docTypes, setDocTypes] = useState<string[]>([])
  const [statuses, setStatuses] = useState<string[]>([])
  const [offices, setOffices] = useState<Office[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState(query)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [
        { data: typeRows, error: typeError },
        { data: statusRows, error: statusError },
        { data: officeRows, error: officeError },
        { data: documentRows, error: documentError },
      ] = await Promise.all([
        supabase.from('doc_types').select('name').order('name'),
        supabase.from('route_statuses').select('name').order('name'),
        supabase.from('offices').select('code, color').order('code'),
        supabase
          .from('documents')
          .select(
            'id, doc_date, doc_type, tracking_no, file_name, particulars, value, route, route_status, date_routed, routing_particulars, created_at',
          )
          .order('doc_date', { ascending: false })
          .order('created_at', { ascending: false }),
      ])

      if (typeError) throw typeError
      if (statusError) throw statusError
      if (officeError) throw officeError
      if (documentError) throw documentError

      setDocTypes((typeRows ?? []).map((row) => row.name))
      setStatuses((statusRows ?? []).map((row) => row.name))
      setOffices((officeRows ?? []) as Office[])
      setDocuments((documentRows ?? []) as DocumentRow[])
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load documents. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    setSearchInput(query)
  }, [query])

  const currentDocuments = documents.filter(
    (doc) =>
      (doc.route ?? []).includes('OSDS') &&
      doc.route_status !== 'ARCHIVED',
  )

  const routedDocuments = documents.filter(
    (doc) =>
      !(doc.route ?? []).includes('OSDS') &&
      doc.route_status !== 'ARCHIVED',
  )

  const archivedDocuments = documents.filter(
    (doc) => doc.route_status === 'ARCHIVED',
  )

  const searchable = (doc: DocumentRow) => {
    const text = [
      doc.particulars,
      doc.file_name,
      doc.tracking_no,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return text.includes(query.trim().toLowerCase())
  }

  const visibleDocuments =
    view === 'current'
      ? currentDocuments.filter(searchable)
      : view === 'routed'
        ? routedDocuments.filter(searchable)
        : view === 'archived'
          ? archivedDocuments.filter(searchable)
          : []

  async function performAction(
    action: () => Promise<void>,
    successMessage: string,
    reloadPage = true,
  ) {
    setSubmitting(true)
    setError(null)
    setNotice(null)

    try {
      await action()
      setNotice(successMessage)

      if (reloadPage) {
        await loadData()
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'The operation failed. Please try again.',
      )
      throw err
    } finally {
      setSubmitting(false)
    }
  }

  function changeView(nextView: Tab) {
    const next = new URLSearchParams(searchParams)
    next.set('view', nextView)
    if (!next.has('q')) next.delete('q')
    setSearchParams(next)
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = new URLSearchParams(searchParams)
    next.set('view', view)
    if (searchInput.trim()) {
      next.set('q', searchInput.trim())
    } else {
      next.delete('q')
    }
    setSearchParams(next)
  }

  async function handleDelete(doc: DocumentRow) {
    const confirmed = window.confirm(
      `Permanently delete document "${doc.tracking_no || doc.particulars}"? This cannot be undone.`,
    )
    if (!confirmed) return

    await performAction(
      () => deleteDocument(doc.id),
      'Document deleted successfully.',
    )
  }

  async function handleArchive(doc: DocumentRow) {
    const confirmed = window.confirm(
      `Archive document "${doc.tracking_no || doc.particulars}"?`,
    )
    if (!confirmed) return

    await performAction(
      () => archiveDocument(doc.id),
      'Document archived successfully.',
    )
  }

  const currency = (value: number | null) =>
    value == null
      ? ''
      : new Intl.NumberFormat('en-PH', {
          style: 'currency',
          currency: 'PHP',
        }).format(value)

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">
                SCHOOLS DIVISION OF SAGAY
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                OSDS Document Routing
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                Monitor, route, and manage incoming office documents.
                </p>
            </div>

            
            <ModalButton
            label={
                <>
                <FilePlus2 size={17} />
                New Document
                </>
            }
            title="Register New Document"
            buttonClassName="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800"
            >
            {(close) => (
                <DocumentForm
                onSubmit={async (formData) => {
                    await performAction(
                    async () => {
                        await createDocument(formData)
                        close()
                    },
                    'Document registered successfully.',
                    )
                    changeView('current')
                }}
                docTypes={docTypes}
                statuses={statuses}
                offices={offices}
                showRouting={false}
                submitLabel="Register Document"
                submitting={submitting}
                />
            )}
            </ModalButton>

        </header>


        <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => changeView(tab.key)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                view === tab.key
                  ? 'bg-sky-700 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {error && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void loadData()}
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            {notice}
          </div>
        )}

        {view === 'dashboard' && (
          <section className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <button
                type="button"
                onClick={() => changeView('current')}
                className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-sky-300 hover:shadow"
              >
                <p className="text-sm font-medium text-slate-500">
                  Current at OSDS
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {currentDocuments.length}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Documents awaiting routing
                </p>
              </button>

              <button
                type="button"
                onClick={() => changeView('routed')}
                className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-sky-300 hover:shadow"
              >
                <p className="text-sm font-medium text-slate-500">
                  Routed Documents
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {routedDocuments.length}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Documents sent to other offices
                </p>
              </button>

              <button
                type="button"
                onClick={() => changeView('archived')}
                className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-sky-300 hover:shadow"
              >
                <p className="text-sm font-medium text-slate-500">
                  Archived
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {archivedDocuments.length}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Documents marked as archived
                </p>
              </button>
            </div>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-slate-900">
                Routed Documents by Office
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Counts each office listed in a document's routing destination.
              </p>

              {offices.filter((office) => office.code !== 'OSDS').length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">
                  No office records found.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {offices
                    .filter((office) => office.code !== 'OSDS')
                    .map((office) => {
                      const count = routedDocuments.filter((doc) =>
                        (doc.route ?? []).includes(office.code),
                      ).length

                      const total = Math.max(routedDocuments.length, 1)
                      const percentage = Math.min((count / total) * 100, 100)

                      return (
                        <div key={office.code}>
                          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                            <span className="flex items-center gap-2 font-medium text-slate-700">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: office.color }}
                              />
                              {office.code}
                            </span>
                            <span className="tabular-nums text-slate-500">
                              {count}
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: office.color,
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </section>
          </section>
        )}

        {view !== 'dashboard' && (
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-semibold text-slate-900">
                  {TABS.find((tab) => tab.key === view)?.label} Documents
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {visibleDocuments.length} document
                  {visibleDocuments.length === 1 ? '' : 's'}
                </p>
              </div>

              <form onSubmit={submitSearch} className="flex w-full gap-2 sm:max-w-md">
                <label className="relative min-w-0 flex-1">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search tracking no., file name, particulars..."
                    className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  Search
                </button>
              </form>
            </div>

            {loading ? (
              <p className="p-8 text-center text-sm text-slate-500">
                Loading documents...
              </p>
            ) : visibleDocuments.length === 0 ? (
              <div className="p-10 text-center">
                <FileText size={30} className="mx-auto text-slate-300" />
                <p className="mt-3 font-medium text-slate-700">
                  No documents found
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Try another search term or check another tab.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] border-collapse text-center text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="border border-slate-200 px-4 py-1 font-semibold text-center">Date</th>
                      <th className="border border-slate-200 px-4 py-1 font-semibold text-center">Doc Type</th>
                      <th className="border border-slate-200 px-4 py-1 font-semibold text-center">Tracking</th>
                      <th className="border border-slate-200 px-4 py-1 font-semibold text-center">File Name</th>
                      <th className="border border-slate-200 px-4 py-1 font-semibold text-center">Particulars</th>
                      <th className="border border-slate-200 px-4 py-1 font-semibold text-center">Value</th>
                      {view === 'routed' && (
                        <>
                          <th className="border border-slate-200 px-4 py-1 font-semibold text-center">Route</th>
                          <th className="border border-slate-200 px-4 py-1 font-semibold text-center">Status</th>
                          <th className="border border-slate-200 px-4 py-1 font-semibold text-center">Date Routed</th>
                          <th className="border border-slate-200 px-4 py-1 font-semibold text-left">Routing Particulars</th>
                        </>
                      )}
                      <th className="border border-slate-200 px-4 py-1 font-semibold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleDocuments.map((doc) => (
                      <tr key={doc.id} className="align-top hover:bg-slate-50/70">
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {displayDate(doc.doc_date)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {doc.doc_type || ''}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {doc.tracking_no || ''}
                        </td>
                        <td className="max-w-48 px-4 py-3 text-slate-600">
                          <span className="line-clamp-2">{doc.file_name || ''}</span>
                        </td>
                        <td className="max-w-72 px-4 py-3 text-slate-700">
                          <span className="line-clamp-3">{doc.particulars}</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {currency(doc.value)}
                        </td>

                        {view === 'routed' && (
                          <>
                            <td className="max-w-48 px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {(doc.route ?? []).map((code) => (
                                  <span
                                    key={code}
                                    className="rounded-md px-2 py-1 text-xs font-semibold text-white"
                                    style={{ backgroundColor: officeColor(code, offices) }}
                                  >
                                    {code}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {doc.route_status || ''}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                              {displayDate(doc.date_routed)}
                            </td>
                            <td className="max-w-64 px-4 py-3 text-slate-600">
                              <span className="line-clamp-3">
                                {doc.routing_particulars || ''}
                              </span>
                            </td>
                          </>
                        )}

                        <td className="px-4 py-1">
                          <div className="flex justify-end gap-1">
                            {view === 'current' && (
                              <>
                                <ModalButton
                                  label={<Send size={16} />}
                                  title="Quick Route"
                                  tooltip="Quick Route"
                                  buttonClassName="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-orange-100"
                                >
                                  <QuickRouteForm
                                    offices={offices}
                                    submitting={submitting}
                                    onSubmit={async (formData) => {
                                      await performAction(
                                        () => routeDocumentSimple(doc.id, formData),
                                        'Document routed successfully.',
                                      )
                                    }}
                                  />
                                </ModalButton>

                                <ModalButton
                                  label={<MessageSquareText size={16} />}
                                  title="Document Action Slip"
                                  tooltip="Route with instructions"
                                  buttonClassName="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-yellow-100"
                                >
                                  <ActionSlipForm
                                    submitting={submitting}
                                    onSubmit={async (formData) => {
                                      await performAction(
                                        () => routeWithInstruction(doc.id, formData),
                                        'Document routed with instructions.',
                                      )
                                    }}
                                  />
                                </ModalButton>
                              </>
                            )}

                            <Link
                              to={`/documents/${doc.id}/edit`}
                              title="Edit document"
                              aria-label="Edit document"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-blue-100 "
                            >
                              <Pencil size={16} />
                            </Link>

                            {view === 'current' && (
                              <button
                                type="button"
                                title="Archive document"
                                aria-label="Archive document"
                                onClick={() => void handleArchive(doc).catch(() => {})}
                                disabled={submitting}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-50"
                              >
                                <Archive size={16} />
                              </button>
                            )}

                            {view !== 'routed' && (
                              <button
                                type="button"
                                title="Delete document"
                                aria-label="Delete document"
                                onClick={() => void handleDelete(doc).catch(() => {})}
                                disabled={submitting}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {loading && view === 'dashboard' && (
          <p className="text-sm text-slate-500">Loading dashboard data...</p>
        )}

        <footer className="border-t border-slate-200 pt-4 text-xs text-slate-400">
          OSDS Routing System
        </footer>
      </div>
    </main>
  )
}
