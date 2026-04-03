'use client'

import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'

interface RangeFilterProps {
  label: string
  unit?: string
  min: number
  max: number
  step?: number
  value: [number, number]
  onChange: (value: [number, number]) => void
}

export function RangeFilter({ label, unit = '', min, max, step = 1, value, onChange }: RangeFilterProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">{label}</Label>
        <span className="text-xs text-muted-foreground">
          {value[0].toLocaleString()}{unit} — {value[1].toLocaleString()}{unit}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={value}
        onValueChange={(v) => onChange(v as [number, number])}
        className="touch-none"
      />
    </div>
  )
}
