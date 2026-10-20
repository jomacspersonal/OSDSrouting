
import { useState, type FormEvent } from 'react'
import { QUICK_STATUSES } from '../lib/routing'

type Office = {
  code: string
  color: string
}

export default function QuickRouteForm({
  onSubmit,
  offices,
  submitting = false,
}: {
  onSubmit: (formData: FormData) => void | Promise<void>
  offices: Office[]
  submitting?: boolean
}) {
  const [status, setStatus] = useState('SIGNED')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit(new FormData(event.currentTarget))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium">Route to</span>
        <select
          name="route"
          required
          defaultValue=""
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>— choose office —</option>
          {offices
            .filter((office) => office.code !== 'OSDS')
            .map((office) => (
              <option key={office.code} value={office.code}>
                {office.code}
              </option>
            ))}
        </select>
      </label>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Status</legend>
        <div className="flex flex-wrap gap-3">
          {QUICK_STATUSES.map((item) => (
            <label key={item} className="flex items-center gap-1.5 text-sm">
              <input
                type="radio"
                name="route_status"
                value={item}
                checked={status === item}
                onChange={() => setStatus(item)}
                required
              />
              {item}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="text-sm font-medium">Particulars</span>
        <textarea
          name="routing_particulars"
          rows={2}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Routing...' : 'Route'}
      </button>
    </form>
  )
}
