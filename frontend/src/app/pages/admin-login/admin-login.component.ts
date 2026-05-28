import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-admin-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './admin-login.component.html',
    styleUrls: ['./admin-login.component.css']
})
export class AdminLoginComponent {
    username = '';
    password = '';
    errorMessage = '';

    constructor(private api: ApiService, private router: Router) { }

    submit() {
        this.errorMessage = '';
        this.api.login(this.username, this.password).subscribe({
            next: (result) => {
                localStorage.setItem('access_token', result.token);
                this.router.navigate(['/admin/dashboard']);
            },
            error: (err) => {
                this.errorMessage = err.error?.message || 'Falha no login. Verifique credenciais.';
            }
        });
    }
}
