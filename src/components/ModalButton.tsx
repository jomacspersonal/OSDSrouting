
import { useEffect, useId, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

type ModalButtonProps = {
  label: ReactNode
  title: string
  tooltip?: string
  buttonClassName?: string
  children: ReactNode | ((close: () => void) => ReactNode)
}

export default function ModalButton({
  label,
  title,
  tooltip,
  buttonClassName = '',
  children,
}: ModalButtonProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const titleId = useId()

  function close() {
    setOpen(false)
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        title={tooltip}
        aria-label={tooltip || title}
        onClick={() => setOpen(true)}
        className={`${buttonClassName} cursor-pointer`}
      >
        {label}
      </button>

      {mounted &&
        open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) close()
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            >
              <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4">
                <h2
                  id={titleId}
                  className="text-lg font-semibold tracking-tight text-slate-900"
                >
                  {title}
                </h2>

                <button
                  type="button"
                  onClick={close}
                  aria-label="Close modal"
                  className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto p-6">
                {typeof children === 'function' ? children(close) : children}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
