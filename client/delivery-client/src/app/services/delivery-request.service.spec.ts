import { TestBed } from '@angular/core/testing';

import { DeliveryRequestService } from './delivery-request.service';

describe('DeliveryRequestService', () => {
  let service: DeliveryRequestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeliveryRequestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
