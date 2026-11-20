export type RoleType =
  | 'presidencia'
  | 'presidencia_substituto'
  | 'financas'
  | 'financas_substituto'
  | 'conselho_fiscal_1'
  | 'conselho_fiscal_2'
  | 'conselho_fiscal_3'
  | 'diretoria'
  | 'filiado'
  | 'colaborador'

export interface UserProfile {
  id: string
  name: string
  role: RoleType
  roleLabel: string
  roleGroup:
    | 'Presidência'
    | 'Finanças'
    | 'Conselho Fiscal'
    | 'Diretoria Executiva'
    | 'Filiados'
    | 'Colaboradores'
  avatarUrl?: string
  description: string
  isSubstitute?: boolean
}

export type RequestType = 'adiantamento' | 'ressarcimento'

/**
 * Fluxo em duas etapas:
 *  - 'pendente': aguardando decisão da Presidência (Etapa 1)
 *  - 'aguardando_financeiro': aprovado pela Presidência; Financeiro planeja o pagamento (Etapa 2)
 *  - 'aguardando_pagamento': Presidência E Financeiro aprovaram; aguardando liquidação pelo Financeiro
 *  - 'pago': liquidado pelo Financeiro
 *  - 'devolvido': devolvido para correção pelo solicitante (reinicia pela Presidência ao reenviar)
 *  - 'recusado': reprovado formalmente (na Etapa 1 ou 2)
 */
export type RequestStatus =
  | 'pendente'
  | 'aguardando_financeiro'
  | 'aguardando_pagamento'
  | 'pago'
  | 'devolvido'
  | 'recusado'

export type StageDecision = 'aprovado' | 'reprovado' | 'devolvido'

export type PaymentPlanningMethod =
  | 'Pix'
  | 'Transferência Bancária'
  | 'Cheque Nominal'
  | 'Dinheiro / Caixa'

/** Planejamento do pagamento feito pelo Financeiro na Etapa 2 */
export interface PaymentPlanning {
  plannedBy: string
  plannedAt: string
  paymentMethod: PaymentPlanningMethod
  expectedDate: string // data prevista (ISO)
  notes?: string
}

/** Registro de decisão de uma etapa (Presidência ou Financeiro) */
export interface StageReview {
  stage: 1 | 2
  decision: StageDecision
  by: string
  byRole: string
  at: string
  justification?: string
}

export interface ExpenseRequest {
  id: string
  applicantName: string
  applicantRole: string
  applicantId: string
  type: RequestType
  amount: number
  reason: string
  category: string
  receiptName?: string
  receiptUrl?: string
  actionId?: string // Optional link to an Action
  status: RequestStatus
  createdAt: string
  /** Etapa atual do fluxo (1 = Presidência, 2 = Financeiro). Reinicia em 1 após devolução/reenvio. */
  currentStage: 1 | 2
  /** Histórico cronológico das deliberações das etapas */
  stageHistory: StageReview[]
  /** Etapa 1: decisão da Presidência */
  presidenciaDecision?: StageReview
  /** Etapa 2: decisão do Financeiro sobre o planejamento */
  financeDecision?: StageReview
  /** Planejamento do pagamento preenchido pelo Financeiro na Etapa 2 */
  paymentPlanning?: PaymentPlanning
  /** Legado/compatibilidade: quem autorizou primeiro (Presidência) */
  authorizedBy?: string
  authorizedAt?: string
  /** Justificativa de reprovação (Etapa 1 ou 2) ou de devolução */
  rejectionReason?: string
  /** Quem devolveu para correção e quando (para exibição ao solicitante) */
  returnedBy?: string
  returnedAt?: string
  paymentInfo?: {
    paidBy: string
    paidAt: string
    paymentMethod: PaymentPlanningMethod
    referenceCode?: string
    notes?: string
  }
}

export type ActionStatus = 'planejada' | 'em_andamento' | 'concluida' | 'cancelada'

export interface ActionMovement {
  id: string
  actionId: string
  type: 'receita' | 'despesa'
  category: string
  description: string
  amount: number
  date: string
  paymentMethod?: string
}

export interface DirectoriaAction {
  id: string
  name: string
  description: string
  responsible: string
  responsibleRole: string
  budget: number
  spent: number
  status: ActionStatus
  startDate: string
  targetDate: string
  category: string
}

export type FiscalDecision = 'aprovado' | 'aprovado_com_ressalva' | 'reprovado'

export interface FiscalVote {
  councilMemberId: 'conselho_fiscal_1' | 'conselho_fiscal_2' | 'conselho_fiscal_3'
  councilMemberName: string
  decision: FiscalDecision
  justification: string
  votedAt: string
}

export interface FiscalAccountPeriod {
  id: string
  title: string
  period: string
  totalIncome: number
  totalExpense: number
  balance: number
  status: 'em_analise' | 'aprovada' | 'aprovada_com_ressalvas' | 'reprovada'
  votes: Record<string, FiscalVote> // key is memberId
  notes?: string
  documentRef?: string
}
