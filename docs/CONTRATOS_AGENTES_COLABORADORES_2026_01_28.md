# Contratos agentes colaboradores (28/01/2026)

## Objetivo
Preparar contratos de agente colaborador con layout Migro (header verde) y exportacion a PDF, firmados con HelloSign en Salamanca con fecha 28/01/2026.

## Agentes incluidos
- Gabriela Calderon Alvarado (CURP: CAAG861227MMNLLB07)
  - Domicilio: Blvd. Sauces #161, Fraccionamiento Rinconada los Sauces, Tarimbaro, Michoacan, Mexico
- Erick Ezequiel Alvarez Legorreta (CURP: AALE950416HMCLGR00)
  - Domicilio: Av de los Maestros 314, Colonia Doctores, C.P. 50060, Toluca, Mexico
- Brenda Montserrat Fanny Moreno Tovar (INE: IDMEX1832667425)
  - Domicilio: Calzada de las Aguilas #934, Col. Ampliacion las Aguilas, C.P. 01759, Alcaldia Alvaro Obregon, Mexico
- Sonia Alejandra Cisnero (DNI: 26245201)
  - Domicilio: Sebastian El Cano 147, San Rafael, Mendoza, Argentina

## Plantilla usada
- `src/legal/agente_ventas_agreement.md`

## Script y salida
- Script: `generate_agent_contracts.py`
- Salida DOCX/PDF: `src/legal/contratos_agentes/`
- Fecha fija de firma: `28 de enero de 2026`
- Nota de firma: "Firmado electronicamente con HelloSign."
- Firmas en tabla con domicilios de MIGRO y del agente para alinear correctamente.

## Exportacion a PDF
El script intenta convertir a PDF de dos formas:
1. `docx2pdf` (instala automaticamente si falta).
2. LibreOffice `soffice` en modo headless como fallback.

## Ejecucion (Docker)
Ejecutar el script dentro del entorno Docker del proyecto para cumplir con la politica de ejecucion:

```
python generate_agent_contracts.py
```

Si la imagen/servicio de Docker ya tiene Python, basta con ejecutar el comando dentro del contenedor.
