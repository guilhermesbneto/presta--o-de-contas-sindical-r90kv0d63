import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import { RoleType } from '@/types'
import {
  Building2,
  LayoutDashboard,
  KanbanSquare,
  FileSpreadsheet,
  CheckCircle2,
  ShieldCheck,
  BarChart3,
  UserCheck,
  ChevronDown,
  RotateCcw,
  Sparkles,
  AlertTriangle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export const Navbar: React.FC = () => {
  const {
    currentProfile,
    setCurrentProfile,
    profiles,
    resetAllData,
    canAuthorizeAndPay,
    isFiscalMember,
  } = useApp()
  const location = useLocation()

  const navItems = [
    {
      to: '/visao-geral',
      label: 'Visão Geral',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: '/acoes',
      label: 'Ações da Diretoria',
      icon: KanbanSquare,
      badge: null,
    },
    {
      to: '/solicitacoes',
      label: 'Solicitações',
      icon: FileSpreadsheet,
      badge: null,
    },
    {
      to: '/autorizacao-pagamento',
      label: 'Autorização e Pagamento',
      icon: CheckCircle2,
      restricted: !canAuthorizeAndPay,
      badgeRoleOnly: 'Presidência e Finanças',
    },
    {
      to: '/conselho-fiscal',
      label: 'Conselho Fiscal',
      icon: ShieldCheck,
      highlight: isFiscalMember,
    },
    {
      to: '/prestacao-contas',
      label: 'Prestação de Contas',
      icon: BarChart3,
      badge: 'Aberto a todos',
    },
  ]

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  const roleGroupColors: Record<string, string> = {
    Presidência:
      'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200',
    Finanças:
      'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200',
    'Conselho Fiscal':
      'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-200',
    'Diretoria Executiva':
      'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-200',
    Filiados: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-200',
    Colaboradores:
      'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200',
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75 shadow-xs">
      {/* Top Banner - Profile Selector & Quick Switcher */}
      <div className="bg-slate-900 text-white text-xs px-4 py-2 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 font-medium text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              Ambiente de Demonstração Ativo:
            </span>
            <span className="text-slate-300 hidden sm:inline">Navegando como</span>
            <span className="font-semibold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {currentProfile.name}
            </span>
            <Badge variant="outline" className="border-slate-600 text-slate-300 text-[10px] py-0">
              {currentProfile.roleLabel}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 text-xs bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
                >
                  <UserCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                  Trocar Perfil ({currentProfile.roleGroup})
                  <ChevronDown className="w-3 h-3 ml-1 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 max-h-[85vh] overflow-y-auto">
                <DropdownMenuLabel className="font-bold flex items-center justify-between">
                  <span>Escolha o Perfil de Demonstração</span>
                  <Link to="/" className="text-xs text-primary font-normal hover:underline">
                    Ver tela de entrada
                  </Link>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Grouped profiles */}
                {[
                  'Presidência',
                  'Finanças',
                  'Conselho Fiscal',
                  'Diretoria Executiva',
                  'Filiados',
                  'Colaboradores',
                ].map((group) => (
                  <DropdownMenuGroup key={group}>
                    <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {group}
                    </div>
                    {profiles
                      .filter((p) => p.roleGroup === group)
                      .map((profile) => (
                        <DropdownMenuItem
                          key={profile.id}
                          onClick={() => setCurrentProfile(profile)}
                          className={`flex items-start gap-2.5 py-2 cursor-pointer ${
                            currentProfile.id === profile.id ? 'bg-accent font-medium' : ''
                          }`}
                        >
                          <Avatar className="h-7 w-7 mt-0.5 border">
                            <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                            <AvatarFallback className="text-[10px]">
                              {getInitials(profile.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col text-left">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium leading-tight">
                                {profile.name}
                              </span>
                              {profile.isSubstitute && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1 py-0 border-amber-400 text-amber-700"
                                >
                                  Substituto
                                </Badge>
                              )}
                            </div>
                            <span className="text-[11px] text-muted-foreground">
                              {profile.roleLabel}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    <DropdownMenuSeparator />
                  </DropdownMenuGroup>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              onClick={resetAllData}
              title="Restaurar dados iniciais de demonstração"
              className="h-7 text-xs text-slate-400 hover:text-white hover:bg-slate-800 px-2"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              <span className="hidden md:inline">Restaurar Dados</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link to="/visao-geral" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-sm transition group-hover:scale-105">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-lg leading-tight tracking-tight text-foreground flex items-center gap-2">
                Prestação de Contas Sindical
              </div>
              <p className="text-xs text-muted-foreground">
                Transparência e Gestão do Terceiro Setor
              </p>
            </div>
          </Link>

          {/* Current user badge display */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex flex-col items-end text-right">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-foreground">{currentProfile.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${roleGroupColors[currentProfile.roleGroup] || ''}`}
                >
                  {currentProfile.roleGroup}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">{currentProfile.roleLabel}</span>
            </div>

            <Avatar className="h-9 w-9 border-2 border-primary/20">
              <AvatarImage src={currentProfile.avatarUrl} alt={currentProfile.name} />
              <AvatarFallback>{getInitials(currentProfile.name)}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 mt-3 overflow-x-auto pb-1 scrollbar-none border-t pt-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to
            const Icon = item.icon

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>

                {item.badgeRoleOnly && (
                  <span
                    className={`ml-1 text-[10px] px-1.5 py-0.2 rounded font-normal ${
                      isActive
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    Exclusivo P/F
                  </span>
                )}

                {item.highlight && (
                  <span
                    className={`ml-1 text-[10px] px-1.5 py-0.2 rounded font-normal ${
                      isActive
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                    }`}
                  >
                    Parecer
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Permission Context Subbar (Alert if user visits restricted area or has special powers) */}
      {canAuthorizeAndPay && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border-t border-b border-emerald-200 dark:border-emerald-800 px-4 py-1 text-[11px] text-emerald-800 dark:text-emerald-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {currentProfile.role === 'presidencia' ||
              currentProfile.role === 'presidencia_substituto' ? (
                <>
                  Permissão Ativa: <strong>Etapa 1 — Presidência.</strong> Você analisa pedidos e
                  pode aprovar, reprovar ou devolver para correção.
                </>
              ) : (
                <>
                  Permissão Ativa: <strong>Etapa 2 — Financeiro.</strong> Você planeja o pagamento,
                  aprova o planejamento e efetua a liquidação (após a dupla aprovação).
                </>
              )}
            </span>
            <Link
              to="/autorizacao-pagamento"
              className="underline font-semibold hover:text-emerald-900"
            >
              Ir para Autorizações &rarr;
            </Link>
          </div>
        </div>
      )}

      {isFiscalMember && (
        <div className="bg-blue-50 dark:bg-blue-950/40 border-t border-b border-blue-200 dark:border-blue-800 px-4 py-1 text-[11px] text-blue-800 dark:text-blue-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Conselho Fiscal: Você pode emitir parecer oficial (aprovar, aprovar com ressalva ou
              reprovar contas).
            </span>
            <Link to="/conselho-fiscal" className="underline font-semibold hover:text-blue-900">
              Auditar Contas &rarr;
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
