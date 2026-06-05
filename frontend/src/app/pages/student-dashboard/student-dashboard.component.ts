import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Item } from '../../models/item';
import { Student } from '../../models/student';

@Component({
    selector: 'app-student-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './student-dashboard.component.html',
    styleUrls: ['./student-dashboard.component.css']
})
export class StudentDashboardComponent implements OnInit {
    description = '';
    imageFile: File | null = null;
    message = '';
    profileMessage = '';
    items: Item[] = [];
    studentMatricula = localStorage.getItem('student_matricula') || '';
    studentEmail = '';
    studentCourse = '';
    studentPhone = '';
    status = 'Perdido';
    studentProfile: Student | null = null;

    constructor(private api: ApiService, private router: Router) {
        if (localStorage.getItem('user_role') !== 'student') {
            this.router.navigate(['/']);
        }
    }

    ngOnInit() {
        this.loadProfile();
        this.loadItems();
    }

    loadProfile() {
        const storedProfile = localStorage.getItem('student_profile');
        if (storedProfile) {
            const profile = JSON.parse(storedProfile) as Student;
            this.studentProfile = profile;
            this.studentEmail = profile.email || '';
            this.studentCourse = profile.course || '';
            this.studentPhone = profile.phone || '';
        }

        if (!this.studentMatricula) {
            return;
        }

        this.api.getStudent(this.studentMatricula).subscribe({
            next: (student) => {
                this.studentProfile = student;
                this.studentEmail = student.email || '';
                this.studentCourse = student.course || '';
                this.studentPhone = student.phone || '';
                localStorage.setItem('student_profile', JSON.stringify(student));
            },
            error: () => {
                this.profileMessage = 'Não foi possível carregar os dados do aluno.';
            }
        });
    }

    loadItems() {
        this.api.getItems().subscribe({
            next: (data) => this.items = data,
            error: () => this.message = 'Não foi possível carregar o mural.'
        });
    }

    viewPublicItems() {
        this.router.navigate(['/items']);
    }

    selectFile(event: Event) {
        const element = event.target as HTMLInputElement;
        this.imageFile = element.files?.[0] || null;
    }

    saveProfile() {
        if (!this.studentMatricula) {
            this.profileMessage = 'Matrícula do aluno não encontrada.';
            return;
        }
        if (!this.studentEmail.trim() || !this.studentCourse.trim() || !this.studentPhone.trim()) {
            this.profileMessage = 'Preencha todos os campos do perfil.';
            return;
        }

        this.api.updateStudent(this.studentMatricula, {
            email: this.studentEmail,
            course: this.studentCourse,
            phone: this.studentPhone
        }).subscribe({
            next: () => {
                this.profileMessage = 'Perfil atualizado com sucesso.';
                const updatedProfile = {
                    matricula: this.studentMatricula,
                    email: this.studentEmail,
                    course: this.studentCourse,
                    phone: this.studentPhone
                };
                localStorage.setItem('student_profile', JSON.stringify(updatedProfile));
            },
            error: (err) => {
                this.profileMessage = err.error?.message || 'Erro ao atualizar o perfil.';
            }
        });
    }

    submit() {
        if (!this.description.trim()) {
            this.message = 'Descreva o item desaparecido antes de enviar.';
            return;
        }

        const formData = new FormData();
        formData.append('description', this.description.trim());
        formData.append('studentMatricula', this.studentMatricula);
        formData.append('status', this.status);
        if (this.imageFile) {
            formData.append('image', this.imageFile);
        }

        this.api.publicUploadItem(formData).subscribe({
            next: () => {
                this.description = '';
                this.imageFile = null;
                this.message = 'Publicação enviada com sucesso!';
                this.loadItems();
            },
            error: (err) => {
                this.message = err.error?.message || 'Erro ao publicar o item.';
            }
        });
    }

    logout() {
        localStorage.removeItem('user_role');
        localStorage.removeItem('student_matricula');
        localStorage.removeItem('student_token');
        localStorage.removeItem('student_profile');
        this.router.navigate(['/']);
    }
}
