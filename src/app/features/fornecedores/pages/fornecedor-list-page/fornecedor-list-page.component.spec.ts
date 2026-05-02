import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { FornecedorListPageComponent } from './fornecedor-list-page.component';

describe('FornecedorListPageComponent', () => {
  let component: FornecedorListPageComponent;
  let fixture: ComponentFixture<FornecedorListPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FornecedorListPageComponent],
      imports: [HttpClientTestingModule, ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(FornecedorListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
