import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  UserProfile,
  ExpenseRequest,
  DirectoriaAction,
  ActionMovement,
  FiscalAccountPeriod,
  RoleType,
  FiscalDecision,
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
  addRequest: (req: Omit<ExpenseRequest, 'id' | 'createdAt' | 'status'>) => void
  authorizeRequest: (id: string, notes?: string) => void
  rejectRequest: (id: string, reason: string) => void
  payRequest: (
    id: string,
    paymentData: {
      paymentMethod: 'Pix' | 'Transferência Bancária' | 'Cheque Nominal' | 'Dinheiro / Caixa'
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
  canManageActions: boolean
  canVoteFiscal: boolean
  isFiscalMember: boolean
  resetAllData: () => void
}

const STORAGE_KEYS = {
  PROFILE: 'sindicato_current_profile',
  REQUESTS: 'sindicato_requests_v1',
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
  // APENAS Presidência e Finanças (ou seus substitutos) podem autorizar e efetuar pagamentos.
  const canAuthorizeAndPay = [
    'presidencia',
    'presidencia_substituto',
    'financas',
    'financas_substituto',
  ].includes(currentProfile.role)

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

  // Request actions
  const addRequest = (req: Omit<ExpenseRequest, 'id' | 'createdAt' | 'status'>) => {
    const newReq: ExpenseRequest = {
      ...req,
      id: `req-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'pendente',
    }
    setRequests((prev) => [newReq, ...prev])
  }

  const authorizeRequest = (id: string, notes?: string) => {
    if (!canAuthorizeAndPay) return
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'autorizado',
              authorizedBy: `${currentProfile.name} (${currentProfile.roleLabel})`,
              authorizedAt: new Date().toISOString(),
            }
          : r,
      ),
    )
  }

  const rejectRequest = (id: string, reason: string) => {
    if (!canAuthorizeAndPay) return
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'recusado',
              rejectionReason: reason,
              authorizedBy: `${currentProfile.name} (${currentProfile.roleLabel})`,
              authorizedAt: new Date().toISOString(),
            }
          : r,
      ),
    )
  }

  const payRequest = (
    id: string,
    paymentData: {
      paymentMethod: 'Pix' | 'Transferência Bancária' | 'Cheque Nominal' | 'Dinheiro / Caixa'
      referenceCode?: string
      notes?: string
    },
  ) => {
    if (!canAuthorizeAndPay) return
    let targetReq: ExpenseRequest | undefined

    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          targetReq = r
          return {
            ...r,
            status: 'pago',
            paymentInfo: {
              paidBy: `${currentProfile.name} (${currentProfile.roleLabel})`,
              paidAt: new Date().toISOString(),
              ...paymentData,
            },
          }
        }
        return r
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
        authorizeRequest,
        rejectRequest,
        payRequest,
        actions,
        addAction,
        updateActionStatus,
        movements,
        addMovement,
        fiscalPeriods,
        castFiscalVote,
        canAuthorizeAndPay,
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
