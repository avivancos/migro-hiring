# Backend: Corrección de Migración - Tabla Duplicada

**Fecha**: 2025-01-28  
**Prioridad**: 🔴 Alta  
**Estado**: ⚠️ Pendiente de Aplicar  
**Módulo**: Backend - Migraciones Alembic

---

## 🐛 Problema Identificado

### Error
```
sqlalchemy.exc.ProgrammingError: (psycopg2.errors.DuplicateTable) 
relation "communication_threads" already exists
```

### Causa
La migración `z51_create_communication_tables.py` está intentando crear la tabla `communication_threads` sin verificar si ya existe. Esto puede ocurrir cuando:
1. La tabla fue creada manualmente
2. La migración se ejecutó parcialmente antes
3. Hay conflictos en el historial de migraciones

---

## 🔧 Solución

### Opción 1: Modificar la Migración (Recomendado)

**Archivo**: `migrations/versions/z51_create_communication_tables.py`

Modificar la función `upgrade()` para verificar si la tabla existe antes de crearla:

```python
def upgrade():
    # Verificar si la tabla ya existe
    from sqlalchemy import inspect
    from sqlalchemy.engine import reflection
    
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()
    
    if 'communication_threads' not in existing_tables:
        op.create_table(
            'communication_threads',
            sa.Column('id', sa.UUID(), nullable=False),
            sa.Column('contact_id', sa.UUID(), nullable=False),
            sa.Column('channel', sa.String(length=20), nullable=False),
            sa.Column('thread_identifier', sa.String(length=255), nullable=True),
            sa.Column('subject', sa.String(length=500), nullable=True),
            sa.Column('status', sa.String(length=20), server_default='open', nullable=False),
            sa.Column('last_message_at', sa.TIMESTAMP(timezone=True), nullable=True),
            sa.Column('unread_count', sa.Integer(), server_default='0', nullable=False),
            sa.Column('responsible_user_id', sa.UUID(), nullable=True),
            sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['contact_id'], ['crm_contacts.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['responsible_user_id'], ['users.id'], ondelete='SET NULL')
        )
        print('✅ Created table: communication_threads')
    else:
        print('⏭️  Table communication_threads already exists, skipping')
    
    # Repetir para otras tablas si las hay...
    # (communication_messages, etc.)
```

### Opción 2: Marcar la Migración como Ejecutada

Si la tabla ya existe y tiene la estructura correcta, puedes marcar la migración como ejecutada sin ejecutarla:

```bash
# Conectar a la base de datos
psql -h <host> -U <user> -d <database>

# Insertar registro en alembic_version
INSERT INTO alembic_version (version_num) 
VALUES ('z51_create_communication_tables')
ON CONFLICT (version_num) DO NOTHING;
```

**⚠️ ADVERTENCIA**: Solo usar esta opción si estás seguro de que la tabla tiene la estructura correcta.

### Opción 3: Usar Alembic con `--sql`

Para ver qué SQL se ejecutaría sin aplicarlo:

```bash
alembic upgrade head --sql > migration_preview.sql
```

Luego revisar y ejecutar manualmente solo las partes necesarias.

---

## 📝 Pasos para Aplicar la Solución

### 1. Acceder al Servidor

```bash
# SSH al servidor de Render
ssh render@<servidor>

# O usar el shell de Render
# Ir a: Dashboard > Service > Shell
```

### 2. Localizar el Archivo de Migración

```bash
cd ~/project/src
find . -name "z51_create_communication_tables.py"
```

### 3. Editar la Migración

```bash
# Editar el archivo
nano migrations/versions/z51_create_communication_tables.py
# o
vim migrations/versions/z51_create_communication_tables.py
```

### 4. Aplicar los Cambios

Usar el código de la **Opción 1** para modificar la función `upgrade()`.

### 5. Verificar la Estructura de la Tabla Existente

```bash
# Conectar a PostgreSQL
psql $DATABASE_URL

# Verificar estructura
\d communication_threads

# Si la estructura es correcta, usar Opción 2
# Si falta algo, usar Opción 1
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
AND table_name = 'communication_threads';
```

### Verificar Estructura de la Tabla

```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'communication_threads'
ORDER BY ordinal_position;
```

### Verificar Índices

```sql
SELECT 
    indexname, 
    indexdef
FROM pg_indexes
WHERE tablename = 'communication_threads';
```

---

## 🛡️ Prevención Futura

### Mejores Prácticas para Migraciones

1. **Siempre verificar existencia**:
```python
from sqlalchemy import inspect

def table_exists(table_name):
    bind = op.get_bind()
    inspector = inspect(bind)
    return table_name in inspector.get_table_names()

if not table_exists('communication_threads'):
    op.create_table(...)
```

2. **Usar `IF NOT EXISTS` en SQL directo**:
```python
op.execute("""
    CREATE TABLE IF NOT EXISTS communication_threads (
        ...
    )
""")
```

3. **Manejar errores gracefully**:
```python
try:
    op.create_table(...)
except Exception as e:
    if 'already exists' in str(e).lower():
        print(f'⏭️  Table already exists, skipping')
    else:
        raise
```

---

## 📚 Referencias

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [SQLAlchemy Inspector](https://docs.sqlalchemy.org/en/14/core/inspection.html)
- [PostgreSQL CREATE TABLE](https://www.postgresql.org/docs/current/sql-createtable.html)

---

## ✅ Checklist

- [ ] Localizar archivo de migración `z51_create_communication_tables.py`
- [ ] Verificar estructura actual de `communication_threads`
- [ ] Modificar migración para verificar existencia (Opción 1)
- [ ] O marcar como ejecutada si estructura es correcta (Opción 2)
- [ ] Re-ejecutar migración
- [ ] Verificar que no hay errores
- [ ] Documentar cambios

---

**Autor**: Auto (AI Assistant)  
**Revisado**: Pendiente  
**Versión**: 1.0
