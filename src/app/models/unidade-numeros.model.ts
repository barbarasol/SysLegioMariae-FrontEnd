/** Campos idênticos às colunas da tabela legio.unidade_numeros. */
export const CAMPOS_NUMEROS = [
  'qtd_senatus', 'qtd_regiae', 'qtd_comitia', 'qtd_comitia_juv',
  'qtd_curiae', 'qtd_curiae_juv', 'qtd_praesidia', 'qtd_praesidia_juv',
  'qtd_velites', 'qtd_praticios', 'qtd_pretorianos', 'qtd_adjutores',
  'qtd_ativos_com_promessa', 'qtd_ativos_sem_promessa',
  'qtd_auxiliares_permanentes', 'qtd_auxiliares_provisorios',
  'qtd_mescs', 'qtd_catequistas', 'qtd_coroinhas',
  'qtd_praesidia_total', 'qtd_igrejas_com_legiao',
  'qtd_igrejas_sem_legiao'
] as const;

export type CampoNumero = typeof CAMPOS_NUMEROS[number];

export type ValoresNumerosUnidade = Record<CampoNumero, number | null>;

export interface RegistroNumerosUnidade extends ValoresNumerosUnidade {
  id: string;
  unidade_id: string;
  ano: number;
  mes: number;
  status: 'RASCUNHO' | 'CONFIRMADO';
  origem: 'MANUAL' | 'VIRADA_ANO';
  copiado_de_id: string | null;
  confirmado_em: string | null;
  confirmado_por_usuario_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PermissoesNumerosUnidade {
  editar: boolean;
  reabrir: boolean;
}

export const GRUPOS_NUMEROS: Array<{
  titulo: string;
  descricao: string;
  campos: Array<{ chave: CampoNumero; titulo: string }>;
}> = [
  {
    titulo: 'Estrutura legionária',
    descricao: 'Conselhos, praesidia e unidades juvenis.',
    campos: [
      { chave: 'qtd_senatus', titulo: 'Senatus' },
      { chave: 'qtd_regiae', titulo: 'Regiae' },
      { chave: 'qtd_comitia', titulo: 'Comitia' },
      { chave: 'qtd_comitia_juv', titulo: 'Comitia juvenis' },
      { chave: 'qtd_curiae', titulo: 'Curiae' },
      { chave: 'qtd_curiae_juv', titulo: 'Curiae juvenis' },
      { chave: 'qtd_praesidia', titulo: 'Praesidia' },
      { chave: 'qtd_praesidia_juv', titulo: 'Praesidia juvenis' },
      { chave: 'qtd_praesidia_total', titulo: 'Praesidia — total informado' }
    ]
  },
  {
    titulo: 'Membros legionários',
    descricao: 'Quantitativos de membros, auxiliares e grupos.',
    campos: [
      { chave: 'qtd_ativos_com_promessa', titulo: 'Ativos com promessa' },
      { chave: 'qtd_ativos_sem_promessa', titulo: 'Ativos sem promessa' },
      { chave: 'qtd_auxiliares_permanentes', titulo: 'Auxiliares permanentes' },
      { chave: 'qtd_auxiliares_provisorios', titulo: 'Auxiliares provisórios' },
      { chave: 'qtd_pretorianos', titulo: 'Pretorianos' },
      { chave: 'qtd_adjutores', titulo: 'Adjutores' },
      { chave: 'qtd_velites', titulo: 'Velites' },
      { chave: 'qtd_praticios', titulo: 'Patrícios' }
    ]
  },
  {
    titulo: 'Apostolado e igrejas',
    descricao: 'Atividades e abrangência nas comunidades.',
    campos: [
      { chave: 'qtd_mescs', titulo: 'MESCEs' },
      { chave: 'qtd_catequistas', titulo: 'Catequistas' },
      { chave: 'qtd_coroinhas', titulo: 'Coroinhas' },
      { chave: 'qtd_igrejas_com_legiao', titulo: 'Igrejas com Legião' },
      { chave: 'qtd_igrejas_sem_legiao', titulo: 'Igrejas sem Legião' }
    ]
  }
];

/** null significa não informado; zero significa quantidade efetivamente igual a zero. */
export function criarValoresVazios(): ValoresNumerosUnidade {
  const campos = Object.fromEntries(
    CAMPOS_NUMEROS.map(chave => [chave, null])
  ) as Record<CampoNumero, null>;
  return campos;
}

export function extrairValores(registro: RegistroNumerosUnidade): ValoresNumerosUnidade {
  const valores = criarValoresVazios();
  for (const campo of CAMPOS_NUMEROS) valores[campo] = registro[campo];
  return valores;
}
