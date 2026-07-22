import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot
} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {

    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const role = localStorage.getItem('role');

    if (isLoggedIn !== 'true') {
      this.router.navigate(['/login']);
      return false;
    }

    // Role required by the route
    const expectedRole = route.data['role'];

    if (expectedRole && role !== expectedRole) {

      // Redirect according to current role
      if (role === 'admin') {
        this.router.navigate(['/admin']);
      } else if (role === 'staff') {
        this.router.navigate(['/staff']);
      } else {
        this.router.navigate(['/login']);
      }

      return false;
    }

    return true;
  }

}