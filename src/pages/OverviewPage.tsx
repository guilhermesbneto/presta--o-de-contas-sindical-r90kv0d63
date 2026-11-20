import React from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import { formatCurrency, formatDate } from '@/lib/formatters'
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  KanbanSquare,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Scale,
  Sparkles,
  Building2,
  DollarSign,
  PieChart,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

export default function OverviewPage() {
  const {
    currentProfile,
    requests,
    actions,
    movements,
    fiscalPeriods,
    canAuthorizeAndPay,
    isFiscalMember,
  } = useApp()

  // Calculate totals
  const totalReceitas = movements
    .filter((m) => m.type === 'receita')
    .reduce((acc, m) => acc + m.amount, 0)

  const totalDespesas = movements
    .filter((m) => m.type === 'despesa')
    .reduce((acc, m) => acc + m.amount, 0)

  const saldoAtual = totalReceitas - totalDespesas

  // Pending items based on role (fluxo em duas etapas)
  const stageOneCount = requests.filter((r) => r.status === 'pendente').length
  const stageTwoCount = requests.filter((r) => r.status === 'aguardando_financeiro').length
  const toSettleCount = requests.filter((r) => r.status === 'aguardando_pagamento').length
  const returnedToMe = requests.filter(
    (r) => r.status === 'devolvido' && r.applicantId === currentProfile.id,
  ).length
  const myRequests = requests.filter((r) => r.applicantId === currentProfile.id)

  const pendingFiscalPeriod = fiscalPeriods.find(
    (p) => p.status === 'em_analise' && !p.votes[currentProfile.role],
  )

  const isPresidencyProfile =
    currentProfile.role === 'presidencia' || currentProfile.role === 'presidencia_substituto'

  const statusMap = {
    planejada: { label: 'Planejada', variant: 'secondary' as const },
    em_andamento: { label: 'Em Andamento', variant: 'default' as const },
    concluida: { label: 'Concluída', variant: 'outline' as const },
    cancelada: { label: 'Cancelada', variant: 'destructive' as const },
  }

  return (
    <div className="space-y-6">
      {/* Role Context Notification Bar */}
      <div className="p-4 rounded-xl border bg-gradient-to-r from-card to-muted/50 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Painel do Cargo
            </span>
            <Badge variant="outline" className="text-xs font-semibold bg-background">
              {currentProfile.roleGroup}
            </Badge>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Bem-vindo(a), {currentProfile.name}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {currentProfile.roleLabel} &bull; Acompanhe a prestação de contas, ações e tarefas
            pendentes do seu perfil.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button asChild size="sm" variant="outline" className="text-xs">
            <Link to="/solicitacoes">
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-primary" />
              Fazer Solicitação
            </Link>
          </Button>

          {canAuthorizeAndPay && (
            <Button
              asChild
              size="sm"
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Link to="/autorizacao-pagamento">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Autorizar & Pagar ({stageOneCount + stageTwoCount + toSettleCount})
              </Link>
            </Button>
          )}

          {isFiscalMember && (
            <Button asChild size="sm" className="text-xs bg-blue-600 hover:bg-blue-700 text-white">
              <Link to="/conselho-fiscal">
                <Scale className="w-3.5 h-3.5 mr-1" />
                Auditar Contas
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Role-specific Action Banner / Pendencies */}
      {(canAuthorizeAndPay ||
        isFiscalMember ||
        myRequests.some((r) => r.status === 'pendente' || r.status === 'devolvido')) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {canAuthorizeAndPay && (
            <Card className="border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> Pendência da Presidência /
                    Finanças
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-amber-100 text-amber-800 border-amber-300 text-xs"
                  >
                    {isPresidencyProfile
                      ? `${stageOneCount} na Etapa 1`
                      : `${stageTwoCount + toSettleCount} na Etapa 2`}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <p className="text-xs text-muted-foreground">
                  {isPresidencyProfile ? (
                    <>
                      Existem{' '}
                      <strong>{stageOneCount} pedidos aguardando a análise da Presidência</strong>{' '}
                      (Etapa 1).
                    </>
                  ) : (
                    <>
                      Existem <strong>{stageTwoCount} pedidos aprovados pela Presidência</strong>{' '}
                      aguardando planejamento e <strong>{toSettleCount}</strong> com dupla aprovação
                      aguardando pagamento (Etapa 2).
                    </>
                  )}
                </p>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="w-full mt-3 text-xs border-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                >
                  <Link
                    to="/autorizacao-pagamento"
                    className="flex items-center justify-center gap-1"
                  >
                    Analisar Pedidos Pendentes <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {isFiscalMember && (
            <Card className="border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-blue-600" /> Parecer do Conselho Fiscal
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-blue-100 text-blue-800 border-blue-300 text-xs"
                  >
                    {pendingFiscalPeriod ? '1 Pauta Aberta' : 'Em Dia'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <p className="text-xs text-muted-foreground">
                  {pendingFiscalPeriod ? (
                    <span>
                      A prestação de contas de <strong>{pendingFiscalPeriod.period}</strong> aguarda
                      seu parecer formal de conselheiro.
                    </span>
                  ) : (
                    <span>
                      Você já votou nas pautas abertas. Pode revisar os pareceres colegiados a
                      qualquer momento.
                    </span>
                  )}
                </p>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="w-full mt-3 text-xs border-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                >
                  <Link to="/conselho-fiscal" className="flex items-center justify-center gap-1">
                    Acessar Conselho Fiscal <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="border-border bg-card">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-primary" /> Meus Pedidos Pessoais
                </span>
                <Badge variant="secondary" className="text-xs">
                  {myRequests.length} registros
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <p className="text-xs text-muted-foreground">
                Qualquer filiado ou colaborador pode pedir adiantamento ou ressarcimento com
                comprovante.
              </p>
              {returnedToMe > 0 && (
                <div className="mt-2 p-2 rounded bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 text-[11px] text-orange-800 dark:text-orange-200">
                  <AlertCircle className="w-3 h-3 inline mr-1 -mt-0.5" />
                  <strong>{returnedToMe}</strong> pedido(s) devolvido(s) para sua correção — acesse{' '}
                  <strong>Solicitações</strong> para ver a justificativa e reenviar.
                </div>
              )}
              <div className="mt-3 flex items-center gap-2">
                <Button asChild size="sm" variant="secondary" className="w-full text-xs">
                  <Link to="/solicitacoes">
                    Nova Solicitação <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Financial KPIs */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          Resumo Financeiro Consolidado
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-xs font-medium flex items-center justify-between">
                <span>Receitas Totais</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </CardDescription>
              <CardTitle className="text-xl sm:text-2xl font-extrabold text-emerald-600">
                {formatCurrency(totalReceitas)}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
              Mensalidades sociais e aportes de campanha
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-xs font-medium flex items-center justify-between">
                <span>Despesas Totais</span>
                <TrendingDown className="w-4 h-4 text-rose-600" />
              </CardDescription>
              <CardTitle className="text-xl sm:text-2xl font-extrabold text-rose-600">
                {formatCurrency(totalDespesas)}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
              Ações sindicais, reembolsos e manutenção
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="p-4 pb-1">
              <CardDescription className="text-xs font-medium flex items-center justify-between">
                <span>Saldo em Caixa</span>
                <Building2 className="w-4 h-4 text-primary" />
              </CardDescription>
              <CardTitle className="text-xl sm:text-2xl font-extrabold text-primary">
                {formatCurrency(saldoAtual)}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
              Disponibilidade auditada pelo Conselho Fiscal
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Grid: Actions Summary & Recent Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actions Summary */}
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <KanbanSquare className="w-4 h-4 text-primary" />
                  Ações da Diretoria Executiva
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Projetos e mobilizações geridos pela Diretoria
                </CardDescription>
              </div>
              <Button asChild size="sm" variant="ghost" className="text-xs h-7">
                <Link to="/acoes">
                  Ver todas ({actions.length}) <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
            {actions.slice(0, 4).map((action) => {
              const percent = Math.min(100, Math.round((action.spent / (action.budget || 1)) * 100))
              const st = statusMap[action.status] || { label: action.status, variant: 'outline' }

              return (
                <div
                  key={action.id}
                  className="p-3 rounded-lg border bg-card/60 space-y-2 hover:bg-muted/40 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-foreground line-clamp-1">
                        {action.name}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Responsável:{' '}
                        <span className="font-medium text-foreground">{action.responsible}</span>
                      </p>
                    </div>
                    <Badge variant={st.variant} className="text-[10px] shrink-0">
                      {st.label}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Execução orçamentária</span>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(action.spent)} de {formatCurrency(action.budget)} ({percent}
                        %)
                      </span>
                    </div>
                    <Progress value={percent} className="h-1.5" />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Latest Financial Movements */}
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-600" />
                  Últimas Movimentações Financeiras
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Receitas e despesas liquidadas abertas a todos os filiados
                </CardDescription>
              </div>
              <Button asChild size="sm" variant="ghost" className="text-xs h-7">
                <Link to="/prestacao-contas">
                  Demonstrativo Completo <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
            {movements.slice(0, 5).map((mov) => {
              const isReceita = mov.type === 'receita'

              return (
                <div
                  key={mov.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border bg-card/60 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isReceita
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {isReceita ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground line-clamp-1">
                        {mov.description}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDate(mov.date)} &bull; {mov.category}{' '}
                        {mov.paymentMethod ? `(${mov.paymentMethod})` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-bold ${
                        isReceita
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isReceita ? '+' : '-'} {formatCurrency(mov.amount)}
                    </span>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Fiscal Council Banner info */}
      <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20">
        <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                Auditoria Colegiada do Conselho Fiscal
              </h3>
              <p className="text-xs text-muted-foreground max-w-2xl">
                O sindicato possui 3 conselheiros fiscais independentes. Qualquer filiado pode
                consultar as atas de aprovação, votos fundamentados e ressalvas emitidas pelo
                colegiado.
              </p>
            </div>
          </div>

          <Button
            asChild
            variant="outline"
            className="text-xs shrink-0 border-blue-300 dark:border-blue-800"
          >
            <Link to="/conselho-fiscal">
              Consultar Pareceres do Conselho <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
