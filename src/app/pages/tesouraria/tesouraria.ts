import {CommonModule} from '@angular/common';
import {ChangeDetectorRef,Component,OnInit,inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {TesourariaService,CatalogosTesouraria,UnidadeTesouraria,ReuniaoTesouraria,LancamentoTesouraria,SaldoImplantacaoTesouraria,FonteTesouraria,FornecedorTesouraria} from '../../services/tesouraria.service';

const hoje=()=>new Date().toLocaleDateString('en-CA');
@Component({selector:'app-tesouraria',standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./tesouraria.html',styleUrl:'./tesouraria.scss'})
export class Tesouraria implements OnInit {
  private api=inject(TesourariaService);
  private cd=inject(ChangeDetectorRef);
  unidades:UnidadeTesouraria[]=[];
  unidadeId='';
  reunioes:ReuniaoTesouraria[]=[]; reuniaoId=''; lancamentos:LancamentoTesouraria[]=[];
  catalogos:CatalogosTesouraria={contas:[],categorias:[],contrapartes:[],unidades:[]};
  carregando=false; salvando=false; erro=''; aviso='';
  mostrarReuniao=false; mostrarLancamento=false; mostrarConta=false; mostrarSaldoImplantacao=false;
  mostrarFonte=false; fontes:FonteTesouraria[]=[]; salvandoFonte=false;
  fonteEditandoId=''; fonteNome=''; erroFonte='';
  fornecedores:FornecedorTesouraria[]=[];
  mostrarFornecedor=false; salvandoFornecedor=false; erroFornecedor=''; fornecedorEditandoId='';
  fornecedorSelecionadoId='';
  fornecedorForm={nome:'',nomeFantasia:'',cpfCnpj:'',tipo:'EMPRESA',categoriaServico:'',telefone:'',email:'',observacao:''};
  saldoImplantacao:SaldoImplantacaoTesouraria|null=null;
  carregandoSaldoImplantacao=false;
  erroSaldoImplantacao='';
  formSaldoImplantacao={dataReferencia:'',saldoAnterior:'',observacao:''};
  dataReuniao=hoje(); observacaoReuniao='';
  conta={nome:'Caixa',tipo:'CAIXA',dataSaldoInicial:hoje(),saldoInicial:'0',bancoNome:'',agencia:'',contaNumero:''};
  form={dataLancamento:hoje(),tipo:'RECEITA',contaId:'',categoriaId:'',contraparteId:'',origem:'CADASTRADA',unidadeRelacionadaId:'',nomeExterno:'',valor:'',finalidade:'',formaPagamento:'DINHEIRO',observacao:''};
  get podeCadastrarSaldoInicial(){
    return this.gestor && !!this.saldoImplantacao && !this.saldoImplantacao.registro &&
      !this.saldoImplantacao.possuiReuniaoFechada && Number(this.saldoImplantacao.saldoInicialContas)===0;
  }
  get motivoBloqueioSaldo():string {
    if(!this.gestor)return 'Somente usuários com perfil GESTOR podem cadastrar o saldo anterior.';
    if(!this.saldoImplantacao)return '';
    if(this.saldoImplantacao.possuiReuniaoFechada)return 'Já existem reuniões fechadas. O saldo de partida não pode ser alterado diretamente; solicite regularização administrativa auditada.';
    if(Number(this.saldoImplantacao.saldoInicialContas)!==0)return 'Já existe saldo inicial registrado nas contas financeiras desta unidade. Não é possível somar outro saldo anterior, pois isso duplicaria o valor.';
    return '';
  }
  get unidade(){return this.unidades.find(u=>u.id===this.unidadeId);}
  get podeLancar(){return ['LANCAMENTO','GESTOR'].includes(this.unidade?.perfil??'');}
  get gestor(){return this.unidade?.perfil==='GESTOR';}
  get reuniao(){return this.reunioes.find(r=>r.id===this.reuniaoId);}
  get categorias(){return this.catalogos.categorias.filter(x=>x.tipo===this.form.tipo);}
  get podeSalvarLancamento(){return this.podeLancar && this.reuniao?.status==='ABERTA';}
  // Data do movimento pode ser de qualquer mes anterior; somente a data da reuniao e o limite superior.
  get dataMaximaLancamento(): string { return this.reuniao?.dataReuniao?.slice(0,10) ?? ''; }
  get dataLancamentoValida(): boolean {
    const dia = this.form.dataLancamento;
    return !!this.reuniao && /^\d{4}-\d{2}-\d{2}$/.test(dia) &&
      dia <= this.dataMaximaLancamento;
  }
  selecionarReuniao(reuniaoId: string): void {
    if (this.reuniaoId !== reuniaoId) {
      this.reuniaoId = reuniaoId;
      this.mostrarLancamento = false;
      this.erro = '';
    }
    this.form.dataLancamento = this.dataMaximaLancamento;
    this.carregarLancamentos();
  }
  alternarFormularioLancamento(): void {
    if (!this.podeSalvarLancamento) return;
    this.mostrarLancamento = !this.mostrarLancamento;
    if (this.mostrarLancamento) {
      this.form.dataLancamento = this.dataMaximaLancamento;
      this.erro = '';
    }
  }
  moeda(v:string|number|null|undefined){return (Number(v)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});}
  private falha(e:unknown){const er=e as {error?:{message?:string};message?:string};this.erro=er?.error?.message||er?.message||'Falha ao consultar dados da Tesouraria.';this.cd.markForCheck();}
  ngOnInit(){this.carregando=true;this.api.unidades().subscribe({next:ls=>{this.unidades=ls;this.carregando=false; if(ls.length){this.unidadeId=ls[0].id;this.trocarUnidade();}this.cd.markForCheck();},error:e=>{this.carregando=false;this.falha(e);}});}
  trocarUnidade(){this.erro='';this.aviso='';this.reuniaoId='';this.reunioes=[];this.lancamentos=[];this.saldoImplantacao=null;this.mostrarSaldoImplantacao=false;this.erroSaldoImplantacao='';this.carregandoSaldoImplantacao=false;this.mostrarFonte=false;this.fonteEditandoId='';this.fonteNome='';this.fontes=[];this.fornecedores=[];this.fornecedorSelecionadoId='';this.mostrarFornecedor=false;this.fornecedorEditandoId='';this.erroFornecedor='';if(!this.unidadeId)return;
    this.carregarFontes();
    this.carregarFornecedores();
    this.carregarSaldoImplantacao();
    this.api.catalogos(this.unidadeId).subscribe({next:c=>{this.catalogos=c;this.cd.markForCheck();},error:e=>this.falha(e)});
    this.carregarReunioes();
  }
  carregarFontes(): void {
    const unidade=this.unidadeId;
    if(!unidade)return;
    this.api.fontes(unidade).subscribe({
      next:ls=>{if(unidade===this.unidadeId){this.fontes=ls;this.cd.markForCheck();}},
      error:e=>{if(unidade===this.unidadeId){const er=e as {error?:{message?:string}};this.erroFonte=er.error?.message||'Não foi possível consultar as fontes cadastradas.';this.cd.markForCheck();}}
    });
  }
  abrirCadastroFonte(): void {
    if(!this.podeLancar)return;
    this.fonteEditandoId='';this.fonteNome='';this.erroFonte='';
    this.mostrarFonte=!this.mostrarFonte;
  }
  editarFonte(fonte:FonteTesouraria): void {
    if(!this.podeLancar)return;
    this.fonteEditandoId=fonte.id;this.fonteNome=fonte.nome;
    this.erroFonte='';this.mostrarFonte=true;
  }
  salvarFonte(): void {
    if(!this.podeLancar||this.salvandoFonte)return;
    const nome=this.fonteNome.trim();
    if(!nome||nome.length>200){this.erroFonte='Informe o nome da fonte com até 200 caracteres.';return;}
    this.salvandoFonte=true;this.erroFonte='';
    const unidadeId=this.unidadeId;
    const body={unidadeId,fontePagadoraRecebedora:nome};
    const requisicao=this.fonteEditandoId
      ? this.api.atualizarFonte(this.fonteEditandoId,body)
      : this.api.criarFonte(body);
    requisicao.subscribe({
      next:fonte=>{
        this.salvandoFonte=false;
        if(unidadeId!==this.unidadeId)return;
        this.mostrarFonte=false;this.fonteEditandoId='';this.fonteNome='';
        this.form.origem='CADASTRADA';this.form.contraparteId=fonte.contraparteId;
        this.aviso='Fonte pagadora/recebedora salva com sucesso.';
        this.api.catalogos(unidadeId).subscribe({next:c=>{if(unidadeId===this.unidadeId){this.catalogos=c;this.cd.markForCheck();}},error:e=>this.falha(e)});
        this.carregarFontes();this.cd.markForCheck();
      },
      error:e=>{
        this.salvandoFonte=false;
        const er=e as {error?:{message?:string};message?:string};
        this.erroFonte=er.error?.message||er.message||'Não foi possível salvar a fonte.';
        this.cd.markForCheck();
      }
    });
  }
  carregarFornecedores(): void {
    const unidade=this.unidadeId;
    if(!unidade)return;
    this.api.fornecedores(unidade).subscribe({
      next:lista=>{if(unidade===this.unidadeId){this.fornecedores=lista;this.cd.markForCheck();}},
      error:e=>{if(unidade===this.unidadeId){const er=e as {error?:{message?:string}};
        this.erroFornecedor=er.error?.message||'Não foi possível consultar os fornecedores.';this.cd.markForCheck();}}
    });
  }
  novoFornecedor(): void {
    if(!this.podeLancar)return;
    this.fornecedorEditandoId='';this.erroFornecedor='';
    this.fornecedorForm={nome:'',nomeFantasia:'',cpfCnpj:'',tipo:'EMPRESA',categoriaServico:'',telefone:'',email:'',observacao:''};
    this.mostrarFornecedor=true;
  }
  editarFornecedor(f:FornecedorTesouraria):void {
    if(!this.podeLancar)return;
    this.fornecedorEditandoId=f.id;
    this.fornecedorForm={nome:f.nome,nomeFantasia:f.nomeFantasia??'',cpfCnpj:f.cpfCnpj??'',
      tipo:f.tipo,categoriaServico:f.categoriaServico??'',telefone:f.telefone??'',
      email:f.email??'',observacao:f.observacao??''};
    this.erroFornecedor='';this.mostrarFornecedor=true;
  }
  editarFornecedorSelecionado():void {
    const fornecedor=this.fornecedores.find(f=>f.id===this.fornecedorSelecionadoId);
    if(fornecedor)this.editarFornecedor(fornecedor);
  }
  salvarFornecedor():void {
    if(!this.podeLancar||this.salvandoFornecedor)return;
    const nome=this.fornecedorForm.nome.trim();
    if(!nome||nome.length>200){this.erroFornecedor='Informe o nome do fornecedor com até 200 caracteres.';return;}
    this.salvandoFornecedor=true;this.erroFornecedor='';
    const unidadeId=this.unidadeId;
    const body={...this.fornecedorForm,unidadeId};
    const requisicao=this.fornecedorEditandoId
      ?this.api.atualizarFornecedor(this.fornecedorEditandoId,body)
      :this.api.criarFornecedor(body);
    requisicao.subscribe({
      next:fornecedor=>{
        this.salvandoFornecedor=false;
        if(unidadeId!==this.unidadeId)return;
        this.mostrarFornecedor=false;this.fornecedorEditandoId='';
        this.form.origem='FORNECEDOR';this.fornecedorSelecionadoId=fornecedor.id;
        this.aviso='Fornecedor salvo e selecionado para o lançamento.';
        this.carregarFornecedores();this.cd.markForCheck();
      },
      error:e=>{this.salvandoFornecedor=false;const er=e as {error?:{message?:string};message?:string};
        this.erroFornecedor=er.error?.message||er.message||'Não foi possível salvar o fornecedor.';
        this.cd.markForCheck();}
    });
  }
  carregarSaldoImplantacao(){
    const u=this.unidadeId;
    if(!u)return;
    this.carregandoSaldoImplantacao=true;
    this.erroSaldoImplantacao='';
    this.cd.markForCheck();
    this.api.saldoImplantacao(u).subscribe({
      next:info=>{
        if(u!==this.unidadeId)return;
        this.saldoImplantacao=info;
        this.carregandoSaldoImplantacao=false;
        this.cd.markForCheck();
      },
      error:e=>{
        if(u!==this.unidadeId)return;
        this.carregandoSaldoImplantacao=false;
        const resposta=e as {status?:number;error?:{message?:string};message?:string};
        this.erroSaldoImplantacao=resposta.status===404
          ? 'A rota de saldo anterior não foi encontrada. Confira se o Backend atualizado está em execução.'
          : resposta.status===500
            ? 'Falha na consulta do saldo anterior. Confirme se a migration 20261125_001_tesouraria_saldo_implantacao.sql foi executada e verifique o log do Backend.'
            : (resposta.error?.message || resposta.message || 'Não foi possível consultar o saldo anterior.');
        this.cd.markForCheck();
      }
    });
  }
  abrirSaldoImplantacao(){
    if(!this.podeCadastrarSaldoInicial)return;
    this.mostrarSaldoImplantacao=!this.mostrarSaldoImplantacao;
    if(this.mostrarSaldoImplantacao && !this.formSaldoImplantacao.dataReferencia && this.saldoImplantacao?.primeiraDataReuniao){
      // A data anterior é informada pelo tesoureiro. Não presumir a periodicidade.
      this.formSaldoImplantacao.dataReferencia='';
    }
  }
  salvarSaldoImplantacao(){
    if(!this.podeCadastrarSaldoInicial || this.salvando)return;
    const info=this.saldoImplantacao;
    if(!this.formSaldoImplantacao.dataReferencia ||
       (info?.primeiraDataReuniao && this.formSaldoImplantacao.dataReferencia >= info.primeiraDataReuniao)){
      this.erro='A data da última reunião anterior deve ser anterior à primeira reunião registrada.';
      this.cd.markForCheck();
      return;
    }
    if(!/^\d+(\.\d{1,2})?$/.test(String(this.formSaldoImplantacao.saldoAnterior))){
      this.erro='Informe o saldo anterior em reais (zero ou valor positivo).';
      this.cd.markForCheck();
      return;
    }
    if(!confirm('Confirmar este saldo anterior como ponto de partida? O registro ficará bloqueado após salvar.'))return;
    this.salvando=true;this.erro='';
    this.api.criarSaldoImplantacao({...this.formSaldoImplantacao,unidadeId:this.unidadeId}).subscribe({
      next:()=>{this.salvando=false;this.mostrarSaldoImplantacao=false;this.aviso='Saldo anterior registrado como ponto de partida.';this.carregarSaldoImplantacao();this.carregarReunioes();this.cd.markForCheck();},
      error:e=>{this.salvando=false;this.falha(e);}
    });
  }
  carregarReunioes(){if(!this.unidadeId)return;const u=this.unidadeId;this.carregando=true;this.api.reunioes(u).subscribe({next:rs=>{
    if(u!==this.unidadeId)return;this.reunioes=rs;this.carregando=false;
    if(!rs.some(r=>r.id===this.reuniaoId)) { this.reuniaoId=rs[0]?.id??''; this.mostrarLancamento=false; }
    if (this.reuniao) this.form.dataLancamento=this.dataMaximaLancamento;
    this.carregarLancamentos();this.cd.markForCheck();},error:e=>{this.carregando=false;this.falha(e);}});}
  carregarLancamentos(){if(!this.reuniaoId){this.lancamentos=[];return;}
    const id=this.reuniaoId;this.api.lancamentos(this.unidadeId,id).subscribe({next:ls=>{if(this.reuniaoId===id)this.lancamentos=ls;this.cd.markForCheck();},error:e=>this.falha(e)});}
  salvarReuniao(){if(!this.podeLancar||this.salvando)return;this.salvando=true;this.erro='';this.api.criarReuniao({unidadeId:this.unidadeId,dataReuniao:this.dataReuniao,observacao:this.observacaoReuniao}).subscribe({next:()=>{this.salvando=false;this.mostrarReuniao=false;this.carregarReunioes();},error:e=>{this.salvando=false;this.falha(e);}});}
  salvarConta(){if(!this.gestor||this.salvando)return;this.salvando=true;this.api.criarConta({...this.conta,unidadeId:this.unidadeId}).subscribe({next:()=>{this.salvando=false;this.mostrarConta=false;this.trocarUnidade();},error:e=>{this.salvando=false;this.falha(e);}});}
  salvarLancamento(){
    if(!this.podeSalvarLancamento||this.salvando)return;
    if (!this.dataLancamentoValida) {
      this.erro = `A data do movimento deve ser igual ou anterior à reunião de ${this.dataMaximaLancamento.split('-').reverse().join('/')}. Datas de meses anteriores são permitidas.`;
      this.cd.markForCheck();
      return;
    }
    if(this.form.origem==='FORNECEDOR'&&!this.fornecedores.some(f=>f.id===this.fornecedorSelecionadoId)){
      this.erro='Selecione um fornecedor externo válido.';this.cd.markForCheck();return;
    }
    this.salvando=true;this.erro='';
    const b:Record<string,unknown>={...this.form,unidadeId:this.unidadeId,reuniaoId:this.reuniaoId,
      contraparteId:this.form.origem==='CADASTRADA'?this.form.contraparteId:this.form.origem==='FORNECEDOR'?this.fornecedores.find(f=>f.id===this.fornecedorSelecionadoId)?.contraparteId??null:null,
      unidadeRelacionadaId:this.form.origem==='UNIDADE'?this.form.unidadeRelacionadaId:null,
      nomeExterno:this.form.origem==='EXTERNA'?this.form.nomeExterno:null};
    this.api.criarLancamento(b).subscribe({next:()=>{this.salvando=false;this.mostrarLancamento=false;this.form.valor='';this.form.finalidade='';this.carregarReunioes();},error:e=>{this.salvando=false;this.falha(e);}});
  }
  fechar(){if(!this.gestor||this.reuniao?.status!=='ABERTA')return;
    if(!confirm('Fechar esta reunião? Depois do fechamento, os lançamentos não poderão ser alterados.'))return;
    this.api.fecharReuniao(this.unidadeId,this.reuniaoId).subscribe({next:()=>{this.aviso='Reunião fechada.';this.carregarReunioes();},error:e=>this.falha(e)});
  }
}
