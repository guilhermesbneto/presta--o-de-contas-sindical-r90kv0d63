import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppProvider } from '@/context/AppContext'
import Layout from './components/Layout'

import EntryPage from './pages/EntryPage'
import OverviewPage from './pages/OverviewPage'
import ActionsPage from './pages/ActionsPage'
import RequestsPage from './pages/RequestsPage'
import AuthorizationPaymentPage from './pages/AuthorizationPaymentPage'
import FiscalCouncilPage from './pages/FiscalCouncilPage'
import AccountabilityPage from './pages/AccountabilityPage'
import NotFound from './pages/NotFound'

const App = () => (
  <BrowserRouter>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<EntryPage />} />
            <Route path="/visao-geral" element={<OverviewPage />} />
            <Route path="/acoes" element={<ActionsPage />} />
            <Route path="/solicitacoes" element={<RequestsPage />} />
            <Route path="/autorizacao-pagamento" element={<AuthorizationPaymentPage />} />
            <Route path="/conselho-fiscal" element={<FiscalCouncilPage />} />
            <Route path="/prestacao-contas" element={<AccountabilityPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppProvider>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
