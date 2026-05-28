# Lost & Found Backend

API em Node.js + Express para o site de achados e perdidos.

## Configuração

1. Instale dependências:

```bash
cd backend
npm install
```

2. Configure o banco MySQL e crie o banco:

```sql
CREATE DATABASE lostfound;
USE lostfound;

CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  date_lost DATE,
  image_url VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

3. Crie um admin manualmente com hash bcrypt ou use o script de seed.

4. Copie `.env.example` para `.env` e ajuste as variáveis.
   - Se ainda não houver nenhum admin, o backend pode criar um admin padrão automaticamente.
   - Usuário padrão: `admin`
   - Senha padrão: `admin123`

## Endpoints

- `POST /api/auth/login` - login do ADM
- `GET /api/items` - lista itens perdidos
- `POST /api/items` - adiciona item perdido (admin autenticado)

## Upload de imagens

As imagens são salvas em `backend/uploads` e servidas em `/uploads`.
