import { Component, OnInit } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { map, Observable } from 'rxjs';

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
  isLoggedIn$: Observable<boolean> = new Observable();
  email: string = '';
  userPhoto: string = './assets/default-avatar.png';
  userName: string = '';
  isSidenavOpen: boolean = false;  // Controla el estado del sidenav
  previousUrl: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Verifica si el usuario está logueado
    this.isLoggedIn$ = this.authService.getAuthState().pipe(
      map(user => {
        if (user) {
          this.userName = user.email ? user.email.substring(0, 8) : 'Usuario';
          return true;
        } else {
          return false;
        }
      })
    );
  
    // Suscribirse al avatar$ para que el avatar se actualice en tiempo real
    this.authService.avatar$.subscribe(avatar => {
      this.userPhoto = avatar;
    });

    // Cerrar el sidenav cuando la ruta cambie
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        if (this.previousUrl !== event.urlAfterRedirects) {
          this.isSidenavOpen = false;
        }
        this.previousUrl = event.urlAfterRedirects;
      }
    });
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }  

  toggleSidenav() {
    this.isSidenavOpen = !this.isSidenavOpen;  // Al pulsar, se alterna entre abrir y cerrar el sidenav
  }
}
