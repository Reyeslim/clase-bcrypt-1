# Sprint 10 · Live 1 — Autenticación con bcrypt y JWT

> **Objetivo de la Clase**
> Implementar un sistema de autenticación en Express usando `bcrypt` para proteger contraseñas, `JWT` para gestionar sesiones y middlewares para proteger rutas según el rol del usuario.
> Los usuarios están almacenados en la tabla `users` de Supabase creada en el Sprint 9.

---

## 📂 Estructura del Proyecto

```text
10-live-1/
├── .env               # Credenciales (NO subir a GitHub)
├── .env.example       # Plantilla de variables
├── .gitignore
├── package.json
├── prisma/
│   └── schema.prisma  # Esquema de Prisma de la base de datos
├── scripts/
│   └── seed.js        # Script para insertar usuarios de prueba en Supabase
└── src/
    ├── server.js
    ├── lib/
    │   └── prisma.js          # Inicialización de Prisma Client
    ├── routes/
    │   └── authRoutes.js
    ├── controllers/
    │   └── auth.js
    ├── services/
    │   └── auth.js
    └── middlewares/
        ├── authMiddleware.js    # Verifica el token JWT
        └── requireRole.js      # Controla acceso por rol

```

---

## Bloque 1 · Teoría (20 min)

### 1.1 ¿Qué es la Autenticación?

La autenticación permite que un servidor identifique **quién** es el usuario que hace una petición.

**Flujo básico:**

```text
Usuario envía email + contraseña
        ↓
Servidor verifica los datos
        ↓
Servidor genera un TOKEN
        ↓
Cliente guarda el token y lo envía en cada petición

```

---

### 1.2 ¿Por qué no guardar contraseñas en texto plano?

```js
// ❌ NUNCA hacer esto
{ email: "ana@example.com", password: "123456" }

```

Si la base de datos se filtra, todas las contraseñas quedan expuestas.

**Solución: usar `bcrypt**`

`bcrypt` convierte la contraseña en un **hash irreversible**:

```text
"123456" → "$2b$10$kZpq7rHv..." (hash)

```

```js
// Registrar usuario
const plainPassword = "Ana123!!"
const hash = await bcrypt.hash(plainPassword, 10)
// hash = '$2b$10$kZpq7rHv....' (imposible revertir)

// Login: comparar contraseña con hash
const isValid = await bcrypt.compare(plainPassword, hash)
// isValid = true (si coincide)
```

Cuando el usuario hace login, se compara la contraseña introducida con el hash guardado. Si coincide, se permite el acceso.

💡 **¿Por qué bcrypt es seguro?**

- `bcrypt` añade un 'salt' (número aleatorio) a la contraseña.
- Esto hace que la misma contraseña produzca un hash diferente. Si dos usuarios tienen 'password123':
- **Ana:** `$2b$10$xyz...`
- **Bob:** `$2b$10$abc...`

---

### 1.3 ¿Qué es JWT?

JWT (JSON Web Token) es un token firmado que el servidor entrega al usuario tras el login.

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhbmFAZXhhbXBsZS5jb20ifQ.XYZ...

```

```js
// Servidor genera token
const token = jwt.sign(
  { id: 1, email: "ana@example.com", role: "user" },
  proccess.env.JWT_SECRET,
  { expiresIn: "2h" },
)
```

El token tiene 3 partes separadas por un punto (`.`): **Header.Payload.Signature**

1. **Header** — Tipo y algoritmo.
2. **Payload** — Datos del usuario (id, email, rol...).
3. **Signature** — Firma que garantiza que el token no ha sido modificado.

---

### httpOnly Cookies: El token guardado de forma segura

Hay dos formas principales de enviar y almacenar el token:

| Característica              | Menos seguro: `localStorage`           | Más seguro: `httpOnly cookie`                  |
| --------------------------- | -------------------------------------- | ---------------------------------------------- |
| **Acceso desde JavaScript** | Sí (Vulnerable a ataques XSS)          | No (Inmune a ataques XSS)                      |
| **Envío al servidor**       | Manual (`Authorization` Header)        | Automático por el navegador                    |
| **Implementación API**      | `res.json({ token })`                  | `res.cookie('token', jwt, { httpOnly: true })` |
| **Guardado en cliente**     | `localStorage.setItem('token', valor)` | El navegador lo gestiona solo                  |

#### ¿Qué son las cookies?

Son archivos de texto que los sitios web envían a tu navegador y se almacenan en tu dispositivo. Su función principal es recordar información sobre ti y tus hábitos. Funcionan como memoria; sin ellas, las webs nos tratarían como visitantes nuevos cada vez que hacemos clic en un enlace.

Sirven para:

- Gestión de sesiones
- Personalización
- Rastreo y publicidad

#### Atributo `httpOnly`

`httpOnly` es un atributo que se le añade a una cookie cuando se crea. Su única función es indicarle al navegador que esa cookie no debe ser accesible a través de scripts del lado del cliente, como el comando `document.cookie` en JavaScript.

Su objetivo principal es la seguridad. Sirve para proteger información muy sensible. Si un atacante inyecta código JS malicioso en una página (XSS), ese código intentará robar las cookies de los usuarios para acceder a sus cuentas. Si la cookie tiene activado `httpOnly`, el navegador bloquea el acceso por completo.

🔐 **httpOnly en la práctica:**

```text
Servidor hace login exitoso
        ↓
Servidor responde: res.cookie('token', jwt, { httpOnly: true })
        ↓
Navegador recibe cookie + flag httpOnly
        ↓
JavaScript NO puede acceder: document.cookie [NO FUNCIONA]
        ↓
Pero el navegador la ENVÍA automáticamente en cada petición HTTP
        ↓
El Middleware del servidor la lee y verifica: req.cookies.token

```

---

### 1.4 Roles de Usuario

Los roles controlan **qué puede hacer** cada usuario:

| Rol     | Acceso                                           |
| ------- | ------------------------------------------------ |
| `user`  | Rutas públicas y su propio perfil                |
| `admin` | Todas las rutas, incluidas las de administración |

#### Flujo completo de autenticación:

**REGISTRO** _(realizado en Supabase mediante el seed):_
`password` → `bcrypt.hash(password, 10)` → Guardado en BD

**LOGIN:**

1. El cliente envía `email` + `password`.
2. El servidor busca al usuario por email utilizando el cliente de Prisma.
3. `bcrypt.compare(passwordRecibida, hashGuardado)` → `true` / `false`.
4. Si es válido → `jwt.sign({ id, email, role })` → **TOKEN**.
5. El servidor introduce el token en una COOKIE `httpOnly`.
6. El navegador guarda la cookie automáticamente.

**PETICIÓN PROTEGIDA:**

1. El navegador envía la cookie automáticamente en la cabecera (no hay que programar nada en el front).
2. El `authMiddleware` lee la cookie y verifica el token.
3. Si es válido → `req.user` = datos del payload.
4. El Controller responde con los datos protegidos.

---

## Bloque 2 · Preparar Entorno (10 min)

### Instalación

```bash
npm install

```

### Crear `.env`

```bash
cp .env.example .env

```

Rellena los valores en el archivo `.env`:

```text
DATABASE_URL="postgresql://postgres:TU_PASSWORD@db.XXXX.supabase.co:5432/postgres"
JWT_SECRET="una-clave-secreta-larga-y-dificil-de-adivinar"
PORT=3000

```

## Bloque 3 · Conexión a Supabase (Prisma + `adapter-pg`) (10 min)

Crear schema.prisma: `npx prisma init`.
Generar Prisma Client: `npx prisma generate`.
Crear instancia a prisma en `src/lib/prisma.js`

---

## Bloque 4 · Login: Service y Controller (20 min)

### Service (`auth.service.js`)

1. Busca al usuario por email en la base de datos a través de Prisma (`prisma.user.findUnique`).
2. Compara la contraseña recibida con el hash usando `bcrypt.compare()`.
3. Si coincide, genera un token con `jwt.sign()`.

### Controller (`auth.controller.js`)

1. Lee `email` y `password` de `req.body`.
2. Llama al service correspondiente.
3. Devuelve el token al cliente dentro de la cookie de respuesta.

---

## Bloque 5 · Middlewares (15 min)

### `authMiddleware.js`

Se coloca antes del controller en las rutas protegidas.

1. Lee el token directamente desde las cookies entrantes usando `req.cookies.token`.
2. Verifica el token con `jwt.verify()`.
3. Si es válido, añade a `req.user` los datos descodificados del usuario.
4. Si no, responde con un estado `401 Unauthorized`.

### `requireRole.js`

Se coloca después de `authMiddleware` en las rutas restringidas por rol.

1. Lee el rol guardado en `req.user.role`.
2. Si el rol no coincide con los permisos requeridos, responde con un `403 Forbidden`.
3. Si coincide, invoca a `next()` para dejar pasar la petición.

---

## Bloque 6 · Probar con Postman (15 min)

### Secuencia recomendada:

**1. Login de usuario normal**

```text
POST http://localhost:3000/login
Body (JSON):
{
  "email": "ana@example.com",
  "password": "password123"
}
→ Responde con éxito. Postman almacena de forma automática la cookie httpOnly en su contenedor ("Cookie Jar").

```

**2. Acceder al perfil (ruta protegida)**

```text
GET http://localhost:3000/profile
→ No hace falta configurar Headers manuales. Postman adjunta la cookie guardada automáticamente.
→ Devuelve datos del usuario.

```

**3. Intentar acceder a /admin siendo usuario normal**

```text
GET http://localhost:3000/admin
→ Postman envía automáticamente la cookie activa de Ana.
→ Debe responder 403 Forbidden.

```

**4. Login de admin**

```text
POST http://localhost:3000/login
Body (JSON):
{
  "email": "admin@example.com",
  "password": "admin123"
}
→ Responde con éxito y actualiza de forma automática la cookie del contenedor con el token del administrador.

```

**5. Acceder a /admin siendo admin**

```text
GET http://localhost:3000/admin
→ Postman envía automáticamente la nueva cookie de administrador.
→ Debe responder con acceso concedido.

```

**6. Petición sin token (Simular Cierre de Sesión)**

```text
Hacer clic en el botón pequeño de "Cookies" (situado justo debajo del botón azul "Send" de Postman).
Borrar la cookie 'token' asociada a localhost.

GET http://localhost:3000/profile
→ Al no enviarse ninguna cookie, debe responder 401 Unauthorized.

```

---

## ✅ Resumen Final

- [ ] Entiendo por qué no se guardan contraseñas en texto plano.
- [ ] Sé cómo funciona `bcrypt.hash()` y `bcrypt.compare()`.
- [ ] Entiendo cómo interactúa Prisma con `@prisma/adapter-pg`.
- [ ] Entiendo qué es un token JWT y qué información contiene.
- [ ] Sé cómo proteger una ruta leyendo las cookies en `authMiddleware`.
- [ ] Sé cómo restringir el acceso por rol con `requireRole`.

---
