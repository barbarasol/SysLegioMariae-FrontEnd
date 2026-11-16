import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Dashboard, ResumoDashboard } from './dashboard';
import { environment } from '../../../environments/environment';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta a API e calcula membros sem usar dados fictícios', () => {
    fixture.detectChanges();
    const req = http.expectOne(`${environment.apiUrl}/dashboard/concilium`);
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);
    const resumo: ResumoDashboard = {
      ano: new Date().getFullYear(), ultima_atualizacao: '2026-11-12T10:00:00',
      totais: {
        qtd_senatus: 1, qtd_regiae: 2, qtd_comitia: 3, qtd_comitia_juv: 0,
        qtd_curiae: 4, qtd_curiae_juv: 0, qtd_praesidia: 5, qtd_praesidia_juv: 0,
        qtd_velites: 0, qtd_praticios: 0, qtd_pretorianos: 3, qtd_adjutores: 2,
        qtd_ativos_com_promessa: 10, qtd_ativos_sem_promessa: 5,
        qtd_auxiliares_permanentes: 7, qtd_auxiliares_provisorios: 3,
        qtd_mescs: 0, qtd_catequistas: 0, qtd_coroinhas: 0, qtd_praesidia_total: 5
      },
      evolucao: [{ mes: 1, membros: 17 }],
      unidades: [{ id: 1, nome: 'Unidade de teste', tipo: 'REGIAE', ultima_atualizacao: '2026-11-12T10:00:00' }]
    };
    req.flush(resumo);
    fixture.detectChanges();
    expect(component.totalAtivos).toBe(15);
    expect(component.totalAuxiliares).toBe(10);
    expect(component.totalMembros).toBe(25);
    expect(component.ativosSemPretorianos).toBe(12);
    expect(component.auxiliaresSemAdjutores).toBe(8);
    expect(component.percentualPretorianos).toBeCloseTo(20, 2);
    expect(component.percentualAdjutores).toBeCloseTo(20, 2);
    expect(component.percentualDoTotal(12)).toBeCloseTo(48, 2);
    expect(component.percentualDoTotal(3)).toBeCloseTo(12, 2);
    expect(component.percentualDoTotal(8)).toBeCloseTo(32, 2);
    expect(component.percentualDoTotal(2)).toBeCloseTo(8, 2);
    expect(component.mediaAtivosPorPraesidium).toBeCloseTo(3, 2);
    expect(component.mediaAuxiliaresPorPraesidium).toBeCloseTo(2, 2);
    expect(component.estruturaValores).toEqual([1, 2, 3, 4, 5]);
    expect(component.evolucaoAno).toHaveSize(12);
    expect(component.evolucaoAno[0].membros).toBe(17);
    expect(component.evolucaoAno[1].membros).toBeNull();
    // O rodapé mantém os percentuais por grupo e a média membros/Praesidia.
    expect(fixture.nativeElement.textContent).toContain('Pretorianos');
    expect(fixture.nativeElement.textContent).toContain('Adjutores');
    expect(fixture.nativeElement.textContent).toContain('Média de membros por Praesidium');
  });
});
