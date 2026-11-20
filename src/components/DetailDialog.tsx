import { useState } from 'react'
import {
  Eye,
  EyeOff,
  FileText,
  ShieldCheck,
  User,
  CalendarDays,
  Wallet,
  Link2,
  CreditCard,
  BadgeCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters'
import { DEMO_SENSITIVE, MASKED } from '@/lib/privacy'
import type { ActionMovement, DirectoriaAction, ExpenseRequest } from '@/types'

interface DetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  movement?: ActionMovement
  request?: ExpenseRequest
  action?: DirectoriaAction
  canSeeSensitive: boolean
}

/** Simulated receipt preview — demo data, no real file behind it. */
function ReceiptPreview({ label, canSeeSensitive }: { label: string; canSeeSensitive: boolean }) {
  return (
    <div className="rounded-lg border bg-white/70 dark:bg-muted/30 overflow-hidden">
      <div className="flex items-center justify-between gap-2 p-3 border-b bg-muted/40">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs font-semibold truncate">{label}</span>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase shrink-0">
          Simulado
        </Badge>
      </div>
      <div className="p-4 space-y-2 text-[11px] text-muted-foreground">
        <div className="h-2 w-2/3 rounded bg-muted" />
        <div className="h-2 w-full rounded bg-muted" />
        <div className="h-2 w-5/6 rounded bg-muted" />
        <div className="mt-3 space-y-1.5 text-foreground/80">
          <p className="font-semibold">Comprovante fiscal simulado (documento de exemplo)</p>
          <p>
            Emitido para:{' '}
            <span className="font-mono">{canSeeSensitive ? DEMO_SENSITIVE.cpf : MASKED.cpf}</span>
          </p>
          <p>Pagador/Recebidor: Sindicato da Categoria — CNPJ 12.345.678/0001-90</p>
          <p>
            Chave Pix / Conta:{' '}
            <span className="font-mono">
              {canSeeSensitive ? DEMO_SENSITIVE.pixKey : MASKED.pixKey}
            </span>
          </p>
          <p className="text-[10px] italic">
            Visualização ilustrativa gerada pelo sistema — os comprovantes desta demonstração são
            dados de exemplo, nenhum arquivo real é anexado.
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground flex items-center gap-1">
        <Icon className="w-3 h-3" /> {label}
      </p>
      <div className="text-xs text-foreground">{children}</div>
    </div>
  )
}

function SensitiveBlock({
  canSeeSensitive,
  requesterName,
  requesterRole,
  movementDescription,
}: {
  canSeeSensitive: boolean
  requesterName: string
  requesterRole: string
  movementDescription: string
}) {
  // Authorized profiles (Presidência/Finanças e substitutos) may hide the data again;
  // other profiles always see masked values — the mask never opens for them.
  const [authorizedShow, setAuthorizedShow] = useState(true)
  const reveal = canSeeSensitive && authorizedShow
  const cpf = reveal ? DEMO_SENSITIVE.cpf : MASKED.cpf
  const conta = reveal ? DEMO_SENSITIVE.conta : MASKED.conta
  const email = reveal ? DEMO_SENSITIVE.email : MASKED.email
  const tel = reveal ? DEMO_SENSITIVE.telefone : MASKED.telefone
  const pix = reveal ? DEMO_SENSITIVE.pixKey : MASKED.pixKey

  return (
    <div className="rounded-lg border border-amber-300/60 bg-amber-50/40 dark:bg-amber-900/10 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          Dados pessoais do solicitante
        </p>
        {!canSeeSensitive && (
          <Badge
            variant="outline"
            className="text-[10px] font-bold uppercase text-amber-700 border-amber-400"
          >
            Protegido (LGPD)
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <p>
          <span className="text-muted-foreground">Nome: </span>
          <span className="font-semibold">{requesterName}</span>
        </p>
        <p>
          <span className="text-muted-foreground">Vínculo: </span>
          {requesterRole}
        </p>
        <p>
          <span className="text-muted-foreground">CPF: </span>
          <span className={`font-mono ${!canSeeSensitive ? 'select-none' : ''}`}>{cpf}</span>
        </p>
        <p>
          <span className="text-muted-foreground">Conta bancária: </span>
          <span className="font-mono">{conta}</span>
        </p>
        <p>
          <span className="text-muted-foreground">Chave Pix: </span>
          <span className="font-mono">{pix}</span>
        </p>
        <p>
          <span className="text-muted-foreground">E-mail: </span>
          <span className="font-mono">{email}</span>
        </p>
        <p>
          <span className="text-muted-foreground">Telefone: </span>
          <span className="font-mono">{tel}</span>
        </p>
      </div>

      {!canSeeSensitive && (
        <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 italic">
          CPF, conta bancária e dados de contato estão mascarados. Apenas Presidência, Finanças e
          seus substitutos visualizam os dados completos
          {movementDescription ? ` — referência: "${movementDescription}"` : ''}.
        </p>
      )}
      {canSeeSensitive && (
        <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 italic flex items-center gap-1">
          <BadgeCheck className="w-3 h-3" /> Você tem permissão para visualizar os dados completos
          do solicitante.
        </p>
      )}

      {canSeeSensitive && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-[11px] h-7 px-2 w-fit"
          onClick={() => setAuthorizedShow((s) => !s)}
        >
          {authorizedShow ? (
            <>
              <EyeOff className="w-3 h-3 mr-1" /> Ocultar dados sensíveis
            </>
          ) : (
            <>
              <Eye className="w-3 h-3 mr-1" /> Exibir dados sensíveis
            </>
          )}
        </Button>
      )}
    </div>
  )
}

export function DetailDialog({
  open,
  onOpenChange,
  movement,
  request,
  action,
  canSeeSensitive,
}: DetailDialogProps) {
  // Hook must run unconditionally (guard clause stays below it)
  const [receiptVisible, setReceiptVisible] = useState(false)

  if (!movement && !request) return null

  const isPayment = Boolean(request)
  const title = isPayment ? 'Detalhes do Pagamento Liquidado' : 'Detalhes da Movimentação'
  const description = isPayment
    ? 'Registro completo do pagamento efetuado, com comprovante e dados do solicitante.'
    : 'Registro contábil do livro de prestação de contas, com comprovante e dados do solicitante.'

  const amount = request ? request.amount : movement!.amount
  const date = request ? (request.paymentInfo?.paidAt ?? request.createdAt) : movement!.date
  const reason = request ? request.reason : movement!.description
  const category = request ? request.category : movement!.category
  const paymentMethod = request
    ? (request.paymentInfo?.paymentMethod ?? 'Pix')
    : (movement!.paymentMethod ?? 'Transferência Bancária')
  const authorizedBy = request?.authorizedBy ?? 'Diretoria Financeira (lançamento direto)'
  const paidBy = request?.paymentInfo?.paidBy
  const receiptLabel = request?.receiptName ?? `comprovante_${movement?.id ?? 'geral'}.pdf`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {isPayment ? (
              <Wallet className="w-4 h-4 text-primary" />
            ) : (
              <FileText className="w-4 h-4 text-primary" />
            )}
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs">{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">Valor</p>
              <p
                className={`text-lg font-extrabold ${
                  (request ? false : movement!.type === 'receita')
                    ? 'text-emerald-600'
                    : 'text-rose-600'
                }`}
              >
                {request ? '' : movement!.type === 'receita' ? '+ ' : '- '}
                {formatCurrency(amount)}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">Data</p>
              <p className="text-sm font-bold">
                {request?.paymentInfo?.paidAt
                  ? formatDateTime(request.paymentInfo.paidAt)
                  : formatDate(date)}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3 col-span-2 sm:col-span-1">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">Tipo</p>
              <p className="text-sm font-bold">
                {request
                  ? request.type === 'adiantamento'
                    ? 'Adiantamento'
                    : 'Ressarcimento'
                  : movement!.type === 'receita'
                    ? 'Receita'
                    : 'Despesa'}
              </p>
            </div>
          </div>

          <Separator />

          {/* Context fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <Field icon={FileText} label="Motivo / Descrição">
              {reason}
              <span className="block text-[11px] text-muted-foreground">Categoria: {category}</span>
            </Field>
            <Field icon={Link2} label="Ação vinculada">
              {action ? (
                <span className="font-semibold text-primary">{action.name}</span>
              ) : (
                <span className="italic text-muted-foreground">
                  Geral / Administrativo (sem ação específica)
                </span>
              )}
            </Field>
            <Field icon={BadgeCheck} label="Autorizado por">
              {authorizedBy}
              {request?.authorizedAt && (
                <span className="block text-[11px] text-muted-foreground">
                  Em {formatDateTime(request.authorizedAt)}
                </span>
              )}
            </Field>
            <Field icon={CreditCard} label="Forma de pagamento">
              {paymentMethod}
              {request?.paymentInfo?.referenceCode && (
                <span className="block text-[11px] text-muted-foreground font-mono">
                  {request.paymentInfo.referenceCode}
                </span>
              )}
              {paidBy && (
                <span className="block text-[11px] text-muted-foreground">
                  Efetuado por: {paidBy}
                </span>
              )}
            </Field>
            <Field icon={User} label="Solicitante / Favorecido">
              {request ? request.applicantName : 'Favorecido externo / fornecedor'}
              {request && (
                <span className="block text-[11px] text-muted-foreground">
                  {request.applicantRole}
                </span>
              )}
            </Field>
            <Field icon={CalendarDays} label="Origem do registro">
              {request ? 'Solicitação de despesa processada' : 'Lançamento contábil direto'}
            </Field>
          </div>

          {/* Personal data with privacy mask */}
          <SensitiveBlock
            canSeeSensitive={canSeeSensitive}
            requesterName={request ? request.applicantName : 'Fornecedor / Prestador de Serviço'}
            requesterRole={request ? request.applicantRole : 'Pessoa jurídica externa'}
            movementDescription={reason}
          />

          {/* Receipt preview (simulated) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground">
                Comprovante anexado
              </p>
              <Button
                variant="outline"
                size="sm"
                className="text-[11px] h-7"
                onClick={() => setReceiptVisible((v) => !v)}
              >
                {receiptVisible ? (
                  <>
                    <EyeOff className="w-3 h-3 mr-1" /> Ocultar comprovante
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3 mr-1" /> Visualizar comprovante
                  </>
                )}
              </Button>
            </div>
            {receiptVisible && (
              <ReceiptPreview label={receiptLabel} canSeeSensitive={canSeeSensitive} />
            )}
          </div>
        </div>

        <DialogFooter className="items-center justify-between gap-2 sm:justify-between">
          <p className="text-[10px] italic text-muted-foreground hidden sm:block">
            Comprovante simulado para fins de demonstração — nenhum arquivo real é baixado.
          </p>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
