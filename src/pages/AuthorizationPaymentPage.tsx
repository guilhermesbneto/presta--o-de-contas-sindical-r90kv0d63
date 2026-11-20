import React, { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { formatCurrency, formatDateTime, formatDate } from '@/lib/formatters'
import { stageLabel, stageBadgeClass, PaymentMethodOption } from '@/lib/requestStages'
import { RequestSummaryCard } from '@/components/RequestSummaryCard'
import { ExpenseRequest } from '@/types'
import {
  CheckCircle2,
  XCircle,
  CreditCard,
  Landmark,
  UserCog,
  AlertTriangle,
  FileCheck2,
  Lock,
  RotateCcw,
  CalendarClock,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Link } from 'react-router-dom'
import { METHOD_LABELS, PAYMENT_METHOD_OPTIONS } from '@/lib/requestStages'

export default function AuthorizationPaymentPage() {
  const {
    currentProfile,
    requests,
    decidePresidency,
    decideFinance,
    payRequest,
    canAuthorizeAndPay,
    isPresidency,
    isFinance,
  } = useApp()
  const { toast } = useToast()

  // Modal: decisão de etapa (reprovar / devolver) com justificativa
  const [decideTarget, setDecideTarget] = useState<ExpenseRequest | null>(null)
  const [decideStage, setDecideStage] = useState<1 | 2>(1)
  const [decideKind, setDecideKind] = useState<'reprovado' | 'devolvido'>('reprovado')
  const [decideJustification, setDecideJustification] = useState('')

  // Modal: planejamento do pagamento (Etapa 2 — Financeiro)
  const [planningReq, setPlanningReq] = useState<ExpenseRequest | null>(null)
  const [planMethod, setPlanMethod] = useState<PaymentMethodOption>('Pix')
  const [planExpectedDate, setPlanExpectedDate] = useState('')
  const [planNotes, setPlanNotes] = useState('')

  // Modal: registro da liquidação (Financeiro)
  const [payingReq, setPayingReq] = useState<ExpenseRequest | null>(null)
  const [payMethod, setPayMethod] = useState<PaymentMethodOption>('Pix')
  const [referenceCode, setReferenceCode] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')

  const openDecision = (req: ExpenseRequest, stage: 1 | 2, kind: 'reprovado' | 'devolvido') => {
    setDecideTarget(req)
    setDecideStage(stage)
    setDecideKind(kind)
    setDecideJustification('')
  }

  const fallbackDate = () => {
    const d = new Date()
    d.setDate(d.getDate() + 5)
    return d.toISOString().split('T')[0]
  }

  const handleConfirmDecision = () => {
    if (!decideTarget) return
    if (!decideJustification.trim()) {
      toast({
        title: 'Justificativa obrigatória',
        description:
          decideKind === 'reprovado'
            ? 'Descreva formalmente o motivo da reprovação da solicitação.'
            : 'Descreva o que o solicitante deve corrigir no pedido.',
        variant: 'destructive',
      })
      return
    }

    const reason = decideJustification.trim()

    if (decideStage === 1) {
      decidePresidency(decideTarget.id, decideKind, reason)
    } else {
      decideFinance(
        decideTarget.id,
        decideKind,
        {
          paymentMethod: planMethod,
          expectedDate: planExpectedDate || fallbackDate(),
          notes: planNotes.trim() || undefined,
        },
        reason,
      )
    }

    toast({
      title: decideKind === 'reprovado' ? 'Solicitação Reprovada' : 'Devolvida para Correção',
      description:
        decideKind === 'reprovado'
          ? `A solicitação de ${decideTarget.applicantName} foi reprovada na etapa ${decideStage === 1 ? 'da Presidência' : 'do Financeiro'} com justificativa.`
          : `O pedido de ${decideTarget.applicantName} voltou ao solicitante para correção; após o reenvio, reinicia pela Presidência.`,
      variant: 'destructive',
    })

    setDecideTarget(null)
    setDecideJustification('')
  }

  const handleConfirmPlanning = () => {
    if (!planningReq) return
    if (!planExpectedDate) {
      toast({
        title: 'Data prevista obrigatória',
        description: 'Informe a data prevista para o planejamento do pagamento.',
        variant: 'destructive',
      })
      return
    }

    decideFinance(planningReq.id, 'aprovado', {
      paymentMethod: planMethod,
      expectedDate: planExpectedDate,
      notes: planNotes.trim() || undefined,
    })

    toast({
      title: 'Planejamento Aprovado',
      description: `Pagamento de ${formatCurrency(planningReq.amount)} planejado via ${planMethod} para ${formatDate(planExpectedDate)}. Pedido apto à liquidação.`,
    })

    setPlanningReq(null)
    setPlanMethod('Pix')
    setPlanExpectedDate('')
    setPlanNotes('')
  }

  const handleConfirmPayment = () => {
    if (!payingReq) return

    const ref = referenceCode.trim() || `COMP-${Date.now().toString().slice(-6)}`

    payRequest(payingReq.id, {
      paymentMethod: payMethod,
      referenceCode: ref,
      notes: paymentNotes.trim() || undefined,
    })

    toast({
      title: 'Pagamento Efetuado e Registrado',
      description: `Valor de ${formatCurrency(payingReq.amount)} liquidado via ${payMethod}. Despesa lançada na prestação de contas!`,
    })

    setPayingReq(null)
    setReferenceCode('')
    setPaymentNotes('')
  }

  // Colunas do fluxo em duas etapas
  const stageOne = requests.filter((r) => r.status === 'pendente')
  const stageTwo = requests.filter((r) => r.status === 'aguardando_financeiro')
  const toSettle = requests.filter((r) => r.status === 'aguardando_pagamento')
  const returned = requests.filter((r) => r.status === 'devolvido')
  const rejectedHistory = requests.filter((r) => r.status === 'recusado')
  const paidHistory = requests.filter((r) => r.status === 'pago')

  if (!canAuthorizeAndPay) {
    return (
      <div className="space-y-6">
        <Card className="border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 text-center py-12 px-4 max-w-2xl mx-auto">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <CardTitle className="text-lg font-bold text-foreground">
            Acesso Restrito: Presidência e Finanças
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-2 max-w-md mx-auto">
            De acordo com o estatuto sindical, <strong>APENAS</strong> os titulares ou substitutos
            da <strong>Presidência</strong> (Etapa 1) e da <strong>Diretoria Financeira</strong>{' '}
            (Etapa 2) têm poder para deliberar sobre despesas e liquidar pagamentos sindicais.
          </CardDescription>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="sm">
              <Link to="/">Trocar Perfil para Presidência ou Finanças</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/solicitacoes">Ir para Minhas Solicitações</Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              Autorização e Liquidação de Pagamentos
            </h1>
            <Badge className="bg-emerald-600 text-white text-xs">Mesa Presidência & Finanças</Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Fluxo em duas etapas: a <strong>Presidência</strong> analisa e delibera (Etapa 1); o{' '}
            <strong>Financeiro</strong> planeja o pagamento aprovado e liquida (Etapa 2). Ambos
            podem aprovar, reprovar ou devolver para correção.
          </p>
        </div>

        <Badge
          variant="outline"
          className={`text-xs font-semibold py-1 ${
            isPresidency
              ? 'border-amber-400 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200'
              : 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200'
          }`}
        >
          Logado como: {currentProfile.roleLabel} &bull;{' '}
          {isPresidency ? 'Etapa 1' : isFinance ? 'Etapa 2' : ''}
        </Badge>
      </div>

      {/* Resumo por etapa */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card className="p-4 flex items-center gap-3 border-amber-200 bg-amber-50/30">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-700">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Aguardando Presidência</p>
            <p className="text-xl font-bold text-amber-800">{stageOne.length} pedidos</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-blue-200 bg-blue-50/30">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-700">
            <UserCog className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Aguardando Financeiro</p>
            <p className="text-xl font-bold text-blue-800">{stageTwo.length} pedidos</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-violet-200 bg-violet-50/30">
          <div className="p-2.5 rounded-lg bg-violet-500/10 text-violet-700">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Aguardando pagamento</p>
            <p className="text-xl font-bold text-violet-800">{toSettle.length} aprovados</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-orange-200 bg-orange-50/30">
          <div className="p-2.5 rounded-lg bg-orange-500/10 text-orange-700">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Devolvidos p/ correção</p>
            <p className="text-xl font-bold text-orange-800">{returned.length}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-emerald-200 bg-emerald-50/30 col-span-2 sm:col-span-1">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Liquidados</p>
            <p className="text-xl font-bold text-emerald-800">{paidHistory.length} pagos</p>
          </div>
        </Card>
      </div>

      {/* Etapa do perfil logado */}
      <div
        className={`rounded-lg border px-4 py-3 text-xs flex items-start gap-2 ${
          isPresidency
            ? 'border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200'
            : 'border-blue-200 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/20 text-blue-900 dark:text-blue-200'
        }`}
      >
        {isPresidency ? (
          <Landmark className="w-4 h-4 mt-0.5 shrink-0" />
        ) : (
          <UserCog className="w-4 h-4 mt-0.5 shrink-0" />
        )}
        {isPresidency ? (
          <span>
            <strong>Sua etapa: 1 &mdash; Presidência.</strong> Você analisa os pedidos novos
            (etiqueta &quot;Aguardando Presidência&quot;) e pode aprovar, reprovar ou devolver para
            correção. O planejamento e a liquidação são feitos pelo Financeiro (Etapa 2).
          </span>
        ) : (
          <span>
            <strong>Sua etapa: 2 &mdash; Financeiro.</strong> Você atua sobre pedidos já aprovados
            pela Presidência (etiqueta &quot;Aguardando Financeiro&quot;): planeja o pagamento,
            aprova o planejamento, reprova ou devolve para correção. A liquidação é liberada só
            depois que ambos aprovam.
          </span>
        )}
      </div>

      {/* Tabs do fluxo */}
      <Tabs defaultValue={isPresidency ? 'etapa1' : 'etapa2'} className="w-full">
        <TabsList className="grid grid-cols-5 w-full sm:w-[720px]">
          <TabsTrigger value="etapa1" className="text-xs">
            Etapa 1 &middot; Presidência ({stageOne.length})
          </TabsTrigger>
          <TabsTrigger value="etapa2" className="text-xs">
            Etapa 2 &middot; Financeiro ({stageTwo.length})
          </TabsTrigger>
          <TabsTrigger value="pagamento" className="text-xs">
            Pagamento ({toSettle.length})
          </TabsTrigger>
          <TabsTrigger value="devolvidos" className="text-xs">
            Devolvidos ({returned.length})
          </TabsTrigger>
          <TabsTrigger value="historico" className="text-xs">
            Histórico ({paidHistory.length + rejectedHistory.length})
          </TabsTrigger>
        </TabsList>

        {/* Etapa 1 — Presidência */}
        <TabsContent value="etapa1" className="space-y-4 mt-4">
          <div className="text-xs text-muted-foreground">
            Pedidos aguardando a deliberação da Presidência (ou substituto). Cada pedido pode ser{' '}
            <strong>aprovado</strong> (segue ao Financeiro), <strong>reprovado</strong> ou{' '}
            <strong>devolvido para correção</strong> — reprovar e devolver exigem justificativa.
          </div>
          {stageOne.length === 0 ? (
            <Card className="text-center py-12">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold">Tudo em dia!</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Não há pedidos aguardando a análise da Presidência.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stageOne.map((req) => (
                <div key={req.id} className="space-y-2">
                  {!isPresidency && (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]">
                      Aguardando Presidência — ação bloqueada para o Financeiro
                    </Badge>
                  )}
                  <RequestSummaryCard req={req} borderColor="border-amber-200">
                    {isPresidency && (
                      <div className="pt-3 border-t mt-4 flex items-center justify-between gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 border-orange-400 text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950"
                          onClick={() => openDecision(req, 1, 'devolvido')}
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />
                          Devolver p/ Correção
                        </Button>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="text-xs h-8"
                            onClick={() => openDecision(req, 1, 'reprovado')}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Reprovar
                          </Button>
                          <Button
                            size="sm"
                            className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => {
                              decidePresidency(req.id, 'aprovado')
                              toast({
                                title: 'Aprovado pela Presidência',
                                description: `Pedido de ${req.applicantName} (${formatCurrency(req.amount)}) seguiu para o planejamento do Financeiro (Etapa 2).`,
                              })
                            }}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Aprovar
                          </Button>
                        </div>
                      </div>
                    )}
                  </RequestSummaryCard>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Etapa 2 — Financeiro */}
        <TabsContent value="etapa2" className="space-y-4 mt-4">
          <div className="text-xs text-muted-foreground">
            Pedidos aprovados pela Presidência. Planeje o pagamento (forma, data prevista,
            observações) e <strong>aprove o planejamento</strong>, <strong>reprove</strong> ou{' '}
            <strong>devolva para correção</strong> — com justificativa.
          </div>
          {stageTwo.length === 0 ? (
            <Card className="text-center py-12">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold">Nada a planejar</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Não há pedidos aprovados pela Presidência aguardando o planejamento do Financeiro.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stageTwo.map((req) => {
                const pd = req.presidenciaDecision
                return (
                  <div key={req.id} className="space-y-2">
                    <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-[10px]">
                      Aprovado pela Presidência{pd ? ` por ${pd.by}` : ''} — Aguardando Financeiro
                    </Badge>
                    <RequestSummaryCard req={req} borderColor="border-blue-200">
                      {pd && (
                        <div className="mt-2 p-2 rounded bg-emerald-50 dark:bg-emerald-950/30 text-[11px] text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3 inline mr-1" />
                          Etapa 1 aprovada por {pd.by} em {formatDateTime(pd.at)}
                        </div>
                      )}
                      {isFinance && (
                        <div className="pt-3 border-t mt-4 flex items-center justify-between gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 border-orange-400 text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950"
                            onClick={() => openDecision(req, 2, 'devolvido')}
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" />
                            Devolver p/ Correção
                          </Button>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="text-xs h-8"
                              onClick={() => openDecision(req, 2, 'reprovado')}
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              Reprovar
                            </Button>
                            <Button
                              size="sm"
                              className="text-xs h-8 bg-blue-700 hover:bg-blue-800 text-white"
                              onClick={() => {
                                setPlanningReq(req)
                                setPlanMethod('Pix')
                                setPlanExpectedDate('')
                                setPlanNotes('')
                              }}
                            >
                              <CalendarClock className="w-3.5 h-3.5 mr-1" />
                              Planejar Pagamento
                            </Button>
                          </div>
                        </div>
                      )}
                    </RequestSummaryCard>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Liquidação — só após as duas aprovações */}
        <TabsContent value="pagamento" className="space-y-4 mt-4">
          <div className="text-xs text-muted-foreground">
            Pedidos com <strong>aprovação da Presidência (Etapa 1)</strong> e do{' '}
            <strong>Financeiro (Etapa 2)</strong>. Somente o Financeiro pode liquidar — o registro
            gera despesa na prestação de contas.
          </div>
          {toSettle.length === 0 ? (
            <Card className="text-center py-12">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold">Nenhum pagamento pendente</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Não há pedidos com as duas aprovações aguardando liquidação no momento.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {toSettle.map((req) => (
                <div key={req.id} className="space-y-2">
                  <Badge className="bg-violet-100 text-violet-800 border-violet-300 text-[10px]">
                    Presidência e Financeiro aprovaram — Aguardando pagamento
                  </Badge>
                  <RequestSummaryCard req={req} borderColor="border-violet-200">
                    <div className="mt-2 space-y-1.5">
                      {req.presidenciaDecision && (
                        <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/30 text-[11px] text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3 inline mr-1" />
                          Etapa 1 (Presidência) aprovada por {req.presidenciaDecision.by}
                        </div>
                      )}
                      {req.financeDecision && req.paymentPlanning && (
                        <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/30 text-[11px] text-blue-800 dark:text-blue-300">
                          <CheckCircle2 className="w-3 h-3 inline mr-1" />
                          Etapa 2 (Financeiro) aprovada por {req.financeDecision.by} &bull;
                          Planejado: {req.paymentPlanning.paymentMethod} para{' '}
                          {formatDate(req.paymentPlanning.expectedDate)}
                          {req.paymentPlanning.notes ? ` — ${req.paymentPlanning.notes}` : ''}
                        </div>
                      )}
                    </div>
                    {isFinance && (
                      <div className="pt-3 border-t mt-4 flex items-center justify-end">
                        <Button
                          size="sm"
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => {
                            setPayingReq(req)
                            setPayMethod(req.paymentPlanning?.paymentMethod ?? 'Pix')
                            setReferenceCode(`PAG-${Date.now().toString().slice(-6)}`)
                            setPaymentNotes('')
                          }}
                        >
                          <CreditCard className="w-3.5 h-3.5 mr-1" />
                          Efetuar / Registrar Pagamento
                        </Button>
                      </div>
                    )}
                  </RequestSummaryCard>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Devolvidos para correção */}
        <TabsContent value="devolvidos" className="space-y-4 mt-4">
          <div className="text-xs text-muted-foreground">
            Pedidos devolvidos para o solicitante corrigir e reenviar. Após o reenvio, o fluxo
            reinicia pela Etapa 1 (Presidência).
          </div>
          {returned.length === 0 ? (
            <Card className="text-center py-12">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold">Nenhum pedido devolvido</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Nenhum pedido aguarda correção do solicitante.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {returned.map((req) => (
                <div key={req.id} className="space-y-2">
                  <Badge className="bg-orange-100 text-orange-800 border-orange-300 text-[10px]">
                    Devolvido para correção{req.returnedBy ? ` — ${req.returnedBy}` : ''}
                  </Badge>
                  <RequestSummaryCard req={req} borderColor="border-orange-200">
                    {req.rejectionReason && (
                      <div className="mt-2 p-2 rounded bg-orange-50 dark:bg-orange-950/30 text-[11px] text-orange-800 dark:text-orange-300">
                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                        Justificativa da devolução: {req.rejectionReason}
                      </div>
                    )}
                  </RequestSummaryCard>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Histórico (pagos + reprovados) */}
        <TabsContent value="historico" className="space-y-3 mt-4">
          <div className="space-y-2">
            {[...paidHistory, ...rejectedHistory]
              .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
              .map((req) => (
                <Card
                  key={req.id}
                  className="p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={stageBadgeClass(req.status)}>
                        {stageLabel(req.status)}
                      </Badge>
                      <span className="font-semibold text-foreground">{req.applicantName}</span>
                      <span className="text-muted-foreground">&bull; {req.category}</span>
                    </div>
                    <p className="text-muted-foreground line-clamp-1">{req.reason}</p>
                    {req.paymentInfo && (
                      <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                        Liquidado via {req.paymentInfo.paymentMethod} &bull; Aut:{' '}
                        {req.paymentInfo.referenceCode} por {req.paymentInfo.paidBy}
                      </p>
                    )}
                    {req.rejectionReason && (
                      <p className="text-rose-700 dark:text-rose-400">
                        Justificativa: {req.rejectionReason}
                      </p>
                    )}
                  </div>

                  <div className="sm:text-right shrink-0">
                    <span className="text-sm font-bold text-foreground">
                      {formatCurrency(req.amount)}
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDateTime(req.authorizedAt || req.createdAt)}
                    </p>
                  </div>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal: decisão de etapa (reprovar / devolver) com justificativa */}
      {decideTarget && (
        <Dialog open={!!decideTarget} onOpenChange={() => setDecideTarget(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle
                className={`text-base flex items-center gap-2 ${
                  decideKind === 'reprovado' ? 'text-rose-600' : 'text-orange-600'
                }`}
              >
                {decideKind === 'reprovado' ? (
                  <XCircle className="w-5 h-5" />
                ) : (
                  <RotateCcw className="w-5 h-5" />
                )}
                {decideKind === 'reprovado'
                  ? `Reprovar Solicitação (Etapa ${decideStage})`
                  : `Devolver para Correção (Etapa ${decideStage})`}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {decideKind === 'reprovado'
                  ? 'A reprovação é definitiva e será registrada nos relatórios de auditoria, visível ao solicitante.'
                  : 'O pedido volta ao solicitante com sua justificativa. Após a correção e o reenvio, o fluxo reinicia pela Etapa 1 (Presidência).'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="p-2.5 rounded bg-muted/60 space-y-1">
                <p>
                  <strong>Pedido:</strong> {decideTarget.reason}
                </p>
                <p>
                  <strong>Valor:</strong> {formatCurrency(decideTarget.amount)}
                </p>
                <p>
                  <strong>Solicitante:</strong> {decideTarget.applicantName}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="decision-reason" className="font-semibold text-xs">
                  {decideKind === 'reprovado'
                    ? 'Justificativa da Reprovação *'
                    : 'O que deve ser corrigido *'}
                </Label>
                <Textarea
                  id="decision-reason"
                  rows={3}
                  placeholder={
                    decideKind === 'reprovado'
                      ? 'Ex: Despesa em desconformidade com as diretrizes da Diretoria ou sem autorização orçamentária prévia...'
                      : 'Ex: Anexe o orçamento formal da gráfica e corrija o valor total do pedido...'
                  }
                  value={decideJustification}
                  onChange={(e) => setDecideJustification(e.target.value)}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setDecideTarget(null)}>
                Voltar
              </Button>
              <Button
                size="sm"
                variant={decideKind === 'reprovado' ? 'destructive' : 'default'}
                onClick={handleConfirmDecision}
              >
                {decideKind === 'reprovado' ? 'Confirmar Reprovação' : 'Confirmar Devolução'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal: Planejamento do pagamento (Etapa 2 — Financeiro) */}
      {planningReq && (
        <Dialog open={!!planningReq} onOpenChange={() => setPlanningReq(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base text-blue-700 flex items-center gap-2">
                <CalendarClock className="w-5 h-5" />
                Planejamento do Pagamento (Etapa 2)
              </DialogTitle>
              <DialogDescription className="text-xs">
                Defina a forma e a data prevista do pagamento. Ao aprovar o planejamento, o pedido
                fica liberado para liquidação (dupla aprovação cumprida).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 space-y-1">
                <div className="flex justify-between font-bold text-sm text-foreground">
                  <span>Valor a Planejar:</span>
                  <span className="text-blue-700 dark:text-blue-400">
                    {formatCurrency(planningReq.amount)}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Favorecido:</span>
                  <span className="font-medium text-foreground">{planningReq.applicantName}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Finalidade:</span>
                  <span className="text-foreground truncate max-w-[200px]">
                    {planningReq.reason}
                  </span>
                </div>
                {planningReq.presidenciaDecision && (
                  <div className="flex justify-between text-muted-foreground pt-1 border-t">
                    <span>Aprovado pela Presidência:</span>
                    <span className="text-foreground">
                      {planningReq.presidenciaDecision.by} em{' '}
                      {formatDateTime(planningReq.presidenciaDecision.at)}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold text-xs">Forma de Pagamento *</Label>
                <Select
                  value={planMethod}
                  onValueChange={(val) => setPlanMethod(val as PaymentMethodOption)}
                >
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHOD_OPTIONS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {METHOD_LABELS[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="plan-date" className="font-semibold text-xs">
                  Data Prevista para o Pagamento *
                </Label>
                <Input
                  id="plan-date"
                  type="date"
                  value={planExpectedDate}
                  onChange={(e) => setPlanExpectedDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="plan-notes" className="font-semibold text-xs">
                  Observações do Planejamento (Opcional)
                </Label>
                <Textarea
                  id="plan-notes"
                  rows={2}
                  placeholder="Ex: Incluir no lote de pagamentos da semana; confirmar chave Pix com o favorecido..."
                  value={planNotes}
                  onChange={(e) => setPlanNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setPlanningReq(null)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-blue-700 hover:bg-blue-800 text-white"
                onClick={handleConfirmPlanning}
              >
                Aprovar Planejamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal: Registrar Liquidação / Pagamento */}
      {payingReq && (
        <Dialog open={!!payingReq} onOpenChange={() => setPayingReq(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base text-emerald-700 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Registrar Pagamento Efetuado
              </DialogTitle>
              <DialogDescription className="text-xs">
                O pagamento será computado como saída nas contas sindicais e vinculará a
                responsabilidade contábil a {currentProfile.name}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 space-y-1">
                <div className="flex justify-between font-bold text-sm text-foreground">
                  <span>Valor a Liquidar:</span>
                  <span className="text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(payingReq.amount)}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Favorecido:</span>
                  <span className="font-medium text-foreground">{payingReq.applicantName}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Finalidade:</span>
                  <span className="text-foreground truncate max-w-[200px]">{payingReq.reason}</span>
                </div>
                {payingReq.paymentPlanning && (
                  <div className="flex justify-between text-muted-foreground pt-1 border-t">
                    <span>Planejado:</span>
                    <span className="text-foreground">
                      {payingReq.paymentPlanning.paymentMethod} para{' '}
                      {formatDate(payingReq.paymentPlanning.expectedDate)}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold text-xs">Forma de Pagamento *</Label>
                <Select
                  value={payMethod}
                  onValueChange={(val) => setPayMethod(val as PaymentMethodOption)}
                >
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHOD_OPTIONS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {METHOD_LABELS[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pay-ref" className="font-semibold text-xs">
                  Código de Autenticação / Comprovante Bancário
                </Label>
                <Input
                  id="pay-ref"
                  placeholder="Ex: PIX-202502-881923"
                  value={referenceCode}
                  onChange={(e) => setReferenceCode(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pay-notes" className="font-semibold text-xs">
                  Observações Contábeis (Opcional)
                </Label>
                <Input
                  id="pay-notes"
                  placeholder="Ex: Pago da conta corrente do Banco do Brasil..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setPayingReq(null)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleConfirmPayment}
              >
                Confirmar e Liquidar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
