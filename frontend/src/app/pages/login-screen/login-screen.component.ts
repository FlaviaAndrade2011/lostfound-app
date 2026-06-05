import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-login-screen',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './login-screen.component.html',
    styleUrls: ['./login-screen.component.css']
})
export class LoginScreenComponent {
    selectedRole: 'admin' | 'student' | '' = '';
    matricula = '';
    password = '';
    errorMessage = '';

    constructor(private router: Router, private api: ApiService) { }

    chooseRole(role: 'admin' | 'student') {
        this.errorMessage = '';
        this.selectedRole = role;
        if (role === 'admin') {
            this.router.navigate(['/admin/login']);
        }
    }

    onMatriculaChange(value: string) {
        const onlyDigits = value.replace(/\D/g, '');
        this.matricula = onlyDigits.slice(0, 7);
    }

    submitStudent() {
        this.errorMessage = '';
        if (!/^\d{7}$/.test(this.matricula)) {
            this.errorMessage = 'A matrícula deve ter exatamente 7 números.';
            return;
        }
        if (!this.password.trim()) {
            this.errorMessage = 'Informe sua senha.';
            return;
        }

        this.api.studentLogin(this.matricula, this.password).subscribe({
            next: (result) => {
                localStorage.setItem('user_role', 'student');
                localStorage.setItem('student_matricula', this.matricula);
                localStorage.setItem('student_token', result.token);
                localStorage.setItem('student_profile', JSON.stringify(result.student));
                this.router.navigate(['/student/dashboard']);
            },
            error: (err) => {
                this.errorMessage = err.error?.message || 'Falha no login do aluno. Verifique os dados.';
            }
        });
    }

    resetSelection() {
        this.selectedRole = '';
        this.matricula = '';
        this.password = '';
        this.errorMessage = '';
    }

    viewItems() {
        this.router.navigate(['/items']);
    }
}
