export interface CriarUsuarioRequest {
  nome: string;
  email: string;
  senha: string;
  nomePreferido?: string | null;
  cpf?: string | null;
  celular?: string | null;
  perfilCodigo: string;
}

export interface UsuarioCriadoResponse {
  usuario: {
    id: string;
    email: string;
    status: string;
  };
  pessoa: {
    id: string;
    nome: string;
    nomePreferido: string | null;
  };
  perfisGlobais: string[];
}

export interface PerfilDisponivel {
  codigo: string;
  nome: string;
  escopo: 'GLOBAL' | 'UNIDADE';
}
