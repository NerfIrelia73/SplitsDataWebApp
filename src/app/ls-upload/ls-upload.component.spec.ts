import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LsUploadComponent } from './ls-upload.component';

describe('LsUploadComponent', () => {
  let component: LsUploadComponent;
  let fixture: ComponentFixture<LsUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LsUploadComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LsUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
