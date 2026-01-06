# Backend: Corrección de Migración sso_sessions

**Fecha**: 2025-01-29  
**Prioridad**: 🔴 Alta  
**Estado**: ⚠️ Pendiente de Aplicar  
**Módulo**: Backend - Migraciones Alembic

---

## 🐛 Problema Identificado

### Error
```
sqlalchemy.exc.ProgrammingError: (psycopg2.errors.DuplicateTable) 
relation "sso_sessions" already exists
```

### Causa
La migración `z52_create_sso_sessions_table.py` está intentando crear la tabla `sso_sessions` que ya existe en la base de datos. Esto puede ocurrir cuando:
1. La tabla fue creada manualmente o por otra migración
2. La migración no tiene verificación de existencia
3. El estado de Alembic no está sincronizado con la base de datos

---

## 🔧 Soluciones

### Opción 1: Agregar Verificación en la Migración (Recomendado)

Modificar el archivo `migrations/versions/z52_create_sso_sessions_table.py`:

```python
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

def upgrade():
    """Create sso_sessions table if it doesn't exist"""
    # Verificar si la tabla ya existe
    inspector = inspect(op.get_bind())
    existing_tables = inspector.get_table_names()
    
    if 'sso_sessions' not in existing_tables:
        op.create_table(
            'sso_sessions',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('user_id', sa.UUID(), nullable=False),
            sa.Column('session_token', sa.String(length=512), nullable=False),
            sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
            sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('metadata', sa.JSON(), nullable=True),
            sa.Column('ip_address', sa.String(length=45), nullable=True),
            sa.Column('user_agent', sa.String(length=512), nullable=True),
            sa.Column('active_subdomains', sa.JSON(), nullable=True),
            sa.Column('last_activity', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('session_token')
        )
        print('✅ Created table: sso_sessions')
    else:
        print('⏭️  Table sso_sessions already exists, skipping')
```

### Opción 2: Marcar la Migración como Aplicada (Solo si la tabla existe y es correcta)

Si la tabla ya existe y tiene la estructura correcta, puedes marcar la migración como aplicada sin ejecutarla:

```bash
# Conectar a la base de datos y ejecutar:
alembic stamp z52_create_sso_sessions_table
```

**⚠️ ADVERTENCIA**: Solo usa esto si estás seguro de que la tabla existe y tiene la estructura correcta.

### Opción 3: Usar `op.execute` con SQL Condicional

```python
def upgrade():
    # Verificar existencia usando SQL directo
    connection = op.get_bind()
    result = connection.execute(sa.text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'sso_sessions'
        );
    """))
    
    table_exists = result.scalar()
    
    if not table_exists:
        op.create_table(
            'sso_sessions',
            # ... columnas ...
        )
        print('✅ Created table: sso_sessions')
    else:
        print('⏭️  Table sso_sessions already exists, skipping')
```

### Opción 4: Usar Try/Except (Más Simple)

```python
def upgrade():
    try:
        op.create_table(
            'sso_sessions',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('user_id', sa.UUID(), nullable=False),
            # ... resto de columnas ...
        )
        print('✅ Created table: sso_sessions')
    except Exception as e:
        if 'already exists' in str(e).lower() or 'duplicate' in str(e).lower():
            print('⏭️  Table sso_sessions already exists, skipping')
        else:
            raise
```

---

## 📝 Pasos para Aplicar la Solución

### 1. Acceder al Servidor de Render

```bash
# Usar el shell de Render
# Ir a: Dashboard > Service > Shell
# O usar SSH si está configurado
```

### 2. Localizar el Archivo de Migración

```bash
cd ~/project/src
find . -name "z52_create_sso_sessions_table.py"
# Debería estar en: migrations/versions/z52_create_sso_sessions_table.py
```

### 3. Editar la Migración

```bash
# Editar el archivo
nano migrations/versions/z52_create_sso_sessions_table.py
# o
vim migrations/versions/z52_create_sso_sessions_table.py
```

### 4. Aplicar los Cambios

Usar el código de la **Opción 1** o **Opción 4** para modificar la función `upgrade()`.

**Ejemplo completo con Opción 1**:

```python
"""create sso_sessions table

Revision ID: z52
Revises: z51
Create Date: 2025-01-29 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = 'z52'
down_revision = 'z51'
branch_labels = None
depends_on = None


def upgrade():
    """Create sso_sessions table if it doesn't exist"""
    # Verificar si la tabla ya existe
    inspector = inspect(op.get_bind())
    existing_tables = inspector.get_table_names()
    
    if 'sso_sessions' not in existing_tables:
        op.create_table(
            'sso_sessions',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('user_id', sa.UUID(), nullable=False),
            sa.Column('session_token', sa.String(length=512), nullable=False),
            sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
            sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('metadata', sa.JSON(), nullable=True),
            sa.Column('ip_address', sa.String(length=45), nullable=True),
            sa.Column('user_agent', sa.String(length=512), nullable=True),
            sa.Column('active_subdomains', sa.JSON(), nullable=True),
            sa.Column('last_activity', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('session_token')
        )
        print('✅ Created table: sso_sessions')
    else:
        print('⏭️  Table sso_sessions already exists, skipping')


def downgrade():
    """Drop sso_sessions table"""
    op.drop_table('sso_sessions')
```

### 5. Verificar la Estructura de la Tabla Existente (Opcional)

```bash
# Conectar a PostgreSQL
psql $DATABASE_URL

# Verificar estructura
\d sso_sessions

# Verificar columnas
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sso_sessions'
ORDER BY ordinal_position;
```

### 6. Re-ejecutar la Migración

```bash
# Desde el directorio del proyecto
cd ~/project/src
alembic upgrade head
```

---

## 🔍 Verificación

### Verificar que la Tabla Existe

```sql
-- En PostgreSQL
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'sso_sessions';
```

### Verificar Estructura de la Tabla

```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sso_sessions'
ORDER BY ordinal_position;
```

### Verificar Índices y Constraints

```sql
SELECT 
    indexname, 
    indexdef
FROM pg_indexes
WHERE tablename = 'sso_sessions';

-- Verificar foreign keys
SELECT
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'sso_sessions';
```

---

## ✅ Checklist de Implementación

- [ ] Acceder al servidor de Render (Shell)
- [ ] Localizar archivo `migrations/versions/z52_create_sso_sessions_table.py`
- [ ] Editar función `upgrade()` para agregar verificación
- [ ] Guardar cambios
- [ ] Verificar estructura de tabla existente (opcional)
- [ ] Re-ejecutar `alembic upgrade head`
- [ ] Verificar que la migración se completa sin errores
- [ ] Confirmar que la tabla tiene la estructura correcta

---

## 🚨 Notas Importantes

1. **Backup**: Antes de modificar migraciones en producción, asegúrate de tener un backup de la base de datos
2. **Estructura**: Verifica que la tabla existente tenga la misma estructura que la migración intenta crear
3. **Índices**: Si la tabla existe pero le faltan índices o constraints, agrégalos manualmente o crea una migración adicional
4. **Consistencia**: Asegúrate de que el estado de Alembic (`alembic_version`) esté sincronizado con la realidad de la base de datos

---

**Reportado por**: Sistema de Desarrollo  
**Revisado por**: -  
**Aprobado por**: -
