"""
limpiar.py — Fase 2: Data-Clean de Amasandería
Procesa inventario_sucio.xlsx.csv y exporta ../data/productos.json

Problemas detectados en el archivo fuente:
  - Encoding roto (latin-1 / cp1252 leído como UTF-8)
  - Precios con '$', espacios y puntos extra  (ej: '$1.50 ', '2500...')
  - Categorías con capitalización inconsistente
  - Filas vacías marcadas como '(vacío)'

Ejecutar dentro del contenedor Docker:
  python limpiar.py
"""

import csv
import json
import re
import os
from datetime import datetime, timezone

# ── Configuración ─────────────────────────────────────────────────────────────
ARCHIVO_ENTRADA = "inventario_sucio.xlsx.csv"
# Docker se monta desde la raíz del cliente (-v ${PWD}:/app -w /app/scripts)
# → /app = raíz cliente, /app/scripts = cwd, ../data = /app/data ✓
ARCHIVO_SALIDA  = "../data/productos.json"

# Mapa de normalización de categorías (corrige encoding roto y unifica)
CATEGORIAS = {
    "panaderia":  "Panadería",
    "panader":    "Panadería",   # captura variantes truncadas
    "rotiseria":  "Rotisería",
    "rotisar":    "Rotisería",
    "bebidas":    "Bebidas",
    "pasteles":   "Pasteles",
    "empanadas":  "Empanadas",
}

# ── Helpers ───────────────────────────────────────────────────────────────────
def limpiar_precio(raw: str) -> int | None:
    """
    Extrae el número de un precio sucio.
    '$1.50 ' → 150  (asume que '.' es separador de miles en formato CLP)
    '2500...' → 2500
    '1800'    → 1800
    Retorna None si no se puede parsear.
    """
    s = raw.strip().replace("$", "").replace(" ", "")
    s = re.sub(r"\.{2,}$", "", s)   # quita puntos finales múltiples (2500...)

    # Si tiene exactamente un punto y dígitos después → separador de miles CLP
    # Ej: '1.500' → 1500 | '1.50' → 150
    if re.fullmatch(r"\d+\.\d+", s):
        partes = s.split(".")
        s = "".join(partes)          # '1.500' → '1500', '1.50' → '150'

    try:
        return int(float(s))
    except ValueError:
        return None


def normalizar_categoria(raw: str) -> str:
    """Normaliza la categoría corrigiendo encoding y capitalización."""
    # Intenta decodificar latin-1 leído como UTF-8 (caracteres rotos)
    try:
        corregida = raw.encode("latin-1").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        corregida = raw

    clave = corregida.lower().strip()

    for patron, nombre in CATEGORIAS.items():
        if patron in clave:
            return nombre

    # Si no hay match, title-case de lo que llegue
    return corregida.strip().title()


def es_vacia(fila: dict) -> bool:
    """Detecta filas marcadas como vacías o completamente en blanco."""
    valores = [v.strip().lower() for v in fila.values()]
    return all(v in ("", "(vac\u00edo)", "(vacio)", "(vacío)") for v in valores)


# ── Procesamiento ─────────────────────────────────────────────────────────────
def procesar():
    if not os.path.exists(ARCHIVO_ENTRADA):
        print(f"[ERROR] No se encontró '{ARCHIVO_ENTRADA}'. Verifica que esté en scripts/")
        return

    productos = []
    advertencias = []
    id_counter = 1

    # Intentar con utf-8 primero, fallback a latin-1
    for encoding in ("utf-8-sig", "latin-1"):
        try:
            with open(ARCHIVO_ENTRADA, newline="", encoding=encoding) as f:
                reader = csv.DictReader(f)
                filas = list(reader)
            print(f"[OK] Archivo leído con encoding: {encoding}")
            break
        except UnicodeDecodeError:
            continue
    else:
        print("[ERROR] No se pudo leer el archivo. Prueba guardarlo como UTF-8 desde Excel.")
        return

    for i, fila in enumerate(filas, start=2):   # start=2 porque fila 1 es header
        if es_vacia(fila):
            print(f"[SKIP] Fila {i}: vacía, ignorada.")
            continue

        nombre_raw = fila.get("Producto", "").strip()
        precio_raw = fila.get("Precio", "").strip()
        cat_raw    = fila.get("Categoria", "").strip()

        # Nombre: title-case, sin espacios extra
        nombre = nombre_raw.title().strip()
        if not nombre:
            advertencias.append(f"Fila {i}: nombre vacío, ignorada.")
            continue

        # Precio
        precio = limpiar_precio(precio_raw)
        if precio is None or precio <= 0:
            advertencias.append(f"Fila {i} '{nombre}': precio '{precio_raw}' no válido → se pone 0, REVISAR.")
            precio = 0

        # Categoría
        categoria = normalizar_categoria(cat_raw) if cat_raw else "Sin categoría"

        productos.append({
            "id":          id_counter,
            "nombre":      nombre,
            "precio":      precio,
            "categoria":   categoria,
            "imagen":      "",
            "disponible":  True,
            "descripcion": ""
        })
        id_counter += 1

    # ── Salida JSON ───────────────────────────────────────────────────────────
    os.makedirs(os.path.dirname(ARCHIVO_SALIDA), exist_ok=True)

    salida = productos   # el JSON es el array directo, sin wrapper

    with open(ARCHIVO_SALIDA, "w", encoding="utf-8") as f:
        json.dump(salida, f, ensure_ascii=False, indent=2)

    # ── Reporte ───────────────────────────────────────────────────────────────
    print(f"\n{'='*50}")
    print(f"  productos exportados : {len(productos)}")
    print(f"  archivo de salida    : {ARCHIVO_SALIDA}")
    print(f"  timestamp            : {datetime.now(timezone.utc).isoformat()}")
    print(f"{'='*50}")

    if advertencias:
        print("\n[ADVERTENCIAS — requieren revisión manual]")
        for a in advertencias:
            print(f"  ⚠  {a}")

    print("\n[LISTO] Abre data/productos.json para verificar antes de publicar.")


if __name__ == "__main__":
    procesar()
