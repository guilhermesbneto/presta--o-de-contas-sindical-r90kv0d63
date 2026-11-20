import { Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  PERIOD_LABELS,
  describePeriod,
  getPresetRange,
  todayISO,
  type DateRange,
  type PeriodPreset,
} from '@/lib/period'

interface PeriodFilterBarProps {
  preset: PeriodPreset
  onPresetChange: (preset: PeriodPreset) => void
  customRange: DateRange | null
  onCustomRangeChange: (range: DateRange | null) => void
}

const PRESET_OPTIONS: Array<{ value: Exclude<PeriodPreset, 'personalizado'>; label: string }> = [
  { value: 'mes_atual', label: PERIOD_LABELS.mes_atual },
  { value: 'trimestre_atual', label: PERIOD_LABELS.trimestre_atual },
  { value: 'ano_atual', label: PERIOD_LABELS.ano_atual },
  { value: 'exercicio_atual', label: PERIOD_LABELS.exercicio_atual },
]

export function PeriodFilterBar({
  preset,
  onPresetChange,
  customRange,
  onCustomRangeChange,
}: PeriodFilterBarProps) {
  const applyCustom = (start: string, end: string) => {
    if (!start || !end || start > end) {
      onCustomRangeChange({ start: start || end || todayISO(), end: end || start || todayISO() })
      return
    }
    onCustomRangeChange({ start, end })
  }

  return (
    <div className="rounded-lg border bg-card p-3 sm:p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wide text-foreground">
            Período
          </span>
        </div>

        <Select
          value={preset}
          onValueChange={(val) => {
            if (val === 'personalizado') {
              onPresetChange('personalizado')
              if (!customRange) onCustomRangeChange({ start: todayISO(), end: todayISO() })
            } else {
              onPresetChange(val as Exclude<PeriodPreset, 'personalizado'>)
              onCustomRangeChange(getPresetRange(val as Exclude<PeriodPreset, 'personalizado'>))
            }
          }}
        >
          <SelectTrigger className="w-full sm:w-64 text-xs h-9">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            {PRESET_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
            <SelectItem value="personalizado">Datas personalizadas</SelectItem>
          </SelectContent>
        </Select>

        {preset === 'personalizado' && (
          <div className="flex flex-col sm:flex-row sm:items-end gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-muted-foreground">De</Label>
              <Input
                type="date"
                value={customRange?.start ?? ''}
                max={customRange?.end}
                onChange={(e) => applyCustom(e.target.value, customRange?.end ?? e.target.value)}
                className="text-xs h-9 w-40"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-muted-foreground">Até</Label>
              <Input
                type="date"
                value={customRange?.end ?? ''}
                min={customRange?.start}
                onChange={(e) => applyCustom(customRange?.start ?? e.target.value, e.target.value)}
                className="text-xs h-9 w-40"
              />
            </div>
          </div>
        )}

        <Badge variant="outline" className="text-[10px] font-bold uppercase w-fit">
          Exibindo: {describePeriod(preset, customRange)}
        </Badge>
      </div>
      <p className="text-[11px] text-muted-foreground">
        O período selecionado restringe todas as movimentações, pagamentos liquidados e o
        acompanhamento orçamentário exibidos nesta prestação de contas.
      </p>
    </div>
  )
}
