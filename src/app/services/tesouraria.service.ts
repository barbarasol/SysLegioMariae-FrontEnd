import {inject,Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
export interface SaldoImplantacaoTesouraria {
  registro: {id:string;dataReferencia:string;saldoAnterior:string;observacao:string|null}|null;
  saldoInicialContas:string; primeiraDataReuniao:string|null; possuiReuniaoFechada:boolean;
}
export interface UnidadeTesouraria {id:string;nome:string;perfil:'CONSULTA'|'LANCAMENTO'|'GESTOR';tipo:string}
export interface ReuniaoTesouraria {id:string;dataReuniao:string;competencia:string;status:'ABERTA'|'FECHADA';saldoInicial:string;totalReceitas:string;totalDespesas:string;saldoFinal:string;quantidadeLancamentos:number}
export interface FonteTesouraria {id:string;nome:string;contraparteId:string;criadoEm?:string}
export interface FornecedorTesouraria {
  id:string;nome:string;contraparteId:string;tipo:string;nomeFantasia:string|null;
  cpfCnpj:string|null;categoriaServico:string|null;telefone:string|null;
  email:string|null;observacao:string|null;
}
export interface ItemOpcao {id:string;nome:string;tipo?:string;grupo?:string;saldoInicial?:string}
export interface CatalogosTesouraria {contas:ItemOpcao[];categorias:ItemOpcao[];contrapartes:ItemOpcao[];unidades:ItemOpcao[]}
export interface LancamentoTesouraria {id:string;reuniaoId:string;data:string;tipo:'RECEITA'|'DESPESA';valor:string;finalidade:string;situacao:string;formaPagamento:string|null;categoria:string;contraparte:string;conta:string}
@Injectable({providedIn:'root'})
export class TesourariaService {
  private http=inject(HttpClient);
  private base=`${environment.apiUrl}/tesouraria`;
  saldoImplantacao(unidadeId:string){return this.http.get<SaldoImplantacaoTesouraria>(`${this.base}/saldo-implantacao`,{params:{unidadeId},withCredentials:true});}
  criarSaldoImplantacao(body:object){return this.http.post<{id:string}>(`${this.base}/saldo-implantacao`,body,{withCredentials:true});}
  unidades(){return this.http.get<UnidadeTesouraria[]>(`${this.base}/unidades`,{withCredentials:true});}
  catalogos(unidadeId:string){return this.http.get<CatalogosTesouraria>(`${this.base}/catalogos`,{params:{unidadeId},withCredentials:true});}
  reunioes(unidadeId:string){return this.http.get<ReuniaoTesouraria[]>(`${this.base}/reunioes`,{params:{unidadeId},withCredentials:true});}
  lancamentos(unidadeId:string,reuniaoId:string){return this.http.get<LancamentoTesouraria[]>(`${this.base}/lancamentos`,{params:{unidadeId,reuniaoId},withCredentials:true});}
  criarReuniao(body:object){return this.http.post<{id:string}>(`${this.base}/reunioes`,body,{withCredentials:true});}
  fontes(unidadeId:string){return this.http.get<FonteTesouraria[]>(`${this.base}/fontes`,{params:{unidadeId},withCredentials:true});}
  criarFonte(body:object){return this.http.post<FonteTesouraria>(`${this.base}/fontes`,body,{withCredentials:true});}
  atualizarFonte(id:string,body:object){return this.http.put<FonteTesouraria>(`${this.base}/fontes/${id}`,body,{withCredentials:true});}
  fornecedores(unidadeId:string){return this.http.get<FornecedorTesouraria[]>(`${this.base}/fornecedores`,{params:{unidadeId},withCredentials:true});}
  criarFornecedor(body:object){return this.http.post<FornecedorTesouraria>(`${this.base}/fornecedores`,body,{withCredentials:true});}
  atualizarFornecedor(id:string,body:object){return this.http.put<FornecedorTesouraria>(`${this.base}/fornecedores/${id}`,body,{withCredentials:true});}
  criarConta(body:object){return this.http.post<{id:string}>(`${this.base}/contas`,body,{withCredentials:true});}
  criarLancamento(body:object){return this.http.post<{id:string}>(`${this.base}/lancamentos`,body,{withCredentials:true});}
  fecharReuniao(unidadeId:string,reuniaoId:string){return this.http.post(`${this.base}/reunioes/fechar`,{unidadeId,reuniaoId},{withCredentials:true});}
}
