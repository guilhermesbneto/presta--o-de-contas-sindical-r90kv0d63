import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/formatters'
import { ExpenseRequest } from '@/types'
import { Paperclip } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * Cartão de resumo de um pedido usado na mesa de trabalho (Autorização e
 * Pagamento). Mostra tipo, valor, motivo e dados do solicitante; o corpo
 * (children) traz as ações da etapa.
 */
export function RequestSummaryCard({
  req,
  borderColor,
  children,
}: {
  req: ExpenseRequest
  borderColor?: string
  children?: ReactNode
}) {
  return (
    <Card className={`p-4 flex flex-col justify-between shadow-2xs ${borderColor ?? ''}`}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge
            variant="outline"
            className={`text-[10px] uppercase font-bold ${
              req.type === 'adiantamento'
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}
          >
            {req.type === 'adiantamento' ? 'Adiantamento' : 'Ressarcimento'}
          </Badge>
          <span className="text-base font-extrabold text-foreground">
            {formatCurrency(req.amount)}
          </span>
        </div>

        <h3 className="text-sm font-semibold text-foreground">{req.reason}</h3>

        <div className="p-2.5 rounded-md bg-muted/50 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Solicitante:</span>
            <span className="font-medium text-foreground">{req.applicantName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cargo:</span>
            <span className="text-foreground">{req.applicantRole}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Categoria:</span>
            <span className="text-foreground">{req.category}</span>
          </div>
          <div className="flex justify-between pt-1 border-t">
            <span className="text-muted-foreground flex items-center gap-1">
              <Paperclip className="w-3 h-3 text-primary" /> Anexo:
            </span>
            <span className="font-medium text-foreground truncate max-w-[200px]">
              {req.receiptName || 'comprovante.pdf'}
            </span>
          </div>
        </div>
      </div>
      {children}
    </Card>
  )
}
