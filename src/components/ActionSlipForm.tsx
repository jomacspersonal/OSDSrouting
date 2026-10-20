
import { useState, type FormEvent } from 'react'
import { GROUPS, INSTRUCTIONS } from '../lib/routing'
import {
  ArrowRight,
  ClipboardList,
  FileText,
  MessageSquareText,
  Send,
} from 'lucide-react'

export default function ActionSlipForm({
  onSubmit,
  submitting = false,
}: {
  onSubmit: (formData: FormData) => void | Promise<void>
  submitting?: boolean
}) {
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = event.currentTarget
    const formData = new FormData(form)

    if (
      formData.getAll('route').length === 0 &&
      formData.getAll('unit').length === 0
    ) {
      setError('Please select at least one receiving office or unit.')
      return
    }

    setError(null)

    try {
      await onSubmit(formData)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to route the document. Please try again.',
      )
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-start gap-3 rounded-xl border border-sky-100 bg-sky-50 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
          <ClipboardList size={21} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">Document Action Slip</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            Select the receiving office and the appropriate instructions before
            routing this document.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <fieldset className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <legend className="sr-only">Receiving office</legend>

          <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <ArrowRight size={19} />
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                To
              </h4>
              <p className="text-xs text-slate-500">Select office or personnel</p>
            </div>
          </div>

          <div className="space-y-4 p-4">
            {GROUPS.map((group) => (
              <div key={group.code}>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors hover:bg-indigo-50">
                  <input
                    type="checkbox"
                    name="route"
                    value={group.code}
                    className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-indigo-600"
                  />
                  <span className="text-sm font-semibold leading-5 text-slate-800">
                    {group.label}
                  </span>
                </label>

                {group.children && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-100 pl-3">
                    {group.children.map((child) => (
                      <label
                        key={child.label}
                        className="flex cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          name={child.code ? 'route' : 'unit'}
                          value={child.code ?? `${group.code}:${child.label}`}
                          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-indigo-600"
                        />
                        <span className="text-sm leading-5 text-slate-600">
                          {child.label}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <legend className="sr-only">Instructions</legend>

          <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <FileText size={19} />
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                Instructions
              </h4>
              <p className="text-xs text-slate-500">Specify the required action</p>
            </div>
          </div>

          <div className="space-y-1 p-4">
            {INSTRUCTIONS.map((instruction) => (
              <label
                key={instruction}
                className="flex cursor-pointer items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-amber-50"
              >
                <input
                  type="checkbox"
                  name="instruction"
                  value={instruction}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-amber-600"
                />
                <span className="text-sm leading-5 text-slate-700">
                  {instruction}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <MessageSquareText size={19} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Remarks</h4>
            <p className="text-xs text-slate-500">
              Add any additional details or specific instructions
            </p>
          </div>
        </div>

        <div className="p-4">
          <textarea
            name="remarks"
            rows={3}
            placeholder="Enter remarks here..."
            className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-slate-500">
          Review your selections before submitting the action slip.
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 active:bg-sky-900"
        >
          <Send size={16} />
          {submitting ? 'Routing...' : 'Route with Instruction'}
        </button>
      </div>
    </form>
  )
}
