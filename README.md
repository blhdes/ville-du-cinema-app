# 🎬 Village du Cinéma

> *« Notes sur le cinématographe — Une collection de chroniques des cinéphiles de Letterboxd. »*

**Village du Cinéma** es tu revista digital de cine con estética brutalista inspirada en *Cahiers du Cinéma*. Agrega y visualiza reseñas de Letterboxd con un diseño editorial vintage que convierte cada visita en una experiencia cinematográfica.

[🌐 Demo en vivo](https://ville-du-cinema-app.vercel.app) | [📖 Documentación](#manual-de-uso) | [🎨 Diseño](#diseño-y-estética)

---

## ✨ ¿Por qué Village du Cinéma?

### El problema
Letterboxd es increíble, pero navegar entre múltiples cinéfilos significa abrir decenas de perfiles. ¿Y si pudieras ver todas las reseñas de tus críticos favoritos en un solo feed personalizado, con diseño editorial de revista?

### La solución
**Village du Cinéma** transforma Letterboxd en tu propia revista de cine curada. Selecciona tus críticos favoritos y obtén un feed agregado con estética Cahiers du Cinéma de los años 60.

---

## 🎯 Funcionalidades Principales

### 📚 Feed Agregado Personalizado
- **Agrega múltiples usuarios** de Letterboxd en un solo feed
- **Paginación inteligente** con 50 reseñas por página
- **Scroll automático** al cambiar de página
- **Visualización limpia** de reseñas y watches
- **Orden cronológico** inverso (más recientes primero)

### 🌍 Multilingüe (i18n)
- **3 idiomas**: Francés, Inglés y Español
- **Traductor animado** con dropdown elegante
- **Preserva el idioma** en toda la navegación
- **Contenido localizado** completo (UI, mensajes, errores)

### 🎨 Sistema de Usuarios Brutalist
- **Diseño tipo Cahiers**: Amarillo (#FFD600), rojo (#E63946), azul (#2E86AB)
- **Bordes gruesos** y sombras offset brutales
- **Colapsar/expandir** para ahorrar espacio
- **Sugerencias aleatorias** de cinéfilos destacados
- **Gestión visual** de tu círculo cinéfilo

### 💬 Citas de Cineastas
- **52 citas auténticas** de directores legendarios
- **Rotación semanal** automática
- Godard, Tarkovsky, Bresson, Hitchcock, Truffaut y más

### 🏛️ Diseño Editorial
- **Layout tipo revista**: Header/footer full-width, contenido centrado
- **Tipografía serif** elegante con efectos RGB offset
- **Logo integrado**: Simple Offset V con capas de color
- **Responsive design** perfecto en móvil y desktop
- **Favicon dinámico** generado con Next.js

---

## 🎨 Diseño y Estética

### Inspiración: Cahiers du Cinéma
El diseño está inspirado en las revistas cinematográficas francesas de los años 60, especialmente *Cahiers du Cinéma*:

- **Brutalismo visual**: Bordes gruesos, sombras offset, colores planos
- **Paleta Cahiers**: Amarillo vibrante, rojo cinematográfico, azul profundo
- **Tipografía editorial**: Serif bold con tracking apretado
- **Efectos retro**: Text-shadow RGB que simula impresión offset vintage

### Logo Simple Offset
El logo oficial es una **V** con tres capas de color desplazadas (amarillo, rojo, azul) sobre un cuadrado blanco con borde negro. Representa:
- La inicial de "Village"
- La estética RGB de impresión vintage
- El brutalismo gráfico de los 60

---

## 🚀 Casos de Uso

### Para Cinéfilos
- **Crea tu revista personal** siguiendo a tus críticos favoritos
- **Descubre nuevas películas** a través de reseñas curadas
- **Ahorra tiempo** viendo todo en un solo feed
- **Experiencia visual única** que hace justicia al cine

### Para Críticos y Bloggers
- **Promociona tu trabajo** siendo parte de las sugerencias
- **Llega a nuevos lectores** que siguen círculos cinematográficos
- **Contexto editorial** que eleva tus reseñas

### Para Comunidades
- **Crea feeds colectivos** del cineclub, grupo de amigos, etc.
- **Comparte círculos** de cinéfilos con intereses similares
- **Organiza temáticas** (horror, nouvelle vague, Criterion, etc.)

---

## 📖 Manual de Uso

### Primeros Pasos

1. **Abre la app**: Accede a [Village du Cinéma](https://ville-du-cinema-app.vercel.app)

2. **Selecciona tu idioma**:
   - Haz clic en el selector de idioma (esquina superior derecha)
   - Elige entre Français, English o Español

3. **Añade usuarios de Letterboxd**:
   - Ve al panel lateral "Cercles de Cinéphiles" (o equivalente en tu idioma)
   - Introduce el username exacto de Letterboxd (sin @)
   - Haz clic en "SUIVRE" / "FOLLOW" / "SEGUIR"

4. **Explora sugerencias**:
   - Si tienes menos de 5 usuarios, verás sugerencias de cinéfilos destacados
   - Haz clic en cualquier nombre para añadirlo instantáneamente

5. **Navega el feed**:
   - El "Recent Feed" muestra las últimas 50 reseñas agregadas
   - Usa los botones de paginación al final
   - Haz clic en el header para volver a la página 1

### Funciones Avanzadas

**Colapsar el panel lateral**:
- Haz clic en la flecha junto a "Cercles de Cinéphiles"
- Útil en pantallas pequeñas o para enfocar en el contenido

**Eliminar usuarios**:
- Pasa el mouse sobre un usuario en tu lista
- Haz clic en el ícono "-" que aparece

**Cambiar de idioma sin perder progreso**:
- El selector preserva tus usuarios seguidos
- Tu posición en el feed se mantiene

**Resetear a página 1**:
- Haz clic en el logo o título "Village du Cinéma"
- Recarga la página completa y vuelve al inicio

---

## 🛠️ Instalación y Desarrollo

### Requisitos Previos
- Node.js 18+
- npm, yarn, pnpm o bun
- Cuenta de Vercel (opcional, para deploy)

### Instalación Local

```bash
# 1. Clona el repositorio
git clone https://github.com/blhdes/ville-du-cinema-app.git
cd ville-du-cinema-app

# 2. Instala dependencias
npm install
# o
yarn install
# o
pnpm install

# 3. Lanza el servidor de desarrollo
npm run dev
# o
yarn dev
# o
pnpm dev

# 4. Abre tu navegador
# Visita http://localhost:3000
```

### Variables de Entorno

No se requieren variables de entorno para desarrollo local. La app funciona out-of-the-box.

### Estructura del Proyecto

```
ville-du-cinema-app/
├── app/
│   ├── [locale]/          # Rutas internacionalizadas
│   │   ├── layout.tsx     # Layout con metadata i18n
│   │   └── page.tsx       # Página principal con feed
│   ├── api/
│   │   └── feed/          # API para agregar reseñas Letterboxd
│   ├── icon.tsx           # Generación dinámica de favicon
│   └── apple-icon.tsx     # Icono iOS
├── components/
│   ├── Header.tsx         # Header con logo clickeable
│   ├── Layout.tsx         # Layout principal (footer)
│   ├── Logo.tsx           # Logo Simple Offset SVG
│   ├── UserList.tsx       # Panel lateral brutalist
│   ├── ReviewCard.tsx     # Cards de reseñas
│   ├── QuoteOfTheDay.tsx  # Citas semanales
│   └── LanguageSwitcher.tsx
├── constants/
│   ├── discoveryUsers.ts  # Lista de cinéfilos sugeridos
│   └── filmmakerQuotes.ts # 52 citas de directores
├── i18n/
│   ├── routing.ts         # Config de rutas i18n
│   └── request.ts         # Helper de requests i18n
├── messages/
│   ├── fr.json            # Traducciones francés
│   ├── en.json            # Traducciones inglés
│   └── es.json            # Traducciones español
├── public/logos/          # Variaciones de logos SVG
└── middleware.ts          # Routing automático i18n
```

### Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor local en http://localhost:3000

# Producción
npm run build        # Build optimizado para producción
npm start            # Inicia servidor de producción

# Utilidades
npm run lint         # Ejecuta ESLint
```

---

## 🌐 Deploy en Vercel

### Deploy Automático (Recomendado)

1. **Conecta tu repositorio**:
   ```bash
   # Push tu código a GitHub
   git push origin main
   ```

2. **Importa en Vercel**:
   - Ve a [vercel.com/new](https://vercel.com/new)
   - Selecciona tu repositorio
   - Haz clic en "Deploy"

3. **Configuración automática**:
   - Vercel detecta Next.js automáticamente
   - No necesitas variables de entorno
   - El build se completa en ~2 minutos

### Deploy Manual

```bash
# Instala Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy a producción
vercel --prod
```

---

## 🎨 Personalización

### Colores del Tema

Edita los colores Cahiers en `tailwind.config.ts`:

```javascript
colors: {
  'cahiers-yellow': '#FFD600',
  'cahiers-red': '#E63946',
  'cahiers-blue': '#2E86AB',
}
```

### Añadir Usuarios Sugeridos

Edita `constants/discoveryUsers.ts`:

```typescript
export const DISCOVERY_USERS = [
  'dvds', 'monicanitro', 'brat',
  // Añade más usernames...
];
```

### Cambiar Citas de Cineastas

Edita `constants/filmmakerQuotes.ts` para añadir nuevas citas o autores.

### Logo Alternativo

Explora los diseños en `public/logos/`:
- `logo-circle.svg` - Sello circular vintage
- `logo-minimal.svg` - Diseño editorial horizontal
- `logo-brutalist.svg` - Máximo offset RGB
- `logo-blocks.svg` - Grid Mondrian abstracto

Cambia el import en `components/Header.tsx` para usar un logo diferente.

---

## 🤝 Contribuir

¿Quieres mejorar Village du Cinéma? ¡Genial!

### Ideas para Contribuir
- 🌍 Añadir más idiomas (italiano, alemán, portugués)
- 🎨 Crear variaciones de tema (modo oscuro, otras paletas)
- 📊 Estadísticas de usuarios (películas más vistas, ratings promedio)
- 🔍 Filtros por género, década, director
- 💾 Exportar tu feed como PDF tipo revista
- 🔗 Compartir feeds públicos con URLs únicas

### Proceso
1. Fork el repositorio
2. Crea tu branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Stack Tecnológico

- **Framework**: Next.js 15 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **i18n**: next-intl
- **Storage**: LocalForage (client-side)
- **API**: Letterboxd RSS feeds
- **Deploy**: Vercel
- **Iconos**: Lucide React

---

## 📜 Licencia

Este proyecto es de código abierto. Siéntete libre de usarlo, modificarlo y compartirlo.

---

## 🎬 Créditos

**Diseño e inspiración**: Cahiers du Cinéma, revistas cinematográficas vintage de los años 60

**Citas de cineastas**: Jean-Luc Godard, Andrei Tarkovsky, Robert Bresson, Alfred Hitchcock, François Truffaut, Ingmar Bergman, Agnès Varda, Orson Welles, Federico Fellini, Akira Kurosawa y más.

**Comunidad**: Gracias a todos los cinéfilos de Letterboxd que comparten sus reseñas.

---

## 📬 Contacto

¿Preguntas, sugerencias o quieres compartir tu feed personalizado?

- GitHub Issues: [Reporta bugs o sugiere features](https://github.com/blhdes/ville-du-cinema-app/issues)
- Twitter/X: Comparte capturas con #VillageDuCinema

---

**Village du Cinéma** — *Fundada en 2026. Una revista digital para cinéfilos.*

🎬 *« Le cinéma n'est pas un spectacle, c'est une écriture. » — Jean Cocteau*
