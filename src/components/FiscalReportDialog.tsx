import { useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters'
import {
  QUARTER_LABELS,
  MARK_STATUS_META,
  quarterRange,
  latestMarkFor,
  type FiscalMarkTargetType,
} from '@/lib/fiscal'
import type { ActionMovement, ExpenseRequest, FiscalAccountPeriod } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle2, Printer, XCircle, Scale } from 'lucide-react'

interface FiscalReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Trimestre em análise (1-4). */
  quarter: 1 | 2 | 3 | 4
  year: number
  /** Prestação de contas vinculada, quando o relatório é emitido a partir dela. */
  period?: FiscalAccountPeriod | null
}

/** Relatório do trimestre analisado pelo Conselho Fiscal (visível a todos, imprimível). */
export function FiscalReportDialog({
  open,
  onOpenChange,
  quarter,
  year,
  period,
}: FiscalReportDialogProps) {
  const { movements, requests, fiscalMarks, fiscalQuarterPlan, profiles } = useApp()

  const range = quarterRange(quarter, year)

  const quarterMovements = useMemo(
    () =>
      movements
        .filter((m) => m.date >= range.start && m.date <= range.end)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [movements, range.start, range.end],
  )

  const quarterPayments = useMemo(
    () =>
      requests.filter(
        (r) =>
          r.status === 'pago' &&
          isDateInQuarter(r.paymentInfo?.paidAt || r.createdAt, range.start, range.end),
      ),
    [requests, range.start, range.end],
  )

  // Marcas do trimestre (exemplo inclui marcas cujo lançamento pode ter sido excluído)
  const quarterMarks = useMemo(
    () => fiscalMarks.filter((m) => m.quarter === quarter),
    [fiscalMarks, quarter],
  )
  const notableMarks = quarterMarks
    .filter((m) => m.status !== 'sem_ressalva')
    .sort((a, b) => a.markedAt.localeCompare(b.markedAt))

  const totalIncome = quarterMovements
    .filter((m) => m.type === 'receita')
    .reduce((acc, m) => acc + m.amount, 0)
  const totalExpense = quarterMovements
    .filter((m) => m.type === 'despesa')
    .reduce((acc, m) => acc + m.amount, 0)
  const balance = totalIncome - totalExpense

  const resolveTarget = (targetId: string, targetType: FiscalMarkTargetType) => {
    if (targetType === 'movimento') {
      const mov = movements.find((m) => m.id === targetId)
      if (mov) return { label: mov.description, detail: formatDate(mov.date), amount: mov.amount }
    }
    const req = requests.find((r) => r.id === targetId)
    if (req) {
      return {
        label: `${req.applicantName}: ${req.reason}`,
        detail: `Pagamento liquidado em ${formatDate(req.paymentInfo?.paidAt || req.createdAt)}`,
        amount: req.amount,
      }
    }
    return { label: '(lançamento não localizado)', detail: '—', amount: 0 }
  }

  const ownerRoles = fiscalQuarterPlan?.assignments[String(quarter)] ?? []
  const ownerNames = ownerRoles
    .map((role) => profiles.find((p) => p.role === role)?.name ?? role)
    .join(', ')

  const voteBadgeClass = {
    aprovado: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    aprovado_com_ressalva: 'bg-amber-100 text-amber-800 border-amber-300',
    reprovado: 'bg-rose-100 text-rose-800 border-rose-300',
  }
  const voteLabel = {
    aprovado: 'Aprovado',
    aprovado_com_ressalva: 'Aprovado com Ressalva',
    reprovado: 'Reprovado',
  }
  const voteIcon = {
    aprovado: CheckCircle2,
    aprovado_com_ressalva: AlertTriangle,
    reprovado: XCircle,
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-600" />
            Relatório de Auditoria Trimestral — {QUARTER_LABELS[quarter]} de {year}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Emitido pelo Conselho Fiscal · Período de {formatDate(range.start)} a{' '}
            {formatDate(range.end)} · Responsável(is): {ownerNames || '—'} · Documento de
            transparência, visível a todos os perfis.
          </DialogDescription>
        </DialogHeader>

        {/* Resumo financeiro do trimestre */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2 text-xs">
          <div className="p-3 rounded-lg border bg-emerald-50/40 dark:bg-emerald-950/20">
            <p className="text-muted-foreground">Receitas do trimestre</p>
            <p className="text-sm font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="p-3 rounded-lg border bg-rose-50/40 dark:bg-rose-950/20">
            <p className="text-muted-foreground">Despesas do trimestre</p>
            <p className="text-sm font-bold text-rose-600">{formatCurrency(totalExpense)}</p>
          </div>
          <div className="p-3 rounded-lg border bg-primary/5">
            <p className="text-muted-foreground">Saldo do trimestre</p>
            <p className="text-sm font-bold text-primary">{formatCurrency(balance)}</p>
          </div>
        </div>

        {/* Parecer consolidado da prestação vinculada */}
        {period && (
          <div className="mt-3 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Parecer Consolidado — {period.title}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {Object.values(period.votes).map((v) => {
                const Icon = voteIcon[v.decision]
                return (
                  <div key={v.councilMemberId} className="p-2.5 rounded-lg border text-[11px]">
                    <div className="flex items-center justify-between gap-1 mb-1 flex-wrap">
                      <span className="font-semibold">{v.councilMemberName}</span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-bold ${voteBadgeClass[v.decision]}`}
                      >
                        {Icon && <Icon className="w-2.5 h-2.5 mr-0.5 inline" />}
                        {voteLabel[v.decision]}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground italic">"{v.justification}"</p>
                    <p className="text-[9px] text-muted-foreground text-right mt-1">
                      {formatDateTime(v.votedAt)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Lançamentos reprovados e com ressalva — destaque */}
        <div className="mt-3 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Lançamentos Reprovados e com Ressalva ({notableMarks.length})
          </h4>
          {notableMarks.length === 0 ? (
            <p className="text-xs text-muted-foreground italic p-3 border rounded-lg bg-muted/30">
              Nenhum lançamento reprovado ou com ressalva registrado neste trimestre.
            </p>
          ) : (
            <div className="space-y-2">
              {notableMarks.map((mark) => {
                const meta = MARK_STATUS_META[mark.status]
                const target = resolveTarget(mark.targetId, mark.targetType)
                return (
                  <div
                    key={mark.id}
                    className={`p-3 rounded-lg border text-xs ${meta.rowClass} ${
                      mark.status === 'reprovado' ? 'border-rose-300' : 'border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        {mark.status === 'reprovado' ? (
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        )}
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {mark.markedBy} · {mark.markedByRole} · {formatDateTime(mark.markedAt)}
                      </span>
                    </div>
                    <p className="font-medium text-foreground mt-1.5">{target.label}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {target.detail} · {formatCurrency(target.amount)}
                    </p>
                    <p className="mt-1.5 p-2 rounded bg-muted/40 border border-muted text-[11px]">
                      "{mark.comment}"
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Movimentações do período */}
        <div className="mt-3 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Movimentações do Período ({quarterMovements.length} lançamentos ·{' '}
            {quarterPayments.length} pagamentos liquidados)
          </h4>
          <div className="rounded-lg border overflow-hidden bg-card">
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-2">Data</th>
                    <th className="p-2">Tipo</th>
                    <th className="p-2">Descrição</th>
                    <th className="p-2 text-right">Valor</th>
                    <th className="p-2">Conselho Fiscal</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {quarterMovements.map((mov: ActionMovement) => {
                    const mark = latestMarkFor(fiscalMarks, mov.id, 'movimento')
                    const meta = mark ? MARK_STATUS_META[mark.status] : null
                    return (
                      <tr key={mov.id} className={meta?.rowClass ?? ''}>
                        <td className="p-2 whitespace-nowrap">{formatDate(mov.date)}</td>
                        <td className="p-2">
                          <Badge
                            variant="outline"
                            className={`text-[9px] uppercase font-bold ${
                              mov.type === 'receita'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                            }`}
                          >
                            {mov.type === 'receita' ? 'Receita' : 'Despesa'}
                          </Badge>
                        </td>
                        <td className="p-2 font-medium max-w-[220px] truncate">
                          {mov.description}
                        </td>
                        <td
                          className={`p-2 text-right font-bold whitespace-nowrap ${
                            mov.type === 'receita' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {mov.type === 'receita' ? '+' : '-'} {formatCurrency(mov.amount)}
                        </td>
                        <td className="p-2">
                          {mark ? (
                            <Badge
                              variant="outline"
                              className={`text-[9px] font-bold ${meta?.badgeClass}`}
                            >
                              {meta?.label} — {mark.markedBy}
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {quarterPayments.map((req: ExpenseRequest) => {
                    const mark = latestMarkFor(fiscalMarks, req.id, 'pagamento')
                    const meta = mark ? MARK_STATUS_META[mark.status] : null
                    return (
                      <tr key={req.id} className={meta?.rowClass ?? ''}>
                        <td className="p-2 whitespace-nowrap">
                          {formatDate(req.paymentInfo?.paidAt || req.createdAt)}
                        </td>
                        <td className="p-2">
                          <Badge
                            variant="outline"
                            className="text-[9px] uppercase font-bold bg-blue-50 text-blue-800 border-blue-300"
                          >
                            Pagamento
                          </Badge>
                        </td>
                        <td className="p-2 font-medium max-w-[220px] truncate">
                          {req.applicantName}: {req.reason}
                        </td>
                        <td className="p-2 text-right font-bold whitespace-nowrap text-rose-600">
                          - {formatCurrency(req.amount)}
                        </td>
                        <td className="p-2">
                          {mark ? (
                            <Badge
                              variant="outline"
                              className={`text-[9px] font-bold ${meta?.badgeClass}`}
                            >
                              {meta?.label} — {mark.markedBy}
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {quarterMovements.length === 0 && quarterPayments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-muted-foreground">
                        Nenhuma movimentação registrada neste trimestre.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => window.print()}
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Imprimir Relatório
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function isDateInQuarter(iso: string, start: string, end: string): boolean {
  return iso.slice(0, 10) >= start && iso.slice(0, 10) <= end
}
