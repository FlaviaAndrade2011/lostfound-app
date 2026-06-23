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
    activeTab: 'profile' | 'publish' = 'profile';
    title = '';
    description = '';
    location = '';
    dateLost = '';
    showLocation = false;
    showDate = false;
    imageFile: File | null = null;
    selectedFileName = '';
    selectedEditFileName = '';
    message = '';
    profileMessage = '';
    studentMatricula = localStorage.getItem('student_matricula') || '';
    studentEmail = '';
    studentCourse = '';
    studentPhone = '';
    status = 'Perdido';
    studentProfile: Student | null = null;
    myItems: Item[] = [];
    myItemsMessage = '';
    editingItemId: number | null = null;
    editDescription = '';
    editStatus = 'Perdido';
    editImageFile: File | null = null;
    showPublishForm = false;

    get today(): string {
        return new Date().toISOString().split('T')[0];
    }

    get minDate(): string {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 1);
        return d.toISOString().split('T')[0];
    }

    private validateDate(date: string): string | null {
        if (!date) return null;
        const selected = new Date(date);
        const now = new Date();
        now.setHours(23, 59, 59, 999);
        const min = new Date();
        min.setFullYear(min.getFullYear() - 1);
        min.setHours(0, 0, 0, 0);
        if (selected > now) return 'A data não pode ser no futuro.';
        if (selected < min) return 'A data não pode ter mais de 1 ano no passado.';
        return null;
    }

    constructor(private api: ApiService, private router: Router) {
        if (localStorage.getItem('user_role') !== 'student') {
            this.router.navigate(['/']);
        }
    }

    ngOnInit() {
        this.loadProfile();
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

    setActiveTab(tab: 'profile' | 'publish') {
        this.activeTab = tab;
        this.message = '';
        this.profileMessage = '';
        this.myItemsMessage = '';
        if (tab === 'publish') {
            this.loadMyItems();
        }
    }

    loadMyItems() {
        this.api.getMyStudentItems().subscribe({
            next: (items) => {
                this.myItems = items;
            },
            error: (err) => {
                this.myItemsMessage = err.error?.message || 'Não foi possível carregar seus itens publicados.';
            }
        });
    }

    viewPublicItems() {
        this.router.navigate(['/items']);
    }

    selectFile(event: Event) {
        const element = event.target as HTMLInputElement;
        this.imageFile = element.files?.[0] || null;
        this.selectedFileName = this.imageFile?.name || '';
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
        if (!/^\d{11}$/.test(this.studentPhone)) {
            this.profileMessage = 'Telefone inválido. Use DDD (2 dígitos) + número (9 dígitos).';
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
            this.message = 'Descreva o item antes de enviar.';
            return;
        }

        if (this.showDate) {
            const dateError = this.validateDate(this.dateLost);
            if (dateError) { this.message = dateError; return; }
        }

        const formData = new FormData();
        formData.append('title', this.title.trim() || 'Publicação de Aluno');
        formData.append('description', this.description.trim());
        formData.append('studentMatricula', this.studentMatricula);
        formData.append('status', this.status);
        if (this.showLocation && this.location.trim()) {
            formData.append('location', this.location.trim());
        }
        if (this.showDate && this.dateLost) {
            formData.append('dateLost', this.dateLost);
        }
        if (this.imageFile) {
            formData.append('image', this.imageFile);
        }

        this.api.publicUploadItem(formData).subscribe({
            next: () => {
                this.title = '';
                this.description = '';
                this.location = '';
                this.dateLost = '';
                this.showLocation = false;
                this.showDate = false;
                this.imageFile = null;
                this.selectedFileName = '';
                this.message = 'Publicação enviada com sucesso!';
                this.loadMyItems();
            },
            error: (err) => {
                this.message = err.error?.message || 'Erro ao publicar o item.';
            }
        });
    }

    startEditItem(item: Item) {
        this.editingItemId = item.id;
        this.editDescription = item.description || '';
        this.editStatus = item.status || 'Perdido';
        this.editImageFile = null;
        this.myItemsMessage = '';
    }

    selectEditFile(event: Event) {
        const element = event.target as HTMLInputElement;
        this.editImageFile = element.files?.[0] || null;
        this.selectedEditFileName = this.editImageFile?.name || '';
    }

    saveItemEdit() {
        if (!this.editingItemId) return;
        if (!this.editDescription.trim()) {
            this.myItemsMessage = 'A descrição é obrigatória para atualizar a publicação.';
            return;
        }

        const formData = new FormData();
        formData.append('description', this.editDescription.trim());
        formData.append('status', this.editStatus);
        if (this.editImageFile) {
            formData.append('image', this.editImageFile);
        }

        this.api.updateMyStudentItem(this.editingItemId, formData).subscribe({
            next: () => {
                this.myItemsMessage = 'Publicação atualizada com sucesso.';
                this.cancelEditItem();
                this.loadMyItems();
            },
            error: (err) => {
                this.myItemsMessage = err.error?.message || 'Erro ao atualizar publicação.';
            }
        });
    }

    cancelEditItem() {
        this.editingItemId = null;
        this.editDescription = '';
        this.editStatus = 'Perdido';
        this.editImageFile = null;
        this.selectedEditFileName = '';
    }

    deleteItem(itemId: number) {
        this.api.deleteMyStudentItem(itemId).subscribe({
            next: () => {
                this.myItemsMessage = 'Publicação excluída com sucesso.';
                if (this.editingItemId === itemId) {
                    this.cancelEditItem();
                }
                this.loadMyItems();
            },
            error: (err) => {
                this.myItemsMessage = err.error?.message || 'Erro ao excluir publicação.';
            }
        });
    }

    onPhoneChange(value: string) {
        this.studentPhone = value.replace(/\D/g, '').slice(0, 11);
    }

    logout() {
        localStorage.removeItem('user_role');
        localStorage.removeItem('student_matricula');
        localStorage.removeItem('student_token');
        localStorage.removeItem('student_profile');
        this.router.navigate(['/']);
    }
}
