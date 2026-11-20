// Dados e lógica de domínio do Conselho Fiscal:
// divisão trimestral da auditoria e marcas individuais de lançamentos
// (sem ressalva / com ressalva / reprovado), que alimentam o parecer consolidado.

import type { FiscalAccountPeriod, FiscalMarkStatus } from '@/types'

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
  /** trimestre do exercício (1-4) em que a marca foi registrada */
  quarter: 1 | 2 | 3 | 4
}

/**
 * Plano do exercício: trimestre(s) sob responsabilidade de cada conselheiro.
 * O 4º trimestre é analisado em conjunto (revisão colegiada) ou redistribuído — editável.
 */
export interface FiscalQuarterPlan {
  id: string
  year: number
  /** role do conselheiro ('conselho_fiscal_1' | 2 | 3) ou 'conjunto' p/ revisão colegiada */
  assignments: Record<string, ('conselho_fiscal_1' | 'conselho_fiscal_2' | 'conselho_fiscal_3')[]>
  /** true quando o conselheiro pode marcar lançamentos deste trimestre */
  openForMarking: boolean
}

export type FiscalMemberRole = 'conselho_fiscal_1' | 'conselho_fiscal_2' | 'conselho_fiscal_3'

export const FISCAL_MEMBER_ROLES: FiscalMemberRole[] = [
  'conselho_fiscal_1',
  'conselho_fiscal_2',
  'conselho_fiscal_3',
]

export const QUARTER_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: '1º Trimestre (Jan–Mar)',
  2: '2º Trimestre (Abr–Jun)',
  3: '3º Trimestre (Jul–Set)',
  4: '4º Trimestre (Out–Dez)',
}

export const QUARTER_SHORT: Record<1 | 2 | 3 | 4, string> = {
  1: '1º Tri',
  2: '2º Tri',
  3: '3º Tri',
  4: '4º Tri',
}

/** Mês (1-12) em que cada trimestre do exercício se inicia. */
export const QUARTER_START_MONTH: Record<1 | 2 | 3 | 4, number> = { 1: 1, 2: 4, 3: 7, 4: 10 }

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

/** Trimestre do exercício a que pertence uma data ISO (yyyy-mm-dd). */
export function quarterOfISODate(isoDate: string): 1 | 2 | 3 | 4 {
  const month = Number(isoDate.slice(5, 7))
  return (Math.floor((month - 1) / 3) + 1) as 1 | 2 | 3 | 4
}

export function quarterRange(quarter: 1 | 2 | 3 | 4, year: number): { start: string; end: string } {
  const m0 = QUARTER_START_MONTH[quarter]
  const start = `${year}-${String(m0).padStart(2, '0')}-01`
  const endMonth = m0 + 2
  const days = new Date(year, endMonth, 0).getDate()
  const end = `${year}-${String(endMonth).padStart(2, '0')}-${String(days).padStart(2, '0')}`
  return { start, end }
}

export function isQuarterOpenForMarking(plan: FiscalQuarterPlan | null | undefined): boolean {
  return Boolean(plan?.openForMarking)
}

/**
 * Conselheiro responsável por um trimestre no plano do exercício.
 * Cada membro titular tem exatamente um trimestre próprio; o 4º é revisado
 * em conjunto (atribuição 'conjunto' distribuída a todos os membros).
 */
export function assignedQuarterOf(
  plan: FiscalQuarterPlan | null | undefined,
  memberRole: FiscalMemberRole,
): 1 | 2 | 3 | 4 | null {
  if (!plan) return null
  for (const q of ['1', '2', '3', '4'] as const) {
    const owners = plan.assignments[q]
    if (owners?.length === 1 && owners[0] === memberRole) return Number(q) as 1 | 2 | 3 | 4
    // No trimestre 4 (colegiado), qualquer membro pode marcar — mas sem "trimestre próprio"
  }
  return null
}

/** O conselheiro pode marcar lançamentos deste trimestre? */
export function canMarkQuarter(
  plan: FiscalQuarterPlan | null | undefined,
  memberRole: FiscalMemberRole,
  quarter: 1 | 2 | 3 | 4,
): boolean {
  if (!plan || !plan.openForMarking) return false
  const owners = plan.assignments[String(quarter)] ?? []
  // responsável próprio OU revisão em conjunto (4º trimestre)
  return owners.includes(memberRole)
}

/**
 * Marcas existentes de um lançamento (movimentação ou pagamento) para um trimestre.
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

/** Marcas com destaque (com_ressalva ou reprovado), agrupadas por trimestre. */
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

export interface FiscalPeriodReview {
  memberId: FiscalMemberRole
  memberName: string
  decision: 'aprovado' | 'aprovado_com_ressalva' | 'reprovado'
  justification: string
  votedAt: string
  quarter: 1 | 2 | 3 | 4
}

/** Pareceres individuais de um período, com o trimestre designado a cada conselheiro. */
export function periodReviewsWithQuarters(
  period: FiscalAccountPeriod,
  plan: FiscalQuarterPlan | null | undefined,
): FiscalPeriodReview[] {
  const votes = Object.values(period.votes) as {
    councilMemberId: FiscalMemberRole
    councilMemberName: string
    decision: 'aprovado' | 'aprovado_com_ressalva' | 'reprovado'
    justification: string
    votedAt: string
  }[]
  return votes.map((v) => ({
    memberId: v.councilMemberId,
    memberName: v.councilMemberName,
    decision: v.decision,
    justification: v.justification,
    votedAt: v.votedAt,
    quarter: assignedQuarterOf(plan, v.councilMemberId) ?? 1,
  }))
}
