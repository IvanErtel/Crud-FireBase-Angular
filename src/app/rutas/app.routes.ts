
import { Routes } from "@angular/router";
import { NavbarComponent } from "../component/navbar/navbar.component";
import { ClientesComponent } from "../component/clientes/clientes.component";
import { ProductosComponent } from "../component/productos/productos.component";
import { ProveedoresComponent } from "../component/proveedores/proveedores.component";
import { LoginComponent } from "../component/login/login.component";
import { AuthGuard } from "../guard/authGuard";
import { VentasComponent } from "../component/ventas/ventas.component";

export const routes: Routes = [
    {
      path: '',
      component: NavbarComponent,
      children: [
        { path: 'clientes', component: ClientesComponent, title: 'Clientes', canActivate: [AuthGuard] },
        { path: 'login', component: LoginComponent, title: 'Login'},
        { path: 'productos', component: ProductosComponent, title: 'Productos', canActivate: [AuthGuard]},
        { path: 'ventas', component: VentasComponent, title: 'Proveedores', canActivate: [AuthGuard]},
        { path: 'proveedor', component: ProveedoresComponent, title: 'Proveedores', canActivate: [AuthGuard]},
        { path: '', redirectTo: 'login', pathMatch: 'full' },
      ]
    },
    { path: '**', redirectTo: '/' }
  ];