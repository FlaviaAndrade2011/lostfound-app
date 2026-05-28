# Lost & Found App

Projeto de achados e perdidos com backend Node.js + MySQL e frontend Angular.

## Estrutura

- `backend/` - API Express, upload de imagens e autenticação de ADM
- `frontend/` - app Angular separado consumindo a API

## Instruções rápidas

1. Configure o banco MySQL e crie as tabelas descritas em `backend/README.md`.
2. Copie `backend/.env.example` para `backend/.env`.
3. Instale dependências:

```bash
cd backend
npm install
cd ../frontend
npm install
```

4. Inicie o backend:

```bash
cd backend
npm start
```

5. Inicie o frontend:

```bash
cd ../frontend
npm start
```

6. Abra no navegador:

- Frontend: `http://localhost:4200`
- Backend: `http://localhost:3000`
