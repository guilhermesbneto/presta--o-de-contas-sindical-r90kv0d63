// Componentes de marcação de lançamentos pelo Conselho Fiscal:
// célula de marca nas tabelas (com destaque), diálogo de marca individual
// (aprovar / com ressalva / reprovar + prazo), resposta da Diretoria Executiva
// às ressalvas, card de pendências em aberto e botão do relatório quadrimestral.

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { formatDate } from '@/lib/formatters'
import {
  MARK_STATUS_META,
  MARK_RESPONSE_STATUS_META,
  QUARTER_SHORT,
  canMarkQuarter,
  latestMarkFor,
  markResponseStatus,
  openPendingMarks,
  type FiscalMarkTargetType,
  type FiscalMemberRole,
} from '@/lib/fiscal'
import type { FiscalMarkStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, MessageSquareReply, Printer, ShieldCheck, XCircle } from 'lucide-react'
import { FiscalReportDialog } from '@/components/FiscalReportDialog'

const STATUS_OPTIONS: {
  value: FiscalMarkStatus
  label: string
  class: string
}[] = [
  {
    value: 'sem_ressalva',
    label: 'Aprovar (sem ressalva)',
    class: 'text-emerald-700 dark:text-emerald-400',
  },
  {
    value: 'com_ressalva',
    label: 'Aprovado com Ressalva',
    class: 'text-amber-700 dark:text-amber-400',
  },
  {
    value: 'reprovado',
    label: 'Reprovado',
    class: 'text-rose-700 dark:text-rose-400',
  },
]

function defaultDueDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().slice(0, 10)
}

/** Célula da tabela: badge da marca (autor/data), botão de marcar/editar e resposta da diretoria. */
export function FiscalMarkCell({
  targetId,
  targetType,
  quarter,
}: {
  targetId: string
  targetType: FiscalMarkTargetType
  quarter: 1 | 2 | 3 | 4
}) {
  const {
    currentProfile,
    fiscalMarks,
    fiscalQuarterPlan,
    isFiscalMember,
    isPresidency,
    isFinance,
    canManageActions,
    upsertFiscalMark,
    respondFiscalMark,
  } = useApp()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [respondOpen, setRespondOpen] = useState(false)
  const [status, setStatus] = useState<FiscalMarkStatus>('sem_ressalva')
  const [comment, setComment] = useState('')
  const [dueDate, setDueDate] = useState(defaultDueDate())
  const [responseMessage, setResponseMessage] = useState('')

  const mark = latestMarkFor(fiscalMarks, targetId, targetType)
  const canMark =
    isFiscalMember &&
    canMarkQuarter(fiscalQuarterPlan, currentProfile.role as FiscalMemberRole, quarter)
  const canRespond =
    (isPresidency || isFinance || canManageActions) &&
    !!mark &&
    mark.status !== 'sem_ressalva' &&
    !mark.boardResponse?.message?.trim()

  const openDialog = () => {
    setStatus(mark?.status ?? 'sem_ressalva')
    setComment(mark?.comment ?? '')
    setDueDate(mark?.responseDueDate ?? defaultDueDate())
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (status !== 'sem_ressalva' && comment.trim().length < 10) {
      return
    }
    upsertFiscalMark({
      targetId,
      targetType,
      status,
      comment: comment.trim(),
      markedBy: currentProfile.name,
      markedByRole: currentProfile.roleLabel,
      quarter,
      responseDueDate: status === 'sem_ressalva' ? undefined : dueDate,
    })
    setDialogOpen(false)
  }

  const handleRespond = () => {
    if (!mark || responseMessage.trim().length < 5) return
    respondFiscalMark(mark.id, responseMessage.trim())
    setRespondOpen(false)
    setResponseMessage('')
  }

  const meta = mark ? MARK_STATUS_META[mark.status] : null
  const respStatus = mark ? markResponseStatus(mark) : null

  return (
    <div className="space-y-1 min-w-[150px]">
      {mark && meta ? (
        <>
          <Badge variant="outline" className={`text-[10px] font-bold ${meta.badgeClass}`}>
            {mark.status === 'reprovado' ? (
              <XCircle className="w-2.5 h-2.5 mr-1 inline" />
            ) : mark.status === 'com_ressalva' ? (
              <AlertTriangle className="w-2.5 h-2.5 mr-1 inline" />
            ) : null}
            {meta.label}
          </Badge>
          <p className="text-[10px] text-muted-foreground leading-tight">
            Por {mark.markedBy}
            <span className="block">em {formatDate(mark.markedAt)}</span>
          </p>
          {mark.status !== 'sem_ressalva' && respStatus && respStatus !== 'sem_prazo' && (
            <Badge
              variant="outline"
              className={`text-[9px] font-bold ${MARK_RESPONSE_STATUS_META[respStatus].badgeClass}`}
            >
              {MARK_RESPONSE_STATUS_META[respStatus].label}
            </Badge>
          )}
        </>
      ) : (
        <span className="text-[10px] text-muted-foreground">—</span>
      )}

      <div className="flex items-center gap-1 flex-wrap">
        {canMark && (
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-[10px] border-blue-300 text-blue-700 hover:bg-blue-50"
            onClick={openDialog}
          >
            <ShieldCheck className="w-3 h-3 mr-0.5" />
            {mark ? 'Editar marca' : 'Marcar'}
          </Button>
        )}
        {canRespond && (
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-[10px] border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            onClick={() => setRespondOpen(true)}
          >
            <MessageSquareReply className="w-3 h-3 mr-0.5" />
            Responder
          </Button>
        )}
      </div>

      {/* Diálogo de marca individual */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Marcação do Lançamento — {QUARTER_SHORT[quarter]}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Sua marcação é individual e fica registrada com seu nome e a data, alimentando o
              parecer consolidado do quadrimestre.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1 text-xs">
            <div className="space-y-2">
              <Label className="font-semibold text-xs">Situação do Lançamento *</Label>
              <RadioGroup
                value={status}
                onValueChange={(v) => setStatus(v as FiscalMarkStatus)}
                className="space-y-2"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <div
                    key={opt.value}
                    className="flex items-center space-x-2 border p-2.5 rounded-md hover:bg-muted/40 cursor-pointer"
                  >
                    <RadioGroupItem value={opt.value} id={`st-${opt.value}`} />
                    <Label
                      htmlFor={`st-${opt.value}`}
                      className={`cursor-pointer flex-1 font-medium ${opt.class}`}
                    >
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mark-comment" className="font-semibold text-xs">
                {status === 'sem_ressalva'
                  ? 'Comentário (opcional)'
                  : 'Justificativa / Apontamento *'}
              </Label>
              <Textarea
                id="mark-comment"
                rows={3}
                placeholder={
                  status === 'sem_ressalva'
                    ? 'Observações gerais sobre a conferência do lançamento...'
                    : 'Descreva a inconsistência encontrada e o que a Diretoria deve regularizar...'
                }
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            {status !== 'sem_ressalva' && (
              <div className="space-y-1.5">
                <Label htmlFor="mark-due" className="font-semibold text-xs">
                  Prazo de resposta da Diretoria Executiva *
                </Label>
                <Input
                  id="mark-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">
                  A diretoria deve responder/regularizar dentro deste prazo, antes do fechamento do
                  relatório anual.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSave}
              disabled={status !== 'sem_ressalva' && comment.trim().length < 10}
            >
              Registrar Marcação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de resposta da Diretoria Executiva */}
      <Dialog open={respondOpen} onOpenChange={setRespondOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Resposta da Diretoria Executiva</DialogTitle>
            <DialogDescription className="text-xs">
              Registre a regularização/resposta ao apontamento do Conselho Fiscal dentro do prazo.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            placeholder="Descreva a regularização realizada (documentos anexados, correção do lançamento, etc.)..."
            value={responseMessage}
            onChange={(e) => setResponseMessage(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRespondOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleRespond}
              disabled={responseMessage.trim().length < 5}
            >
              Registrar Resposta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** Card das pendências em aberto (ressalvas/reprovações sem resposta da diretoria). */
export function OpenPendingsCard() {
  const { fiscalMarks, movements, requests, isPresidency, isFinance, canManageActions } = useApp()
  const pendings = openPendingMarks(fiscalMarks)
  const isBoard = isPresidency || isFinance || canManageActions

  const resolveTarget = (mark: (typeof fiscalMarks)[number]) => {
    if (mark.targetType === 'movimento') {
      const mov = movements.find((m) => m.id === mark.targetId)
      return mov ? mov.description : '(lançamento não localizado)'
    }
    const req = requests.find((r) => r.id === mark.targetId)
    return req ? `${req.applicantName}: ${req.reason}` : '(pagamento não localizado)'
  }

  return (
    <Card className="border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4" />
          Pendências em Aberto com a Diretoria ({pendings.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2">
        {pendings.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            Nenhuma pendência em aberto — todas as ressalvas e reprovações foram regularizadas.
          </p>
        ) : (
          pendings.map((mark) => {
            const resp = markResponseStatus(mark)
            return (
              <div
                key={mark.id}
                className={`p-2.5 rounded-lg border text-xs ${MARK_STATUS_META[mark.status].rowClass} ${
                  mark.status === 'reprovado' ? 'border-rose-300' : 'border-amber-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold ${MARK_STATUS_META[mark.status].badgeClass}`}
                  >
                    {MARK_STATUS_META[mark.status].label}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-[9px] font-bold ${MARK_RESPONSE_STATUS_META[resp].badgeClass}`}
                  >
                    {MARK_RESPONSE_STATUS_META[resp].label}
                  </Badge>
                </div>
                <p className="font-medium text-foreground mt-1">{resolveTarget(mark)}</p>
                <p className="text-[11px] text-muted-foreground italic">"{mark.comment}"</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {mark.markedBy} · {formatDate(mark.markedAt)}
                  {mark.responseDueDate && ` · Prazo: ${formatDate(mark.responseDueDate)}`}
                </p>
              </div>
            )
          })
        )}
        {isBoard && pendings.length > 0 && (
          <p className="text-[10px] text-muted-foreground">
            Use o botão "Responder" na coluna Conselho Fiscal das tabelas para regularizar cada
            pendência.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

/** Botão do relatório quadrimestral imprimível, com seleção do quadrimestre. */
export function FiscalReportButton({ defaultQuarter = 1 }: { defaultQuarter?: 1 | 2 | 3 | 4 }) {
  const { fiscalQuarterPlan } = useApp()
  const [open, setOpen] = useState(false)
  const [quarter, setQuarter] = useState<1 | 2 | 3 | 4>(defaultQuarter)

  return (
    <div className="flex items-center gap-1.5">
      <Select value={String(quarter)} onValueChange={(v) => setQuarter(Number(v) as 1 | 2 | 3 | 4)}>
        <SelectTrigger className="h-8 text-xs w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {([1, 2, 3, 4] as const).map((q) => (
            <SelectItem key={q} value={String(q)}>
              {QUARTER_SHORT[q]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" variant="outline" className="text-xs" onClick={() => setOpen(true)}>
        <Printer className="w-3.5 h-3.5 mr-1" />
        Relatório Quadrimestral
      </Button>
      <FiscalReportDialog
        open={open}
        onOpenChange={setOpen}
        quarter={quarter}
        year={fiscalQuarterPlan.year}
      />
    </div>
  )
}
