import React, { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import { FiscalDecision, FiscalAccountPeriod, RoleType } from '@/types'
import {
  Scale,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Vote,
  Users,
  Building2,
  Lock,
  MessageSquare,
  BadgeAlert,
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Link } from 'react-router-dom'

export default function FiscalCouncilPage() {
  const {
    currentProfile,
    fiscalPeriods,
    castFiscalVote,
    isFiscalMember,
    setCurrentProfile,
    profiles,
  } = useApp()
  const { toast } = useToast()

  // Voting modal
  const [selectedPeriodForVote, setSelectedPeriodForVote] = useState<FiscalAccountPeriod | null>(
    null,
  )
  const [decision, setDecision] = useState<FiscalDecision>('aprovado')
  const [justification, setJustification] = useState('')

  const handleOpenVote = (period: FiscalAccountPeriod) => {
    // Pre-populate if this council member already voted
    const existingVote = period.votes[currentProfile.role]
    if (existingVote) {
      setDecision(existingVote.decision)
      setJustification(existingVote.justification)
    } else {
      setDecision('aprovado')
      setJustification('')
    }
    setSelectedPeriodForVote(period)
  }

  const handleConfirmVote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPeriodForVote) return

    if (!justification.trim() || justification.trim().length < 10) {
      toast({
        title: 'Justificativa insuficiente',
        description:
          'Todo parecer do Conselho Fiscal requer justificativa técnica fundamentada (mínimo de 10 caracteres).',
        variant: 'destructive',
      })
      return
    }

    castFiscalVote(selectedPeriodForVote.id, decision, justification.trim())

    const decisionText =
      decision === 'aprovado'
        ? 'Aprovação'
        : decision === 'aprovado_com_ressalva'
          ? 'Aprovação com Ressalva'
          : 'Reprovação'

    toast({
      title: 'Parecer Registrado pelo Conselheiro',
      description: `Seu voto (${decisionText}) para "${selectedPeriodForVote.title}" foi protocolado com sucesso!`,
    })

    setSelectedPeriodForVote(null)
    setJustification('')
  }

  const decisionBadgeConfig: Record<
    FiscalDecision,
    { label: string; class: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    aprovado: {
      label: 'Aprovado',
      class:
        'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300',
      icon: CheckCircle2,
    },
    aprovado_com_ressalva: {
      label: 'Aprovado com Ressalva',
      class: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300',
      icon: AlertTriangle,
    },
    reprovado: {
      label: 'Reprovado',
      class: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300',
      icon: XCircle,
    },
  }

  const periodStatusConfig = {
    em_analise: {
      label: 'Em Auditoria / Votação Aberta',
      class: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    aprovada: {
      label: 'Contas Aprovadas pelo Colegiado',
      class: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    aprovada_com_ressalvas: {
      label: 'Aprovadas com Ressalvas',
      class: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    reprovada: {
      label: 'Contas Reprovadas pelo Colegiado',
      class: 'bg-rose-100 text-rose-800 border-rose-300',
    },
  }

  const councilMembers = [
    {
      roleKey: 'conselho_fiscal_1',
      title: '1º Conselheiro Fiscal',
      defaultName: 'Dr. Valter Nogueira',
    },
    {
      roleKey: 'conselho_fiscal_2',
      title: '2ª Conselheira Fiscal',
      defaultName: 'Dra. Sônia Regina Prado',
    },
    {
      roleKey: 'conselho_fiscal_3',
      title: '3º Conselheiro Fiscal',
      defaultName: 'Prof. Bento Albuquerque',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Scale className="w-6 h-6 text-blue-600" />
              Conselho Fiscal do Sindicato
            </h1>
            <Badge className="bg-blue-600 text-white text-xs">
              Auditoria Estatutária Colegiada
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Órgão fiscalizador autônomo composto por <strong>3 conselheiros fiscais</strong> eleitos
            pela categoria para auditar receitas, despesas, balancetes e emitir parecer
            fundamentado.
          </p>
        </div>

        {/* Quick switch between council members to test easily */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Simular Conselheiro:
          </span>
          {councilMembers.map((member, idx) => {
            const profile = profiles.find((p) => p.role === member.roleKey)
            const isCurrent = currentProfile.role === member.roleKey

            return (
              <Button
                key={member.roleKey}
                variant={isCurrent ? 'default' : 'outline'}
                size="sm"
                className={`text-xs h-8 ${isCurrent ? 'bg-blue-600 text-white' : ''}`}
                onClick={() => {
                  if (profile) setCurrentProfile(profile)
                }}
              >
                {idx + 1}º Conselheiro {isCurrent && '(Você)'}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Role State Banner */}
      {isFiscalMember ? (
        <Card className="border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">
                  Você está autenticado como <strong>{currentProfile.name}</strong> (
                  {currentProfile.roleLabel})
                </p>
                <p className="text-muted-foreground">
                  Seu cargo tem direito a voto e emissão de parecer em todas as prestações de contas
                  abertas.
                </p>
              </div>
            </div>
            <Badge className="bg-blue-600 text-white shrink-0">Poder de Voto Ativo</Badge>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-muted bg-muted/40">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 text-muted-foreground shrink-0" />
              <div>
                <p className="font-semibold text-foreground">
                  Visualização Pública dos Pareceres do Conselho Fiscal
                </p>
                <p className="text-muted-foreground">
                  Como {currentProfile.roleLabel}, você pode ler na íntegra as decisões e
                  justificativas dos 3 conselheiros. Para votar, selecione um dos conselheiros
                  acima.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* The 3 Council Members Cards */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          Composição do Conselho Fiscal (3 Membros Titulares)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {councilMembers.map((member) => {
            const p = profiles.find((prof) => prof.role === member.roleKey)
            const isMe = currentProfile.role === member.roleKey

            return (
              <Card
                key={member.roleKey}
                className={`p-3 text-xs transition ${
                  isMe ? 'ring-2 ring-blue-500 bg-blue-50/20' : 'bg-card'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                    {member.roleKey.slice(-1)}º
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{p?.name || member.defaultName}</p>
                    <p className="text-[11px] text-muted-foreground">{member.title}</p>
                  </div>
                </div>
                {isMe && (
                  <Badge
                    variant="outline"
                    className="mt-2 text-[10px] bg-blue-100 text-blue-800 border-blue-300"
                  >
                    Seu Cargo Atual
                  </Badge>
                )}
              </Card>
            )
          })}
        </div>
      </div>

      {/* Account Periods List */}
      <div className="space-y-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          Prestações de Contas Submetidas ao Conselho
        </h2>

        {fiscalPeriods.map((period) => {
          const statusInfo = periodStatusConfig[period.status] || {
            label: period.status,
            class: 'bg-muted text-muted-foreground',
          }

          const votesList = Object.values(period.votes)
          const myVote = period.votes[currentProfile.role]

          return (
            <Card key={period.id} className="overflow-hidden border shadow-xs">
              <CardHeader className="p-4 sm:p-5 pb-3 bg-muted/20 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-xs font-semibold ${statusInfo.class}`}
                      >
                        {statusInfo.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Competência: <strong>{period.period}</strong>
                      </span>
                    </div>
                    <CardTitle className="text-base sm:text-lg font-bold mt-1">
                      {period.title}
                    </CardTitle>
                  </div>

                  <div className="flex items-center gap-2">
                    {isFiscalMember && (
                      <Button
                        size="sm"
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                        onClick={() => handleOpenVote(period)}
                      >
                        <Vote className="w-3.5 h-3.5 mr-1.5" />
                        {myVote ? 'Alterar Meu Parecer' : 'Emitir Meu Parecer'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 space-y-4">
                {/* Financial Summary of the period */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-card border text-xs">
                  <div>
                    <span className="text-muted-foreground">Receitas no Período:</span>
                    <p className="text-sm font-bold text-emerald-600">
                      {formatCurrency(period.totalIncome)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Despesas no Período:</span>
                    <p className="text-sm font-bold text-rose-600">
                      {formatCurrency(period.totalExpense)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Superávit / Saldo Líquido:</span>
                    <p className="text-sm font-bold text-primary">
                      {formatCurrency(period.balance)}
                    </p>
                  </div>
                </div>

                {period.notes && (
                  <p className="text-xs text-muted-foreground italic">
                    <strong>Anotação da Diretoria Financeira:</strong> "{period.notes}"
                  </p>
                )}

                {/* The 3 Council Votes Box */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5" />
                      Votação dos 3 Conselheiros Fiscais ({votesList.length} de 3 manifestações)
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {councilMembers.map((member) => {
                      const vote = period.votes[member.roleKey]
                      const badge = vote ? decisionBadgeConfig[vote.decision] : null
                      const BadgeIcon = badge?.icon

                      return (
                        <div
                          key={member.roleKey}
                          className={`p-3 rounded-lg border text-xs flex flex-col justify-between ${
                            vote ? 'bg-card' : 'bg-muted/30 border-dashed'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-2">
                              <span className="font-semibold text-foreground">{member.title}</span>
                              {vote ? (
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] font-bold ${badge?.class}`}
                                >
                                  {BadgeIcon && <BadgeIcon className="w-3 h-3 mr-1 inline" />}
                                  {badge?.label}
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] text-muted-foreground bg-muted"
                                >
                                  Voto Pendente
                                </Badge>
                              )}
                            </div>

                            <p className="text-[11px] text-muted-foreground font-medium mb-1.5">
                              {vote?.councilMemberName || member.defaultName}
                            </p>

                            {vote ? (
                              <div className="space-y-1 mt-1">
                                <p className="text-[11px] text-foreground bg-muted/40 p-2 rounded border border-muted">
                                  "{vote.justification}"
                                </p>
                                <p className="text-[10px] text-muted-foreground text-right">
                                  Emitido em: {formatDateTime(vote.votedAt)}
                                </p>
                              </div>
                            ) : (
                              <p className="text-[11px] text-muted-foreground italic mt-2">
                                Aguardando análise da documentação comprobatória e parecer do
                                conselheiro.
                              </p>
                            )}
                          </div>

                          {currentProfile.role === member.roleKey && !vote && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-3 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                              onClick={() => handleOpenVote(period)}
                            >
                              Registrar Meu Voto Agora &rarr;
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Voting Modal */}
      {selectedPeriodForVote && (
        <Dialog open={!!selectedPeriodForVote} onOpenChange={() => setSelectedPeriodForVote(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Vote className="w-5 h-5 text-blue-600" />
                Parecer do Conselho Fiscal
              </DialogTitle>
              <DialogDescription className="text-xs">
                {selectedPeriodForVote.title} ({selectedPeriodForVote.period})
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleConfirmVote} className="space-y-4 py-2 text-xs">
              <div className="p-3 rounded-md bg-blue-50/50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-1">
                <p>
                  <strong>Conselheiro Responsável:</strong> {currentProfile.name}
                </p>
                <p className="text-muted-foreground">
                  Cargo estatutário: <strong>{currentProfile.roleLabel}</strong>
                </p>
              </div>

              {/* Decision radio */}
              <div className="space-y-2">
                <Label className="font-semibold text-xs">Decisão do Voto *</Label>
                <RadioGroup
                  value={decision}
                  onValueChange={(val) => setDecision(val as FiscalDecision)}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2 border p-2.5 rounded-md hover:bg-muted/40 cursor-pointer">
                    <RadioGroupItem value="aprovado" id="r-aprovado" />
                    <Label
                      htmlFor="r-aprovado"
                      className="cursor-pointer flex-1 font-medium text-emerald-700 dark:text-emerald-400"
                    >
                      Aprovar as Contas (Sem Ressalvas)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 border p-2.5 rounded-md hover:bg-muted/40 cursor-pointer">
                    <RadioGroupItem value="aprovado_com_ressalva" id="r-ressalva" />
                    <Label
                      htmlFor="r-ressalva"
                      className="cursor-pointer flex-1 font-medium text-amber-700 dark:text-amber-400"
                    >
                      Aprovar com Ressalva (Apontamentos e Recomendações)
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 border p-2.5 rounded-md hover:bg-muted/40 cursor-pointer">
                    <RadioGroupItem value="reprovado" id="r-reprovado" />
                    <Label
                      htmlFor="r-reprovado"
                      className="cursor-pointer flex-1 font-medium text-rose-700 dark:text-rose-400"
                    >
                      Reprovar as Contas (Irregularidades ou Inconformidades)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Justification */}
              <div className="space-y-1.5">
                <Label htmlFor="fiscal-justification" className="font-semibold text-xs">
                  Justificativa e Parecer Técnico *
                </Label>
                <Textarea
                  id="fiscal-justification"
                  rows={4}
                  placeholder="Fundamente sua decisão com base na conferência dos extratos, comprovantes fiscais e respeito ao estatuto..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Seu parecer constará na ata pública de prestação de contas do sindicato.
                </p>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedPeriodForVote(null)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Protocolar Parecer Colegiado
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
