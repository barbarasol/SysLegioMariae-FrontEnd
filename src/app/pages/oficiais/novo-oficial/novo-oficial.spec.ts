import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NovoOficial } from './novo-oficial';

describe('NovoOficial', () => {
  let component: NovoOficial;
  let fixture: ComponentFixture<NovoOficial>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NovoOficial],
    }).compileComponents();

    fixture = TestBed.createComponent(NovoOficial);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
