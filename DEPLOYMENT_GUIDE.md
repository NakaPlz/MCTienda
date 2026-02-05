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
    - `MANAGEMENT_WEBHOOK_URL`: `https://omni-crm...` (La URL que te dieron).
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

## 4. Verificar Conexión
1. Entra al dominio del **Frontend**.
2. Deberías ver tus productos.
3. Si sale error, revisa los logs del servicio Frontend para ver si falla la conexión a `http://backend:8000`.

## 5. Webhook Inbound (Para recibir stock)
Una vez desplegado el Backend, tu URL para configurar en la Plataforma de Gestión será:
`https://TU-DOMINIO-BACKEND/webhooks/products`
