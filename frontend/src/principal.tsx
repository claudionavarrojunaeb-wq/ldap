function Principal() {
	const logDescription = `ldap turnstile login backend frontend setup minimal patch files created

Resumen inicial: Implementación de login LDAP full-stack con Turnstile, validación de formatos de bind, ajustes UI (campo contraseña con ojo, fondo oscuro), y redirección post-login a la vista principal.

2026-04-28 00:00:00 Dev solicita: en este proyecto necesito conectar a ldap, el proyecto tiene frontend y backend, crea un acceso tipo login con ojo para ver la clave que se ingresa, además que intergre cloudflare turnstyle, hazlo lo más simple posible

Cambios realizados:
- Se añadió un backend minimal en \`backend/\` con \`index.js\`, \`package.json\` y \`.env.example\` para autenticación LDAP y verificación Cloudflare Turnstile.
- Se añadió el componente \`Login\` en \`frontend/src/Login.tsx\` y se actualizó \`frontend/src/App.tsx\` para usarlo.

2026-04-28 09:09:15 Dev solicita: para el ojito del password utiliza FaEyeSlash y usa este sitekey para turnstyle 0x4AAAAAADBOvtG73ncxE6hL

2026-04-28 09:09:15 Cambios realizados:
- Se agregó \`react-icons\` y se utilizó \`FaEyeSlash\` en \`frontend/src/Login.tsx\`.
- Se añadió \`frontend/.env\` con \`VITE_TURNSTILE_SITE_KEY=0x4AAAAAADBOvtG73ncxE6hL\`.

2026-04-28 09:12:00 Dev solicita: actualizar CORS_ORIGIN en backend para coincidir con puerto del frontend (5174) y reiniciar backend

2026-04-28 09:12:00 Cambios realizados:
- Se actualizó \`backend/.env\` cambiando \`CORS_ORIGIN\` a \`http://localhost:5174\`.
- Se reinició el servidor backend para recargar variables de entorno.

2026-04-28 09:20:00 Dev solicita: usar variables LDAP_URL, LDAP_DOMAIN y LDAP_BASE_DN desde \`.env\` en el backend

2026-04-28 09:20:00 Cambios realizados:
- Se actualizó \`backend/index.js\` para construir el DN del usuario usando, en orden de preferencia: \`LDAP_DN_TEMPLATE\` (si existe), \`username@LDAP_DOMAIN\` (si \`LDAP_DOMAIN\` existe), \`uid=username,LDAP_BASE_DN\` (si \`LDAP_BASE_DN\` existe), o un valor por defecto.
- Se marcó la configuración de LDAP como completada en la lista de tareas.

2026-04-28 09:32:00 Dev solicita: corregir prioridad de construcción de DN para usar \`LDAP_BASE_DN\` preferentemente y cambiar fondo del formulario a oscuro

2026-04-28 09:32:00 Cambios realizados:
- Se actualizó \`backend/index.js\` para preferir \`LDAP_BASE_DN\` al construir el DN del usuario y se añadió un \`console.log\` que muestra el DN usado en el intento de bind.
- Se actualizó \`frontend/src/App.css\` para usar un fondo oscuro en el formulario (\`#1f2937\`) y ajustar colores de labels, inputs y el botón ojo.
- Se añadió la clase \`.submit-button\` y se cambió el \`button\` de submit en \`frontend/src/Login.tsx\` para usarla.

2026-04-28 09:45:00 Dev solicita: corregir \`invalid-credentials\` pese a credenciales correctas

2026-04-28 09:45:00 Cambios realizados:
- Se implementó fallback de autenticación en \`backend/index.js\` para intentar múltiples formatos de principal LDAP: \`uid=<usuario>,<base_dn>\`, \`cn=<usuario>,<base_dn>\`, \`usuario@dominio\` y \`DOMINIO\\usuario\`.
- El endpoint \`POST /api/login\` ahora devuelve \`principal\` usado en caso de éxito para facilitar diagnóstico.
- Se mejoró el detalle del error cuando todos los formatos de bind fallan.

2026-04-28 09:52:00 Dev solicita: validar salida de logs LDAP tras prueba de login

2026-04-28 09:52:00 Resultado de validación:
- Conexión LDAP correcta a \`ldap://10.16.200.221:389\`.
- Bind exitoso en el intento 3 con formato UPN: \`claudio.navarro@junaeb.local\`.
- Login reportado como exitoso desde frontend.

2026-04-28 10:15:00 Dev solicita: make a simple page at principal.tsx, it contains only a title and description. Descripton take from D:\\_ReactU\\ReactU\\00_ldap\\log\\2026-04-28.md

2026-04-28 10:15:00 Cambios realizados:
- Se creó una página simple en \`frontend/src/principal.tsx\` con título \`Principal\`.
- La descripción se tomó desde el resumen del archivo de log: "Registro de la acción realizada al añadir login LDAP y Turnstile.".

2026-04-28 10:25:00 Dev solicita: when logon success on login.tsx, redirect to principal.tsx

2026-04-28 10:25:00 Cambios realizados:
- Se actualizó \`frontend/src/Login.tsx\` para redirigir a /principal al login exitoso.
- Se actualizó \`frontend/src/App.tsx\` para mostrar Principal cuando \`window.location.pathname\` es /principal.

2026-04-28 10:35:00 Dev solicita: vuelve a hacer el resumen del log

2026-04-28 10:35:00 Cambios realizados:
- Se rehizo la línea \`Resumen inicial\` para reflejar el estado consolidado del trabajo (LDAP, Turnstile, ajustes de UI y redirección post-login).`

	return (
		<main style={{ padding: '24px', textAlign: 'left' }}>
			<h1>Principal</h1>
			<p>
				Registro completo del log de trabajo de la sesión.
			</p>
			<pre style={{ whiteSpace: 'pre-wrap', lineHeight: 1.4, textAlign: 'left' }}>{logDescription}</pre>
		</main>
	)
}

export default Principal
