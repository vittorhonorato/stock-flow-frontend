import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstoqueBaixoPageComponent } from './estoque-baixo-page.component';

describe('EstoqueBaixoPageComponent', () => {
  let component: EstoqueBaixoPageComponent;
  let fixture: ComponentFixture<EstoqueBaixoPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EstoqueBaixoPageComponent]
    });
    fixture = TestBed.createComponent(EstoqueBaixoPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
