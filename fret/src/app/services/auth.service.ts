import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, tap, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:9090/auth';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private userRoleSubject = new BehaviorSubject<string | null>(null);

  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  userRole$ = this.userRoleSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: { username: string; password: string }) {
    return this.http.post<{ 
      token: string, 
      role: string,
      username: string,
      message: string
    }>(`${this.API_URL}/login`, credentials).pipe(
      tap(response => {
        if (!response.token || !this.isValidToken(response.token)) {
          throw new Error('Invalid token received');
        }
        
        localStorage.setItem('token', response.token);
        localStorage.setItem('username', response.username);
        localStorage.setItem('role', response.role);
        
        this.isAuthenticatedSubject.next(true);
        this.userRoleSubject.next(response.role);
        
        this.navigateByRole(response.role);
      }),
      catchError(error => {
        this.clearAuthData();
        this.setAuthState(false, null);
        return throwError(() => error.error?.message || 'Login failed');
      })
    );
  }

  logout() {
    this.clearAuthData();
    this.setAuthState(false, null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && this.isValidToken(token);
  }

  private isValidToken(token: string): boolean {
    try {
      const parts = token.split('.');
      return parts.length === 3 
        && parts[0].length > 0 
        && parts[1].length > 0 
        && parts[2].length > 0;
    } catch {
      return false;
    }
  }

  private storeAuthData(response: { token: string, role: string, username: string }): void {
    localStorage.setItem('token', response.token);
    localStorage.setItem('username', response.username);
    localStorage.setItem('role', response.role);
  }

  private clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
  }

  private setAuthState(isAuthenticated: boolean, role: string | null): void {
    this.isAuthenticatedSubject.next(isAuthenticated);
    this.userRoleSubject.next(role);
  }

  private navigateByRole(role: string): void {
    role = role?.toUpperCase();
    if (role === 'ADMIN') {
      this.router.navigate(['/admin-dashboard']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}