import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryPartnerDashboard } from './delivery-partner-dashboard';

describe('DeliveryPartnerDashboard', () => {
  let component: DeliveryPartnerDashboard;
  let fixture: ComponentFixture<DeliveryPartnerDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeliveryPartnerDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(DeliveryPartnerDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
