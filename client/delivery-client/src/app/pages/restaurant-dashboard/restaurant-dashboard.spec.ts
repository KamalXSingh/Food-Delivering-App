import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestaurantDashboard } from './restaurant-dashboard';

describe('RestaurantDashboard', () => {
  let component: RestaurantDashboard;
  let fixture: ComponentFixture<RestaurantDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestaurantDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(RestaurantDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
