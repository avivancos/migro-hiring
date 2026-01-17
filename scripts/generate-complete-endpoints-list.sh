#!/bin/bash
# Script auxiliar para generar la lista completa de endpoints a verificar
# Se usa para generar el código del diagnóstico completo

cat <<'EOF'
# Lista completa de endpoints a verificar en el diagnóstico

# CRM - LEADS (9 endpoints)
GET    /api/crm/leads
GET    /api/crm/leads/count
GET    /api/crm/leads/{id}
GET    /api/crm/leads/new
POST   /api/crm/leads
PUT    /api/crm/leads/{id}
DELETE /api/crm/leads/{id}
POST   /api/crm/leads/{id}/convert
POST   /api/crm/leads/{id}/mark-initial-contact-completed

# CRM - CONTACTS (10 endpoints)
GET    /api/crm/contacts
GET    /api/crm/contacts/count
GET    /api/crm/contacts/{id}
POST   /api/crm/contacts
PUT    /api/crm/contacts/{id}
DELETE /api/crm/contacts/{id}
GET    /api/crm/contacts/{id}/leads
GET    /api/crm/contacts/{id}/tasks
GET    /api/crm/contacts/{id}/calls
GET    /api/crm/contacts/{id}/notes

# CRM - COMPANIES (5 endpoints)
GET    /api/crm/companies
GET    /api/crm/companies/{id}
POST   /api/crm/companies
PUT    /api/crm/companies/{id}
DELETE /api/crm/companies/{id}

# CRM - TASKS (6 endpoints)
GET    /api/crm/tasks
GET    /api/crm/tasks/calendar
POST   /api/crm/tasks
PUT    /api/crm/tasks/{id}
PUT    /api/crm/tasks/{id}/complete
DELETE /api/crm/tasks/{id}

# CRM - NOTES (3 endpoints)
GET    /api/crm/notes
POST   /api/crm/notes
DELETE /api/crm/notes/{id}

# CRM - CALLS (4 endpoints)
GET    /api/crm/calls
GET    /api/crm/calls/calendar
POST   /api/crm/calls
DELETE /api/crm/calls/{id}

# CRM - PIPELINES (3 endpoints)
GET    /api/crm/pipelines
GET    /api/crm/pipelines/{id}
GET    /api/crm/pipelines/{id}/stages

# CRM - TASK TEMPLATES (5 endpoints)
GET    /api/crm/task-templates
POST   /api/crm/task-templates
PUT    /api/crm/task-templates/{id}
DELETE /api/crm/task-templates/{id}
PUT    /api/crm/task-templates/order

# CRM - CUSTOM FIELDS (5 endpoints)
GET    /api/crm/custom-fields
GET    /api/crm/custom-fields/{id}
POST   /api/crm/custom-fields
PUT    /api/crm/custom-fields/{id}
DELETE /api/crm/custom-fields/{id}

# CRM - CUSTOM FIELD VALUES (4 endpoints)
GET    /api/crm/custom-field-values
POST   /api/crm/custom-field-values
PUT    /api/crm/custom-field-values/{id}
DELETE /api/crm/custom-field-values/{id}

# CRM - OPPORTUNITIES (6 endpoints)
GET    /api/crm/opportunities
GET    /api/crm/opportunities/{id}
POST   /api/crm/opportunities
POST   /api/crm/opportunities/{id}/assign
POST   /api/crm/opportunities/assign-random
POST   /api/crm/opportunities/{id}/analyze

# CRM - DASHBOARD (2 endpoints)
GET    /api/crm/dashboard/pipeline-stats
GET    /api/crm/dashboard/stats

# CRM - CALL TYPES (1 endpoint)
GET    /api/crm/call-types

# CRM - WIZARD (8 endpoints)
POST   /api/crm/calls/{id}/wizard/start
GET    /api/crm/calls/{id}/wizard
GET    /api/crm/calls/{id}/wizard/next-step
GET    /api/crm/calls/{id}/wizard/guidance
POST   /api/crm/calls/{id}/wizard/step
POST   /api/crm/calls/{id}/wizard/complete
POST   /api/crm/calls/{id}/wizard/pause
POST   /api/crm/calls/{id}/wizard/resume

# ADMIN - USERS (13 endpoints)
GET    /api/users/
GET    /api/users/{id}
GET    /api/users/me
POST   /api/users/
PATCH  /api/users/{id}
DELETE /api/users/{id}
PATCH  /api/users/{id}/role
PATCH  /api/users/{id}/status
PATCH  /api/users/{id}/password
POST   /api/users/{id}/reset-password
POST   /api/users/{id}/impersonate
POST   /api/users/me/photo-avatar
GET    /api/users/export
GET    /api/users/audit-logs

# ADMIN - HIRING (2 endpoints)
GET    /api/admin/hiring/list
POST   /api/admin/hiring/create

# ADMIN - CALL TYPES (4 endpoints)
GET    /api/admin/call-types
POST   /api/admin/call-types
PATCH  /api/admin/call-types/{id}
DELETE /api/admin/call-types/{id}

# ADMIN - CONTRACTS (1 endpoint)
DELETE /api/admin/contracts/{code}

# ADMIN - HIRING ANNEXES (1 endpoint)
DELETE /api/admin/hiring/annexes/{annexId}

# AUTH (4 endpoints)
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/refresh
POST   /api/auth/logout

# HIRING (4 endpoints)
GET    /api/hiring/{code}
POST   /api/hiring/{code}/confirm-data
POST   /api/hiring/{code}/contract/accept
POST   /api/hiring/{code}/kyc/complete

# EXPEDIENTES (14 endpoints)
GET    /api/expedientes/
GET    /api/expedientes/{id}
GET    /api/expedientes/user/{user_id}
POST   /api/expedientes/
PUT    /api/expedientes/{id}
DELETE /api/expedientes/{id}
POST   /api/expedientes/{id}/seleccionar-formulario
GET    /api/expedientes/{id}/completitud
GET    /api/expedientes/{id}/checklist
GET    /api/expedientes/{id}/historial
POST   /api/expedientes/{id}/cambiar-estado
GET    /api/expedientes/{id}/estadisticas
GET    /api/expedientes/buscar
POST   /api/expedientes/{id}/archivos
PATCH  /api/expedientes/{id}/archivos/{archivo_id}

# PIPELINES (12 endpoints)
GET    /api/pipelines/stages/{entity_type}/{entity_id}
POST   /api/pipelines/stages
PATCH  /api/pipelines/stages/{stage_id}/next-action
GET    /api/pipelines/stages/{entity_type}/{entity_id}/status
POST   /api/pipelines/actions
GET    /api/pipelines/actions/{entity_type}/{entity_id}
POST   /api/pipelines/actions/{action_id}/validate
GET    /api/pipelines/action-types
POST   /api/pipelines/calls/{call_id}/analyze
GET    /api/pipelines/calls/{call_id}/next-action
GET    /api/pipelines/admin/approve-hiring-code/validate
POST   /api/pipelines/admin/approve-hiring-code

# CONVERSATIONS (2 endpoints)
GET    /api/conversations/{id}/messages
GET    /api/conversations/{id}/export

# AGENT JOURNAL (5 endpoints)
GET    /api/agent-journal/daily-report
GET    /api/agent-journal/performance-dashboard
GET    /api/agent-journal/metrics/{user_id}
POST   /api/agent-journal/sync
POST   /api/agent-journal/sign-and-send

EOF
