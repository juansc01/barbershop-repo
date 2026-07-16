# Tito's Barber Shop

Aplicación de gestión de citas para barbería. Diseño moderno, minimalista y premium.

## Stack

- **Vue 3** - Framework de frontend
- **Vite** - Build tool
- **Supabase** - Backend (base de datos, API)
- **FullCalendar** - Calendario de citas en panel admin
- **JavaScript / CSS** - Sin preprocesadores adicionales

## Instalación

```bash
# Clonar repositorio
git clone <url-del-repo>
cd barbershop-repo

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Variables de entorno

El archivo `.env` ya está configurado con:

```
VITE_SUPABASE_URL=https://pcosrxvuzzenfwgyylcq.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable__GE6tjyLkhFzzPWKMZJ44Q_twBKirLi
```

## Migraciones de base de datos

Las migraciones se encuentran en `supabase/migrations/`:

1. `20240101000000_initial_schema.sql` - Esquema completo de la base de datos
2. `20240101000001_seed_data.sql` - Datos iniciales (peluquero Nacho, servicios, horarios)

### Ejecutar migraciones

#### Opción 1: Con Supabase CLI

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link al proyecto
supabase link --project-ref pcosrxvuzzenfwgyylcq

# Ejecutar migraciones
supabase db push
```

#### Opción 2: Desde el panel de Supabase

1. Acceder a https://supabase.com/dashboard
2. Ir al SQL Editor
3. Ejecutar el contenido de cada archivo de migración en orden

## Estructura del proyecto

```
src/
├── components/ui/     # Componentes reutilizables (Toast, etc.)
├── composables/       # Composables de Vue (useToast)
├── lib/               # Configuración (Supabase client)
├── router/            # Vue Router
├── services/          # Servicios de datos (Supabase queries)
├── styles/            # Estilos globales CSS
└── views/             # Páginas
    ├── LandingPage.vue
    ├── BookingPage.vue
    └── admin/         # Panel de administración
        ├── AdminLayout.vue
        ├── DashboardView.vue
        ├── CalendarView.vue
        ├── ClientsView.vue
        ├── ServicesView.vue
        ├── BarbersView.vue
        ├── ScheduleView.vue
        └── BlocksView.vue
```

## Funcionalidades

### Público
- **Landing page** con información de la barbería
- **Reserva de citas** en 5 pasos (servicio → peluquero → fecha → hora → datos)
- Cálculo dinámico de disponibilidad

### Panel de administración (`/admin`)
- **Dashboard** con estadísticas en tiempo real
- **Calendario** con FullCalendar (vista día/semana/mes, drag & drop)
- **Clientes** con buscador e historial
- **Servicios** CRUD completo
- **Peluqueros** CRUD completo con asignación de servicios
- **Horarios** configurables por peluquero y día
- **Bloqueos** (vacaciones, descansos, ausencias)

## Scripts

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run preview  # Preview del build
```

## Mejoras futuras

- Autenticación para el panel de administración
- Notificaciones por email/SMS
- Integración con pasarelas de pago
- PWA para acceso offline
- Recordatorios automáticos
- Informes y analytics avanzados
- Multi-idioma
- Tema claro/oscuro configurable
- Sistema de reseñas
- Lista de espera para horas completas
