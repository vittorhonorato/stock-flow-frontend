import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FornecedorListPageComponent } from './fornecedor-list-page.component';

describe('FornecedorListPageComponent', () => {
  let component: FornecedorListPageComponent;
  let fixture: ComponentFixture<FornecedorListPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FornecedorListPageComponent]
    });
    fixture = TestBed.createComponent(FornecedorListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
