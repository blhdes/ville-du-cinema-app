'use client'

interface ColumnSelectorProps {
  value: 1 | 2 | 3
  onChange: (value: 1 | 2 | 3) => void
  threeColumnsDisabled?: boolean
  labels: { col1: string; col2: string; col3: string }
}

export default function ColumnSelector({
  value,
  onChange,
  threeColumnsDisabled = false,
  labels,
}: ColumnSelectorProps) {
  const options: { val: 1 | 2 | 3; label: string; disabled: boolean }[] = [
    { val: 1, label: labels.col1, disabled: false },
    { val: 2, label: labels.col2, disabled: false },
    { val: 3, label: labels.col3, disabled: threeColumnsDisabled },
  ]

  return (
    <div className="flex gap-3">
      {options.map((opt) => {
        const isActive = value === opt.val
        const isDisabled = opt.disabled

        return (
          <button
            key={opt.val}
            type="button"
            disabled={isDisabled}
            onClick={() => onChange(opt.val)}
            className={`
              flex-1 flex flex-col items-center gap-2 px-3 py-3 border-2 font-serif text-xs uppercase tracking-wider transition-colors
              ${isActive
                ? 'bg-[#FFD600] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                : isDisabled
                  ? 'bg-gray-200 border-gray-400 opacity-50 cursor-not-allowed'
                  : 'bg-white border-black hover:bg-gray-50 cursor-pointer'
              }
            `}
          >
            {/* Column preview icons */}
            <div className="flex gap-0.5">
              {Array.from({ length: opt.val }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-5 ${isActive ? 'bg-black' : isDisabled ? 'bg-gray-400' : 'bg-black/60'}`}
                />
              ))}
            </div>
            <span className="font-bold">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
