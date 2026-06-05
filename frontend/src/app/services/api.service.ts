import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Item } from '../models/item';

const API_URL = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
    constructor(private http: HttpClient) { }

    login(username: string, password: string): Observable<any> {
        return this.http.post(`${API_URL}/auth/login`, { username, password });
    }

    studentLogin(matricula: string, password: string): Observable<any> {
        return this.http.post(`${API_URL}/auth/student-login`, { matricula, password });
    }

    getItems(): Observable<Item[]> {
        return this.http.get<Item[]>(`${API_URL}/items`);
    }

    uploadItem(data: FormData): Observable<any> {
        const token = localStorage.getItem('access_token');
        const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
        return this.http.post(`${API_URL}/items`, data, { headers });
    }

    publicUploadItem(data: FormData): Observable<any> {
        return this.http.post(`${API_URL}/items/public`, data);
    }

    updateItem(itemId: number, data: FormData): Observable<any> {
        const token = localStorage.getItem('access_token');
        const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
        return this.http.put(`${API_URL}/items/${itemId}`, data, { headers });
    }

    deleteItem(itemId: number): Observable<any> {
        const token = localStorage.getItem('access_token');
        const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
        return this.http.delete(`${API_URL}/items/${itemId}`, { headers });
    }

    getStudents(): Observable<any> {
        const token = localStorage.getItem('access_token');
        const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
        return this.http.get(`${API_URL}/students`, { headers });
    }

    createStudent(data: any): Observable<any> {
        const token = localStorage.getItem('access_token');
        const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
        return this.http.post(`${API_URL}/students`, data, { headers });
    }

    updateStudent(matricula: string, data: any): Observable<any> {
        const token = localStorage.getItem('access_token') || localStorage.getItem('student_token');
        const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
        const route = localStorage.getItem('access_token') ? `${API_URL}/students/${matricula}` : `${API_URL}/students/${matricula}/profile`;
        return this.http.put(route, data, { headers });
    }

    getStudent(matricula: string): Observable<any> {
        const token = localStorage.getItem('access_token') || localStorage.getItem('student_token');
        const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
        const route = localStorage.getItem('access_token') ? `${API_URL}/students/${matricula}` : `${API_URL}/students/${matricula}/profile`;
        return this.http.get(route, { headers });
    }

    deleteStudent(matricula: string): Observable<any> {
        const token = localStorage.getItem('access_token');
        const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
        return this.http.delete(`${API_URL}/students/${matricula}`, { headers });
    }
}
