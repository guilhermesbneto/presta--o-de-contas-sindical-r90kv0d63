export type PeriodPreset =
  | 'mes_atual'
  | 'trimestre_atual'
  | 'ano_atual'
  | 'exercicio_atual'
  | 'personalizado'

export interface DateRange {
  start: string // yyyy-mm-dd
  end: string // yyyy-mm-dd (inclusive)
}

const pad = (n: number) => String(n).padStart(2, '0')

export const toISODate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const todayISO = () => toISODate(new Date())

/** Start date (inclusive) of the trimester containing the given date. */
export const trimesterStart = (d: Date) => {
  const tri = Math.floor(d.getMonth() / 3) * 3
  return new Date(d.getFullYear(), tri, 1)
}

/** Inclusive end date of the trimester containing the given date. */
export const trimesterEnd = (d: Date) => {
  const tri = Math.floor(d.getMonth() / 3) * 3 + 3
  return new Date(d.getFullYear(), tri, 0) // day 0 of next month = last day of previous
}

export function getPresetRange(preset: Exclude<PeriodPreset, 'personalizado'>): DateRange {
  const now = new Date()
  switch (preset) {
    case 'mes_atual':
      return {
        start: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)),
        end: toISODate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
      }
    case 'trimestre_atual':
      return {
        start: toISODate(trimesterStart(now)),
        end: toISODate(trimesterEnd(now)),
      }
    case 'ano_atual':
      return {
        start: `${now.getFullYear()}-01-01`,
        end: `${now.getFullYear()}-12-31`,
      }
    case 'exercicio_atual':
      return {
        start: `${now.getFullYear()}-01-01`,
        end: todayISO(),
      }
  }
}

export const PERIOD_LABELS: Record<Exclude<PeriodPreset, 'personalizado'>, string> = {
  mes_atual: 'Mês atual',
  trimestre_atual: 'Trimestre atual',
  ano_atual: 'Ano atual (janeiro a dezembro)',
  exercicio_atual: 'Exercício corrente (até hoje)',
}

/** Inclusive check for an ISO date (yyyy-mm-dd) inside a range. */
export function isDateInRange(isoDate: string, range: DateRange | null): boolean {
  if (!range) return true
  const day = isoDate.slice(0, 10)
  return day >= range.start && day <= range.end
}

const MONTHS_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export const monthName = (m: number) => MONTHS_PT[m]

/** Human readable label of the currently selected period, e.g. "Fevereiro/2025" or "1º trimestre/2025". */
export function describePeriod(preset: PeriodPreset, range: DateRange | null): string {
  if (preset === 'personalizado' && range) {
    const s = range.start.split('-')
    const e = range.end.split('-')
    const sTxt = `${s[2]}/${s[1]}/${s[0]}`
    const eTxt = `${e[2]}/${e[1]}/${e[0]}`
    return sTxt === eTxt ? sTxt : `${sTxt} a ${eTxt}`
  }
  if (!range) return 'Todo o histórico'
  const now = new Date()
  switch (preset) {
    case 'mes_atual':
      return `${monthName(now.getMonth())}/${now.getFullYear()}`
    case 'trimestre_atual': {
      const tri = Math.floor(now.getMonth() / 3) + 1
      return `${tri}º trimestre/${now.getFullYear()}`
    }
    case 'ano_atual':
      return `Ano civil ${now.getFullYear()}`
    case 'exercicio_atual':
      return `Exercício ${now.getFullYear()} (até hoje)`
  }
}
