import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import type { PerfilDisponivel, UnidadeDisponivel } from '../../../models/usuario.model';

import {
  mensagemDeErro,
  UsuarioService,
  type LocalidadeCadastro,
  type SubdivisaoCadastro,
  type PaisCadastro
} from '../../../services/usuario.service';

type TurnstileAPI = {
  render: (element: HTMLElement, options: {
    sitekey: string;
    callback: (token: string) => void;
    'expired-callback': () => void;
    'error-callback': () => void;
  }) => string;
  reset: (id?: string) => void;
  remove: (id: string) => void;
};

type TurnstileWindow = Window & { turnstile?: TurnstileAPI };

@Component({
  imports: [
    FormsModule
  ],
  selector: 'app-novo-usuario',
  styleUrl: './novo-usuario.scss',
  templateUrl: './novo-usuario.html',
})
export class NovoUsuario implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('turnstileContainer') turnstileContainer?: ElementRef<HTMLElement>;
  turnstileToken = '';
  turnoSiteKey = '';
  turnoErro = '';
  private widgetId: string | null = null;
  private componenteDestruido = false;
  etapa = 1;

  nome = '';
  nomePreferido = '';
  cpf = '';
  celular = '';
  paisId = '';
  municipioId = '';
  subdivisaoLocalId = '';
  localidadesCadastro: LocalidadeCadastro[] = [];
  pesquisaMunicipio = '';
  municipiosEncontrados: LocalidadeCadastro[] = [];
  pesquisaRealizada = false;
  private consultaLocalidadesId = 0;
  private consultaSubdivisoesId = 0;
  carregandoSubdivisoes = false;
  subdivisoesCadastro: SubdivisaoCadastro[] = [];
  paisesCadastro: PaisCadastro[] = [];
  email = '';
  senha = '';
  confirmarSenha = '';
  unidadeSolicitadaId = '';
  perfilSolicitadoCodigo = '';
  unidadesCadastro: UnidadeDisponivel[] = [];
  perfisCadastro: PerfilDisponivel[] = [];
  carregandoCatalogo = false;
  erroCatalogo = '';


  erro = '';
  sucesso = '';
  carregando = false;
  verificandoCadastro = false;
  private cadastroConferido = '';

  constructor(
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngAfterViewInit(): void {
    this.usuarioService.configuracaoTurnstile().subscribe({
      next: ({ siteKey }) => {
        if (this.componenteDestruido) return;
        this.turnoSiteKey = siteKey;
        if (!siteKey) {
          this.turnoErro = 'Verificação de segurança ainda não configurada. Contate o suporte.';
          this.cdr.detectChanges();
          return;
        }
        this.carregarScriptTurnstile();
      },
      error: () => {
        this.turnoErro = 'Não foi possível carregar a verificação de segurança.';
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.componenteDestruido = true;
    const api = (window as TurnstileWindow).turnstile;
    if (api && this.widgetId) api.remove(this.widgetId);
  }

  private carregarScriptTurnstile(): void {
    const w = window as TurnstileWindow;
    if (w.turnstile) { this.renderizarTurnstile(); return; }
    let script = document.querySelector<HTMLScriptElement>('script[data-syslegio-turnstile]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.dataset['syslegioTurnstile'] = 'true';
      document.head.appendChild(script);
    }
    script.addEventListener('load', () => this.renderizarTurnstile(), { once: true });
    script.addEventListener('error', () => {
      this.turnoErro = 'Não foi possível carregar o CAPTCHA. Verifique sua conexão.';
      this.cdr.detectChanges();
    }, { once: true });
  }

  private renderizarTurnstile(): void {
    const api = (window as TurnstileWindow).turnstile;
    const element = this.turnstileContainer?.nativeElement;
    if (!api || !element || this.widgetId || this.componenteDestruido) return;
    this.widgetId = api.render(element, {
      sitekey: this.turnoSiteKey,
      callback: (token) => {
        this.turnstileToken = token;
        this.turnoErro = '';
        this.cdr.detectChanges();
      },
      'expired-callback': () => {
        this.turnstileToken = '';
        this.cdr.detectChanges();
      },
      'error-callback': () => {
        this.turnstileToken = '';
        this.turnoErro = 'Falha na verificação de segurança. Tente novamente.';
        this.cdr.detectChanges();
      }
    });
  }

  private renovarTurnstile(): void {
    this.turnstileToken = '';
    const api = (window as TurnstileWindow).turnstile;
    if (api && this.widgetId) api.reset(this.widgetId);
    this.cdr.detectChanges();
  }

  ngOnInit(): void {
    this.carregandoCatalogo = true;
    this.usuarioService.listarCatalogoCadastro()
      .pipe(finalize(() => { this.carregandoCatalogo = false; this.cdr.detectChanges(); }))
      .subscribe({
        next: (resultado) => {
          this.unidadesCadastro = resultado.unidades ?? [];
          this.perfisCadastro = resultado.perfis ?? [];
          this.paisesCadastro = resultado.paises ?? [];
          const brasil = this.paisesCadastro.find(p => p.sigla?.toUpperCase() === 'BR');
          if (!this.paisId && brasil) this.paisId = brasil.id;
          if (this.paisId) this.carregarLocalidades();
          this.cdr.detectChanges();
        },
        error: () => {
          this.erroCatalogo = 'Não foi possível carregar as unidades e os perfis. Recarregue a página.';
          this.cdr.detectChanges();
        }
      });
  }

  paisAlterado(): void {
    ++this.consultaSubdivisoesId;
    this.carregandoSubdivisoes = false;
    ++this.consultaLocalidadesId;
    this.cadastroConferido = '';
    this.limparPesquisaMunicipio();
    this.municipioId = '';
    this.subdivisaoLocalId = '';
    this.localidadesCadastro = [];
    this.subdivisoesCadastro = [];
    this.carregarLocalidades();
  }

  municipioAlterado(): void {
    // Apenas uma alteração EXPLÍCITA de município limpa a Região Administrativa.
    const requisicao = ++this.consultaSubdivisoesId;
    const municipioConsultado = this.municipioId;
    this.subdivisaoLocalId = '';
    this.subdivisoesCadastro = [];
    this.carregandoSubdivisoes = false;
    this.cadastroConferido = '';
    if (!this.municipioNoDF) return;

    this.carregandoSubdivisoes = true;
    this.usuarioService.listarSubdivisoesCadastro(municipioConsultado).subscribe({
      next: (lista) => {
        if (this.componenteDestruido || requisicao !== this.consultaSubdivisoesId ||
            municipioConsultado !== this.municipioId) return;
        this.subdivisoesCadastro = [...lista].sort((a, b) =>
          a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
        this.carregandoSubdivisoes = false;
        this.cdr.detectChanges();
      },
      error: () => {
        if (this.componenteDestruido || requisicao !== this.consultaSubdivisoesId ||
            municipioConsultado !== this.municipioId) return;
        this.carregandoSubdivisoes = false;
        this.erro = 'Não foi possível carregar as Regiões Administrativas. Tente selecionar o município novamente.';
        this.cdr.detectChanges();
      }
    });
  }

  private ordenarLocalidades(lista: LocalidadeCadastro[]): LocalidadeCadastro[] {
    return [...lista].sort((a, b) =>
      a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }) ||
      a.ufNome.localeCompare(b.ufNome, 'pt-BR', { sensitivity: 'base' })
    );
  }

  private textoParaPesquisa(valor: string): string {
    return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR').trim();
  }

  private limparPesquisaMunicipio(): void {
    this.pesquisaMunicipio = '';
    this.municipiosEncontrados = [];
    this.pesquisaRealizada = false;
  }

  pesquisarMunicipio(): void {
    this.municipiosEncontrados = [];
    this.pesquisaRealizada = false;
    if (!this.paisId || !this.pesquisaMunicipio.trim()) {
      this.erro = 'Digite parte do nome do município e clique em Pesquisar.';
      this.cdr.detectChanges();
      return;
    }
    this.erro = '';
    const termo = this.textoParaPesquisa(this.pesquisaMunicipio);
    this.municipiosEncontrados = this.localidadesCadastro.filter(localidade =>
      this.textoParaPesquisa(localidade.nome).includes(termo) ||
      this.textoParaPesquisa(localidade.ufNome).includes(termo)
    ).slice(0, 50);
    this.pesquisaRealizada = true;
    this.cdr.detectChanges();
  }

  selecionarMunicipio(localidade: LocalidadeCadastro): void {
    if (this.carregando || this.verificandoCadastro) return;
    this.municipioId = localidade.id;
    this.pesquisaMunicipio = `${localidade.nome} — ${localidade.ufNome}`;
    this.municipiosEncontrados = [];
    this.pesquisaRealizada = false;
    this.erro = '';
    this.municipioAlterado();
    this.cdr.detectChanges();
  }

  limparMunicipioSelecionado(): void {
    ++this.consultaSubdivisoesId;
    this.carregandoSubdivisoes = false;
    this.cadastroConferido = '';
    this.municipioId = '';
    this.subdivisaoLocalId = '';
    this.subdivisoesCadastro = [];
    this.limparPesquisaMunicipio();
    this.erro = '';
    this.cdr.detectChanges();
  }

  private carregarLocalidades(): void {
    const requisicao = ++this.consultaLocalidadesId;
    if (!this.paisId) { this.localidadesCadastro = []; return; }
    this.usuarioService.listarLocalidadesCadastro(this.paisId).subscribe({
      next: (lista) => {
        if (requisicao !== this.consultaLocalidadesId || this.componenteDestruido) return;
        // Não modificar município nem RA selecionados ao concluir uma consulta.
        this.localidadesCadastro = this.ordenarLocalidades(lista);
        this.cdr.detectChanges();
      },
      error: () => {
        if (requisicao !== this.consultaLocalidadesId || this.componenteDestruido) return;
        this.localidadesCadastro = [];
        this.erro = 'Não foi possível carregar os municípios/localidades.';
        this.cdr.detectChanges();
      }
    });
  }

  limparErroCadastro(): void {
    // CPF/e-mail não podem redefinir país, município ou Região Administrativa.
    this.erro = '';
    this.cadastroConferido = '';
  }

  refazerVerificacao(): void {
    this.turnoErro = '';
    this.erro = '';
    this.renovarTurnstile();
  }

  get municipioNoDF(): boolean {
    if (!this.brasileiro || !this.municipioId) return false;
    const localidade = this.localidadesCadastro.find(m => m.id === this.municipioId);
    return localidade?.ufSigla?.toUpperCase() === 'DF';
  }

  get paisSelecionado(): PaisCadastro | undefined {
    return this.paisesCadastro.find(p => p.id === this.paisId);
  }

  get brasileiro(): boolean {
    return this.paisSelecionado?.sigla?.trim().toUpperCase() === 'BR';
  }

  get celularValido(): boolean {
    const numero = this.celular.trim().replace(/[\s().-]/g, '');
    if (this.brasileiro) {
      return /^(?:\d{10,11}|\+55\d{10,11})$/.test(numero);
    }
    return /^\+[1-9]\d{7,14}$/.test(numero);
  }

  get cpfValido(): boolean {
    if (!this.brasileiro && !this.cpf.trim()) return true;
    const cpf = this.cpf.replace(/\D/g, '');
    if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
    const digito = (n: number) => {
      const soma = Array.from({length:n}, (_,i) => Number(cpf[i]) * (n+1-i)).reduce((a,b) => a+b,0);
      const resto = (soma*10)%11;
      return resto===10?0:resto;
    };
    return digito(9)===Number(cpf[9]) && digito(10)===Number(cpf[10]);
  }

  get unidadeSelecionada(): UnidadeDisponivel | undefined {
    return this.unidadesCadastro.find((u) => u.id === this.unidadeSolicitadaId);
  }

  get perfilPermitidoNaUnidade(): boolean {
    return this.perfilSolicitadoCodigo !== 'MEMBRO' ||
      this.unidadeSelecionada?.tipoCodigo === 'PRAESIDIUM';
  }

  get senhasDiferentes(): boolean {
    return (
      this.senha.length > 0 &&
      this.confirmarSenha.length > 0 &&
      this.senha !== this.confirmarSenha
    );
  }

  private assinaturaCadastro(): string {
    return `${this.cpf.replace(/\D/g, '')}|${this.email.trim().toLowerCase()}`;
  }

  get etapaValida(): boolean {

    if (this.etapa === 1) {
      return (
        !!this.nome.trim() &&
        !!this.paisId &&
        this.paisesCadastro.some(p => p.id === this.paisId) &&
        !!this.municipioId &&
        this.localidadesCadastro.some(m => m.id === this.municipioId) &&
        !this.carregandoSubdivisoes &&
        (!this.subdivisaoLocalId || (this.municipioNoDF &&
          this.subdivisoesCadastro.some(s => s.id === this.subdivisaoLocalId))) &&
        this.cpfValido &&
        this.celularValido &&
        !!this.email.trim() &&
        this.emailValido(this.email)
      );
    }

    if (this.etapa === 2) {
      return (
        this.senha.length >= 6 &&
        this.confirmarSenha.length >= 6 &&
        this.senha === this.confirmarSenha &&
        !!this.unidadeSolicitadaId &&
        !!this.perfilSolicitadoCodigo &&
        this.perfilPermitidoNaUnidade &&
        !this.carregandoCatalogo
      );
    }

    return true;
  }

  proximo(): void {

    if (this.carregando || this.verificandoCadastro) {
      return;
    }
    this.erro = '';

    if (this.etapa === 1) {
      // Validar os dados ANTES de exigir um token; assim o usuário sabe o que corrigir.
      if (!this.nome.trim()) {
        this.erro = 'Informe o nome completo.';
        this.cdr.detectChanges();
        return;
      }
      if (!this.paisId || !this.paisesCadastro.some(p => p.id === this.paisId)) {
        this.erro = 'Selecione um país válido.';
        this.cdr.detectChanges();
        return;
      }
      if (!this.municipioId || !this.localidadesCadastro.some(m => m.id === this.municipioId)) {
        this.erro = 'Selecione um município/localidade do país informado.';
        this.cdr.detectChanges();
        return;
      }
      if (this.subdivisaoLocalId && (!this.municipioNoDF ||
          !this.subdivisoesCadastro.some(item => item.id === this.subdivisaoLocalId))) {
        this.erro = 'Selecione uma Região Administrativa válida do Distrito Federal.';
        this.cdr.detectChanges();
        return;
      }
      if (!this.cpfValido) {
        this.erro = 'Informe um CPF válido para o Brasil ou deixe em branco se estrangeiro.';
        this.cdr.detectChanges();
        return;
      }
      if (!this.celularValido) {
        this.erro = this.brasileiro
          ? 'Informe celular brasileiro com DDD (10 ou 11 dígitos).'
          : 'Informe celular internacional no formato +DD seguido do número.';
        this.cdr.detectChanges();
        return;
      }

      if (!this.nome.trim()) {
        this.erro =
          'Informe o nome completo.';
        this.cdr.detectChanges();
        return;
      }

      if (!this.email.trim()) {
        this.erro =
          'Informe o e-mail.';
        this.cdr.detectChanges();
        return;
      }

      if (!this.emailValido(this.email)) {
        this.erro =
          'Informe um e-mail válido.';
        this.cdr.detectChanges();
        return;
      }
    }

    if (this.etapa === 2) {

      if (!this.unidadeSolicitadaId || !this.perfilSolicitadoCodigo || !this.perfilPermitidoNaUnidade) {
        this.erro = 'Escolha uma unidade válida e um perfil compatível. MEMBRO requer Praesidium.';
        this.cdr.detectChanges();
        return;
      }

      if (!this.senha) {
        this.erro =
          'Informe a senha.';
        this.cdr.detectChanges();
        return;
      }

      if (this.senha.length < 6) {
        this.erro =
          'A senha deve possuir pelo menos 6 caracteres.';
        this.cdr.detectChanges();
        return;
      }

      if (!this.confirmarSenha) {
        this.erro =
          'Confirme a senha.';
        this.cdr.detectChanges();
        return;
      }

      if (
        this.confirmarSenha.length < 6
      ) {
        this.erro =
          'A confirmação da senha deve possuir pelo menos 6 caracteres.';
        this.cdr.detectChanges();
        return;
      }

      if (
        this.senha !==
        this.confirmarSenha
      ) {
        this.erro =
          'As senhas informadas não são iguais.';
        this.cdr.detectChanges();
        return;
      }
    }

    if (this.etapa === 1) {
      if (this.carregandoSubdivisoes) {
        this.erro = 'Aguarde o carregamento das Regiões Administrativas.';
        this.cdr.detectChanges();
        return;
      }
      if (!this.etapaValida) {
        this.erro = 'Confira os dados obrigatórios da primeira etapa.';
        this.cdr.detectChanges();
        return;
      }
      if (!this.turnstileToken) {
        this.erro = 'Conclua ou refaça a verificação de segurança para continuar.';
        this.cdr.detectChanges();
        return;
      }
      this.verificandoCadastro = true;
      const assinatura = this.assinaturaCadastro();
      const paisConsultado = this.paisId;
      const municipioConsultado = this.municipioId;
      const subdivisaoConsultada = this.subdivisaoLocalId;
      this.usuarioService.verificarCadastroExistente({ cpf: this.cpf, email: this.email, turnstileToken: this.turnstileToken })
        .pipe(finalize(() => { this.verificandoCadastro = false; this.cdr.detectChanges(); }))
        .subscribe({
          next: (resultado) => {
            this.renovarTurnstile();
            if (!resultado.disponivel) {
              this.cadastroConferido = '';
              this.erro = 'Cadastro já existente. O CPF ou e-mail informado já consta em nosso sistema. Entre em contato com o suporte: syslegiomariae@gmail.com.';
              return;
            }
            if (assinatura !== this.assinaturaCadastro() || paisConsultado !== this.paisId ||
                municipioConsultado !== this.municipioId || subdivisaoConsultada !== this.subdivisaoLocalId) {
              this.erro = 'Os dados foram alterados durante a consulta. Clique novamente em Próximo para verificar.';
              return;
            }
            this.cadastroConferido = assinatura;
            this.etapa = 2;
            this.cdr.detectChanges();
          },
          error: (error: HttpErrorResponse) => {
            this.renovarTurnstile();
            this.cadastroConferido = '';
            this.erro = error.status === 409
              ? 'Cadastro já existente. O CPF ou e-mail informado já consta em nosso sistema. Entre em contato com o suporte: syslegiomariae@gmail.com.'
              : mensagemDeErro(error, 'Não foi possível verificar o cadastro. Tente novamente.');
            this.cdr.detectChanges();
          }
        });
      return;
    }

    if (this.etapa < 3) {
      this.etapa++;
      this.cdr.detectChanges();
    }
  }

  voltar(): void {

    if (
      this.carregando ||
      this.etapa <= 1
    ) {
      return;
    }

    this.erro = '';
    this.etapa--;

    this.cdr.detectChanges();
  }

  criar(): void {

    if (
      this.carregando ||
      this.etapa !== 3
    ) {
      return;
    }

    if (!this.turnstileToken) {
      this.erro = 'Conclua novamente a verificação de segurança para criar o usuário.';
      this.cdr.detectChanges();
      return;
    }

    if (this.cadastroConferido !== this.assinaturaCadastro()) {
      this.etapa = 1;
      this.erro = 'Confirme novamente o CPF e o e-mail antes de concluir o cadastro.';
      this.cdr.detectChanges();
      return;
    }

    this.erro = '';
    this.sucesso = '';
    this.carregando = true;

    this.usuarioService
      .criar({
        nome:
          this.nome,

        nomePreferido:
          this.nomePreferido,

        email:
          this.email,

        cpf: this.cpf,
        paisId: this.paisId,
        municipioId: this.municipioId,
        subdivisaoLocalId: this.subdivisaoLocalId || null,
        turnstileToken: this.turnstileToken,
        celular: this.celular,

        senha:
          this.senha,
        unidadeSolicitadaId: this.unidadeSolicitadaId,
        perfilSolicitadoCodigo: this.perfilSolicitadoCodigo
      })
      .pipe(
        finalize(() => {
          this.carregando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (resultado) => {
          this.renovarTurnstile();

          /*
           * Cadastro iniciado pela tela de Login:
           * volta ao Login exibindo a mensagem de pendência.
           */
          if (
            this.router.url
              .startsWith(
                '/cadastro'
              ) &&
            resultado.usuario.status ===
              'PENDENTE_EMAIL'
          ) {
            this.router.navigate(
              ['/login'],
              {
                queryParams: {
                  cadastro:
                    'pendente'
                },
                replaceUrl:
                  true
              }
            );

            return;
          }

          /*
           * Cadastro iniciado por administrador:
           * permanece na tela atual.
           */
          const pessoaReutilizada =
            'pessoaReutilizada' in resultado &&
            resultado.pessoaReutilizada === true;

          this.sucesso =
            `Usuário ${resultado.usuario.email} criado com sucesso. ` +
            (pessoaReutilizada
              ? 'Vinculado à pessoa já cadastrada, sem modificar os dados do legionário. '
              : '') +
            'Sua solicitação de unidade e perfil ficará aguardando aprovação administrativa.';

          this.etapa = 1;
          this.limpar();

          this.cdr.detectChanges();
        },

        error: (
          error:
            HttpErrorResponse
        ) => {
          this.renovarTurnstile();

          this.erro = error.status === 409
            ? 'Cadastro já existente. O CPF ou e-mail informado já consta em nosso sistema. Entre em contato com o suporte: syslegiomariae@gmail.com.'
            : mensagemDeErro(error, 'Não foi possível criar o usuário. Tente novamente.');
          if (error.status === 409) {
            this.cadastroConferido = '';
            this.etapa = 1;
          }

          this.cdr.detectChanges();
        }
      });
  }

  private emailValido(
    email: string
  ): boolean {

    return (
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(
          email.trim()
        )
    );
  }

  private limpar(): void {
    ++this.consultaSubdivisoesId;
    this.carregandoSubdivisoes = false;
    this.cadastroConferido = '';
    this.nome = '';
    this.nomePreferido = '';
    this.cpf = '';
    this.celular = '';
    this.paisId = this.paisesCadastro.find(p => p.sigla?.toUpperCase() === 'BR')?.id ?? '';
    this.municipioId = '';
    this.subdivisaoLocalId = '';
    this.subdivisoesCadastro = [];
    this.limparPesquisaMunicipio();
    this.carregarLocalidades();
    this.email = '';
    this.senha = '';
    this.confirmarSenha = '';
    this.unidadeSolicitadaId = '';
    this.perfilSolicitadoCodigo = '';

  }
}
