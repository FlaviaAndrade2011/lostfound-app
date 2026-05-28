import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Item } from '../../models/item';

@Component({
    selector: 'app-items-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './items-list.component.html',
    styleUrls: ['./items-list.component.css']
})
export class ItemsListComponent implements OnInit {
    items: Item[] = [];
    error = '';

    constructor(private api: ApiService) { }

    ngOnInit() {
        this.api.getItems().subscribe({
            next: (data) => this.items = data,
            error: () => this.error = 'Falha ao carregar itens.'
        });
    }
}
