# Amasandería — Guía de Entrega

Sitio web estático para catálogo de productos con pedidos vía WhatsApp.

---

## Cómo publicar en GitHub Pages (paso a paso)

1. Crear cuenta en [github.com](https://github.com) si no tiene una.
2. Crear repositorio nuevo (ej: `amasanderia-web`). Que sea **público**.
3. Subir todos los archivos de esta carpeta al repositorio.
4. Ir a **Settings → Pages → Branch: main → Save**.
5. En 2–3 minutos el sitio estará en: `https://TU-USUARIO.github.io/amasanderia-web/public/`

---

## Cómo actualizar el catálogo

El catálogo se gestiona editando el archivo `data/productos.json`.

Cada producto tiene esta estructura:

```json
{
  "id": 7,
  "nombre": "Nombre del producto",
  "precio": 1500,
  "categoria": "Pan",
  "imagen": "nombre-archivo.webp",
  "disponible": true,
  "descripcion": "Descripción breve opcional."
}
```

- **Para agregar:** copiar un bloque y cambiar los valores. El `id` debe ser único.
- **Para quitar temporalmente:** cambiar `"disponible": false`.
- **Para eliminar:** borrar el bloque completo (incluyendo la coma si no es el último).

### Categorías actuales
- `Pan`
- `Empanadas`
- `Pasteles`

Puedes agregar categorías nuevas simplemente usando un nombre nuevo en el campo `"categoria"`.

---

## Configurar número de WhatsApp

Abrir `scripts/app.js` y cambiar la línea:

```js
WHATSAPP_NUMERO: '56912345678',
```

Reemplazar con el número real en formato: `56` + número sin espacios ni guiones.
Ejemplo: `56998765432`

---

## Imágenes de productos

- Formato recomendado: **WebP**, máximo **200 KB** por imagen.
- Guardar en: `assets/img/`
- En el JSON, escribir solo el nombre del archivo (ej: `"marraqueta.webp"`).
- Herramienta gratuita para convertir: [squoosh.app](https://squoosh.app)

---

## Servicios de terceros utilizados

| Servicio | Uso | Cuenta requerida |
|----------|-----|-----------------|
| Tailwind CSS CDN | Estilos | No |
| Google Fonts | Tipografía (Inter) | No |
| WhatsApp API | Botón de pedido | Solo el número de teléfono |
| GitHub Pages | Hosting gratuito | Cuenta GitHub |

---

## Soporte

**CodeClutions** — contacto@codeclutions.cl
Ante cualquier duda técnica, no editar archivos `.js` salvo los indicados arriba.
