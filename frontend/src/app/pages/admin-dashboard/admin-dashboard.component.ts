import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Item } from '../../models/item';
import { Student } from '../../models/student';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './admin-dashboard.component.html',
    styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
    title = '';
    description = '';
    location = '';
    dateLost = '';
    status = 'Achado';
    imageFile: File | null = null;
    message = '';
    items: Item[] = [];
    students: Student[] = [];
    currentView: 'posts' | 'students' = 'posts';
    showItemForm = false;
    showStudentForm = false;

    editingId: number | null = null;
    editTitle = '';
    editDescription = '';
    editLocation = '';
    editDateLost = '';
    editStatus = 'Achado';
    editImageFile: File | null = null;

    studentMatricula = '';
    studentEmail = '';
    studentCourse = '';
    studentPhone = '';
    studentPassword = '';
    studentMessage = '';
    editingStudentMatricula: string | null = null;

    constructor(private api: ApiService, private router: Router) {
        if (!localStorage.getItem('access_token')) {
            this.router.navigate(['/admin/login']);
        }
    }

    ngOnInit() {
        this.loadItems();
        this.loadStudents();
    }

    setView(view: 'posts' | 'students') {
        this.currentView = view;
        this.message = '';
        this.studentMessage = '';
        this.showItemForm = false;
        this.showStudentForm = false;
        this.editingId = null;
        this.editingStudentMatricula = null;

        if (view === 'students') {
            this.loadStudents();
        }
    }

    loadItems() {
        this.api.getItems().subscribe({
            next: (data) => this.items = data,
            error: () => this.message = 'Não foi possível carregar os itens.'
        });
    }

    loadStudents() {
        this.api.getStudents().subscribe({
            next: (data) => this.students = data,
            error: () => this.studentMessage = 'Não foi possível carregar os alunos.'
        });
    }

    selectFile(event: Event) {
        const element = event.target as HTMLInputElement;
        this.imageFile = element.files?.[0] || null;
    }

    submit() {
        if (!this.imageFile) {
            this.message = 'Por favor, selecione uma imagem do item.';
            return;
        }

        const formData = new FormData();
        formData.append('title', this.title);
        formData.append('description', this.description);
        formData.append('location', this.location);
        formData.append('dateLost', this.dateLost);
        formData.append('status', this.status);
        formData.append('image', this.imageFile);

        this.api.uploadItem(formData).subscribe({
            next: () => {
                this.message = 'Item carregado com sucesso!';
                this.title = '';
                this.description = '';
                this.location = '';
                this.dateLost = '';
                this.imageFile = null;
                this.showItemForm = false;
                this.loadItems();
            },
            error: (err) => {
                this.message = err.error?.message || 'Erro ao enviar item.';
            }
        });
    }

    deleteItem(itemId: number) {
        if (!itemId) {
            this.message = 'Item ID inválido.';
            return;
        }
        this.api.deleteItem(itemId).subscribe({
            next: () => {
                this.message = 'Item excluído com sucesso.';
                this.items = this.items.filter(item => item.id !== itemId);
            },
            error: (err) => {
                console.error('Delete error:', err);
                this.message = err.error?.message || 'Erro ao excluir item.';
            }
        });
    }

    startEdit(item: Item) {
        this.editingId = item.id;
        this.editTitle = item.title;
        this.editDescription = item.description;
        this.editLocation = item.location;
        this.editDateLost = item.date_lost;
        this.editStatus = item.status || 'Achado';
        this.editImageFile = null;
        this.currentView = 'posts';
        this.showItemForm = true;
    }

    selectEditFile(event: Event) {
        const element = event.target as HTMLInputElement;
        this.editImageFile = element.files?.[0] || null;
    }

    updateItem() {
        if (!this.editingId) return;

        const formData = new FormData();
        formData.append('title', this.editTitle);
        formData.append('description', this.editDescription);
        formData.append('location', this.editLocation);
        formData.append('dateLost', this.editDateLost);
        formData.append('status', this.editStatus);
        if (this.editImageFile) {
            formData.append('image', this.editImageFile);
        }

        this.api.updateItem(this.editingId, formData).subscribe({
            next: () => {
                this.message = 'Item atualizado com sucesso!';
                this.editingId = null;
                this.editTitle = '';
                this.editDescription = '';
                this.editLocation = '';
                this.editDateLost = '';
                this.editImageFile = null;
                this.showItemForm = false;
                this.loadItems();
            },
            error: (err) => {
                this.message = err.error?.message || 'Erro ao atualizar item.';
            }
        });
    }

    cancelEdit() {
        this.editingId = null;
        this.editTitle = '';
        this.editDescription = '';
        this.editLocation = '';
        this.editDateLost = '';
        this.editImageFile = null;
    }

    editStudent(student: Student) {
        this.editingStudentMatricula = student.matricula;
        this.studentMatricula = student.matricula;
        this.studentEmail = student.email;
        this.studentCourse = student.course;
        this.studentPhone = student.phone;
        this.studentPassword = '';
        this.showStudentForm = true;
        this.currentView = 'students';
    }

    saveStudent() {
        if (!this.studentMatricula.trim() || !this.studentEmail.trim() || !this.studentCourse.trim() || !this.studentPhone.trim()) {
            this.studentMessage = 'Preencha todos os dados do aluno.';
            return;
        }

        const payload: any = {
            matricula: this.studentMatricula,
            email: this.studentEmail,
            course: this.studentCourse,
            phone: this.studentPhone
        };

        if (!this.editingStudentMatricula && !this.studentPassword.trim()) {
            this.studentMessage = 'A senha do aluno é obrigatória para cadastro.';
            return;
        }

        if (this.studentPassword.trim()) {
            payload.password = this.studentPassword.trim();
        }

        if (this.editingStudentMatricula) {
            this.api.updateStudent(this.editingStudentMatricula, payload).subscribe({
                next: () => {
                    this.studentMessage = 'Aluno atualizado com sucesso.';
                    this.editingStudentMatricula = null;
                    this.clearStudentForm();
                    this.loadStudents();
                },
                error: (err) => {
                    this.studentMessage = err.error?.message || 'Erro ao atualizar aluno.';
                }
            });
            return;
        }

        this.api.createStudent(payload).subscribe({
            next: () => {
                this.studentMessage = 'Aluno cadastrado com sucesso.';
                this.clearStudentForm();
                this.currentView = 'students';
                this.loadStudents();
            },
            error: (err) => {
                this.studentMessage = err.error?.message || 'Erro ao cadastrar aluno.';
            }
        });
    }

    deleteStudent(matricula: string) {
        if (!matricula) {
            this.studentMessage = 'Matrícula inválida.';
            return;
        }
        this.api.deleteStudent(matricula).subscribe({
            next: () => {
                this.studentMessage = 'Aluno excluído com sucesso.';
                this.loadStudents();
            },
            error: (err) => {
                this.studentMessage = err.error?.message || 'Erro ao excluir aluno.';
            }
        });
    }

    clearStudentForm() {
        this.studentMatricula = '';
        this.studentEmail = '';
        this.studentCourse = '';
        this.studentPhone = '';
        this.studentPassword = '';
        this.editingStudentMatricula = null;
        this.showStudentForm = false;
    }

    toggleItemForm() {
        this.showItemForm = !this.showItemForm;
        this.showStudentForm = false;
        this.editingId = null;
    }

    toggleStudentForm() {
        this.showStudentForm = !this.showStudentForm;
        this.showItemForm = false;
        this.editingStudentMatricula = null;
    }

    navigateToItems() {
        this.router.navigate(['/items']);
    }

    clearForm() {
        this.title = '';
        this.description = '';
        this.location = '';
        this.dateLost = '';
        this.imageFile = null;
    }

    logout() {
        localStorage.removeItem('access_token');
        this.router.navigate(['/admin/login']);
    }
}
