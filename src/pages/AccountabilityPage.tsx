import React, { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { FiscalMarkCell, FiscalReportButton } from '@/components/FiscalMarking'
import { latestMarkFor, MARK_STATUS_META, quarterOfISODate } from '@/lib/fiscal'
import {
  isDateInRange,
  getPresetRange,
  describePeriod,
  type DateRange,
  type PeriodPreset,
} from '@/lib/period'
import type { ActionMovement, ExpenseRequest, DirectoriaAction } from '@/types'
import { PeriodFilterBar } from '@/components/PeriodFilterBar'
import { DetailDialog } from '@/components/DetailDialog'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Layers,
  FileSpreadsheet,
  Download,
  Filter,
  Search,
  CheckCircle2,
  Calendar,
  Building2,
  PieChart,
  Plus,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'

function AccountabilityPage() {
  const {
    movements,
    actions,
    requests,
    addMovement,
    canAuthorizeAndPay,
    canManageActions,
    fiscalQuarterPlan,
    fiscalMarks,
    isFiscalMember,
    currentProfile,
  } = useApp()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<'geral' | 'por_acao' | 'pagamentos'>('geral')
  const [search, setSearch] = useState('')
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Period filter (default: current month)
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('mes_atual')
  const [customRange, setCustomRange] = useState<DateRange | null>(null)
  const activeRange = periodPreset === 'personalizado' ? customRange : getPresetRange(periodPreset)

  const [detailTarget, setDetailTarget] = useState<{
    movement?: ActionMovement
    request?: ExpenseRequest
  } | null>(null)

  const detailAction: DirectoriaAction | undefined = detailTarget
    ? actions.find((a) =>
        detailTarget.request
          ? a.id === detailTarget.request.actionId
          : a.id === detailTarget.movement?.actionId,
      )
    : undefined

  // Movement insertion dialog (for Directoria / Finanças)
  const [isNewMovementOpen, setIsNewMovementOpen] = useState(false)
  const [newType, setNewType] = useState<'receita' | 'despesa'>('despesa')
  const [newActionId, setNewActionId] = useState('geral')
  const [newCategory, setNewCategory] = useState('Mobilização e Eventos')
  const [newDescription, setNewDescription] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newPaymentMethod, setNewPaymentMethod] = useState('Transferência Bancária')
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0])

  const handleAddMovement = (e: React.FormEvent) => {
    e.preventDefault()
    const amountVal = parseFloat(newAmount.replace(',', '.'))
    if (isNaN(amountVal) || amountVal <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Informe um valor financeiro válido.',
        variant: 'destructive',
      })
      return
    }

    if (!newDescription.trim()) {
      toast({
        title: 'Descrição necessária',
        description: 'Preencha a descrição da movimentação financeira.',
        variant: 'destructive',
      })
      return
    }

    addMovement({
      actionId: newActionId,
      type: newType,
      category: newCategory,
      description: newDescription.trim(),
      amount: amountVal,
      date: newDate,
      paymentMethod: newPaymentMethod,
    })

    toast({
      title: 'Movimentação Lançada',
      description: `Lançamento de ${newType === 'receita' ? 'receita' : 'despesa'} no valor de ${formatCurrency(amountVal)} registrado.`,
    })

    setIsNewMovementOpen(false)
    setNewDescription('')
    setNewAmount('')
  }

  // Filtered movements (period + search + type + action)
  const filteredMovements = movements.filter((mov) => {
    const matchesSearch =
      mov.description.toLowerCase().includes(search.toLowerCase()) ||
      mov.category.toLowerCase().includes(search.toLowerCase())

    const matchesAction = selectedActionFilter === 'all' || mov.actionId === selectedActionFilter
    const matchesType = typeFilter === 'all' || mov.type === typeFilter
    const matchesPeriod = isDateInRange(mov.date, activeRange)

    return matchesSearch && matchesAction && matchesType && matchesPeriod
  })

  // Financial aggregates (period-filtered)
  const totalReceitas = filteredMovements
    .filter((m) => m.type === 'receita')
    .reduce((acc, m) => acc + m.amount, 0)

  const totalDespesas = filteredMovements
    .filter((m) => m.type === 'despesa')
    .reduce((acc, m) => acc + m.amount, 0)

  const saldo = totalReceitas - totalDespesas

  // Paid requests (settled payments), respecting the selected period
  const paidRequests = requests.filter(
    (r) => r.status === 'pago' && isDateInRange(r.paymentInfo?.paidAt || r.createdAt, activeRange),
  )

  const periodLabel = describePeriod(periodPreset, activeRange)

  return (
    <div className="space-y-6">
      {/* Period filter */}
      <PeriodFilterBar
        preset={periodPreset}
        onPresetChange={setPeriodPreset}
        customRange={customRange}
        onCustomRangeChange={setCustomRange}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              Prestação de Contas Aberta
            </h1>
            <Badge className="bg-emerald-600 text-white text-xs">
              Portal da Transparência Sindical
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Demonstrativo financeiro completo com receitas arrecadadas, despesas executadas e
            detalhamento dos pagamentos por ação da Diretoria.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <FiscalReportButton />
          {(canAuthorizeAndPay || canManageActions) && (
            <Dialog open={isNewMovementOpen} onOpenChange={setIsNewMovementOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Novo Lançamento Contábil
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Novo Lançamento Financeiro</DialogTitle>
                  <DialogDescription className="text-xs">
                    Inclusão de receita ou despesa no livro de prestação de contas sindical.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleAddMovement} className="space-y-4 py-2 text-xs">
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-xs">Tipo de Movimentação *</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={newType === 'receita' ? 'default' : 'outline'}
                        className={`text-xs ${newType === 'receita' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                        onClick={() => setNewType('receita')}
                      >
                        <TrendingUp className="w-3.5 h-3.5 mr-1" />
                        Receita (Entrada)
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={newType === 'despesa' ? 'default' : 'outline'}
                        className={`text-xs ${newType === 'despesa' ? 'bg-rose-600 hover:bg-rose-700 text-white' : ''}`}
                        onClick={() => setNewType('despesa')}
                      >
                        <TrendingDown className="w-3.5 h-3.5 mr-1" />
                        Despesa (Saída)
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="mov-amount" className="font-semibold text-xs">
                        Valor (R$) *
                      </Label>
                      <Input
                        id="mov-amount"
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={newAmount}
                        onChange={(e) => setNewAmount(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="mov-date" className="font-semibold text-xs">
                        Data *
                      </Label>
                      <Input
                        id="mov-date"
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-semibold text-xs">Ação Vinculada</Label>
                    <Select value={newActionId} onValueChange={setNewActionId}>
                      <SelectTrigger className="text-xs h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="geral">
                          Geral / Não vinculada a ação específica
                        </SelectItem>
                        {actions.map((act) => (
                          <SelectItem key={act.id} value={act.id}>
                            {act.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="mov-desc" className="font-semibold text-xs">
                      Descrição Detalhada *
                    </Label>
                    <Input
                      id="mov-desc"
                      placeholder="Ex: Pagamento da locação de tendas para assembleia..."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="mov-cat" className="font-semibold text-xs">
                        Categoria
                      </Label>
                      <Input
                        id="mov-cat"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold text-xs">Forma de Pagamento</Label>
                      <Select value={newPaymentMethod} onValueChange={setNewPaymentMethod}>
                        <SelectTrigger className="text-xs h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Transferência Bancária">
                            Transferência Bancária
                          </SelectItem>
                          <SelectItem value="Pix">Pix</SelectItem>
                          <SelectItem value="Boleto Bancário">Boleto Bancário</SelectItem>
                          <SelectItem value="Cheque Nominal">Cheque Nominal</SelectItem>
                          <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsNewMovementOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" size="sm">
                      Gravar Lançamento
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/20">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
              <span>Receitas Arrecadadas</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(totalReceitas)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            Mensalidades de filiados, contribuições sociais e taxas aprovadas
          </CardContent>
        </Card>

        <Card className="border-rose-200 dark:border-rose-900 bg-rose-50/20">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-semibold text-rose-800 dark:text-rose-300 flex items-center justify-between">
              <span>Despesas Executadas</span>
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-rose-700 dark:text-rose-400">
              {formatCurrency(totalDespesas)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            Custos com mobilizações, formação, assessoria jurídica e reformas
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs font-semibold text-primary flex items-center justify-between">
              <span>Superávit / Saldo Disponível</span>
              <Building2 className="w-4 h-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-primary">
              {formatCurrency(saldo)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            Saldo em contas correntes e aplicações sindicais
          </CardContent>
        </Card>
      </div>

      <p className="text-[11px] text-muted-foreground -mt-2">
        Período em análise: <strong className="text-foreground">{periodLabel}</strong>
      </p>

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'geral' | 'por_acao' | 'pagamentos')}
        className="w-full"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-2">
          <TabsList className="h-9">
            <TabsTrigger value="geral" className="text-xs">
              Todas as Movimentações ({movements.length})
            </TabsTrigger>
            <TabsTrigger value="por_acao" className="text-xs">
              Despesas por Ação da Diretoria ({actions.length})
            </TabsTrigger>
            <TabsTrigger value="pagamentos" className="text-xs">
              Pagamentos Liquidados ({paidRequests.length})
            </TabsTrigger>
          </TabsList>

          <span className="text-xs text-muted-foreground">
            Relatório oficial para assembleia e auditoria
          </span>
        </div>

        {/* Tab 1: Todas as movimentações com busca e filtros */}
        <TabsContent value="geral" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Filtrar por descrição ou categoria..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32 text-xs h-9">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Contas</SelectItem>
                  <SelectItem value="receita">Apenas Receitas</SelectItem>
                  <SelectItem value="despesa">Apenas Despesas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedActionFilter} onValueChange={setSelectedActionFilter}>
                <SelectTrigger className="w-48 text-xs h-9">
                  <SelectValue placeholder="Ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Ações</SelectItem>
                  <SelectItem value="geral">Despesas Gerais</SelectItem>
                  {actions.map((act) => (
                    <SelectItem key={act.id} value={act.id}>
                      {act.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3">Data</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Descrição da Movimentação</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3">Ação Vinculada</th>
                    <th className="p-3">Forma</th>
                    <th className="p-3 text-right">Valor (R$)</th>
                    <th className="p-3">Análise Fiscal</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        Nenhum registro contábil encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((mov) => {
                      const isReceita = mov.type === 'receita'
                      const linkedAct = actions.find((a) => a.id === mov.actionId)
                      const movMark = latestMarkFor(fiscalMarks, mov.id, 'movimento')
                      const movRowClass =
                        movMark && movMark.status !== 'sem_ressalva'
                          ? MARK_STATUS_META[movMark.status].rowClass
                          : ''

                      return (
                        <tr
                          key={mov.id}
                          className={`hover:bg-muted/30 transition cursor-pointer ${movRowClass}`}
                          onClick={() => setDetailTarget({ movement: mov })}
                        >
                          <td className="p-3 font-medium text-foreground whitespace-nowrap">
                            {formatDate(mov.date)}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className={`text-[10px] uppercase font-bold ${
                                isReceita
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'bg-rose-50 text-rose-800 border-rose-300'
                              }`}
                            >
                              {isReceita ? 'Receita' : 'Despesa'}
                            </Badge>
                          </td>
                          <td className="p-3 font-medium text-foreground max-w-xs">
                            {mov.description}
                          </td>
                          <td className="p-3 text-muted-foreground whitespace-nowrap">
                            {mov.category}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {linkedAct ? (
                              <span className="font-semibold text-primary truncate block max-w-[180px]">
                                {linkedAct.name}
                              </span>
                            ) : (
                              <span className="text-muted-foreground italic">
                                Geral / Administrativo
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-muted-foreground whitespace-nowrap">
                            {mov.paymentMethod || 'Transferência'}
                          </td>
                          <td
                            className={`p-3 text-right font-extrabold whitespace-nowrap ${
                              isReceita ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isReceita ? '+' : '-'} {formatCurrency(mov.amount)}
                          </td>
                          <td className="p-3 align-top" onClick={(e) => e.stopPropagation()}>
                            <FiscalMarkCell
                              targetId={mov.id}
                              targetType="movimento"
                              quarter={quarterOfISODate(mov.date)}
                            />
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Movimentações detalhadas por Ação da Diretoria */}
        <TabsContent value="por_acao" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 gap-4">
            {actions.map((act) => {
              const actMovements = movements.filter((m) => m.actionId === act.id)
              const actIncome = actMovements
                .filter((m) => m.type === 'receita')
                .reduce((acc, m) => acc + m.amount, 0)
              const actExpense = actMovements
                .filter((m) => m.type === 'despesa')
                .reduce((acc, m) => acc + m.amount, 0)

              return (
                <Card key={act.id} className="overflow-hidden">
                  <CardHeader className="p-4 sm:p-5 pb-3 bg-muted/20 border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] font-bold uppercase">
                            {act.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Responsável: <strong>{act.responsible}</strong>
                          </span>
                        </div>
                        <CardTitle className="text-base font-bold mt-1">{act.name}</CardTitle>
                      </div>

                      <div className="text-right sm:text-right shrink-0">
                        <span className="text-xs text-muted-foreground block">
                          Orçamento: {formatCurrency(act.budget)}
                        </span>
                        <span className="text-sm font-bold text-rose-600">
                          Gasto Real: {formatCurrency(act.spent)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-5 pt-3">
                    {actMovements.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2 italic">
                        Nenhuma movimentação financeira lançada diretamente para esta ação ainda.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-foreground">
                          Lançamentos contábeis desta ação ({actMovements.length}):
                        </p>
                        <div className="divide-y border rounded-md">
                          {actMovements.map((m) => (
                            <div
                              key={m.id}
                              className="p-2.5 text-xs flex items-center justify-between hover:bg-muted/20 transition"
                            >
                              <div className="space-y-0.5">
                                <p className="font-medium text-foreground">{m.description}</p>
                                <p className="text-[11px] text-muted-foreground">
                                  {formatDate(m.date)} &bull; {m.category} &bull; {m.paymentMethod}
                                </p>
                              </div>

                              <span
                                className={`font-bold ${
                                  m.type === 'receita' ? 'text-emerald-600' : 'text-rose-600'
                                }`}
                              >
                                {m.type === 'receita' ? '+' : '-'} {formatCurrency(m.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Tab 3: Pagamentos de solicitações autorizadas */}
        <TabsContent value="pagamentos" className="space-y-4 mt-4">
          <div className="rounded-lg border overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3">Data do Pagamento</th>
                    <th className="p-3">Favorecido (Solicitante)</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Motivo / Despesa</th>
                    <th className="p-3">Autorizado Por</th>
                    <th className="p-3">Forma de Pagamento</th>
                    <th className="p-3">Comprovante Ref</th>
                    <th className="p-3 text-right">Valor Pago (R$)</th>
                    <th className="p-3">Análise Fiscal</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paidRequests.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground">
                        Nenhum pagamento liquidado no histórico.
                      </td>
                    </tr>
                  ) : (
                    paidRequests.map((req) => {
                      const reqMark = latestMarkFor(fiscalMarks, req.id, 'pagamento')
                      const reqRowClass =
                        reqMark && reqMark.status !== 'sem_ressalva'
                          ? MARK_STATUS_META[reqMark.status].rowClass
                          : ''
                      return (
                        <tr
                          key={req.id}
                          className={`hover:bg-muted/30 transition cursor-pointer ${reqRowClass}`}
                          onClick={() => setDetailTarget({ request: req })}
                        >
                          <td className="p-3 whitespace-nowrap font-medium">
                            {formatDate(req.paymentInfo?.paidAt || req.createdAt)}
                          </td>
                          <td className="p-3 font-semibold text-foreground whitespace-nowrap">
                            {req.applicantName}
                            <span className="block text-[10px] font-normal text-muted-foreground">
                              {req.applicantRole}
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <Badge variant="outline" className="text-[10px] uppercase font-bold">
                              {req.type}
                            </Badge>
                          </td>
                          <td className="p-3 max-w-xs">{req.reason}</td>
                          <td className="p-3 text-muted-foreground whitespace-nowrap">
                            {req.authorizedBy}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="font-semibold text-foreground">
                              {req.paymentInfo?.paymentMethod || 'Pix'}
                            </span>
                            <span className="block text-[10px] text-muted-foreground">
                              {req.paymentInfo?.referenceCode}
                            </span>
                          </td>
                          <td className="p-3 text-primary whitespace-nowrap truncate max-w-[120px]">
                            {req.receiptName || 'Anexo validado'}
                          </td>
                          <td className="p-3 text-right font-extrabold text-emerald-600 whitespace-nowrap">
                            {formatCurrency(req.amount)}
                          </td>
                          <td className="p-3 align-top" onClick={(e) => e.stopPropagation()}>
                            <FiscalMarkCell
                              targetId={req.id}
                              targetType="pagamento"
                              quarter={quarterOfISODate(req.paymentInfo?.paidAt || req.createdAt)}
                            />
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <DetailDialog
        open={Boolean(detailTarget)}
        onOpenChange={(open) => {
          if (!open) setDetailTarget(null)
        }}
        movement={detailTarget?.movement}
        request={detailTarget?.request}
        action={detailAction}
        canSeeSensitive={canAuthorizeAndPay}
      />
    </div>
  )
}

export default AccountabilityPage
