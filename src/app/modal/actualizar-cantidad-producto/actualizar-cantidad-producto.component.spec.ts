import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActualizarCantidadProductoComponent } from './actualizar-cantidad-producto.component';

describe('ActualizarCantidadProductoComponent', () => {
  let component: ActualizarCantidadProductoComponent;
  let fixture: ComponentFixture<ActualizarCantidadProductoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActualizarCantidadProductoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ActualizarCantidadProductoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
