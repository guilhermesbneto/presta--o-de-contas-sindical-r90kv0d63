/** Shared masked values for demo personal data ( CPF / conta / chave Pix / e-mail). */
export const DEMO_SENSITIVE = {
  cpf: '245.678.901-33',
  conta: '98765432-1 Ag. 0045 (Banco Santander)',
  pixKey: '245.678.901-33',
  email: 'carlos.silveira@sindicato.org.br',
  telefone: '(11) 98877-1234',
}

export const MASKED = {
  cpf: '•••.456.789-••',
  conta: 'Conta ••••1',
  pixKey: '•••.•••.•••-••',
  email: 'c••••••••@•••••••.org.br',
  telefone: '(••) •••••-••••',
}

export function maskCpf(cpf: string): string {
  if (!cpf) return cpf
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return '•••.•••.•••-••'
  return `•••.${digits.slice(3, 6)}.${digits.slice(6, 9)}-••`
}

export function maskAccount(acc: string): string {
  if (!acc) return acc
  return `Conta ••••${acc.slice(-1)}`
}
