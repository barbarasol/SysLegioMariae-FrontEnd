export interface CriarUsuarioRequest {
  nome: string;
  email: string;
  senha: string;
  nomePreferido?: string | null;
  cpf?: string | null;
  celular?: string | null;
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

export interface UsuarioLista {
  id: string;
  pessoaId: string;
  nome: string;
  nomePreferido: string | null;
  cpf: string | null;
  celular: string | null;
  email: string;
  status: string;
  perfisGlobais: string[];
}

export interface AtualizarUsuarioRequest {
  nome: string;
  nomePreferido?: string | null;
  cpf?: string | null;
  celular?: string | null;
  email: string;
  status: string;
  /*
   * Opcional:
   * null ou '' = usuário sem perfil GLOBAL.
   */
  perfilCodigo?: string | null;
}

export interface PerfilDisponivel {
  id?: string;
  codigo: string;
  nome: string;
  escopo: 'GLOBAL' | 'UNIDADE';
  descricao?: string | null;
}

export interface UnidadeDisponivel {
  id: string;
  nome: string;
  nomeReduzido: string | null;
  tipoCodigo: string;
  tipoNome: string;
  statusAprovacao: string;
}

export interface AcessoUnidade {
  usuarioId: string;
  unidadeId: string;
  unidadeNome: string;
  unidadeNomeReduzido: string | null;
  unidadeTipoCodigo: string;
  unidadeTipoNome: string;
  unidadeStatusAprovacao: string;
  perfilId: string;
  perfilCodigo: string;
  perfilNome: string;
  concedidoEm: string | null;
}

export interface SalvarAcessoUnidadeRequest {
  unidadeId: string;
  perfilCodigo: string;
  observacao?: string | null;
}
