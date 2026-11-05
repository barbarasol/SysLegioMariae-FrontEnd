import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Oficiais } from './oficiais';

describe('Oficiais', () => {
  let component: Oficiais;
  let fixture: ComponentFixture<Oficiais>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Oficiais],
    }).compileComponents();

    fixture = TestBed.createComponent(Oficiais);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
