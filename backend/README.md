Instalación y ejecución del backend minimal para autenticación LDAP

1. Crear un `.env` basado en `.env.example` y ajustar valores (LDAP_URL, TURNSTILE_SECRET).
2. Instalar dependencias:

```
cd backend
npm install
```

3. Ejecutar el servidor:

```
npm start
```

El servidor expone `POST /api/login` que espera JSON `{ username, password, token }`.
Si `TURNSTILE_SECRET` no está configurado, la verificación de Turnstile se omite (útil para desarrollo).
