import React, { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters'
import { stageLabel, stageBadgeClass } from '@/lib/requestStages'
import { RequestType, ExpenseRequest } from '@/types'
import {
  FileSpreadsheet,
  Plus,
  Paperclip,
  CheckCircle2,
  Clock,
  XCircle,
  Banknote,
  Send,
  HelpCircle,
  FileCheck2,
  UserCog,
  Eye,
  Calendar,
  User,
  ExternalLink,
  AlertTriangle,
  Pencil,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'

export default function RequestsPage() {
  const { currentProfile, requests, addRequest, resubmitRequest, actions } = useApp()
  const { toast } = useToast()

  // Form states
  const [requestType, setRequestType] = useState<RequestType>('ressarcimento')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [category, setCategory] = useState('Transporte e Deslocamento')
  const [actionId, setActionId] = useState<string>('geral')
  const [receiptFileName, setReceiptFileName] = useState('')

  // Edição/reenvio de pedido devolvido para correção
  const [editingRequest, setEditingRequest] = useState<ExpenseRequest | null>(null)

  // View modal for details / receipt
  const [selectedRequest, setSelectedRequest] = useState<ExpenseRequest | null>(null)
  const [activeTab, setActiveTab] = useState<'minhas' | 'todas'>('minhas')

  const startEditing = (req: ExpenseRequest) => {
    setEditingRequest(req)
    setRequestType(req.type)
    setAmount(String(req.amount))
    setReason(req.reason)
    setCategory(req.category)
    setActionId(req.actionId ?? 'geral')
    setReceiptFileName(req.receiptName ?? '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEditing = () => {
    setEditingRequest(null)
    setRequestType('ressarcimento')
    setAmount('')
    setReason('')
    setCategory('Transporte e Deslocamento')
    setActionId('geral')
    setReceiptFileName('')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFileName(e.target.files[0].name)
    }
  }

  const handleSimulateAttachReceipt = () => {
    // Convenience button to pick a sample receipt name if not selecting real file
    const sampleReceipts = [
      'recibo_combustivel_posto_central.pdf',
      'nf_eletronica_material_papelaria.pdf',
      'comprovante_refeicao_assembleia.pdf',
      'bilhete_passagem_rodoviaria.pdf',
      'recibo_hospedagem_hotel_sp.pdf',
    ]
    const randomReceipt = sampleReceipts[Math.floor(Math.random() * sampleReceipts.length)]
    setReceiptFileName(randomReceipt)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const parsedAmount = parseFloat(amount.replace(',', '.'))
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Por favor, informe um valor financeiro válido em reais.',
        variant: 'destructive',
      })
      return
    }

    if (!reason.trim()) {
      toast({
        title: 'Motivo obrigatório',
        description: 'Descreva a finalidade da despesa ou do adiantamento.',
        variant: 'destructive',
      })
      return
    }

    if (!receiptFileName.trim()) {
      toast({
        title: 'Comprovante obrigatório',
        description: 'Anexe o comprovante, orçamento ou cupom fiscal da solicitação.',
        variant: 'destructive',
      })
      return
    }

    if (editingRequest) {
      resubmitRequest(editingRequest.id, {
        type: requestType,
        amount: parsedAmount,
        reason: reason.trim(),
        category,
        receiptName: receiptFileName,
        actionId: actionId === 'geral' ? undefined : actionId,
      })

      toast({
        title: 'Pedido corrigido e reenviado',
        description: `O pedido reenviado (${formatCurrency(parsedAmount)}) voltou à fila da Presidência (Etapa 1) para nova deliberação.`,
      })

      cancelEditing()
      setActiveTab('minhas')
      return
    }

    addRequest({
      applicantName: currentProfile.name,
      applicantRole: currentProfile.roleLabel,
      applicantId: currentProfile.id,
      type: requestType,
      amount: parsedAmount,
      reason: reason.trim(),
      category,
      receiptName: receiptFileName,
      receiptUrl: '#',
      actionId: actionId === 'geral' ? undefined : actionId,
    })

    toast({
      title: 'Solicitação enviada à Presidência',
      description: `Pedido de ${requestType === 'adiantamento' ? 'adiantamento' : 'ressarcimento'} no valor de ${formatCurrency(parsedAmount)} protocolado com sucesso!`,
    })

    // Reset form
    setAmount('')
    setReason('')
    setReceiptFileName('')
    setActionId('geral')
    setActiveTab('minhas')
  }

  const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    pendente: Clock,
    aguardando_financeiro: UserCog,
    aguardando_pagamento: FileCheck2,
    devolvido: AlertTriangle,
    recusado: XCircle,
    pago: CheckCircle2,
  }

  const myRequests = requests.filter((r) => r.applicantId === currentProfile.id)
  const displayedRequests = activeTab === 'minhas' ? myRequests : requests

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-primary" />
            Solicitações de Despesas e Adiantamentos
          </h1>
          <Badge variant="outline" className="text-xs">
            Aberto a Filiados e Colaboradores
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Regra estatutária: qualquer filiado sindical ou colaborador pode requerer{' '}
          <strong>ressarcimento de despesa</strong> já efetuada ou <strong>adiantamento</strong>{' '}
          prévio à Presidência do sindicato.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Card (5 cols on lg) */}
        <Card
          className={`lg:col-span-5 shadow-xs border-primary/20 ${
            editingRequest ? 'border-orange-300 dark:border-orange-800' : ''
          }`}
        >
          <CardHeader className="p-4 sm:p-5 pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              {editingRequest ? (
                <>
                  <Pencil className="w-4 h-4 text-orange-600" />
                  Corrigir Pedido Devolvido
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-primary" />
                  Novo Pedido à Presidência
                </>
              )}
            </CardTitle>
            <CardDescription className="text-xs">
              Solicitante: <strong>{currentProfile.name}</strong> ({currentProfile.roleLabel})
            </CardDescription>
            {editingRequest && (
              <div className="mt-1 p-2.5 rounded bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 text-[11px] text-orange-800 dark:text-orange-200 space-y-1">
                <p className="font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Devolvido para correção
                  {editingRequest.returnedBy ? ` por ${editingRequest.returnedBy}` : ''}
                </p>
                {editingRequest.rejectionReason && (
                  <p>
                    <strong>Justificativa:</strong> {editingRequest.rejectionReason}
                  </p>
                )}
                <p className="text-muted-foreground">
                  Ajuste os campos abaixo e reenvie — o pedido reinicia o fluxo pela Etapa 1
                  (Presidência).
                </p>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-4 sm:p-5 pt-2">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type selection */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tipo da Solicitação *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={requestType === 'ressarcimento' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs justify-start h-9"
                    onClick={() => setRequestType('ressarcimento')}
                  >
                    <Banknote className="w-3.5 h-3.5 mr-1.5" />
                    Ressarcimento
                  </Button>
                  <Button
                    type="button"
                    variant={requestType === 'adiantamento' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs justify-start h-9"
                    onClick={() => setRequestType('adiantamento')}
                  >
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    Adiantamento
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {requestType === 'ressarcimento'
                    ? 'Reembolso de despesa já paga do próprio bolso a serviço do sindicato.'
                    : 'Liberação antecipada de verba para despesa que será realizada.'}
                </p>
              </div>

              {/* Amount and Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="req-amount" className="text-xs font-semibold">
                    Valor (R$) *
                  </Label>
                  <Input
                    id="req-amount"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="req-category" className="text-xs font-semibold">
                    Categoria
                  </Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="req-category" className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Transporte e Deslocamento">
                        Transporte e Deslocamento
                      </SelectItem>
                      <SelectItem value="Alimentação e Hospedagem">
                        Alimentação e Hospedagem
                      </SelectItem>
                      <SelectItem value="Material de Consumo / Eventos">
                        Material de Consumo / Eventos
                      </SelectItem>
                      <SelectItem value="Serviços Técnicos e Terceiros">
                        Serviços Técnicos e Terceiros
                      </SelectItem>
                      <SelectItem value="Viagens e Diárias">Viagens e Diárias</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Link to Action */}
              <div className="space-y-1.5">
                <Label htmlFor="req-action" className="text-xs font-semibold">
                  Ação da Diretoria Vinculada (Opcional)
                </Label>
                <Select value={actionId} onValueChange={setActionId}>
                  <SelectTrigger id="req-action" className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geral">
                      Despesa Geral / Não vinculada a ação específica
                    </SelectItem>
                    {actions.map((act) => (
                      <SelectItem key={act.id} value={act.id}>
                        {act.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <Label htmlFor="req-reason" className="text-xs font-semibold">
                  Motivo e Justificativa da Despesa *
                </Label>
                <Textarea
                  id="req-reason"
                  rows={3}
                  placeholder="Explique detalhadamente o objetivo e a necessidade sindical da despesa..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>

              {/* Receipt File Upload / Mock */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Comprovante Digital *</Label>
                  <button
                    type="button"
                    onClick={handleSimulateAttachReceipt}
                    className="text-[11px] text-primary hover:underline"
                  >
                    Usar comprovante de exemplo
                  </button>
                </div>

                <div className="border border-dashed rounded-lg p-3 text-center hover:bg-muted/30 transition">
                  <Paperclip className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
                  <div className="flex items-center justify-center gap-2">
                    <label className="cursor-pointer text-xs font-medium text-primary hover:underline">
                      <span>Selecionar arquivo</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept="image/*,.pdf,.doc,.docx"
                      />
                    </label>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Anexe Nota Fiscal, Cupom, Recibo ou Orçamento (.pdf, .jpg, .png)
                  </p>
                </div>

                {receiptFileName && (
                  <div className="flex items-center justify-between p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200">
                    <span className="flex items-center gap-1.5 truncate">
                      <Paperclip className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{receiptFileName}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setReceiptFileName('')}
                      className="text-rose-600 font-bold hover:underline shrink-0 ml-2"
                    >
                      Remover
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1 text-xs font-semibold">
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  {editingRequest
                    ? 'Reenviar à Presidência (Etapa 1)'
                    : 'Enviar Solicitação à Presidência'}
                </Button>
                {editingRequest && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={cancelEditing}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* List of Requests (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as 'minhas' | 'todas')}
            className="w-full"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <TabsList className="h-8">
                <TabsTrigger value="minhas" className="text-xs">
                  Minhas Solicitações ({myRequests.length})
                </TabsTrigger>
                <TabsTrigger value="todas" className="text-xs">
                  Todas as Solicitações ({requests.length})
                </TabsTrigger>
              </TabsList>

              <span className="text-xs text-muted-foreground hidden sm:inline">
                Acompanhamento em tempo real
              </span>
            </div>

            <TabsContent value={activeTab} className="mt-4 space-y-3">
              {displayedRequests.length === 0 ? (
                <Card className="text-center py-10">
                  <FileSpreadsheet className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-semibold">Nenhuma solicitação encontrada</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {activeTab === 'minhas'
                      ? 'Você ainda não enviou nenhum pedido com este perfil.'
                      : 'Nenhum pedido protocolado no momento.'}
                  </p>
                </Card>
              ) : (
                displayedRequests.map((req) => {
                  const StatusIcon = statusIcons[req.status] || Clock
                  const linkedAction = actions.find((a) => a.id === req.actionId)
                  const canEditThis =
                    req.status === 'devolvido' &&
                    req.applicantId === currentProfile.id &&
                    !editingRequest

                  return (
                    <Card
                      key={req.id}
                      className={`p-4 hover:shadow-xs transition cursor-pointer ${
                        req.status === 'devolvido' ? 'border-orange-300 dark:border-orange-800' : ''
                      }`}
                      onClick={() => setSelectedRequest(req)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold uppercase ${
                                req.type === 'adiantamento'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {req.type === 'adiantamento' ? 'Adiantamento' : 'Ressarcimento'}
                            </Badge>

                            <Badge
                              variant="outline"
                              className={`text-[10px] font-medium flex items-center gap-1 ${stageBadgeClass(req.status)}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {stageLabel(req.status)}
                            </Badge>

                            <span className="text-[11px] text-muted-foreground">
                              {formatDateTime(req.createdAt)}
                            </span>
                          </div>

                          <h3 className="text-sm font-semibold text-foreground line-clamp-2">
                            {req.reason}
                          </h3>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {req.applicantName} ({req.applicantRole})
                            </span>
                            {linkedAction && (
                              <span className="text-primary font-medium truncate max-w-xs">
                                &bull; Ação: {linkedAction.name}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="sm:text-right shrink-0">
                          <span className="text-base font-extrabold text-foreground">
                            {formatCurrency(req.amount)}
                          </span>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {req.category}
                          </div>
                        </div>
                      </div>

                      {req.status === 'devolvido' && req.rejectionReason && (
                        <div className="mt-2 p-2 rounded bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 text-[11px] text-orange-800 dark:text-orange-200">
                          <AlertTriangle className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                          <strong>
                            Devolvido{req.returnedBy ? ` por ${req.returnedBy}` : ''}:
                          </strong>{' '}
                          {req.rejectionReason}
                        </div>
                      )}

                      <div className="mt-3 pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Paperclip className="w-3 h-3 text-primary" />
                          <span className="truncate max-w-[200px]">
                            {req.receiptName || 'Comprovante anexado'}
                          </span>
                        </span>

                        {canEditThis ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs px-2 border-orange-400 text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950"
                            onClick={(e) => {
                              e.stopPropagation()
                              startEditing(req)
                            }}
                          >
                            <Pencil className="w-3 h-3 mr-1" />
                            Corrigir e Reenviar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-xs px-2 text-primary"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Detalhes
                          </Button>
                        )}
                      </div>
                    </Card>
                  )
                })
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Details Dialog */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-between pr-4">
                <Badge
                  variant="outline"
                  className={`text-[10px] uppercase font-bold ${
                    selectedRequest.type === 'adiantamento'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {selectedRequest.type === 'adiantamento' ? 'Adiantamento' : 'Ressarcimento'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Protocolo: {selectedRequest.id}
                </span>
              </div>
              <DialogTitle className="text-base font-bold mt-2">
                {selectedRequest.reason}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Submetido em {formatDateTime(selectedRequest.createdAt)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 rounded-lg bg-muted/50 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor Requisitado:</span>
                  <span className="font-extrabold text-sm text-foreground">
                    {formatCurrency(selectedRequest.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Solicitante:</span>
                  <span className="font-medium text-foreground">
                    {selectedRequest.applicantName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cargo/Vínculo:</span>
                  <span className="text-foreground">{selectedRequest.applicantRole}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Categoria Contábil:</span>
                  <span className="text-foreground">{selectedRequest.category}</span>
                </div>
              </div>

              {/* Status and History */}
              <div className="border rounded-lg p-3 space-y-2">
                <div className="font-semibold text-foreground flex items-center justify-between">
                  <span>Situação Atual</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${stageBadgeClass(selectedRequest.status)}`}
                  >
                    {stageLabel(selectedRequest.status)}
                  </Badge>
                </div>

                {selectedRequest.presidenciaDecision && (
                  <p className="text-muted-foreground">
                    <strong>Etapa 1 (Presidência):</strong>{' '}
                    {selectedRequest.presidenciaDecision.decision === 'aprovado'
                      ? 'aprovado'
                      : selectedRequest.presidenciaDecision.decision === 'reprovado'
                        ? 'reprovado'
                        : 'devolvido para correção'}{' '}
                    por {selectedRequest.presidenciaDecision.by} em{' '}
                    {formatDateTime(selectedRequest.presidenciaDecision.at)}
                  </p>
                )}

                {selectedRequest.financeDecision && (
                  <p className="text-muted-foreground">
                    <strong>Etapa 2 (Financeiro):</strong>{' '}
                    {selectedRequest.financeDecision.decision === 'aprovado'
                      ? 'planejamento aprovado'
                      : selectedRequest.financeDecision.decision === 'reprovado'
                        ? 'reprovado'
                        : 'devolvido para correção'}{' '}
                    por {selectedRequest.financeDecision.by} em{' '}
                    {formatDateTime(selectedRequest.financeDecision.at)}
                  </p>
                )}

                {selectedRequest.paymentPlanning && (
                  <p className="text-muted-foreground">
                    <strong>Planejamento:</strong> {selectedRequest.paymentPlanning.paymentMethod}{' '}
                    para {formatDate(selectedRequest.paymentPlanning.expectedDate)}
                    {selectedRequest.paymentPlanning.notes
                      ? ` — ${selectedRequest.paymentPlanning.notes}`
                      : ''}
                  </p>
                )}

                {selectedRequest.rejectionReason && (
                  <div
                    className={`p-2 rounded border text-rose-800 dark:text-rose-200 ${
                      selectedRequest.status === 'devolvido'
                        ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200'
                    }`}
                  >
                    <strong>
                      {selectedRequest.status === 'devolvido'
                        ? 'Justificativa da Devolução:'
                        : 'Motivo da Reprovação:'}
                    </strong>{' '}
                    {selectedRequest.rejectionReason}
                  </div>
                )}

                {selectedRequest.status === 'devolvido' &&
                  selectedRequest.applicantId === currentProfile.id && (
                    <Button
                      size="sm"
                      className="w-full text-xs bg-orange-600 hover:bg-orange-700 text-white"
                      onClick={() => {
                        setSelectedRequest(null)
                        startEditing(selectedRequest)
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1.5" />
                      Corrigir e Reenviar à Presidência
                    </Button>
                  )}

                {selectedRequest.paymentInfo && (
                  <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-900 dark:text-emerald-100 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Pagamento Efetuado
                    </p>
                    <p>Por: {selectedRequest.paymentInfo.paidBy}</p>
                    <p>Forma: {selectedRequest.paymentInfo.paymentMethod}</p>
                    {selectedRequest.paymentInfo.referenceCode && (
                      <p>Autenticação/Ref: {selectedRequest.paymentInfo.referenceCode}</p>
                    )}
                    <p>Data: {formatDateTime(selectedRequest.paymentInfo.paidAt)}</p>
                  </div>
                )}
              </div>

              {/* Comprovante box */}
              <div className="border rounded-lg p-3 flex items-center justify-between bg-card">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">
                      {selectedRequest.receiptName || 'comprovante_fiscal.pdf'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Comprovante de despesa / orçamento anexado
                    </p>
                  </div>
                </div>

                <Badge variant="secondary" className="text-[10px]">
                  Anexo Validado
                </Badge>
              </div>
            </div>

            <DialogFooter>
              <Button size="sm" onClick={() => setSelectedRequest(null)} className="w-full">
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
