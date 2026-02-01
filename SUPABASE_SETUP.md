# Supabase Setup Guide - Ville du Cinéma

## 1. Ejecutar el Schema SQL

Ve al Supabase Dashboard:

1. Abre tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **SQL Editor** (icono de terminal en la barra lateral)
3. Copia todo el contenido de `supabase-schema.sql`
4. Pégalo en el editor y haz clic en **RUN**

El script creará:
- ✅ Tabla `user_data` con los campos necesarios
- ✅ Políticas RLS para seguridad
- ✅ Trigger para actualizar `updated_at` automáticamente
- ✅ Índices para mejor performance

## 2. Verificar que todo funciona

Ejecuta estas queries en el SQL Editor para verificar:

```sql
-- Ver la estructura de la tabla
SELECT * FROM information_schema.tables WHERE table_name = 'user_data';

-- Verificar que RLS está activado
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'user_data';

-- Ver las políticas creadas
SELECT * FROM pg_policies WHERE tablename = 'user_data';
```

## 3. Estructura de la tabla

| Campo           | Tipo          | Default       | Descripción                          |
|----------------|---------------|---------------|--------------------------------------|
| user_id        | uuid          | -             | ID del usuario (FK a auth.users)     |
| followed_users | jsonb         | []            | Array de usernames de Letterboxd     |
| language       | text          | 'fr'          | Idioma del usuario (fr/en/es)        |
| updated_at     | timestamptz   | now()         | Última actualización (auto)          |

## 4. Uso desde tu código

### Client Component (browser):
```typescript
import { createClient } from '@/lib/supabase/client'
import type { UserData } from '@/types/database'

const supabase = createClient()

// Obtener datos del usuario actual
const { data, error } = await supabase
  .from('user_data')
  .select('*')
  .single()

// Actualizar followed_users
await supabase
  .from('user_data')
  .update({ followed_users: ['user1', 'user2'] })
  .eq('user_id', userId)
```

### Server Component:
```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()

const { data, error } = await supabase
  .from('user_data')
  .select('*')
  .single()
```

## 5. Migración desde localforage

Para migrar los datos existentes de localforage a Supabase:

```typescript
import localforage from 'localforage'
import { createClient } from '@/lib/supabase/client'

async function migrateToSupabase() {
  const supabase = createClient()

  // Obtener datos de localforage
  const followedUsers = await localforage.getItem<string[]>('followedUsers') || []
  const language = await localforage.getItem<string>('language') || 'fr'

  // Obtener user_id del usuario autenticado
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Insertar/actualizar en Supabase
    await supabase
      .from('user_data')
      .upsert({
        user_id: user.id,
        followed_users: followedUsers,
        language: language
      })
  }
}
```

## 6. Optimización para Plan Gratuito

Este schema está optimizado para el plan gratuito de Supabase:

- ✅ **1 tabla** (no normalizada para reducir joins)
- ✅ **Índices mínimos** (solo en user_id)
- ✅ **JSONB** para arrays (más eficiente que tablas relacionadas)
- ✅ **RLS activado** (seguridad sin costo extra)

### Límites del plan gratuito:
- 500 MB de espacio
- 50,000 usuarios activos/mes
- 2 GB de transferencia de datos/mes

Con este diseño, puedes almacenar ~100,000 usuarios antes de alcanzar el límite de espacio.
