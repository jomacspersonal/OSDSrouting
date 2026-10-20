
import { useEffect, useState } from 'react'

type TodayDateInputProps = {
  name: string
  defaultValue?: string | null
  required?: boolean
  className?: string
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

export default function TodayDateInput({
  name,
  defaultValue,
  required,
  className,
}: TodayDateInputProps) {
  const [value, setValue] = useState(defaultValue ?? '')

  useEffect(() => {
    if (!defaultValue) {
      setValue(getManilaDate())
    }
  }, [defaultValue])

  return (
    <input
      type="date"
      name={name}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      required={required}
      className={className}
    />
  )
}
