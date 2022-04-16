import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalBestComponent } from './personal-best.component';

describe('PersonalBestComponent', () => {
  let component: PersonalBestComponent;
  let fixture: ComponentFixture<PersonalBestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PersonalBestComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PersonalBestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
