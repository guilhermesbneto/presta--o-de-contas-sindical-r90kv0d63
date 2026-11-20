import React, { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { DirectoriaAction, ActionStatus } from '@/types'
import {
  KanbanSquare,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderOpen,
  Calendar,
  User,
  DollarSign,
  TrendingDown,
  Layers,
  Search,
  Filter,
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
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

export default function ActionsPage() {
  const { actions, addAction, updateActionStatus, canManageActions, currentProfile, movements } =
    useApp()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Form state for creating new action
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newResponsible, setNewResponsible] = useState(currentProfile.name)
  const [newResponsibleRole, setNewResponsibleRole] = useState(currentProfile.roleLabel)
  const [newBudget, setNewBudget] = useState('')
  const [newCategory, setNewCategory] = useState('Mobilização Sindical')
  const [newTargetDate, setNewTargetDate] = useState('2025-06-30')

  const handleCreateAction = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newBudget) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o nome da ação e o orçamento planejado.',
        variant: 'destructive',
      })
      return
    }

    const budgetNum = parseFloat(newBudget.replace(',', '.'))
    if (isNaN(budgetNum) || budgetNum <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Informe um valor orçado numérico positivo.',
        variant: 'destructive',
      })
      return
    }

    addAction({
      name: newName,
      description: newDescription,
      responsible: `${newResponsible} (${newResponsibleRole})`,
      responsibleRole: newResponsibleRole,
      budget: budgetNum,
      spent: 0,
      status: 'planejada',
      startDate: new Date().toISOString().split('T')[0],
      targetDate: newTargetDate,
      category: newCategory,
    })

    toast({
      title: 'Ação registrada com sucesso',
      description: `A ação "${newName}" foi criada pela Diretoria Executiva.`,
    })

    // Reset and close
    setNewName('')
    setNewDescription('')
    setNewBudget('')
    setIsDialogOpen(false)
  }

  const filteredActions = actions.filter((action) => {
    const matchesSearch =
      action.name.toLowerCase().includes(search.toLowerCase()) ||
      action.description.toLowerCase().includes(search.toLowerCase()) ||
      action.responsible.toLowerCase().includes(search.toLowerCase()) ||
      action.category.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === 'all' || action.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusConfig: Record<ActionStatus, { label: string; badgeClass: string }> = {
    planejada: { label: 'Planejada', badgeClass: 'bg-slate-100 text-slate-800 border-slate-300' },
    em_andamento: {
      label: 'Em Andamento',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    concluida: {
      label: 'Concluída',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    cancelada: { label: 'Cancelada', badgeClass: 'bg-rose-100 text-rose-800 border-rose-300' },
  }

  // Summary statistics
  const totalBudget = actions.reduce((acc, a) => acc + a.budget, 0)
  const totalSpent = actions.reduce((acc, a) => acc + a.spent, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <KanbanSquare className="w-6 h-6 text-primary" />
              Ações da Diretoria Executiva
            </h1>
            <Badge variant="outline" className="text-xs">
              Acompanhamento Público
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Projetos, mobilizações e reformas conduzidos pela Diretoria Executiva com transparência
            de custos e responsáveis.
          </p>
        </div>

        {canManageActions ? (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="text-xs shrink-0">
                <Plus className="w-4 h-4 mr-1.5" />
                Registrar Nova Ação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Registrar Nova Ação Sindical</DialogTitle>
                <DialogDescription>
                  Inclusão de projeto ou atividade da Diretoria Executiva com estimativa
                  orçamentária e responsável.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateAction} className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="action-name" className="text-xs font-semibold">
                    Nome da Ação / Projeto *
                  </Label>
                  <Input
                    id="action-name"
                    placeholder="Ex: Campanha Salarial, Congresso de Base, Reforma..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="action-category" className="text-xs font-semibold">
                      Categoria
                    </Label>
                    <Select value={newCategory} onValueChange={setNewCategory}>
                      <SelectTrigger id="action-category" className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mobilização Sindical">Mobilização Sindical</SelectItem>
                        <SelectItem value="Formação e Capacitação">
                          Formação e Capacitação
                        </SelectItem>
                        <SelectItem value="Assessoria Jurídica">Assessoria Jurídica</SelectItem>
                        <SelectItem value="Infraestrutura e Patrimônio">
                          Infraestrutura e Patrimônio
                        </SelectItem>
                        <SelectItem value="Comunicação e Mídia">Comunicação e Mídia</SelectItem>
                        <SelectItem value="Assistência Social ao Filiado">
                          Assistência Social ao Filiado
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="action-budget" className="text-xs font-semibold">
                      Orçamento Previsto (R$) *
                    </Label>
                    <Input
                      id="action-budget"
                      type="number"
                      step="0.01"
                      placeholder="Ex: 25000"
                      value={newBudget}
                      onChange={(e) => setNewBudget(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="action-desc" className="text-xs font-semibold">
                    Descrição Detalhada e Objetivos
                  </Label>
                  <Textarea
                    id="action-desc"
                    placeholder="Descreva a finalidade desta ação para a categoria sindical..."
                    rows={3}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="action-resp" className="text-xs font-semibold">
                      Diretor(a) Responsável
                    </Label>
                    <Input
                      id="action-resp"
                      value={newResponsible}
                      onChange={(e) => setNewResponsible(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="action-date" className="text-xs font-semibold">
                      Previsão de Conclusão
                    </Label>
                    <Input
                      id="action-date"
                      type="date"
                      value={newTargetDate}
                      onChange={(e) => setNewTargetDate(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm">
                    Salvar Ação
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        ) : (
          <div className="text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded border">
            Gestão restrita aos membros da Diretoria Executiva
          </div>
        )}
      </div>

      {/* Top Aggregations */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total de Ações Registradas</p>
            <p className="text-xl font-bold">{actions.length} ações</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Orçamento Total Planejado</p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(totalBudget)}
            </p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Executado (Liquidado)</p>
            <p className="text-xl font-bold text-blue-700 dark:text-blue-400">
              {formatCurrency(totalSpent)}{' '}
              <span className="text-xs font-normal text-muted-foreground">
                ({Math.round((totalSpent / (totalBudget || 1)) * 100)}%)
              </span>
            </p>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por ação, responsável ou categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">Situação:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 text-xs h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Situações</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="planejada">Planejada</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Actions Grid */}
      {filteredActions.length === 0 ? (
        <Card className="text-center py-12">
          <FolderOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-60" />
          <p className="text-sm font-semibold">Nenhuma ação encontrada</p>
          <p className="text-xs text-muted-foreground mt-1">
            Tente ajustar seus termos de busca ou filtros.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredActions.map((action) => {
            const percent = Math.min(100, Math.round((action.spent / (action.budget || 1)) * 100))
            const cfg = statusConfig[action.status] || { label: action.status, badgeClass: '' }
            const actionMovements = movements.filter((m) => m.actionId === action.id)

            return (
              <Card
                key={action.id}
                className="flex flex-col justify-between hover:shadow-xs transition"
              >
                <CardHeader className="p-4 sm:p-5 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase font-bold text-muted-foreground"
                        >
                          {action.category}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${cfg.badgeClass}`}
                        >
                          {cfg.label}
                        </Badge>
                      </div>
                      <CardTitle className="text-base font-bold leading-snug">
                        {action.name}
                      </CardTitle>
                    </div>
                  </div>

                  <CardDescription className="text-xs text-muted-foreground line-clamp-2 mt-2">
                    {action.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 pt-0 space-y-4">
                  {/* Budget & Execution */}
                  <div className="p-3 rounded-lg bg-muted/40 border space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Execução Orçamentária</span>
                      <span className="font-bold">
                        {formatCurrency(action.spent)}{' '}
                        <span className="font-normal text-muted-foreground">
                          de {formatCurrency(action.budget)}
                        </span>
                      </span>
                    </div>
                    <Progress value={percent} className="h-2" />
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{percent}% utilizado</span>
                      <span>
                        Disponível: {formatCurrency(Math.max(0, action.budget - action.spent))}
                      </span>
                    </div>
                  </div>

                  {/* Responsible & Dates */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate" title={action.responsible}>
                        {action.responsible}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 justify-end">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>Até {formatDate(action.targetDate)}</span>
                    </div>
                  </div>

                  {/* Associated movements snippet */}
                  {actionMovements.length > 0 && (
                    <div className="pt-2 border-t text-[11px]">
                      <span className="font-semibold text-foreground">
                        {actionMovements.length} movimentação(ões) vinculada(s):
                      </span>
                      <ul className="mt-1 space-y-1">
                        {actionMovements.slice(0, 2).map((m) => (
                          <li key={m.id} className="flex justify-between text-muted-foreground">
                            <span className="truncate pr-2">&bull; {m.description}</span>
                            <span className="font-medium text-foreground shrink-0">
                              {formatCurrency(m.amount)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="p-4 sm:p-5 pt-0 border-t mt-auto flex items-center justify-between text-xs">
                  <span className="text-muted-foreground text-[11px]">
                    Início: {formatDate(action.startDate)}
                  </span>

                  {canManageActions && (
                    <div className="flex items-center gap-1">
                      <Select
                        value={action.status}
                        onValueChange={(val) => updateActionStatus(action.id, val as ActionStatus)}
                      >
                        <SelectTrigger className="h-7 text-xs w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planejada">Planejada</SelectItem>
                          <SelectItem value="em_andamento">Em Andamento</SelectItem>
                          <SelectItem value="concluida">Concluída</SelectItem>
                          <SelectItem value="cancelada">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
