import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
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

@Component({
  imports: [
    FormsModule
  ],
  selector: 'app-novo-usuario',
  styleUrl: './novo-usuario.scss',
  templateUrl: './novo-usuario.html',
})
export class NovoUsuario implements OnInit {

  etapa = 1;

  nome = '';
  nomePreferido = '';
  cpf = '';
  celular = '';
  paisId = '';
  municipioId = '';
  subdivisaoLocalId = '';
  localidadesCadastro: LocalidadeCadastro[] = [];
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

  constructor(
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

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
    this.municipioId = '';
    this.subdivisaoLocalId = '';
    this.localidadesCadastro = [];
    this.subdivisoesCadastro = [];
    this.carregarLocalidades();
  }

  municipioAlterado(): void {
    this.subdivisaoLocalId = '';
    this.subdivisoesCadastro = [];
    if (!this.municipioNoDF) return;
    this.usuarioService.listarSubdivisoesCadastro(this.municipioId).subscribe({
      next: (lista) => { this.subdivisoesCadastro = lista; this.cdr.detectChanges(); },
      error: () => { this.erro = 'Não foi possível carregar as subdivisões locais.'; this.cdr.detectChanges(); }
    });
  }

  private carregarLocalidades(): void {
    if (!this.paisId) return;
    this.usuarioService.listarLocalidadesCadastro(this.paisId).subscribe({
      next: (lista) => { this.localidadesCadastro = lista; this.cdr.detectChanges(); },
      error: () => { this.erro = 'Não foi possível carregar os municípios/localidades.'; this.cdr.detectChanges(); }
    });
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

  get etapaValida(): boolean {

    if (this.etapa === 1) {
      return (
        !!this.nome.trim() &&
        !!this.paisId &&
        this.paisesCadastro.some(p => p.id === this.paisId) &&
        !!this.municipioId &&
        this.localidadesCadastro.some(m => m.id === this.municipioId) &&
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

    if (this.carregando) {
      return;
    }

    this.erro = '';

    if (this.etapa === 1) {
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

          this.erro =
            mensagemDeErro(
              error,
              'Não foi possível criar o usuário. Tente novamente.'
            );

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
    this.nome = '';
    this.nomePreferido = '';
    this.cpf = '';
    this.celular = '';
    this.paisId = this.paisesCadastro.find(p => p.sigla?.toUpperCase() === 'BR')?.id ?? '';
    this.municipioId = '';
    this.subdivisaoLocalId = '';
    this.subdivisoesCadastro = [];
    this.carregarLocalidades();
    this.email = '';
    this.senha = '';
    this.confirmarSenha = '';
    this.unidadeSolicitadaId = '';
    this.perfilSolicitadoCodigo = '';

  }
}
