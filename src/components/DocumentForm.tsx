
import { type FormEvent, type ReactNode } from 'react'
import {
  FilePlus2,
  FileText,
  CalendarDays,
  Hash,
  UserRound,
  PhilippinePeso,
  Route,
  Building2,
  Clock,
  MessageSquareText,
  Save,
} from 'lucide-react'
import TodayDateInput from './TodayDateInput'

type Office = {
  code: string
  color: string
}

type Defaults = {
  doc_date?: string
  doc_type?: string | null
  tracking_no?: string | null
  file_name?: string | null
  particulars?: string
  value?: number | null
  route?: string[]
  route_status?: string | null
  date_routed?: string | null
  routing_particulars?: string | null
}

type DocumentFormProps = {
  onSubmit: (formData: FormData) => void | Promise<void>
  defaults?: Defaults
  docTypes: string[]
  statuses: string[]
  offices: Office[]
  submitLabel?: string
  showRouting?: boolean
  submitting?: boolean
}

const FIELD_CLASS =
  'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100'

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
    </div>
  )
}

export default function DocumentForm({
  onSubmit,
  defaults = {},
  docTypes,
  statuses,
  offices,
  submitLabel = 'Save',
  showRouting = true,
  submitting = false,
}: DocumentFormProps) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit(new FormData(event.currentTarget))
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
      <div className="flex items-start gap-3 rounded-xl border border-sky-100 bg-sky-50 p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
          <FilePlus2 size={22} />
        </div>
        <div>
          <h2 className="font-semibold text-slate-900">
            Document Information
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            Enter the document details below to register and track it in the
            routing system.
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <SectionHeader
          icon={<FileText size={19} />}
          title="Basic Details"
          description="Identify and describe the incoming document"
        />

        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
          <label className="block min-w-0">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <CalendarDays size={15} className="text-slate-400" />
              Date <span className="text-rose-500">*</span>
            </span>
            <TodayDateInput
              name="doc_date"
              required
              defaultValue={defaults.doc_date}
              className={FIELD_CLASS}
            />
          </label>

          <label className="block min-w-0">
            <span className="text-sm font-semibold text-slate-700">
              Document Type
            </span>
            <select
              name="doc_type"
              required
              defaultValue={defaults.doc_type ?? ''}
              className={FIELD_CLASS}
            >
              <option value="">DOCUMENT TYPE</option>
              {docTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label className="block min-w-0">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Hash size={15} className="text-slate-400" />
              Tracking Number
            </span>
            <input
              name="tracking_no"
              defaultValue={defaults.tracking_no ?? ''}
              placeholder="e.g. SGOD-5369"
              className={FIELD_CLASS}
            />
          </label>

          <label className="block min-w-0">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <UserRound size={15} className="text-slate-400" />
              File Name / From Whom
            </span>
            <input
              name="file_name"
              defaultValue={defaults.file_name ?? ''}
              placeholder="Name of sender or source"
              className={FIELD_CLASS}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-sm font-semibold text-slate-700">
              Particulars <span className="text-rose-500">*</span>
            </span>
            <p className="mt-1 text-xs text-slate-500">
              Provide a brief description or subject of the document.
            </p>
            <textarea
              name="particulars"
              required
              rows={3}
              defaultValue={defaults.particulars ?? ''}
              placeholder="Enter document subject, purpose, or brief description..."
              className={`${FIELD_CLASS} resize-y`}
            />
          </label>

          <label className="block sm:max-w-xs">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <PhilippinePeso size={15} className="text-slate-400" />
              Value (₱)
            </span>
            <input
              type="number"
              step="0.01"
              name="value"
              defaultValue={defaults.value ?? ''}
              placeholder="0.00"
              className={FIELD_CLASS}
            />
          </label>
        </div>
      </section>

      {showRouting && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <SectionHeader
            icon={<Route size={19} />}
            title="Routing Details"
            description="Specify the destination offices and routing status"
          />

          <div className="space-y-5 p-4">
            <fieldset>
              <legend className="text-sm font-semibold text-slate-700">
                Route to Office(s)
              </legend>
              <p className="mt-1 text-xs text-slate-500">
                Select one or more offices responsible for handling the
                document.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {offices.map((office) => (
                  <label
                    key={office.code}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-sky-300 hover:bg-sky-50 has-[:checked]:border-sky-400 has-[:checked]:bg-sky-50 has-[:checked]:text-sky-800"
                  >
                    <input
                      type="checkbox"
                      name="route"
                      value={office.code}
                      defaultChecked={defaults.route?.includes(office.code)}
                      className="h-4 w-4 cursor-pointer accent-sky-700"
                    />
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: office.color }}
                    />
                    {office.code}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block min-w-0">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Building2 size={15} className="text-slate-400" />
                  Route Status
                </span>
                <select
                  name="route_status"
                  defaultValue={defaults.route_status ?? ''}
                  className={FIELD_CLASS}
                >
                  <option value="">— Choose status —</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block min-w-0">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Clock size={15} className="text-slate-400" />
                  Date Routed
                </span>
                <input
                  type="date"
                  name="date_routed"
                  defaultValue={defaults.date_routed ?? ''}
                  className={FIELD_CLASS}
                />
              </label>
            </div>

            <label className="block">
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <MessageSquareText size={15} className="text-slate-400" />
                Routing Particulars
              </span>
              <p className="mt-1 text-xs text-slate-500">
                Add routing notes, instructions, or other relevant details.
              </p>
              <textarea
                name="routing_particulars"
                rows={2}
                defaultValue={defaults.routing_particulars ?? ''}
                placeholder="Enter routing notes..."
                className={`${FIELD_CLASS} resize-y`}
              />
            </label>
          </div>
        </section>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-slate-500">
          Fields marked with <span className="text-rose-500">*</span> are
          required.
        </p>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 active:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={16} />
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}