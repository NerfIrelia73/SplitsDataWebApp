import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LsTrueBalancedComponent } from './ls-true-balanced.component';

describe('LsTrueBalancedComponent', () => {
  let component: LsTrueBalancedComponent;
  let fixture: ComponentFixture<LsTrueBalancedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LsTrueBalancedComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LsTrueBalancedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
