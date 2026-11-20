import React, { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import { ExpenseRequest } from '@/types'
import {
  CheckCircle2,
  XCircle,
  CreditCard,
  Clock,
  ShieldAlert,
  ArrowRight,
  Paperclip,
  User,
  AlertTriangle,
  Receipt,
  FileCheck2,
  DollarSign,
  Building2,
  Lock,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
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

export default function AuthorizationPaymentPage() {
  const {
    currentProfile,
    requests,
    authorizeRequest,
    rejectRequest,
    payRequest,
    canAuthorizeAndPay,
    actions,
  } = useApp()
  const { toast } = useToast()

  // Modal dialog states
  const [rejectingReq, setRejectingReq] = useState<ExpenseRequest | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const [payingReq, setPayingReq] = useState<ExpenseRequest | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<
    'Pix' | 'Transferência Bancária' | 'Cheque Nominal' | 'Dinheiro / Caixa'
  >('Pix')
  const [referenceCode, setReferenceCode] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')

  const handleAuthorize = (req: ExpenseRequest) => {
    authorizeRequest(req.id)
    toast({
      title: 'Solicitação Autorizada',
      description: `Pedido de ${req.applicantName} (${formatCurrency(req.amount)}) autorizado pela Presidência/Finanças. Pronto para pagamento.`,
    })
  }

  const handleConfirmReject = () => {
    if (!rejectingReq) return
    if (!rejectReason.trim()) {
      toast({
        title: 'Motivo obrigatório',
        description: 'Justifique formalmente o motivo da recusa da solicitação.',
        variant: 'destructive',
      })
      return
    }

    rejectRequest(rejectingReq.id, rejectReason.trim())
    toast({
      title: 'Solicitação Recusada',
      description: `A solicitação foi recusada formalmente e arquivada com justificativa.`,
      variant: 'destructive',
    })
    setRejectingReq(null)
    setRejectReason('')
  }

  const handleConfirmPayment = () => {
    if (!payingReq) return

    const ref = referenceCode.trim() || `COMP-${Date.now().toString().slice(-6)}`

    payRequest(payingReq.id, {
      paymentMethod,
      referenceCode: ref,
      notes: paymentNotes.trim() || undefined,
    })

    toast({
      title: 'Pagamento Efetuado e Registrado',
      description: `Valor de ${formatCurrency(payingReq.amount)} liquidado via ${paymentMethod}. Despesa lançada na prestação de contas!`,
    })

    setPayingReq(null)
    setReferenceCode('')
    setPaymentNotes('')
  }

  // Filter requests
  const pendingToAuthorize = requests.filter((r) => r.status === 'pendente')
  const authorizedToPay = requests.filter((r) => r.status === 'autorizado')
  const paidHistory = requests.filter((r) => r.status === 'pago')
  const rejectedHistory = requests.filter((r) => r.status === 'recusado')

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
            De acordo com o estatuto sindical e regras do terceiro setor, <strong>APENAS</strong> os
            titulares ou substitutos da <strong>Presidência</strong> e da{' '}
            <strong>Diretoria Financeira</strong> têm poder para autorizar despesas e liquidar
            pagamentos sindicais.
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
            Analise e delibere sobre adiantamentos e ressarcimentos enviados por filiados e
            colaboradores. Registre os comprovantes de liquidação.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-xs font-semibold py-1 border-emerald-400 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200"
          >
            Logado como: {currentProfile.roleLabel}
          </Badge>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3 border-amber-200 bg-amber-50/30">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-700">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Aguardando Autorização</p>
            <p className="text-xl font-bold text-amber-800">{pendingToAuthorize.length} pedidos</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-blue-200 bg-blue-50/30">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-700">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Aguardando Pagamento</p>
            <p className="text-xl font-bold text-blue-800">{authorizedToPay.length} autorizados</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-emerald-200 bg-emerald-50/30">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total de Pagos</p>
            <p className="text-xl font-bold text-emerald-800">{paidHistory.length} liquidados</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-rose-200 bg-rose-50/30">
          <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-700">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Recusados / Indeferidos</p>
            <p className="text-xl font-bold text-rose-800">{rejectedHistory.length}</p>
          </div>
        </Card>
      </div>

      {/* Tabs of Process */}
      <Tabs defaultValue="pendentes" className="w-full">
        <TabsList className="grid grid-cols-3 w-full sm:w-[500px]">
          <TabsTrigger value="pendentes" className="text-xs">
            1. Autorizar ({pendingToAuthorize.length})
          </TabsTrigger>
          <TabsTrigger value="pagamento" className="text-xs">
            2. Pagar ({authorizedToPay.length})
          </TabsTrigger>
          <TabsTrigger value="historico" className="text-xs">
            Histórico ({paidHistory.length + rejectedHistory.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Pendentes de Autorização */}
        <TabsContent value="pendentes" className="space-y-4 mt-4">
          {pendingToAuthorize.length === 0 ? (
            <Card className="text-center py-12">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold">Tudo em dia!</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Não há pedidos pendentes de autorização pela Presidência ou Finanças.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingToAuthorize.map((req) => {
                const linkedAction = actions.find((a) => a.id === req.actionId)

                return (
                  <Card
                    key={req.id}
                    className="p-4 flex flex-col justify-between border-amber-200 shadow-2xs"
                  >
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
                        {linkedAction && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Ação Vinculada:</span>
                            <span className="font-semibold text-primary">{linkedAction.name}</span>
                          </div>
                        )}
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

                    <div className="pt-3 border-t mt-4 flex items-center justify-between gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="text-xs h-8"
                        onClick={() => {
                          setRejectingReq(req)
                          setRejectReason('')
                        }}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Recusar
                      </Button>

                      <Button
                        size="sm"
                        className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleAuthorize(req)}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Autorizar Pedido
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Autorizados aguardando liquidação/pagamento */}
        <TabsContent value="pagamento" className="space-y-4 mt-4">
          {authorizedToPay.length === 0 ? (
            <Card className="text-center py-12">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold">Nenhum pagamento pendente</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Não há solicitações autorizadas aguardando registro de pagamento no momento.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {authorizedToPay.map((req) => (
                <Card
                  key={req.id}
                  className="p-4 flex flex-col justify-between border-blue-200 bg-blue-50/10"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-blue-600 text-white text-[10px] font-semibold">
                        Autorizado &bull; Pronto para Pagamento
                      </Badge>
                      <span className="text-base font-extrabold text-foreground">
                        {formatCurrency(req.amount)}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-foreground">{req.reason}</h3>

                    <div className="p-2.5 rounded-md bg-muted/40 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Favorecido:</span>
                        <span className="font-semibold text-foreground">{req.applicantName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Autorizado por:</span>
                        <span className="text-foreground">{req.authorizedBy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Data da Autorização:</span>
                        <span className="text-foreground">
                          {formatDateTime(req.authorizedAt || '')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Comprovante Original:</span>
                        <span className="text-primary truncate">{req.receiptName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t mt-4 flex items-center justify-end">
                    <Button
                      size="sm"
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {
                        setPayingReq(req)
                        setReferenceCode(`PAG-${Date.now().toString().slice(-6)}`)
                      }}
                    >
                      <CreditCard className="w-3.5 h-3.5 mr-1" />
                      Efetuar / Registrar Pagamento
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Histórico de Pagos e Recusados */}
        <TabsContent value="historico" className="space-y-3 mt-4">
          <div className="space-y-2">
            {[...paidHistory, ...rejectedHistory]
              .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
              .map((req) => {
                const isPaid = req.status === 'pago'

                return (
                  <Card
                    key={req.id}
                    className="p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }
                        >
                          {isPaid ? 'Pago' : 'Recusado'}
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
                )
              })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal: Recusar solicitação com justificativa */}
      {rejectingReq && (
        <Dialog open={!!rejectingReq} onOpenChange={() => setRejectingReq(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base text-rose-600 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Recusar Solicitação de Despesa
              </DialogTitle>
              <DialogDescription className="text-xs">
                A recusa será registrada nos relatórios de auditoria e ficará visível ao solicitante
                ({rejectingReq.applicantName}).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="p-2.5 rounded bg-muted/60 space-y-1">
                <p>
                  <strong>Pedido:</strong> {rejectingReq.reason}
                </p>
                <p>
                  <strong>Valor:</strong> {formatCurrency(rejectingReq.amount)}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reject-reason" className="font-semibold text-xs">
                  Justificativa Oficial da Recusa *
                </Label>
                <Textarea
                  id="reject-reason"
                  rows={3}
                  placeholder="Ex: Despesa em desconformidade com as diretrizes da Diretoria ou ausência de autorização orçamentária prévia..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => setRejectingReq(null)}>
                Voltar
              </Button>
              <Button size="sm" variant="destructive" onClick={handleConfirmReject}>
                Confirmar Recusa Formal
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
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold text-xs">Forma de Pagamento *</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(val) =>
                    setPaymentMethod(
                      val as
                        | 'Pix'
                        | 'Transferência Bancária'
                        | 'Cheque Nominal'
                        | 'Dinheiro / Caixa',
                    )
                  }
                >
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pix">Pix (Chave Bancária do Favorecido)</SelectItem>
                    <SelectItem value="Transferência Bancária">
                      Transferência Bancária (TED/DOC)
                    </SelectItem>
                    <SelectItem value="Cheque Nominal">Cheque Nominal</SelectItem>
                    <SelectItem value="Dinheiro / Caixa">
                      Dinheiro (Caixa Pequeno / Fundo Fixo)
                    </SelectItem>
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
