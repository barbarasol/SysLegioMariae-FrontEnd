import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NovoUsuario } from './listagem-usuarios';

describe('NovoUsuario', () => {
  let component: NovoUsuario;
  let fixture: ComponentFixture<NovoUsuario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NovoUsuario],
    }).compileComponents();

    fixture = TestBed.createComponent(NovoUsuario);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
