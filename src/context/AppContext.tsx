import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import {
  DEMO_PROFILES,
  INITIAL_ACTIONS,
  INITIAL_MOVEMENTS,
  INITIAL_REQUESTS,
  INITIAL_FISCAL_PERIODS,
  INITIAL_FISCAL_QUARTER_PLAN,
  INITIAL_FISCAL_MARKS,
} from '@/data/initialData'
import type {
  ActionMovement,
  ActionStatus,
  DirectoriaAction,
  ExpenseRequest,
  FiscalAccountPeriod,
  FiscalDecision,
  StageDecision,
  UserProfile,
} from '@/types'
import type { FiscalMovementMark, FiscalQuarterPlan } from '@/lib/fiscal'

const STORAGE_KEY = 'sind-app-state-v4'

interface AppState {
  profile: UserProfile | null
  actions: DirectoriaAction[]
  movements: ActionMovement[]
  requests: ExpenseRequest[]
  fiscalPeriods: FiscalAccountPeriod[]
  fiscalQuarterPlan: FiscalQuarterPlan
  fiscalMarks: FiscalMovementMark[]
}

interface AppContextValue extends AppState {
  profiles: UserProfile[]
  currentProfile: UserProfile
  setCurrentProfile: (profile: UserProfile) => void
  login: (profileId: string) => void
  logout: () => void
  addAction: (action: Omit<DirectoriaAction, 'id'>) => void
  updateActionStatus: (actionId: string, status: ActionStatus) => void
  addMovement: (movement: Omit<ActionMovement, 'id'>) => void
  addRequest: (request: Omit<ExpenseRequest, 'id' | 'stageHistory'>) => void
  resubmitRequest: (
    requestId: string,
    data: {
      type: ExpenseRequest['type']
      amount: number
      reason: string
      category: string
      receiptName?: string
      actionId?: string
    },
  ) => void
  decidePresidency: (requestId: string, decision: StageDecision, justification?: string) => void
  decideFinance: (
    requestId: string,
    decision: StageDecision,
    planning?: { paymentMethod: string; expectedDate: string; notes?: string },
    justification?: string,
  ) => void
  payRequest: (
    requestId: string,
    info: { paymentMethod: string; referenceCode: string; notes?: string },
  ) => void
  castFiscalVote: (periodId: string, decision: FiscalDecision, justification: string) => void
  updateFiscalQuarterPlan: (plan: FiscalQuarterPlan) => void
  upsertFiscalMark: (mark: Omit<FiscalMovementMark, 'id' | 'markedAt'>) => void
  removeFiscalMark: (markId: string) => void
  respondFiscalMark: (markId: string, message: string) => void
  resetAllData: () => void
  canAuthorizeAndPay: boolean
  canManageActions: boolean
  isFiscalMember: boolean
  isPresidency: boolean
  isFinance: boolean
}

const AppContext = createContext<AppContextValue | null>(null)

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      // Marcas antigas podem não ter prazo de resposta / resposta da diretoria
      const normalized = (parsed.fiscalMarks ?? []).map((m) => ({
        ...m,
        responseDueDate: m.responseDueDate,
        boardResponse: m.boardResponse,
      }))
      return {
        ...parsed,
        profile: parsed.profile ?? null,
        fiscalQuarterPlan: parsed.fiscalQuarterPlan ?? INITIAL_FISCAL_QUARTER_PLAN,
        fiscalMarks: normalized.length ? normalized : INITIAL_FISCAL_MARKS,
      }
    }
  } catch {
    // estado corrompido — recarrega dados de exemplo
  }
  return {
    profile: null,
    actions: INITIAL_ACTIONS,
    movements: INITIAL_MOVEMENTS,
    requests: INITIAL_REQUESTS,
    fiscalPeriods: INITIAL_FISCAL_PERIODS,
    fiscalQuarterPlan: INITIAL_FISCAL_QUARTER_PLAN,
    fiscalMarks: INITIAL_FISCAL_MARKS,
  }
}

/** Recarrega os dados de exemplo (usado pelo botão "Restaurar Dados" da Navbar). */
function resetDemoState(): AppState {
  return {
    profile: null,
    actions: INITIAL_ACTIONS,
    movements: INITIAL_MOVEMENTS,
    requests: INITIAL_REQUESTS,
    fiscalPeriods: INITIAL_FISCAL_PERIODS,
    fiscalQuarterPlan: INITIAL_FISCAL_QUARTER_PLAN,
    fiscalMarks: INITIAL_FISCAL_MARKS,
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // quota — segue sem persistir
    }
  }, [state])

  const value = useMemo<AppContextValue>(() => {
    const nextId = (prefix: string) =>
      `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

    const patchRequest = (id: string, patch: Partial<ExpenseRequest>) =>
      setState((s) => ({
        ...s,
        requests: s.requests.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      }))

    const currentProfile: UserProfile =
      state.profile ??
      ({
        id: 'anon',
        name: 'Visitante',
        role: 'filiado',
        roleLabel: 'Visitante (sem cargo definido)',
        roleGroup: 'Filiados',
        description: 'Perfil provisório antes da escolha na tela inicial.',
      } as UserProfile)

    return {
      ...state,
      profiles: DEMO_PROFILES,
      currentProfile,
      setCurrentProfile: (profile) => setState((s) => ({ ...s, profile })),
      login: (profileId) =>
        setState((s) => ({
          ...s,
          profile: DEMO_PROFILES.find((p) => p.id === profileId) ?? null,
        })),
      logout: () => setState((s) => ({ ...s, profile: null })),
      addAction: (action) =>
        setState((s) => ({
          ...s,
          actions: [...s.actions, { ...action, id: nextId('act') }],
        })),
      updateActionStatus: (actionId, status) =>
        setState((s) => ({
          ...s,
          actions: s.actions.map((a) => (a.id === actionId ? { ...a, status } : a)),
        })),
      addMovement: (movement) =>
        setState((s) => ({
          ...s,
          movements: [...s.movements, { ...movement, id: nextId('mov') }],
        })),
      addRequest: (request) =>
        setState((s) => ({
          ...s,
          requests: [{ ...request, id: nextId('req'), stageHistory: [] }, ...s.requests],
        })),
      resubmitRequest: (requestId, data) =>
        setState((s) => ({
          ...s,
          requests: s.requests.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  ...data,
                  status: 'pendente' as const,
                  currentStage: 1 as const,
                  stageHistory: [
                    ...r.stageHistory,
                    {
                      stage: 1 as const,
                      decision: 'devolvido' as const,
                      by: 'Sistema',
                      byRole: 'Reenvio do solicitante',
                      at: new Date().toISOString(),
                      justification: 'Pedido corrigido e reenviado pelo solicitante',
                    },
                  ],
                  returnedBy: undefined,
                  returnedAt: undefined,
                  rejectionReason: undefined,
                }
              : r,
          ),
        })),
      decidePresidency: (requestId, decision, justification) =>
        setState((s) => ({
          ...s,
          requests: s.requests.map((r) => {
            if (r.id !== requestId) return r
            const entry = {
              stage: 1 as const,
              decision,
              by: currentProfile.name,
              byRole: currentProfile.roleLabel,
              at: new Date().toISOString(),
              justification,
            }
            const base: ExpenseRequest = {
              ...r,
              stageHistory: [...r.stageHistory, entry],
              presidenciaDecision: entry,
            }
            if (decision === 'aprovado') {
              return {
                ...base,
                status: 'aguardando_financeiro' as const,
                currentStage: 2 as const,
                authorizedBy: currentProfile.name,
                authorizedAt: entry.at,
              }
            }
            if (decision === 'reprovado') {
              return { ...base, status: 'recusado' as const, rejectionReason: justification }
            }
            return {
              ...base,
              status: 'devolvido' as const,
              currentStage: 1 as const,
              returnedBy: currentProfile.name,
              returnedAt: entry.at,
              rejectionReason: justification,
            }
          }),
        })),
      decideFinance: (requestId, decision, planning, justification) =>
        setState((s) => ({
          ...s,
          requests: s.requests.map((r) => {
            if (r.id !== requestId) return r
            const entry = {
              stage: 2 as const,
              decision,
              by: currentProfile.name,
              byRole: currentProfile.roleLabel,
              at: new Date().toISOString(),
              justification,
            }
            const base: ExpenseRequest = {
              ...r,
              stageHistory: [...r.stageHistory, entry],
              financeDecision: entry,
            }
            if (decision === 'aprovado') {
              return {
                ...base,
                status: 'aguardando_pagamento' as const,
                paymentPlanning: planning
                  ? {
                      plannedBy: currentProfile.name,
                      plannedAt: entry.at,
                      paymentMethod: planning.paymentMethod as PaymentPlanning['paymentMethod'],
                      expectedDate: planning.expectedDate,
                      notes: planning.notes,
                    }
                  : undefined,
              }
            }
            if (decision === 'reprovado') {
              return { ...base, status: 'recusado' as const, rejectionReason: justification }
            }
            return {
              ...base,
              status: 'devolvido' as const,
              currentStage: 1 as const,
              returnedBy: currentProfile.name,
              returnedAt: entry.at,
              rejectionReason: justification,
            }
          }),
        })),
      payRequest: (requestId, info) =>
        patchRequest(requestId, {
          status: 'pago',
          paymentInfo: {
            paidBy: currentProfile.name,
            paidAt: new Date().toISOString(),
            paymentMethod: info.paymentMethod as PaymentPlanning['paymentMethod'],
            referenceCode: info.referenceCode,
            notes: info.notes,
          },
        }),
      castFiscalVote: (periodId, decision, justification) =>
        setState((s) => ({
          ...s,
          fiscalPeriods: s.fiscalPeriods.map((p) =>
            p.id === periodId
              ? {
                  ...p,
                  votes: {
                    ...p.votes,
                    [currentProfile.role]: {
                      councilMemberId: currentProfile.role,
                      councilMemberName: currentProfile.name,
                      decision,
                      justification,
                      votedAt: new Date().toISOString(),
                    },
                  },
                }
              : p,
          ),
        })),
      updateFiscalQuarterPlan: (plan) => setState((s) => ({ ...s, fiscalQuarterPlan: plan })),
      upsertFiscalMark: (mark) =>
        setState((s) => {
          const existing = s.fiscalMarks.find(
            (m) => m.targetId === mark.targetId && m.targetType === mark.targetType,
          )
          if (existing) {
            return {
              ...s,
              fiscalMarks: s.fiscalMarks.map((m) =>
                m.id === existing.id ? { ...m, ...mark, markedAt: new Date().toISOString() } : m,
              ),
            }
          }
          return {
            ...s,
            fiscalMarks: [
              ...s.fiscalMarks,
              { ...mark, id: nextId('fmark'), markedAt: new Date().toISOString() },
            ],
          }
        }),
      removeFiscalMark: (markId) =>
        setState((s) => ({
          ...s,
          fiscalMarks: s.fiscalMarks.filter((m) => m.id !== markId),
        })),
      respondFiscalMark: (markId, message) =>
        setState((s) => ({
          ...s,
          fiscalMarks: s.fiscalMarks.map((m) =>
            m.id === markId
              ? {
                  ...m,
                  boardResponse: {
                    respondedBy: currentProfile.name,
                    respondedByRole: currentProfile.roleLabel,
                    respondedAt: new Date().toISOString(),
                    message,
                  },
                }
              : m,
          ),
        })),
      resetAllData: () => setState(resetDemoState()),
      canAuthorizeAndPay: [
        'presidencia',
        'presidencia_substituto',
        'financas',
        'financas_substituto',
      ].includes(currentProfile.role),
      canManageActions: ['diretoria'].includes(currentProfile.role),
      isFiscalMember: currentProfile.role.startsWith('conselho_fiscal'),
      isPresidency: ['presidencia', 'presidencia_substituto'].includes(currentProfile.role),
      isFinance: ['financas', 'financas_substituto'].includes(currentProfile.role),
    }
  }, [state])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp deve ser usado dentro de AppProvider')
  return ctx
}
