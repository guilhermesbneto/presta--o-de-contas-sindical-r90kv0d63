import React from 'react'
import { Link } from 'react-router-dom'
import { Building2, ShieldCheck, HeartHandshake } from 'lucide-react'

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t bg-muted/40 py-6 text-xs text-muted-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground">Prestação de Contas Sindical</span>
          <span>&bull;</span>
          <span>Transparência ativa para filiados e colaboradores</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Auditado pelo Conselho Fiscal
          </span>
          <span className="flex items-center gap-1 text-[11px]">
            <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
            Terceiro Setor
          </span>
          <Link to="/" className="text-primary hover:underline">
            Trocar Perfil Demo
          </Link>
        </div>
      </div>
    </footer>
  )
}
