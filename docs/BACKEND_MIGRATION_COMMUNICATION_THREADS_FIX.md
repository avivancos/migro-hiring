# Backend: Corrección de Migración communication_threads

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
La migración `z51_create_communication_tables.py` está intentando crear la tabla `communication_threads` que ya existe en la base de datos. Esto puede ocurrir cuando:
1. La tabla fue creada manualmente o por otra migración
2. La migración no tiene verificación de existencia
3. El estado de Alembic no está sincronizado con la base de datos

---

## 🔧 Soluciones

### Opción 1: Agregar Verificación en la Migración (Recomendado)

Modificar el archivo `migrations/versions/z51_create_communication_tables.py`:

```python
def upgrade():
    # Verificar si la tabla ya existe antes de crearla
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
            sa.Column('status', sa.String(length=20), nullable=False, server_default='open'),
            sa.Column('last_message_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('unread_count', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('responsible_user_id', sa.UUID(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['contact_id'], ['crm_contacts.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['responsible_user_id'], ['users.id'], ondelete='SET NULL')
        )
        print('✅ Created table: communication_threads')
    else:
        print('⏭️  Table communication_threads already exists, skipping')
    
    # Similar para otras tablas si las hay...
```

### Opción 2: Usar Alembic para Marcar la Migración como Ejecutada

Si la tabla ya existe y está correcta, puedes marcar la migración como ejecutada sin ejecutarla:

```bash
# Conectar a la base de datos y ejecutar:
alembic stamp z51_create_communication_tables
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
            AND table_name = 'communication_threads'
        );
    """))
    
    table_exists = result.scalar()
    
    if not table_exists:
        op.create_table(
            'communication_threads',
            # ... columnas ...
        )
        print('✅ Created table: communication_threads')
    else:
        print('⏭️  Table communication_threads already exists, skipping')
```

### Opción 4: Usar Alembic Operations con Try/Except

```python
def upgrade():
    try:
        op.create_table(
            'communication_threads',
            # ... columnas ...
        )
        print('✅ Created table: communication_threads')
    except Exception as e:
        if 'already exists' in str(e).lower() or 'duplicate' in str(e).lower():
            print('⏭️  Table communication_threads already exists, skipping')
        else:
            raise
```

---

## 📝 Implementación Recomendada

### Archivo: `migrations/versions/z51_create_communication_tables.py`

```python
"""create communication tables

Revision ID: z51
Revises: z50
Create Date: 2025-01-28 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = 'z51'
down_revision = 'z50'
branch_labels = None
depends_on = None


def upgrade():
    """Create communication_threads table if it doesn't exist"""
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
            sa.Column('status', sa.String(length=20), nullable=False, server_default='open'),
            sa.Column('last_message_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('unread_count', sa.Integer(), nullable=False, server_default='0'),
            sa.Column('responsible_user_id', sa.UUID(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['contact_id'], ['crm_contacts.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['responsible_user_id'], ['users.id'], ondelete='SET NULL')
        )
        
        # Crear índices si no existen
        op.create_index('idx_communication_threads_contact', 'communication_threads', ['contact_id'])
        op.create_index('idx_communication_threads_status', 'communication_threads', ['status'])
        op.create_index('idx_communication_threads_responsible', 'communication_threads', ['responsible_user_id'])
        
        print('✅ Created table: communication_threads')
    else:
        print('⏭️  Table communication_threads already exists, skipping')
    
    # Si hay más tablas relacionadas, aplicar la misma lógica
    # ...


def downgrade():
    """Drop communication_threads table"""
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()
    
    if 'communication_threads' in existing_tables:
        op.drop_table('communication_threads')
        print('✅ Dropped table: communication_threads')
    else:
        print('⏭️  Table communication_threads does not exist, skipping')
```

---

## 🚀 Pasos para Aplicar la Solución

### 1. Verificar el Estado Actual

```bash
# Ver qué migraciones están aplicadas
alembic current

# Ver el historial de migraciones
alembic history

# Verificar si la tabla existe en la base de datos
psql -d tu_base_de_datos -c "\d communication_threads"
```

### 2. Aplicar la Corrección

1. **Editar la migración** `z51_create_communication_tables.py` con la solución recomendada
2. **Probar localmente** antes de aplicar en producción
3. **Ejecutar la migración**:
   ```bash
   alembic upgrade head
   ```

### 3. Si la Tabla Ya Existe y Está Correcta

Si la tabla ya existe y tiene la estructura correcta, puedes:

```bash
# Marcar la migración como ejecutada sin ejecutarla
alembic stamp z51
```

---

## ✅ Verificación

Después de aplicar la solución, verificar:

1. **La migración se ejecuta sin errores**:
   ```bash
   alembic upgrade head
   ```

2. **La tabla existe y tiene la estructura correcta**:
   ```sql
   \d communication_threads
   ```

3. **Los índices están creados**:
   ```sql
   \d+ communication_threads
   ```

---

## 🔄 Prevención Futura

Para evitar este problema en el futuro:

1. **Siempre verificar existencia** antes de crear tablas/columnas/índices
2. **Usar el patrón** que ya se usa en otras migraciones del proyecto:
   ```python
   if 'table_name' not in existing_tables:
       op.create_table(...)
   else:
       print('⏭️  Table already exists, skipping')
   ```

3. **Sincronizar Alembic** con el estado real de la base de datos periódicamente

---

## 📚 Referencias

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [SQLAlchemy Inspector](https://docs.sqlalchemy.org/en/14/core/reflection.html)
- Otras migraciones del proyecto que ya usan este patrón (z33, z34, z37, etc.)

---

**Autor**: Auto (AI Assistant)  
**Revisado**: Pendiente  
**Versión**: 1.0
