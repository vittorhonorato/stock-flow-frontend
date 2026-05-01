import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstoqueMovimentacaoPageComponent } from './estoque-movimentacao-page.component';

describe('EstoqueMovimentacaoPageComponent', () => {
  let component: EstoqueMovimentacaoPageComponent;
  let fixture: ComponentFixture<EstoqueMovimentacaoPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EstoqueMovimentacaoPageComponent]
    });
    fixture = TestBed.createComponent(EstoqueMovimentacaoPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
