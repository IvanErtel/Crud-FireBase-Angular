// import { Routes } from "@angular/router";

// export const routes: Routes = [

//     {
//         path: 'navbar',
//         loadComponent: () => import('../component/navbar/navbar.component'),
//         children: [
//             {
//                 path: 'clientes',
//                 title: 'clientes',
//                 loadComponent: () => import('../component/clientes/clientes.component')
//             },
//             {
//                 path: 'productos',
//                 title: 'productos',
//                 loadComponent: () => import('../component/productos/productos.component')
//             },
//             {
//                 path: 'proveedor',
//                 title: 'proveedores',
//                 loadComponent: () => import('../component/proveedores/proveedores.component')
//             },
//         ]
//     },
    
//     {
//         path: '', redirectTo: 'navbar', pathMatch: 'full',
//     },

//     { path: '**', redirectTo: 'navbar' }

// ];
import { Routes } from "@angular/router";
import { NavbarComponent } from "../component/navbar/navbar.component";
import { ClientesComponent } from "../component/clientes/clientes.component";
import { ProductosComponent } from "../component/productos/productos.component";
import { ProveedoresComponent } from "../component/proveedores/proveedores.component";
import { LoginComponent } from "../component/login/login.component";
import { AuthGuard } from "../guard/authGuard";

export const routes: Routes = [
    {
      path: '',
      component: NavbarComponent,
      children: [
        { path: 'clientes', component: ClientesComponent, title: 'Clientes', canActivate: [AuthGuard] },
        { path: 'login', component: LoginComponent, title: 'Login'},
        { path: 'productos', component: ProductosComponent, title: 'Productos', canActivate: [AuthGuard]},
        { path: 'proveedor', component: ProveedoresComponent, title: 'Proveedores', canActivate: [AuthGuard]},
        { path: '', redirectTo: 'login', pathMatch: 'full' },
      ]
    },
    { path: '**', redirectTo: '/' }
  ];