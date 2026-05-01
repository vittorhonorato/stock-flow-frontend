import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProdutoListPageComponent } from './produto-list-page.component';

describe('ProdutoListPageComponent', () => {
  let component: ProdutoListPageComponent;
  let fixture: ComponentFixture<ProdutoListPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProdutoListPageComponent]
    });
    fixture = TestBed.createComponent(ProdutoListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
