import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SolicitacoesOficiais } from './solicitacoes-oficiais';

describe('SolicitacoesOficiais', () => {
  let component: SolicitacoesOficiais;
  let fixture: ComponentFixture<SolicitacoesOficiais>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolicitacoesOficiais],
    }).compileComponents();

    fixture = TestBed.createComponent(SolicitacoesOficiais);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
