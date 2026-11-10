import type { IndicadoresEstrutura, UnidadeEstrutura } from '../services/cadastro-unidade.service';

export const COLUNAS_ESTRUTURA = [
  { rotulo: 'COM.', chave: 'qtd_comitia' },
  { rotulo: 'CURIAE', chave: 'qtd_curiae' },
  { rotulo: 'CUR JUV', chave: 'qtd_curiae_juv' },
  { rotulo: 'PRAE', chave: 'qtd_praesidia' },
  { rotulo: 'PRAE JUV', chave: 'qtd_praesidia_juv' },
  { rotulo: 'VELI', chave: 'qtd_velites' },
  { rotulo: 'PATRI', chave: 'qtd_praticios' },
  { rotulo: 'PRET', chave: 'qtd_pretorianos' },
  { rotulo: 'ADJU', chave: 'qtd_adjutores' },
  { rotulo: 'ATIVOS', chave: 'ativos' },
  { rotulo: 'AUXI', chave: 'auxi' },
  { rotulo: 'MESC', chave: 'qtd_mescs' },
  { rotulo: 'CATE', chave: 'qtd_catequistas' },
  { rotulo: 'CORO', chave: 'qtd_coroinhas' },
  { rotulo: 'Tot Praesidia', chave: 'qtd_praesidia_total' }
] as const;

export type ChaveColunaEstrutura = typeof COLUNAS_ESTRUTURA[number]['chave'];
export type ValoresEstrutura = Record<ChaveColunaEstrutura, number | null>;
export type UnidadeLinhaTabela = UnidadeEstrutura & { nivel: number };

export interface LinhaTabelaConsolidada {
  chave: string;
  tipo: 'unidade' | 'subtotal' | 'geral';
  unidade?: UnidadeLinhaTabela;
  uf?: string;
  valores: ValoresEstrutura;
  fontes?: number;
}

const NIVEIS_GERAIS = new Set(['CONCILIUM', 'SENATUS', 'REGIA']);

export function valorIndicador(numeros: IndicadoresEstrutura | null | undefined, chave: ChaveColunaEstrutura): number | null {
  if (!numeros) return null;
  if (chave === 'ativos') return somarInformados(numeros.qtd_ativos_com_promessa, numeros.qtd_ativos_sem_promessa);
  if (chave === 'auxi') return somarInformados(numeros.qtd_auxiliares_permanentes, numeros.qtd_auxiliares_provisorios);
  return numeros[chave] ?? null;
}

function somarInformados(a: number | null, b: number | null): number | null {
  if (a == null && b == null) return null;
  return (a ?? 0) + (b ?? 0);
}

export function valoresUnidade(numeros: IndicadoresEstrutura | null | undefined): ValoresEstrutura {
  return Object.fromEntries(COLUNAS_ESTRUTURA.map(c => [c.chave, valorIndicador(numeros, c.chave)])) as ValoresEstrutura;
}

function somarValores(fontes: Array<{ valores: ValoresEstrutura }>): ValoresEstrutura {
  return Object.fromEntries(COLUNAS_ESTRUTURA.map(({ chave }) => {
    const informados = fontes.map(f => f.valores[chave]).filter((v): v is number => v != null);
    return [chave, informados.length ? informados.reduce((a, b) => a + b, 0) : null];
  })) as ValoresEstrutura;
}

export function ufUnidade(unidade: UnidadeEstrutura): string {
  return (unidade.ufSigla || unidade.estadoRegiao || 'UF não informada').trim().toUpperCase();
}

/**
 * O cadastro numérico de um conselho pode conter os totais de suas unidades
 * filiadas. Para subtotalizar por UF, selecionamos uma 'fronteira' de registros:
 * - desprezamos a Regia/Senatus/Concilium, que normalmente abrange várias UFs;
 * - dentre os demais relatórios, não somamos filho já coberto por antepassado
 *   com registro na mesma UF.
 * O critério é aplicado sobre as linhas visíveis, respeitando os filtros.
 */
export function fontesIndependentesPorUf(
  unidades: UnidadeLinhaTabela[],
  todasUnidades: UnidadeEstrutura[],
  uf: string
): UnidadeLinhaTabela[] {
  const candidatos = unidades.filter(u =>
    ufUnidade(u) === uf && !!u.numeros && !NIVEIS_GERAIS.has(u.tipo)
  );
  const ids = new Set(candidatos.map(u => u.id));
  const porId = new Map(todasUnidades.map(u => [u.id, u]));
  return candidatos.filter(u => {
    const visitados = new Set<string>([u.id]);
    let superior = u.unidadeSuperiorId;
    while (superior && !visitados.has(superior)) {
      if (ids.has(superior)) return false;
      visitados.add(superior);
      superior = porId.get(superior)?.unidadeSuperiorId ?? null;
    }
    return true;
  });
}

export function montarLinhasConsolidadas(
  linhas: UnidadeLinhaTabela[],
  todasUnidades: UnidadeEstrutura[],
  ordenacao: 'estado' | 'hierarquia'
): LinhaTabelaConsolidada[] {
  const dados = linhas.map(unidade => ({
    chave: `u-${unidade.id}`,
    tipo: 'unidade' as const,
    unidade,
    valores: valoresUnidade(unidade.numeros)
  }));
  const ufs = [...new Set(linhas.map(ufUnidade))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const subtotalPorUf = new Map<string, LinhaTabelaConsolidada>();
  for (const uf of ufs) {
    const fontes = fontesIndependentesPorUf(linhas, todasUnidades, uf);
    subtotalPorUf.set(uf, {
      chave: `subtotal-${uf}`, tipo: 'subtotal', uf,
      fontes: fontes.length,
      valores: somarValores(fontes.map(u => ({ valores: valoresUnidade(u.numeros) })))
    });
  }
  const resultado: LinhaTabelaConsolidada[] = [];
  if (ordenacao === 'estado') {
    for (const uf of ufs) {
      resultado.push(...dados.filter(l => ufUnidade(l.unidade) === uf));
      const subtotal = subtotalPorUf.get(uf);
      if (subtotal) resultado.push(subtotal);
    }
  } else {
    resultado.push(...dados);
    for (const subtotal of subtotalPorUf.values()) resultado.push(subtotal);
  }
  if (ufs.length > 1) {
    resultado.push({
      chave: 'total-geral-ufs', tipo: 'geral', fontes: [...subtotalPorUf.values()].reduce((a, b) => a + (b.fontes ?? 0), 0),
      valores: somarValores([...subtotalPorUf.values()])
    });
  }
  return resultado;
}
