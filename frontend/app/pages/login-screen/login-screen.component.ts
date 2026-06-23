import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Item } from '../../models/item';

@Component({
    selector: 'app-login-screen',
    standalone: true,
    imports: [CommonModule, FormsModule, DatePipe],
    templateUrl: './login-screen.component.html',
    styleUrls: ['./login-screen.component.css']
})
export class LoginScreenComponent implements OnInit {
    selectedRole: 'admin' | 'student' | '' = '';

    matricula = '';
    password = '';

    adminUsername = '';
    adminPassword = '';

    errorMessage = '';

    items: Item[] = [];
    itemsLoading = true;

    constructor(private router: Router, private api: ApiService) { }

    ngOnInit() {
        this.api.getItems().subscribe({
            next: (data) => { this.items = data; this.itemsLoading = false; },
            error: () => { this.itemsLoading = false; }
        });
    }

    chooseRole(role: 'admin' | 'student') {
        this.errorMessage = '';
        this.selectedRole = role;
    }

    resetSelection() {
        this.selectedRole = '';
        this.matricula = '';
        this.password = '';
        this.adminUsername = '';
        this.adminPassword = '';
        this.errorMessage = '';
    }

    onMatriculaChange(value: string) {
        this.matricula = value.replace(/\D/g, '').slice(0, 7);
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

    submitAdmin() {
        this.errorMessage = '';
        if (!this.adminUsername.trim() || !this.adminPassword.trim()) {
            this.errorMessage = 'Preencha usuário e senha.';
            return;
        }

        this.api.login(this.adminUsername, this.adminPassword).subscribe({
            next: (result) => {
                localStorage.setItem('access_token', result.token);
                this.router.navigate(['/admin/dashboard']);
            },
            error: (err) => {
                this.errorMessage = err.error?.message || 'Credenciais inválidas.';
            }
        });
    }

    viewItems() {
        this.router.navigate(['/items']);
    }
}
