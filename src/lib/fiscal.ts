// Dados e lógica de domínio do Conselho Fiscal:
// divisão QUADRIMESTRAL da auditoria (1º, 2º, 3º e 4º quadrimestres do exercício)
// e marcas individuais de lançamentos (sem ressalva / com ressalva / reprovado),
// que alimentam o parecer consolidado e o controle de respostas da Diretoria Executiva.
// Obs.: TRIMESTRAIS são os relatórios de atividades da Diretoria Executiva — não confundir.

import type { FiscalMarkStatus } from '@/types'

export type FiscalMarkTargetType = 'movimento' | 'pagamento'

export interface FiscalMovementMark {
  id: string
  /** id da movimentação (mov-*) ou do pagamento liquidado (req-*) */
  targetId: string
  targetType: FiscalMarkTargetType
  /** 'sem_ressalva' | 'com_ressalva' | 'reprovado' */
  status: FiscalMarkStatus
  comment: string
  markedBy: string
  markedByRole: string
  markedAt: string
  /** quadrimestre do exercício (1-4) em que a marca foi registrada */
  quarter: 1 | 2 | 3 | 4
  /** Prazo (ISO yyyy-mm-dd) para a Diretoria Executiva responder/regularizar */
  responseDueDate?: string
  /** Resposta/regularização registrada pela Diretoria Executiva */
  boardResponse?: {
    respondedBy: string
    respondedByRole: string
    respondedAt: string
    message: string
  }
}

/** Situação da pendência de resposta da Diretoria Executiva */
export type MarkResponseStatus = 'sem_prazo' | 'em_aberto' | 'vencida' | 'regularizada'

/**
 * Plano do exercício: quadrimestre(s) sob responsabilidade de cada conselheiro.
 * Os 1º, 2º e 3º quadrimestres têm um conselheiro titular cada; o 4º
 * (fechamento do exercício) é analisado em conjunto — editável pelo colegiado.
 */
export interface FiscalQuarterPlan {
  id: string
  year: number
  /** role do conselheiro por quadrimestre; 'conjunto' = todos os membros (colegiado) */
  assignments: Record<string, ('conselho_fiscal_1' | 'conselho_fiscal_2' | 'conselho_fiscal_3')[]>
  /** true enquanto o exercício está aberto para marcação de lançamentos */
  openForMarking: boolean
}

export type FiscalMemberRole = 'conselho_fiscal_1' | 'conselho_fiscal_2' | 'conselho_fiscal_3'

export const FISCAL_MEMBER_ROLES: FiscalMemberRole[] = [
  'conselho_fiscal_1',
  'conselho_fiscal_2',
  'conselho_fiscal_3',
]

export const QUARTER_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: '1º Quadrimestre (Jan–Abr)',
  2: '2º Quadrimestre (Mai–Ago)',
  3: '3º Quadrimestre (Set–Dez)',
  4: '4º Quadrimestre — Fechamento do Exercício (colegiado)',
}

export const QUARTER_SHORT: Record<1 | 2 | 3 | 4, string> = {
  1: '1º Quadri',
  2: '2º Quadri',
  3: '3º Quadri',
  4: '4º Quadri (colegiado)',
}

/** Mês (1-12) de início e fim de cada quadrimestre. O 4º cobre o exercício inteiro (fechamento). */
export const QUARTER_MONTH_RANGE: Record<1 | 2 | 3 | 4, { from: number; to: number }> = {
  1: { from: 1, to: 4 },
  2: { from: 5, to: 8 },
  3: { from: 9, to: 12 },
  4: { from: 1, to: 12 },
}

export const MARK_STATUS_META: Record<
  FiscalMarkStatus,
  { label: string; badgeClass: string; rowClass: string; dot: string }
> = {
  sem_ressalva: {
    label: 'Sem ressalva',
    badgeClass:
      'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300',
    rowClass: '',
    dot: 'text-emerald-600',
  },
  com_ressalva: {
    label: 'Com Ressalva',
    badgeClass:
      'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300',
    rowClass: 'bg-amber-50/60 dark:bg-amber-950/20',
    dot: 'text-amber-600',
  },
  reprovado: {
    label: 'Reprovado',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300',
    rowClass: 'bg-rose-50/70 dark:bg-rose-950/20',
    dot: 'text-rose-600',
  },
}

/** Quadrimestre do exercício a que pertence uma data ISO (yyyy-mm-dd). */
export function quarterOfISODate(isoDate: string): 1 | 2 | 3 | 4 {
  const month = Number(isoDate.slice(5, 7))
  if (month <= 4) return 1
  if (month <= 8) return 2
  return 3
}

export function quarterRange(quarter: 1 | 2 | 3 | 4, year: number): { start: string; end: string } {
  const { from, to } = QUARTER_MONTH_RANGE[quarter]
  const start = `${year}-${String(from).padStart(2, '0')}-01`
  const days = new Date(year, to, 0).getDate()
  const end = `${year}-${String(to).padStart(2, '0')}-${String(days).padStart(2, '0')}`
  return { start, end }
}

export function isQuarterOpenForMarking(plan: FiscalQuarterPlan | null | undefined): boolean {
  return Boolean(plan?.openForMarking)
}

/**
 * Conselheiro responsável por um quadrimestre no plano do exercício.
 * Cada membro titular tem exatamente um quadrimestre próprio; o 4º
 * (fechamento) é revisado em conjunto pelos três membros.
 */
export function assignedQuarterOf(
  plan: FiscalQuarterPlan | null | undefined,
  memberRole: FiscalMemberRole,
): 1 | 2 | 3 | 4 | null {
  if (!plan) return null
  for (const q of ['1', '2', '3', '4'] as const) {
    const owners = plan.assignments[q]
    if (owners?.length === 1 && owners[0] === memberRole) return Number(q) as 1 | 2 | 3 | 4
  }
  return null
}

/** Rótulo curto do quadrimestre designado a um conselheiro no plano. */
export function assignedQuarterLabel(
  plan: FiscalQuarterPlan | null | undefined,
  memberRole: FiscalMemberRole,
): string {
  const q = assignedQuarterOf(plan, memberRole)
  if (!q) return 'Revisão colegiada (4º quadrimestre)'
  return QUARTER_SHORT[q]
}

/** O conselheiro pode marcar lançamentos deste quadrimestre? */
export function canMarkQuarter(
  plan: FiscalQuarterPlan | null | undefined,
  memberRole: FiscalMemberRole,
  quarter: 1 | 2 | 3 | 4,
): boolean {
  if (!plan || !plan.openForMarking) return false
  const owners = plan.assignments[String(quarter)] ?? []
  // responsável próprio OU revisão em conjunto (4º quadrimestre — fechamento)
  return owners.includes(memberRole)
}

/**
 * Marcas existentes de um lançamento (movimentação ou pagamento).
 */
export function marksForTarget(
  marks: FiscalMovementMark[],
  targetId: string,
  targetType: FiscalMarkTargetType,
): FiscalMovementMark[] {
  return marks.filter((m) => m.targetId === targetId && m.targetType === targetType)
}

/** Última marca registrada (a mais recente vence para destaque visual). */
export function latestMarkFor(
  marks: FiscalMovementMark[],
  targetId: string,
  targetType: FiscalMarkTargetType,
): FiscalMovementMark | undefined {
  const all = marksForTarget(marks, targetId, targetType)
  return all.slice().sort((a, b) => b.markedAt.localeCompare(a.markedAt))[0]
}

/** Marcas com destaque (com_ressalva ou reprovado), agrupadas por quadrimestre. */
export function notableMarksGroupedByQuarter(marks: FiscalMovementMark[]) {
  const notable = marks.filter((m) => m.status !== 'sem_ressalva')
  const byQuarter = new Map<1 | 2 | 3 | 4, FiscalMovementMark[]>()
  for (const m of notable) {
    const list = byQuarter.get(m.quarter) ?? []
    list.push(m)
    byQuarter.set(m.quarter, list)
  }
  return byQuarter
}

/**
 * Situação da pendência de resposta da Diretoria Executiva para uma marca.
 * 'vencida' = prazo passado sem resposta; 'regularizada' = diretoria já respondeu.
 */
export function markResponseStatus(
  mark: FiscalMovementMark,
  today: string = new Date().toISOString().slice(0, 10),
): MarkResponseStatus {
  if (mark.status === 'sem_ressalva') return 'sem_prazo'
  if (mark.boardResponse?.message?.trim()) return 'regularizada'
  if (mark.responseDueDate && mark.responseDueDate < today) return 'vencida'
  return 'em_aberto'
}

export const MARK_RESPONSE_STATUS_META: Record<
  MarkResponseStatus,
  { label: string; badgeClass: string }
> = {
  sem_prazo: { label: '—', badgeClass: '' },
  em_aberto: {
    label: 'Resposta pendente',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300',
  },
  vencida: {
    label: 'Prazo vencido',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300',
  },
  regularizada: {
    label: 'Regularizada pela Diretoria',
    badgeClass:
      'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300',
  },
}

/** Pendências em aberto (sem resposta) para acompanhamento antes do relatório anual. */
export function openPendingMarks(marks: FiscalMovementMark[]): FiscalMovementMark[] {
  return marks
    .filter((m) => m.status !== 'sem_ressalva')
    .filter((m) => {
      const st = markResponseStatus(m)
      return st === 'em_aberto' || st === 'vencida'
    })
    .sort((a, b) => (a.responseDueDate ?? '9999').localeCompare(b.responseDueDate ?? '9999'))
}
