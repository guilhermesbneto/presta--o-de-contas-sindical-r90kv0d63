import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import { UserProfile, RoleType } from '@/types'
import {
  ShieldAlert,
  Building2,
  CheckCircle2,
  Scale,
  Users,
  Briefcase,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  FileText,
  BadgeCheck,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function EntryPage() {
  const { profiles, currentProfile, setCurrentProfile } = useApp()
  const navigate = useNavigate()

  const handleSelectProfile = (profile: UserProfile) => {
    setCurrentProfile(profile)
    navigate('/visao-geral')
  }

  const roleGroups = [
    {
      group: 'Presidência',
      icon: Building2,
      color: 'border-amber-400 bg-amber-500/10 text-amber-700 dark:text-amber-400',
      description:
        'Poder de autorização e liquidação de pagamentos, além de coordenação geral das ações.',
      badge: 'Autorização & Pagamento',
    },
    {
      group: 'Finanças',
      icon: CreditCard,
      color: 'border-emerald-400 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
      description:
        'Gestão contábil e orçamentária; autoriza solicitações e registra pagamentos efetuados.',
      badge: 'Autorização & Pagamento',
    },
    {
      group: 'Conselho Fiscal',
      icon: Scale,
      color: 'border-blue-400 bg-blue-500/10 text-blue-700 dark:text-blue-400',
      description:
        'Auditoria colegiada: 3 conselheiros que aprovam, aprovam com ressalva ou reprovam as contas.',
      badge: 'Parecer Colegiado (3 votos)',
    },
    {
      group: 'Diretoria Executiva',
      icon: Briefcase,
      color: 'border-purple-400 bg-purple-500/10 text-purple-700 dark:text-purple-400',
      description:
        'Executa e gerencia as ações e projetos sindicais, registrando custos e movimentações.',
      badge: 'Gestão de Ações',
    },
    {
      group: 'Filiados',
      icon: Users,
      color: 'border-sky-400 bg-sky-500/10 text-sky-700 dark:text-sky-400',
      description:
        'Base sindical: acompanha toda a prestação de contas e pode pedir ressarcimentos ou adiantamentos.',
      badge: 'Acompanhamento & Pedidos',
    },
    {
      group: 'Colaboradores',
      icon: FileText,
      color: 'border-slate-400 bg-slate-500/10 text-slate-700 dark:text-slate-400',
      description:
        'Equipe de apoio e assessores técnicos com direito a solicitar adiantamentos ou reembolsos de despesas.',
      badge: 'Equipe Operacional',
    },
  ]

  return (
    <div className="space-y-8 py-4">
      {/* Hero Welcome */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide">
          <BadgeCheck className="w-4 h-4" />
          Sistema de Prestação de Contas Sindical (3º Setor)
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Escolha seu Perfil de Demonstração
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Simule a experiência de cada cargo do sindicato sem necessidade de senha. Veja como
          funcionam os fluxos de <strong>solicitação</strong>,{' '}
          <strong>autorização exclusiva</strong> da Presidência/Finanças,{' '}
          <strong>execução de ações</strong> e o <strong>parecer do Conselho Fiscal</strong>.
        </p>
      </div>

      {/* Quick stats / Highlights box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-2xs flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 mt-1">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Regra Estatutária
            </h3>
            <p className="text-sm font-semibold mt-0.5">Autorização e Pagamento</p>
            <p className="text-xs text-muted-foreground mt-1">
              Apenas Presidência, Finanças e seus substitutos podem autorizar e registrar
              pagamentos.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-2xs flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 mt-1">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Auditoria Independente
            </h3>
            <p className="text-sm font-semibold mt-0.5">3 Conselheiros Fiscais</p>
            <p className="text-xs text-muted-foreground mt-1">
              Votam individualmente com parecer formal: aprovado, com ressalva ou reprovado.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-2xs flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary mt-1">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Transparência Total
            </h3>
            <p className="text-sm font-semibold mt-0.5">Aberto aos Filiados</p>
            <p className="text-xs text-muted-foreground mt-1">
              Demonstrativo de receitas, despesas e pagamentos por ação acessível a todos.
            </p>
          </div>
        </div>
      </div>

      {/* Profiles Cards grouped */}
      <div className="space-y-8 max-w-5xl mx-auto pt-4">
        {roleGroups.map((groupInfo) => {
          const groupProfiles = profiles.filter((p) => p.roleGroup === groupInfo.group)
          const GroupIcon = groupInfo.icon

          return (
            <div key={groupInfo.group} className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-md border ${groupInfo.color}`}>
                    <GroupIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                      {groupInfo.group}
                    </h2>
                    <p className="text-xs text-muted-foreground">{groupInfo.description}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[11px] font-medium hidden sm:inline-flex">
                  {groupInfo.badge}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {groupProfiles.map((profile) => {
                  const isCurrent = currentProfile.id === profile.id

                  return (
                    <Card
                      key={profile.id}
                      className={`transition-all duration-150 hover:shadow-md hover:border-primary/50 cursor-pointer flex flex-col justify-between ${
                        isCurrent
                          ? 'ring-2 ring-primary border-primary bg-primary/5 shadow-xs'
                          : 'bg-card'
                      }`}
                      onClick={() => handleSelectProfile(profile)}
                    >
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-12 h-12 border-2 border-background shadow-xs shrink-0">
                            <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                            <AvatarFallback>
                              {profile.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <CardTitle className="text-sm font-bold truncate">
                                {profile.name}
                              </CardTitle>
                              {profile.isSubstitute && (
                                <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-800 border-amber-300">
                                  Substituto
                                </Badge>
                              )}
                            </div>
                            <CardDescription className="text-xs font-medium text-primary mt-0.5">
                              {profile.roleLabel}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="p-4 pt-1 pb-3 text-xs text-muted-foreground line-clamp-2">
                        {profile.description}
                      </CardContent>

                      <CardFooter className="p-4 pt-0 flex items-center justify-between border-t mt-auto text-xs font-medium">
                        {isCurrent ? (
                          <span className="text-primary font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Perfil Ativo
                          </span>
                        ) : (
                          <span className="text-muted-foreground group-hover:text-foreground">
                            Entrar com este cargo
                          </span>
                        )}
                        <Button
                          size="sm"
                          variant={isCurrent ? 'default' : 'secondary'}
                          className="h-7 text-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectProfile(profile)
                          }}
                        >
                          Acessar <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </CardFooter>
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
