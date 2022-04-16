import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LsDataComponent } from './ls-statistics.component';

describe('LsDataComponent', () => {
  let component: LsDataComponent;
  let fixture: ComponentFixture<LsDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LsDataComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LsDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
