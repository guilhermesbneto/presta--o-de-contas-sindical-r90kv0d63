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

export type RequestStatus = 'pendente' | 'autorizado' | 'recusado' | 'pago'

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
  authorizedBy?: string
  authorizedAt?: string
  rejectionReason?: string
  paymentInfo?: {
    paidBy: string
    paidAt: string
    paymentMethod: 'Pix' | 'Transferência Bancária' | 'Cheque Nominal' | 'Dinheiro / Caixa'
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
