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
    readonly status = 'Achado';
    imageFile: File | null = null;
    selectedFileName = '';
    selectedEditFileName = '';
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

    get today(): string {
        return new Date().toISOString().split('T')[0];
    }

    get minDate(): string {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 1);
        return d.toISOString().split('T')[0];
    }

    private validateDate(date: string, fieldLabel = 'data'): string | null {
        if (!date) return null;
        const selected = new Date(date);
        const now = new Date();
        now.setHours(23, 59, 59, 999);
        const min = new Date();
        min.setFullYear(min.getFullYear() - 1);
        min.setHours(0, 0, 0, 0);
        if (selected > now) return `A ${fieldLabel} não pode ser no futuro.`;
        if (selected < min) return `A ${fieldLabel} não pode ter mais de 1 ano no passado.`;
        return null;
    }

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
        this.selectedFileName = this.imageFile?.name || '';
    }

    submit() {
        if (!this.imageFile) {
            this.message = 'Por favor, selecione uma imagem do item.';
            return;
        }

        const dateError = this.validateDate(this.dateLost, 'data do item');
        if (dateError) { this.message = dateError; return; }

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
        this.editImageFile = null;
        this.currentView = 'posts';
        this.showItemForm = true;
    }

    selectEditFile(event: Event) {
        const element = event.target as HTMLInputElement;
        this.editImageFile = element.files?.[0] || null;
        this.selectedEditFileName = this.editImageFile?.name || '';
    }

    updateItem() {
        if (!this.editingId) return;

        const dateError = this.validateDate(this.editDateLost, 'data do item');
        if (dateError) { this.message = dateError; return; }

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
        this.studentMatricula = this.studentMatricula.replace(/\D/g, '').slice(0, 7);
        this.studentPhone = this.studentPhone.replace(/\D/g, '').slice(0, 11);

        if (!this.studentMatricula.trim() || !this.studentEmail.trim() || !this.studentCourse.trim() || !this.studentPhone.trim()) {
            this.studentMessage = 'Preencha todos os dados do aluno.';
            return;
        }
        if (!/^\d{7}$/.test(this.studentMatricula)) {
            this.studentMessage = 'A matrícula deve conter exatamente 7 números.';
            return;
        }
        if (!/^\d{11}$/.test(this.studentPhone)) {
            this.studentMessage = 'O telefone deve conter DDD (2 dígitos) + número (9 dígitos).';
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

    onStudentMatriculaChange(value: string) {
        this.studentMatricula = value.replace(/\D/g, '').slice(0, 7);
    }

    onStudentPhoneChange(value: string) {
        this.studentPhone = value.replace(/\D/g, '').slice(0, 11);
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
        this.router.navigate(['/']);
    }
}
