import { RequestStatus } from '@/types'

export type PaymentMethodOption =
  | 'Pix'
  | 'Transferência Bancária'
  | 'Cheque Nominal'
  | 'Dinheiro / Caixa'

export const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  'Pix',
  'Transferência Bancária',
  'Cheque Nominal',
  'Dinheiro / Caixa',
]

export const METHOD_LABELS: Record<PaymentMethodOption, string> = {
  Pix: 'Pix (Chave Bancária do Favorecido)',
  'Transferência Bancária': 'Transferência Bancária (TED/DOC)',
  'Cheque Nominal': 'Cheque Nominal',
  'Dinheiro / Caixa': 'Dinheiro (Caixa Pequeno / Fundo Fixo)',
}

/** Etiqueta da etapa atual do pedido no fluxo de duas etapas. */
export function stageLabel(status: RequestStatus): string {
  switch (status) {
    case 'pendente':
      return 'Aguardando Presidência'
    case 'aguardando_financeiro':
      return 'Aguardando Financeiro'
    case 'aguardando_pagamento':
      return 'Aguardando pagamento'
    case 'devolvido':
      return 'Devolvido para correção'
    case 'recusado':
      return 'Reprovado'
    default:
      return 'Pago / Liquidado'
  }
}

/** Classes do Badge correspondente a cada etapa. */
export function stageBadgeClass(status: RequestStatus): string {
  switch (status) {
    case 'pendente':
      return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
    case 'aguardando_financeiro':
      return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
    case 'aguardando_pagamento':
      return 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-950 dark:text-violet-300'
    case 'devolvido':
      return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300'
    case 'recusado':
      return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
    default:
      return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
  }
}
