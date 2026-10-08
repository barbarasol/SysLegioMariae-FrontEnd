import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  imports: [
    FormsModule
  ],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {

  email = '';
  senha = '';
  erro = '';
  carregando = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  entrar(): void {
    if (
      this.carregando ||
      !this.email.trim() ||
      !this.senha
    ) {
      return;
    }

    this.erro = '';
    this.carregando = true;

    this.authService
      .login(this.email, this.senha)
      .pipe(
        finalize(() => {
          this.carregando = false;
        })
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/home']);
        },
        error: (error: HttpErrorResponse) => {
          this.erro =
            error.error?.message ||
            'Não foi possível entrar. Verifique o e-mail e a senha.';
        }
      });
  }
}
