# Makefile para comandos Docker simplificados
# Uso: make <comando>

.PHONY: help dev prod stop clean logs shell install build test

# Colores para output
RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[1;33m
NC=\033[0m # No Color

help: ## Mostrar esta ayuda
	@echo "$(GREEN)Migro Hiring - Comandos Docker$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'

dev: ## Iniciar entorno de desarrollo
	@echo "$(GREEN)🚀 Iniciando entorno de desarrollo...$(NC)"
	docker-compose up dev

dev-d: ## Iniciar desarrollo en segundo plano
	@echo "$(GREEN)🚀 Iniciando desarrollo en background...$(NC)"
	docker-compose up -d dev
	@echo "$(GREEN)✅ Desarrollo activo en http://localhost:5173$(NC)"

prod: ## Iniciar entorno de producción
	@echo "$(GREEN)🚀 Iniciando producción...$(NC)"
	docker-compose --profile production up prod

prod-d: ## Iniciar producción en segundo plano
	@echo "$(GREEN)🚀 Iniciando producción en background...$(NC)"
	docker-compose --profile production up -d prod
	@echo "$(GREEN)✅ Producción activa en http://localhost$(NC)"

mock: ## Iniciar con Mock API
	@echo "$(GREEN)🚀 Iniciando con Mock API...$(NC)"
	docker-compose --profile mock up dev mock-api

stop: ## Detener todos los servicios
	@echo "$(YELLOW)⏸ Deteniendo servicios...$(NC)"
	docker-compose down

clean: ## Limpiar contenedores, volúmenes e imágenes
	@echo "$(RED)🧹 Limpiando todo...$(NC)"
	docker-compose down -v --rmi all

logs: ## Ver logs de desarrollo
	docker-compose logs -f dev

logs-prod: ## Ver logs de producción
	docker-compose logs -f prod

shell: ## Acceder al shell del contenedor de desarrollo
	@echo "$(GREEN)🐚 Accediendo al shell...$(NC)"
	docker-compose exec dev sh

install: ## Instalar nueva dependencia (uso: make install PKG=nombre-paquete)
	@echo "$(GREEN)📦 Instalando $(PKG)...$(NC)"
	docker-compose exec dev npm install $(PKG)
	@echo "$(GREEN)✅ $(PKG) instalado$(NC)"

build: ## Build de producción
	@echo "$(GREEN)🏗️  Building producción...$(NC)"
	docker-compose --profile production build prod

rebuild: ## Rebuild forzado
	@echo "$(YELLOW)🔄 Rebuild completo...$(NC)"
	docker-compose build --no-cache dev

ps: ## Ver estado de contenedores
	docker-compose ps

restart: ## Reiniciar desarrollo
	@echo "$(YELLOW)🔄 Reiniciando desarrollo...$(NC)"
	docker-compose restart dev

test: ## Ejecutar tests (cuando existan)
	@echo "$(GREEN)🧪 Ejecutando tests...$(NC)"
	docker-compose exec dev npm run test

lint: ## Ejecutar linter
	@echo "$(GREEN)🔍 Ejecutando linter...$(NC)"
	docker-compose exec dev npm run lint

format: ## Formatear código
	@echo "$(GREEN)✨ Formateando código...$(NC)"
	docker-compose exec dev npm run format

health: ## Ver health status
	@echo "$(GREEN)❤️  Health check:$(NC)"
	@curl -s http://localhost:5173 > /dev/null && echo "$(GREEN)✅ Dev: OK$(NC)" || echo "$(RED)❌ Dev: FAIL$(NC)"

prune: ## Limpiar sistema Docker completo (CUIDADO)
	@echo "$(RED)⚠️  Limpiando TODO el sistema Docker...$(NC)"
	@read -p "¿Estás seguro? [y/N] " -n 1 -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker system prune -a --volumes; \
	fi

# Default target
.DEFAULT_GOAL := help

