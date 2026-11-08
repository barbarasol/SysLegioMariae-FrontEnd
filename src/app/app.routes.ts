import { Routes } from '@angular/router';
import { Layout } from './components/layout/layout';
import { Home } from './pages/home/home';
import { UploadDocumentos } from './pages/upload-documentos/upload-documentos';
import { Dashboard } from './pages/dashboard/dashboard';
import { Membros } from './pages/membros/membros';
import { NovoMembro } from './pages/membros/novo-membro/novo-membro';
import { Perfil } from './pages/perfil/perfil';
import { Caixa } from './pages/caixa/caixa';
import { Afiliacao } from './pages/afiliacao/afiliacao';
import { NovaUnidade } from './pages/afiliacao/nova-unidade/nova-unidade';
import { SolicitacoesUnidades } from './pages/afiliacao/solicitacoes-unidades/solicitacoes-unidades';
import { VisualizarSolicitacao } from './pages/afiliacao/solicitacoes-unidades/visualizar-solicitacao/visualizar-solicitacao';
import { authGuard } from './core/guards/auth.guard';
import { ListagemUsuarios } from './pages/usuarios-plataforma/listagem-usuarios/listagem-usuarios';
import { NovoUsuario } from './pages/usuarios-plataforma/novo-usuario/novo-usuario';
import { Oficiais } from './pages/oficiais/oficiais';
import { NovoOficial } from './pages/oficiais/novo-oficial/novo-oficial';
import { SolicitacoesOficiais } from './pages/oficiais/solicitacoes-oficiais/solicitacoes-oficiais';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login')
        .then(m => m.Login)
  },

  /*
   * Cadastro público de usuário.
   * Usa o mesmo componente da área administrativa.
   */
  {
    path: 'cadastro',
    component: NovoUsuario
  },

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        component: Home
      },
      {
        path: 'upload-documentos',
        component: UploadDocumentos
      },
      {
        path: 'dashboard',
        component: Dashboard
      },
      {
        path: 'membros',
        component: Membros
      },
      {
        path: 'cadastro-membro',
        component: NovoMembro
      },
      {
        path: 'perfil',
        component: Perfil
      },
      {
        path: 'caixa',
        component: Caixa
      },
      {
        path: 'afiliacao',
        component: Afiliacao
      },
      {
        path: 'nova-unidade',
        component: NovaUnidade
      },
      {
        path: 'solicitacoes-unidades',
        component: SolicitacoesUnidades
      },
      {
        path: 'visualizar-solicitacao',
        component: VisualizarSolicitacao
      },
      {
        path: 'listagem-usuarios',
        component: ListagemUsuarios
      },
      {
        path: 'novo-usuario',
        component: NovoUsuario
      },
      {
        path: 'oficiais',
        component: Oficiais
      },
      {
        path: 'novo-oficial',
        component: NovoOficial
      },
      {
        path: 'solicitacoes-oficiais',
        component: SolicitacoesOficiais
      },
      {
        path: 'numeros-unidades',
        loadComponent: () =>
          import('./pages/numeros-unidades/numeros-unidades')
            .then(m => m.NumerosUnidades)
      },
      {
        path: 'unidade-visitas',
        loadComponent: () => import('./pages/unidade-visitas/unidade-visitas')
          .then(m => m.UnidadeVisitas)
      },
      {
        path: 'unidade-institucional',
        loadComponent: () => import('./pages/unidade-institucional/unidade-institucional')
          .then(m => m.UnidadeInstitucional)
      }
    ]
  }
];
