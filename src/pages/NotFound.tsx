import React from 'react'
import { Link } from 'react-router-dom'
import { Home, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">Página não encontrada</h1>
      <p className="text-sm text-muted-foreground max-w-md">
        A tela que você tentou acessar não existe ou foi movida. Retorne para a página inicial ou
        para a visão geral.
      </p>
      <div className="flex gap-2">
        <Button asChild size="sm">
          <Link to="/">
            <Home className="w-4 h-4 mr-2" />
            Tela de Entrada
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/visao-geral">Visão Geral</Link>
        </Button>
      </div>
    </div>
  )
}
