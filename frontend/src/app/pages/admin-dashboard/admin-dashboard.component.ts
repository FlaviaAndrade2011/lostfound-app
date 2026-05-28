import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Item } from '../../models/item';

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
    imageFile: File | null = null;
    message = '';
    items: Item[] = [];

    editingId: number | null = null;
    editTitle = '';
    editDescription = '';
    editLocation = '';
    editDateLost = '';
    editImageFile: File | null = null;

    constructor(private api: ApiService, private router: Router) {
        if (!localStorage.getItem('access_token')) {
            this.router.navigate(['/admin/login']);
        }
    }

    ngOnInit() {
        this.loadItems();
    }

    loadItems() {
        this.api.getItems().subscribe({
            next: (data) => this.items = data,
            error: () => this.message = 'Não foi possível carregar os itens.'
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
        formData.append('image', this.imageFile);

        this.api.uploadItem(formData).subscribe({
            next: () => {
                this.message = 'Item carregado com sucesso!';
                this.title = '';
                this.description = '';
                this.location = '';
                this.dateLost = '';
                this.imageFile = null;
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
