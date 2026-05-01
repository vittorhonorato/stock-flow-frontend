import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovimentacaoListPageComponent } from './movimentacao-list-page.component';

describe('MovimentacaoListPageComponent', () => {
  let component: MovimentacaoListPageComponent;
  let fixture: ComponentFixture<MovimentacaoListPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MovimentacaoListPageComponent]
    });
    fixture = TestBed.createComponent(MovimentacaoListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
