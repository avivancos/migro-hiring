## Fix: fallback LibreOffice sobreescribe PDF corrupto

Contexto
- `convert_docx_to_pdf()` intenta primero `docx2pdf` y luego usa LibreOffice si falla.
- Si `docx2pdf` deja un PDF corrupto en la ruta final, el fallback podía no reemplazarlo.

Cambio aplicado
- Antes de ejecutar LibreOffice, se elimina cualquier PDF existente en `pdf_path`.
- Esto asegura que el fallback genere un PDF limpio y válido.

Archivos afectados
- `generate_agent_contracts.py`
