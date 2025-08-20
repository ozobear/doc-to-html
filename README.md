# Doc to HTML Converter - NextJS

Una aplicación full-stack para convertir documentos (TXT, DOC, DOCX, CSV, XLSX, XML) a HTML con estilos incluidos.

## 🚀 Stack Tecnológico

- **Frontend**: Next.js 15 + React 19 + Tailwind CSS
- **Backend**: Next.js API Routes + Prisma ORM
- **Base de datos**: PostgreSQL (compatible con SQLite para desarrollo)
- **Autenticación**: NextAuth.js con Google OAuth
- **Procesamiento**: mammoth (Word), xlsx (Excel), xml2js (XML)
- **Deployment**: Vercel + Neon PostgreSQL (100% gratuito)

## 🛠️ Instalación Local

### Prerrequisitos

- Node.js 18+
- npm o yarn
- PostgreSQL local (opcional, usa SQLite por defecto)

### Configuración

1. **Clonar e instalar**:
   ```bash
   git clone <tu-repo>
   cd doc-to-html-nextjs
   npm install
   ```

2. **Configurar variables de entorno**:
   ```bash
   cp .env.local.example .env.local
   ```

   Edita `.env.local`:
   ```env
   # Base de datos (SQLite para desarrollo)
   DATABASE_URL="file:./dev.db"
   
   # NextAuth.js
   NEXTAUTH_SECRET="tu-secret-key-aqui"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Google OAuth (opcional para desarrollo)
   GOOGLE_CLIENT_ID="tu-google-client-id"
   GOOGLE_CLIENT_SECRET="tu-google-client-secret"
   ```

3. **Configurar base de datos**:
   ```bash
   npm run db:push
   ```

4. **Ejecutar en desarrollo**:
   ```bash
   npm run dev
   ```

## 🌐 Deployment en Vercel (100% Gratuito)

### 1. Preparar Base de Datos

**Opción A: Neon PostgreSQL (Recomendado)**
1. Ir a [neon.tech](https://neon.tech) y crear cuenta gratuita
2. Crear nueva base de datos
3. Copiar la connection string

**Opción B: PlanetScale MySQL (Alternativa)**
1. Ir a [planetscale.com](https://planetscale.com) y crear cuenta
2. Crear nueva base de datos
3. Copiar la connection string

### 2. Configurar Google OAuth

1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. Crear nuevo proyecto o seleccionar existente
3. Habilitar Google+ API
4. Crear credenciales OAuth 2.0:
   - Tipo: Aplicación web
   - URIs autorizados: `https://tu-app.vercel.app/api/auth/callback/google`
5. Copiar Client ID y Client Secret

### 3. Deploy en Vercel

1. **Conectar con GitHub**:
   ```bash
   # Subir a GitHub
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Configurar Vercel**:
   - Ir a [vercel.com](https://vercel.com) y conectar GitHub
   - Importar tu repositorio
   - Configurar variables de entorno:

   ```env
   DATABASE_URL=tu-neon-connection-string
   NEXTAUTH_SECRET=tu-secret-key-muy-seguro
   NEXTAUTH_URL=https://tu-app.vercel.app
   GOOGLE_CLIENT_ID=tu-google-client-id
   GOOGLE_CLIENT_SECRET=tu-google-client-secret
   ```

3. **Deploy automático**:
   - Vercel detectará Next.js automáticamente
   - El build incluye `prisma generate`
   - Deploy se completa en ~2-3 minutos

### 4. Configurar Base de Datos en Producción

```bash
# Desde tu máquina local, conectar a producción
npx prisma db push --preview-feature
```

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/     # Autenticación
│   │   ├── upload/                 # Subida de archivos
│   │   ├── status/[id]/           # Estado de conversión
│   │   ├── download/[id]/         # Descarga de archivos
│   │   └── files/                 # Lista de archivos del usuario
│   ├── layout.tsx                 # Layout principal
│   ├── page.tsx                   # Página principal
│   └── providers.tsx              # Proveedores de contexto
├── components/
│   ├── FileUploader.tsx           # Carga de archivos
│   ├── FileStatus.tsx             # Estado de conversión
│   ├── AuthModal.tsx              # Modal de autenticación
│   └── UserMenu.tsx               # Menú de usuario
├── lib/
│   ├── auth.ts                    # Configuración NextAuth
│   ├── prisma.ts                  # Cliente Prisma
│   └── fileConverter.ts           # Lógica de conversión
└── prisma/
    └── schema.prisma              # Esquema de base de datos
```

## 🔧 Características

### Conversión de Archivos

- **TXT**: Preserva formato de párrafos y saltos de línea
- **DOC/DOCX**: Mantiene estilos, tablas y estructura usando mammoth
- **CSV**: Genera tablas HTML interactivas con estilos
- **XLSX/XLS**: Convierte hojas de cálculo a tablas HTML
- **XML**: Muestra contenido con syntax highlighting

### Limitaciones

- **Anónimos**: 3MB por archivo
- **Registrados**: 10MB por archivo
- **Expiración**: 3 horas automáticamente
- **Formatos**: Solo los listados arriba

### Seguridad

- **Content Security Policy (CSP)** implementado
- **Rate limiting** avanzado por IP y endpoint
- **Validación de archivos** con magic numbers
- **Sanitización** de nombres de archivo y contenido
- **Headers de seguridad** (X-Frame-Options, X-Content-Type-Options, etc.)
- **Autenticación OAuth2** con Google
- **Eliminación automática** de archivos (3 horas)
- **HTTPS obligatorio** en producción

### SEO y Performance

- **Meta tags optimizados** con Open Graph y Twitter Cards
- **Datos estructurados** (Schema.org WebApplication)
- **Sitemap XML** generado automáticamente
- **Robots.txt** configurado
- **Páginas legales** (Términos y Privacidad)
- **URLs semánticas** y navegación optimizada

## 🚀 Comandos Útiles

```bash
# Desarrollo
npm run dev                 # Servidor de desarrollo
npm run db:studio          # Interfaz visual de BD

# Producción
npm run build              # Build optimizado
npm start                  # Servidor de producción

# Base de datos
npm run db:push            # Aplicar schema a BD
npm run db:migrate         # Crear migración
npm run db:generate        # Generar cliente Prisma
```

## 🌟 Deployment Alternativo (Railway)

Si prefieres Railway en lugar de Vercel:

1. **Conectar GitHub a Railway**
2. **Variables de entorno** (mismas que Vercel)
3. **Auto-deploy** con cada push

Railway incluye PostgreSQL gratuito integrado.

## 📝 Contribuir

1. Fork del proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para detalles.

## 🆘 Troubleshooting

### Error: "Prisma Client not generated"
```bash
npm run db:generate
```

### Error: "Database connection failed"
- Verificar DATABASE_URL en variables de entorno
- Confirmar que la base de datos esté activa

### Error: "Google OAuth failed"
- Verificar Client ID y Secret
- Confirmar redirect URL en Google Console

### Archivos no se procesan
- Verificar tamaño de archivo (3MB anónimo / 10MB registrado)
- Confirmar formato soportado
- Revisar logs en Vercel/Railway dashboard
