import { Component, OnInit } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    MatListModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    RouterModule,
    CommonModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  isLoggedIn: boolean = false;
  email: string = '';
  isSidenavOpen: boolean = false;  // Controla el estado del sidenav
  previousUrl: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Cerrar el sidenav cuando la ruta cambie, pero solo si la ruta actual es diferente de la previa
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        // Solo cerrar si la ruta ha cambiado
        if (this.previousUrl !== event.urlAfterRedirects) {
          this.isSidenavOpen = false;
        }
        this.previousUrl = event.urlAfterRedirects;
      }
    });
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.isLoggedIn = false;
      this.router.navigate(['/login']);
    });
  }

  toggleSidenav() {
    this.isSidenavOpen = !this.isSidenavOpen;  // Al pulsar, se alterna entre abrir y cerrar el sidenav
  }
}
