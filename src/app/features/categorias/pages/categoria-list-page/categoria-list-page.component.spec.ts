import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoriaListPageComponent } from './categoria-list-page.component';

describe('CategoriaListPageComponent', () => {
  let component: CategoriaListPageComponent;
  let fixture: ComponentFixture<CategoriaListPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CategoriaListPageComponent]
    });
    fixture = TestBed.createComponent(CategoriaListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
