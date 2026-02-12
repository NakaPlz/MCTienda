# Guía de Despliegue en Easypanel

Sigue estos pasos exactos para configurar tu "Tienda Muy Criollo" en Easypanel.

## 1. Crear Proyecto
1. En el Dashboard de Easypanel, crea un **Nuevo Proyecto**.
2. Llámalo: `Tienda Muy Criollo` (o como prefieras).
3. Dentro de este proyecto crearás **2 Servicios** (Applications).

---

## 2. Servicio Backend (API)
Crea una nueva "Application" (Servicio) dentro del proyecto.

- **Name**: `backend`
- **Source**:
    - **Repository**: `https://github.com/TU_USUARIO/tienda-muy-criollo` (La URL de tu repo).
    - **Build Path**: `/backend` (Importante: define la carpeta raíz del backend).
- **Build**:
    - **Docker Image**: Dejar en blanco (usará el Dockerfile del repo).
- **Environment** (Variables de Entorno):
    - `DATABASE_URL`: `sqlite:////app/data/tienda.db` (Nota: 4 barras para ruta absoluta).
    - `MERCADOPAGO_ACCESS_TOKEN`: `Tu_Token_De_Prod_O_Test`
    - `MANAGEMENT_WEBHOOK_URL` (Opcional): URL de tu sistema Dragonfish.
    - `FRONTEND_URL`: `https://TU-DOMINIO-FRONTEND` (Sin barra al final).
    - **Emails (SMTP)**:
        - `MAIL_SERVER`: `smtp.gmail.com`
        - `MAIL_PORT`: `587`
        - `MAIL_USERNAME`: `tu-email@gmail.com` (Usa una Contraseña de Aplicación)
        - `MAIL_PASSWORD`: `tu-contraseña-aplicación`
        - `ADMIN_EMAIL`: `muycriolloarg@gmail.com`
- **Storage** (Volúmenes):
    - **Mount Path**: `/app/data` (Debe coincidir con la carpeta de la DB).
- **Network**:
    - **Port**: `8000` (Debe coincidir con nuestro Dockerfile).
    - Habilita el dominio público (ej: `api.tutienda.com` o el que genera Easypanel).

---

## 3. Servicio Frontend (Next.js)
Crea otra "Application" (Servicio) dentro del mismo proyecto.

- **Name**: `frontend`
- **Source**:
    - **Repository**: Misma URL del repo.
    - **Build Path**: `/frontend`
- **Environment**:
    - `BACKEND_INTERNAL_URL`: `http://backend:8000` 
        - *Nota: "backend" es el nombre del servicio que creamos arriba. Esto permite que el servidor de Next.js le hable al API internamente.*
- **Network**:
    - **Port**: `3000`.
    - Habilita el dominio público (ej: `tutienda.com`).

---


---

## 4. Servicio Admin (Panel de Control)
Crea una tercera "Application" (Servicio) para el panel administrativo.

- **Name**: `admin`
- **Source**:
    - **Repository**: Misma URL del repo.
    - **Build Path**: `/admin`
- **Build**:
    - **Docker Image**: Dejar en blanco (Easypanel detectará Next.js/Node automáticamente).
- **Environment**:
    - `NEXT_PUBLIC_API_URL`: `https://TU-DOMINIO-BACKEND` (URL pública del backend, igual que en frontend pero pública para el navegador).
    - *Nota: El admin se comunica con el backend PRINCIPALMENTE desde el navegador (Client Components), por lo que necesita la URL pública.*
- **Network**:
    - **Port**: `3000` (Next.js default).
    - Habilita el dominio público (ej: `admin.tutienda.com`).

---

## 5. Verificar Conexión
1. Entra al dominio del **Frontend**.
2. Deberías ver tus productos.
3. Entra al dominio del **Admin**.
4. Loguéate con la contraseña configurada en `ADMIN_PASSWORD` del Backend.

## 6. Webhook Inbound (Para recibir stock)
Una vez desplegado el Backend, tu URL para configurar en la Plataforma de Gestión será:
`https://TU-DOMINIO-BACKEND/webhooks/products`

