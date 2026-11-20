import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  UserProfile,
  ExpenseRequest,
  DirectoriaAction,
  ActionMovement,
  FiscalAccountPeriod,
  RoleType,
  FiscalDecision,
  PaymentPlanningMethod,
  StageReview,
} from '@/types'
import {
  DEMO_PROFILES,
  INITIAL_ACTIONS,
  INITIAL_MOVEMENTS,
  INITIAL_REQUESTS,
  INITIAL_FISCAL_PERIODS,
} from '@/data/initialData'

interface AppContextType {
  currentProfile: UserProfile
  setCurrentProfile: (profile: UserProfile) => void
  profiles: UserProfile[]

  // Requests
  requests: ExpenseRequest[]
  addRequest: (
    req: Omit<ExpenseRequest, 'id' | 'createdAt' | 'status' | 'currentStage' | 'stageHistory'>,
  ) => void
  /** Etapa 1: decisão da Presidência (ou substituto) sobre o pedido */
  decidePresidency: (id: string, decision: StageReview['decision'], justification?: string) => void
  /** Etapa 2: Financeiro planeja o pagamento e decide (aprovar/reprovar/devolver) */
  decideFinance: (
    id: string,
    decision: StageReview['decision'],
    planning: {
      paymentMethod: PaymentPlanningMethod
      expectedDate: string
      notes?: string
    },
    justification?: string,
  ) => void
  /** Solicitante corrige e reenvia pedido devolvido — reinicia na Etapa 1 */
  resubmitRequest: (
    id: string,
    updates: Partial<
      Pick<ExpenseRequest, 'amount' | 'reason' | 'category' | 'receiptName' | 'actionId' | 'type'>
    >,
  ) => void
  /** Liquidação do pagamento pelo Financeiro — exige aprovação das duas etapas */
  payRequest: (
    id: string,
    paymentData: {
      paymentMethod: PaymentPlanningMethod
      referenceCode?: string
      notes?: string
    },
  ) => void

  // Actions
  actions: DirectoriaAction[]
  addAction: (action: Omit<DirectoriaAction, 'id' | 'spent'>) => void
  updateActionStatus: (id: string, status: DirectoriaAction['status']) => void

  // Movements
  movements: ActionMovement[]
  addMovement: (movement: Omit<ActionMovement, 'id'>) => void

  // Fiscal Council
  fiscalPeriods: FiscalAccountPeriod[]
  castFiscalVote: (periodId: string, decision: FiscalDecision, justification: string) => void

  // Permissions helpers
  canAuthorizeAndPay: boolean
  isPresidency: boolean
  isFinance: boolean
  canManageActions: boolean
  canVoteFiscal: boolean
  isFiscalMember: boolean
  resetAllData: () => void
}

const STORAGE_KEYS = {
  PROFILE: 'sindicato_current_profile',
  // v2: fluxo de autorização em duas etapas (formato de ExpenseRequest mudou)
  REQUESTS: 'sindicato_requests_v2',
  ACTIONS: 'sindicato_actions_v1',
  MOVEMENTS: 'sindicato_movements_v1',
  FISCAL: 'sindicato_fiscal_v1',
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentProfile, setCurrentProfileState] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const found = DEMO_PROFILES.find((p) => p.id === parsed.id)
        if (found) return found
      } catch (e) {
        console.error(e)
      }
    }
    return DEMO_PROFILES[0] // Default: Presidente
  })

  const [requests, setRequests] = useState<ExpenseRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REQUESTS)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error(e)
      }
    }
    return INITIAL_REQUESTS
  })

  const [actions, setActions] = useState<DirectoriaAction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIONS)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error(e)
      }
    }
    return INITIAL_ACTIONS
  })

  const [movements, setMovements] = useState<ActionMovement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MOVEMENTS)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error(e)
      }
    }
    return INITIAL_MOVEMENTS
  })

  const [fiscalPeriods, setFiscalPeriods] = useState<FiscalAccountPeriod[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FISCAL)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error(e)
      }
    }
    return INITIAL_FISCAL_PERIODS
  })

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(currentProfile))
  }, [currentProfile])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests))
  }, [requests])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIONS, JSON.stringify(actions))
  }, [actions])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements))
  }, [movements])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FISCAL, JSON.stringify(fiscalPeriods))
  }, [fiscalPeriods])

  const setCurrentProfile = (profile: UserProfile) => {
    setCurrentProfileState(profile)
  }

  // Permission logic according to union rules:
  // APENAS Presidência e Finanças (ou seus substitutos) acessam a mesa de trabalho.
  const canAuthorizeAndPay = [
    'presidencia',
    'presidencia_substituto',
    'financas',
    'financas_substituto',
  ].includes(currentProfile.role)

  // Etapa 1: somente Presidência (ou substituto) decide
  const isPresidency = ['presidencia', 'presidencia_substituto'].includes(currentProfile.role)

  // Etapa 2: somente Finanças (ou substituto) planeja/decide e liquida o pagamento
  const isFinance = ['financas', 'financas_substituto'].includes(currentProfile.role)

  // A diretoria executa e gerencia as ações (Presidência e Finanças também compõem a Diretoria Executiva)
  const canManageActions = [
    'diretoria',
    'presidencia',
    'presidencia_substituto',
    'financas',
    'financas_substituto',
  ].includes(currentProfile.role)

  // Os 3 conselheiros fiscais podem aprovar, aprovar com ressalva ou reprovar as contas
  const isFiscalMember = ['conselho_fiscal_1', 'conselho_fiscal_2', 'conselho_fiscal_3'].includes(
    currentProfile.role,
  )

  const canVoteFiscal = isFiscalMember

  const whoAmI = `${currentProfile.name} (${currentProfile.roleLabel})`

  // Request actions
  const addRequest = (
    req: Omit<ExpenseRequest, 'id' | 'createdAt' | 'status' | 'currentStage' | 'stageHistory'>,
  ) => {
    const newReq: ExpenseRequest = {
      ...req,
      id: `req-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'pendente',
      currentStage: 1,
      stageHistory: [],
    }
    setRequests((prev) => [newReq, ...prev])
  }

  const buildStageReview = (
    decision: StageReview['decision'],
    justification?: string,
  ): StageReview => ({
    stage: isPresidency ? 1 : 2,
    decision,
    by: whoAmI,
    byRole: currentProfile.roleLabel,
    at: new Date().toISOString(),
    justification: justification?.trim() || undefined,
  })

  // Etapa 1 — Presidência: aprovar (segue ao Financeiro), reprovar ou devolver p/ correção
  const decidePresidency = (
    id: string,
    decision: StageReview['decision'],
    justification?: string,
  ) => {
    if (!isPresidency) return
    if (decision !== 'aprovado' && !justification?.trim()) return

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        // Guarda: só age sobre pedidos que estão na Etapa 1
        if (r.currentStage !== 1 || r.status !== 'pendente') return r

        const review = buildStageReview(decision, justification)

        if (decision === 'aprovado') {
          return {
            ...r,
            status: 'aguardando_financeiro',
            currentStage: 2,
            presidenciaDecision: review,
            stageHistory: [...r.stageHistory, review],
            authorizedBy: review.by, // compatibilidade: primeira autorização
            authorizedAt: review.at,
            rejectionReason: undefined,
            returnedBy: undefined,
            returnedAt: undefined,
          }
        }

        if (decision === 'devolvido') {
          return {
            ...r,
            status: 'devolvido',
            currentStage: 1,
            presidenciaDecision: review,
            stageHistory: [...r.stageHistory, review],
            rejectionReason: justification?.trim(),
            returnedBy: review.by,
            returnedAt: review.at,
          }
        }

        // reprovado
        return {
          ...r,
          status: 'recusado',
          currentStage: 1,
          presidenciaDecision: review,
          stageHistory: [...r.stageHistory, review],
          rejectionReason: justification?.trim(),
        }
      }),
    )
  }

  // Etapa 2 — Financeiro: planeja o pagamento e decide; liquidação só depois de ambos aprovarem
  const decideFinance = (
    id: string,
    decision: StageReview['decision'],
    planning: {
      paymentMethod: PaymentPlanningMethod
      expectedDate: string
      notes?: string
    },
    justification?: string,
  ) => {
    if (!isFinance) return
    if (decision !== 'aprovado' && !justification?.trim()) return

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        // Guarda: só age sobre pedidos na Etapa 2
        if (r.currentStage !== 2 || r.status !== 'aguardando_financeiro') return r

        const review = buildStageReview(decision, justification)
        const planningData = {
          plannedBy: whoAmI,
          plannedAt: new Date().toISOString(),
          paymentMethod: planning.paymentMethod,
          expectedDate: planning.expectedDate,
          notes: planning.notes?.trim() || undefined,
        }

        if (decision === 'aprovado') {
          // Ambos aprovaram → pronto para liquidação
          return {
            ...r,
            status: 'aguardando_pagamento',
            currentStage: 2,
            financeDecision: review,
            paymentPlanning: planningData,
            stageHistory: [...r.stageHistory, review],
            rejectionReason: undefined,
            returnedBy: undefined,
            returnedAt: undefined,
          }
        }

        if (decision === 'devolvido') {
          return {
            ...r,
            status: 'devolvido',
            currentStage: 1,
            financeDecision: review,
            stageHistory: [...r.stageHistory, review],
            rejectionReason: justification?.trim(),
            returnedBy: review.by,
            returnedAt: review.at,
          }
        }

        // reprovado
        return {
          ...r,
          status: 'recusado',
          currentStage: 2,
          financeDecision: review,
          stageHistory: [...r.stageHistory, review],
          rejectionReason: justification?.trim(),
        }
      }),
    )
  }

  // Solicitante corrige e reenvia pedido devolvido — reinicia na Etapa 1 (Presidência)
  const resubmitRequest = (
    id: string,
    updates: Partial<
      Pick<ExpenseRequest, 'amount' | 'reason' | 'category' | 'receiptName' | 'actionId' | 'type'>
    >,
  ) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        // Guarda: apenas o próprio solicitante, apenas pedidos devolvidos
        if (r.applicantId !== currentProfile.id) return r
        if (r.status !== 'devolvido') return r

        return {
          ...r,
          ...updates,
          status: 'pendente',
          currentStage: 1,
          rejectionReason: undefined,
          returnedBy: undefined,
          returnedAt: undefined,
          // Reinicia o fluxo: decisões anteriores ficam no histórico; decisões correntes são limpas
          presidenciaDecision: undefined,
          financeDecision: undefined,
        }
      }),
    )
  }

  // Liquidação — somente Financeiro e somente quando presidente E financeiro aprovaram
  const payRequest = (
    id: string,
    paymentData: {
      paymentMethod: PaymentPlanningMethod
      referenceCode?: string
      notes?: string
    },
  ) => {
    if (!isFinance) return

    let targetReq: ExpenseRequest | undefined

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        // Guarda: exige aprovação da Presidência (etapa 1) E do Financeiro (etapa 2)
        const bothApproved =
          r.presidenciaDecision?.decision === 'aprovado' &&
          r.financeDecision?.decision === 'aprovado'
        if (!bothApproved || r.status !== 'aguardando_pagamento') return r

        targetReq = r
        return {
          ...r,
          status: 'pago',
          paymentInfo: {
            paidBy: whoAmI,
            paidAt: new Date().toISOString(),
            ...paymentData,
          },
        }
      }),
    )

    // Automatically generate a movement for the action if action is linked, or general
    if (targetReq) {
      const newMovement: ActionMovement = {
        id: `mov-pay-${Date.now()}`,
        actionId: targetReq.actionId || 'geral',
        type: 'despesa',
        category: targetReq.category || 'Ressarcimento / Adiantamento',
        description: `Pgto ${targetReq.type === 'adiantamento' ? 'Adiantamento' : 'Ressarcimento'}: ${targetReq.reason} (${targetReq.applicantName})`,
        amount: targetReq.amount,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: paymentData.paymentMethod,
      }
      setMovements((prev) => [newMovement, ...prev])

      // If linked to an action, update its spent total
      if (targetReq.actionId && targetReq.actionId !== 'geral') {
        setActions((prev) =>
          prev.map((act) =>
            act.id === targetReq?.actionId ? { ...act, spent: act.spent + targetReq.amount } : act,
          ),
        )
      }
    }
  }

  // Action methods
  const addAction = (actionData: Omit<DirectoriaAction, 'id' | 'spent'>) => {
    const newAction: DirectoriaAction = {
      ...actionData,
      id: `act-${Date.now()}`,
      spent: 0,
    }
    setActions((prev) => [newAction, ...prev])
  }

  const updateActionStatus = (id: string, status: DirectoriaAction['status']) => {
    setActions((prev) => prev.map((act) => (act.id === id ? { ...act, status } : act)))
  }

  // Movement methods
  const addMovement = (movementData: Omit<ActionMovement, 'id'>) => {
    const newMovement: ActionMovement = {
      ...movementData,
      id: `mov-${Date.now()}`,
    }
    setMovements((prev) => [newMovement, ...prev])

    // Update action spent if it is a despesa and linked to action
    if (
      newMovement.type === 'despesa' &&
      newMovement.actionId &&
      newMovement.actionId !== 'geral'
    ) {
      setActions((prev) =>
        prev.map((act) =>
          act.id === newMovement.actionId ? { ...act, spent: act.spent + newMovement.amount } : act,
        ),
      )
    }
  }

  // Fiscal vote
  const castFiscalVote = (periodId: string, decision: FiscalDecision, justification: string) => {
    if (!canVoteFiscal) return
    const memberRole = currentProfile.role as
      | 'conselho_fiscal_1'
      | 'conselho_fiscal_2'
      | 'conselho_fiscal_3'

    setFiscalPeriods((prev) =>
      prev.map((period) => {
        if (period.id !== periodId) return period

        const updatedVotes = {
          ...period.votes,
          [memberRole]: {
            councilMemberId: memberRole,
            councilMemberName: currentProfile.name,
            decision,
            justification,
            votedAt: new Date().toISOString(),
          },
        }

        // Check if all 3 have voted to calculate overall status
        const voteCount = Object.keys(updatedVotes).length
        let finalStatus = period.status

        if (voteCount === 3) {
          const decisions = Object.values(updatedVotes).map((v) => v.decision)
          const rejectedCount = decisions.filter((d) => d === 'reprovado').length
          const withCaveatsCount = decisions.filter((d) => d === 'aprovado_com_ressalva').length

          if (rejectedCount >= 2) {
            finalStatus = 'reprovada'
          } else if (rejectedCount === 1 || withCaveatsCount >= 1) {
            finalStatus = 'aprovada_com_ressalvas'
          } else {
            finalStatus = 'aprovada'
          }
        }

        return {
          ...period,
          votes: updatedVotes,
          status: finalStatus,
        }
      }),
    )
  }

  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEYS.REQUESTS)
    localStorage.removeItem(STORAGE_KEYS.ACTIONS)
    localStorage.removeItem(STORAGE_KEYS.MOVEMENTS)
    localStorage.removeItem(STORAGE_KEYS.FISCAL)
    localStorage.removeItem(STORAGE_KEYS.PROFILE)
    setRequests(INITIAL_REQUESTS)
    setActions(INITIAL_ACTIONS)
    setMovements(INITIAL_MOVEMENTS)
    setFiscalPeriods(INITIAL_FISCAL_PERIODS)
    setCurrentProfileState(DEMO_PROFILES[0])
  }

  return (
    <AppContext.Provider
      value={{
        currentProfile,
        setCurrentProfile,
        profiles: DEMO_PROFILES,
        requests,
        addRequest,
        decidePresidency,
        decideFinance,
        resubmitRequest,
        payRequest,
        actions,
        addAction,
        updateActionStatus,
        movements,
        addMovement,
        fiscalPeriods,
        castFiscalVote,
        canAuthorizeAndPay,
        isPresidency,
        isFinance,
        canManageActions,
        canVoteFiscal,
        isFiscalMember,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
