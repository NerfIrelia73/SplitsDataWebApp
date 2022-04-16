import { TestBed } from '@angular/core/testing';

import { DataMapService } from './data-map.service';

describe('DataMapService', () => {
  let service: DataMapService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataMapService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
