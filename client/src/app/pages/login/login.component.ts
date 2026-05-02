import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { timeout } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    console.log('Form valid:', this.loginForm.valid);
    console.log('Form values:', this.loginForm.value);

    if (this.loginForm.invalid) {
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    const { email, password } = this.loginForm.value;

    console.log('=== LOGIN REQUEST ===');
    console.log('Email:', email);
    console.log('=====================');

    console.log('Calling login API...');

    this.authService.login(email, password).pipe(
      timeout(10000) // 10 second timeout
    ).subscribe({
      next: (response) => {
        console.log('=== LOGIN SUCCESS ===');
        console.log('Response:', response);
        console.log('=====================');

        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err: HttpErrorResponse | any) => {
        console.error('=== LOGIN ERROR ===');
        console.error('Error status:', err.status);
        console.error('Error statusText:', err.statusText);
        console.error('Error body:', err.error);
        console.error('Full error:', err);
        console.error('===================');

        this.isLoading = false;
        if (err.name === 'TimeoutError') {
          this.errorMessage = 'Request timed out. Please check if the server is running.';
        } else if (err instanceof HttpErrorResponse) {
          if (err.status === 0) {
            this.errorMessage = 'Cannot connect to server. Please ensure the server is running on port 5000.';
          } else if (err.status === 401) {
            this.errorMessage = err.error?.message || 'Invalid credentials';
          } else {
            this.errorMessage = err.error?.message || `Login failed: ${err.statusText || 'Unknown error'}`;
          }
        } else {
          this.errorMessage = 'Login failed. Please try again.';
        }
      }
    });
  }

  onForgotPassword(event: Event): void {
    event.preventDefault();
    const email = this.loginForm.get('email')?.value;
    
    if (!email) {
      alert('Please enter your email address first, then click Forgot Password.');
      return;
    }
    
    if (!this.loginForm.get('email')?.valid) {
      alert('Please enter a valid email address.');
      return;
    }
    
    // In a real application, this would call a password reset API
    alert(`Password reset link has been sent to ${email}. Please check your email.`);
  }
}