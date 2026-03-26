# PDR — Preven-Score: Radar de Riesgo Predictivo ACHS

## 1. Visión General del Proyecto

Construir una aplicación web (React + Python backend) que calcule un **Preven-Score** (0-100) para cada empresa adherida a ACHS, priorizando cuáles requieren intervención preventiva inmediata. El sistema debe ser **explicable**: el experto en prevención debe entender por qué una empresa sube o baja en el ranking.

**Usuario principal:** Experto en prevención de ACHS que gestiona ~12 empresas y necesita decidir cada mañana a quién visitar primero.

**Problema que resuelve:** Hoy el prevencionista atiende a quien "grita más fuerte" (urgencia percibida). Este sistema reemplaza eso con priorización basada en evidencia y riesgo real.

---

## 2. Arquitectura

```
/preven-score
├── /backend                    # Python (FastAPI)
│   ├── main.py                 # API endpoints
│   ├── scoring/
│   │   ├── model.py            # Modelo predictivo del Preven-Score
│   │   ├── nlp.py              # Análisis NLP de comentarios de inspección
│   │   └── features.py         # Feature engineering
│   ├── data/
│   │   ├── loader.py           # Carga y cruce de datasets
│   │   └── datasets/           # Copiar aquí los CSV/XLSX del proyecto
│   └── requirements.txt
├── /frontend                   # React (Vite)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   ├── pages/
│   │   └── styles/
│   └── package.json
└── README.md
```

---

## 3. Datasets Disponibles

Todos los archivos están en `/mnt/project/`. Copiarlos a `backend/data/datasets/`.

### 3.1 `empresas_riesgo_historico_v2.csv` — Dataset maestro
- **144 filas**, 12 empresas, datos semanales desde 2025-12-31 hasta 2026-03-18
- **21 columnas:**
  - Identificación: `fecha`, `empresa_id`, `empresa_nombre`, `rubro`, `comuna`, `region`
  - Operacionales: `dotacion`, `dias_desde_ultima_capacitacion`, `inspecciones_ult_90d`, `hallazgos_abiertos`, `accidentabilidad_12m`, `ausentismo_pct`, `turno_critico`, `dias_desde_ultima_visita_prevencion`, `temporada_alta`
  - Climáticos/contextuales: `lluvia_mm`, `temperatura_c`, `alerta_meteorologica`, `congestion_operacional`, `evento_masivo_zona`
  - **Target:** `accidente_ocurrio_30d` (binario 0/1) — USAR COMO VARIABLE OBJETIVO para el modelo predictivo
- **Notas de calidad:** `turno_critico` tiene valores inconsistentes ("No", "Sí", "NO", "SI"), normalizar. `dias_desde_ultima_capacitacion` tiene NaN. `congestion_operacional` tiene mayúsculas mixtas ("Alta", "alta", "Media", "media", "Baja").

### 3.2 `comentarios_inspecciones.xlsx` — Textos de inspección para NLP
- **67 filas** (header real en fila 3, fila 1 es título decorativo)
- **Columnas:** `inspection_id`, `empresa_id`, `empresa_nombre`, `inspection_date`, `inspector_name`, `observation_text`, `tema_principal`, `severidad_referencial`
- `severidad_referencial`: "Bajo", "Medio", "Crítico"
- `tema_principal`: "Hallazgos", "Orden y limpieza", "Turnos", "EPP", "Procedimientos", "Capacitación"
- Los textos en `observation_text` son frases en español de 1-2 oraciones describiendo hallazgos de inspección

### 3.3 `contexto_climatico_operacional.xlsx` — Contexto del día actual
- **12 filas** (una por empresa), fecha fija `2026-03-25`
- **Columnas:** `fecha`, `empresa_id`, `empresa_nombre`, `rubro`, `comuna`, `lluvia_mm`, `temperatura_c`, `alerta_meteorologica`, `congestion_operacional`, `evento_masivo_zona`, `sensibilidad_clima`
- `sensibilidad_clima`: "Alta", "Media", "Baja" — indica qué tan sensible es el rubro al clima
- Usar estos datos como el "estado actual" para calcular el score de hoy

### 3.4 `agenda_prevencionista_mock.csv` — Agenda actual del experto
- **8 filas**, horarios de 9:00 a 16:00
- **Columnas:** `slot_hora`, `empresa_id`, `empresa_nombre`, `motivo_actual`, `prioridad_actual`, `zona`
- Representa la agenda SIN optimizar. El sistema debe sugerir RE-PRIORIZAR esta agenda según el Preven-Score

### 3.5 `ground_truth_prevenscore_uso_jurado.xlsx` — Referencia de validación
- **12 filas** (una por empresa)
- **Columnas:** `empresa_id`, `empresa_nombre`, `rubro`, `comuna`, `preven_score_referencial`, `criticidad_esperada`, `recomendacion_esperada`
- Header real en fila 3 (fila 1 es título decorativo)
- Scores de referencia van de 34.1 a 76.1
- Criticidad: "Alta" (score ≥ ~65) o "Media" (score < ~65)
- Recomendaciones: "Visita prioritaria hoy" o "Llamado y seguimiento"
- **USAR PARA VALIDAR** que el modelo genera scores correlacionados con esta referencia

### 3.6 Archivos de diseño
- `achs-tokens__4_.css` — CSS con variables de diseño ACHS (colores, tipografía, componentes)
- `achs-tokens-v2_.json` — Tokens de diseño en JSON

---

## 4. Modelo Predictivo del Preven-Score

### 4.1 Enfoque

Usar un **modelo de dos capas:**

**Capa 1 — Modelo ML (probabilidad de accidente):**
- Entrenar con `empresas_riesgo_historico_v2.csv`
- Target: `accidente_ocurrio_30d`
- Features numéricas: `dotacion`, `dias_desde_ultima_capacitacion`, `inspecciones_ult_90d`, `hallazgos_abiertos`, `accidentabilidad_12m`, `ausentismo_pct`, `dias_desde_ultima_visita_prevencion`, `lluvia_mm`, `temperatura_c`
- Features categóricas (one-hot o label encode): `rubro`, `turno_critico`, `temporada_alta`, `alerta_meteorologica`, `congestion_operacional`, `evento_masivo_zona`
- Algoritmo: **Gradient Boosting (sklearn GradientBoostingClassifier o RandomForest)** — priorizar interpretabilidad
- Output: probabilidad 0-1 de accidente

**Capa 2 — Score compuesto (0-100):**
```
preven_score = (
    prob_accidente_ml * 40          # peso del modelo ML
    + score_operacional * 25        # hallazgos, capacitación, visitas
    + score_nlp * 20                # señales de texto de inspecciones
    + score_contextual * 15         # clima, congestión, eventos
)
```

Donde:
- `score_operacional` = normalizar 0-100 combinando: hallazgos_abiertos/dotacion*1000, dias_desde_ultima_capacitacion, dias_desde_ultima_visita_prevencion, accidentabilidad_12m
- `score_nlp` = proporción de comentarios críticos + detección de palabras clave de riesgo en `observation_text`
- `score_contextual` = combinar lluvia (si sensibilidad_clima=Alta), alerta_meteorologica, congestion_operacional, evento_masivo_zona

### 4.2 Feature Engineering

Crear estas features derivadas:
- `hallazgos_por_100_trabajadores` = hallazgos_abiertos / dotacion * 100
- `brecha_capacitacion` = 1 si dias_desde_ultima_capacitacion > 90, 0 si no
- `empresa_silenciosa` = 1 si inspecciones_ult_90d == 0 y dias_desde_ultima_visita > 60
- `tendencia_accidentabilidad` = comparar accidentabilidad actual vs promedio histórico de esa empresa
- `lluvia_x_sensibilidad` = lluvia_mm * (1 si sensibilidad_clima Alta, 0.5 si Media, 0 si Baja)
- `comentarios_criticos_pct` = proporción de comentarios con severidad "Crítico" por empresa

### 4.3 Análisis NLP de Comentarios

Implementar en `nlp.py`:
1. **Palabras clave de riesgo** — buscar en `observation_text`:
   - Riesgo alto: "negligencia", "sin responsable", "no se evidencia", "incumplimiento", "reiterado", "sin cierre", "improvisación", "deteriorad", "insegur", "fatiga", "sobrecarga", "abandono", "caos", "desorden grave", "falta de", "no usan", "sin EPP"
   - Riesgo medio: "parcial", "pendiente", "falta seguimiento", "regular"
   - Riesgo bajo: "cumple", "aceptable", "buena disposición", "sin incidentes"
2. **Score NLP por empresa** = (n_comentarios_criticos * 3 + n_comentarios_medio * 1) / total_comentarios * 100
3. Usar `tema_principal` y `severidad_referencial` como features adicionales

### 4.4 Validación

- Calcular correlación de Spearman entre preven_score calculado y `preven_score_referencial` del ground truth
- Verificar que el top 7 de empresas por score coincida con las empresas de criticidad "Alta" en ground truth
- Ajustar pesos si la correlación es baja

---

## 5. API Backend (FastAPI)

### Endpoints:

```
GET /api/ranking
  → Lista de empresas ordenadas por preven_score desc
  → Cada empresa incluye: empresa_id, nombre, rubro, comuna, preven_score, 
    criticidad (Alta/Media/Baja), semaforo (rojo/amarillo/verde),
    top_3_factores_riesgo, accion_recomendada

GET /api/empresa/{empresa_id}
  → Detalle completo: score, desglose de componentes del score,
    historial de scores semanales, comentarios de inspección recientes,
    factores de riesgo con explicación en texto simple,
    contexto climático actual, métricas operacionales

GET /api/agenda
  → Agenda actual vs agenda re-priorizada por el sistema
  → Muestra la agenda original del prevencionista y sugiere reordenamiento

GET /api/simulacion
  → Recibe parámetros modificados (ej: hallazgos=0, capacitacion=reciente)
  → Retorna nuevo score simulado ("what-if")

GET /api/resumen
  → KPIs globales: total empresas, % críticas, score promedio,
    empresas sin visita >30 días, alertas activas
```

---

## 6. Frontend — Vistas y Funcionalidades

### Estilo Visual
- Usar los **tokens de diseño ACHS** del archivo `achs-tokens__4_.css`
- Colores primarios: verde ACHS `#27933E` (seguro), con semánticos para semáforo
- Semáforo: rojo `#FF7466`, amarillo `#EAC52F`, verde `#27933E`
- Fondo claro: `#E6F7E4` o blanco
- Tipografía: usar fonts del sistema que se parezcan a sans-serif modernos (fallback a sans-serif ya que las fuentes ACHS custom no están disponibles)
- Border radius: 16px en cards
- Sombras suaves como en los tokens

### 6.1 Vista Principal — Dashboard de Ranking (página default)

**Layout:** Panel de control con 3 secciones verticales

**Sección superior — KPIs rápidos (cards en fila horizontal):**
- Total empresas monitoreadas
- Empresas en criticidad ALTA (con número y porcentaje)
- Score promedio del portafolio
- Empresas sin visita preventiva > 30 días
- Alertas climáticas activas hoy

**Sección central — Ranking priorizado (tabla principal):**
- Tabla con columnas: #, Empresa, Rubro, Comuna, Preven-Score (barra visual 0-100), Semáforo, Tendencia (↑↓→), Acción Recomendada
- Semáforo visual: círculo rojo/amarillo/verde al lado del score
- Acción recomendada como badge/pill: "Visitar hoy" (rojo), "Llamar" (amarillo), "Monitorear" (verde)
- Al hacer click en una fila → navegar a vista detalle
- Filtros arriba de la tabla: por rubro, por criticidad, por comuna

**Sección inferior — Factores de riesgo del día:**
- Card con condiciones climáticas actuales (lluvia, temperatura, alertas)
- Card con empresas que tienen alerta contextual (evento masivo, congestión alta)

### 6.2 Vista Detalle por Empresa

Al hacer click en una empresa del ranking:

**Header:** Nombre, rubro, comuna, score grande con semáforo, badge de criticidad

**Panel izquierdo — Desglose del Score (explicabilidad):**
- Gráfico de barras horizontal o donut mostrando contribución de cada componente:
  - Modelo predictivo ML: X/40 pts
  - Riesgo operacional: X/25 pts  
  - Señales de texto (NLP): X/20 pts
  - Contexto climático: X/15 pts
- Debajo: lista de los **top 5 factores que elevan el riesgo** en lenguaje simple:
  - Ejemplo: "⚠️ 257 días sin capacitación (umbral: 90 días)"
  - Ejemplo: "⚠️ 9 hallazgos abiertos sin cierre"
  - Ejemplo: "🌧️ Lluvia de 13.6mm con sensibilidad climática Alta"
  - Ejemplo: "📋 2 de 4 inspecciones con observaciones críticas"
  - Ejemplo: "📅 117 días sin visita preventiva"

**Panel derecho — Historial y contexto:**
- Gráfico de línea: evolución del score en las últimas 12 semanas
- Timeline de últimos comentarios de inspección (con color por severidad)
- Métricas operacionales actuales en cards pequeños

**Acción recomendada:** Box destacado abajo con la recomendación y razón

### 6.3 Vista Agenda Inteligente

**Layout de dos columnas:**

**Columna izquierda — "Agenda actual":**
- Muestra la agenda_prevencionista_mock tal cual (horarios, empresas, motivos)
- Cada slot con la prioridad original

**Columna derecha — "Agenda sugerida por Preven-Score":**
- Misma estructura pero re-ordenada por score
- Las empresas con score más alto van primero en la mañana
- Cada slot muestra: hora, empresa, score, motivo sugerido basado en factores de riesgo
- Resaltado visual de los cambios vs la agenda original
- Indicador de cuántas empresas de alta criticidad estaban relegadas en la agenda original

**Insight box:** "La agenda original tenía X empresas críticas en horarios tardíos. La agenda sugerida prioriza intervenciones de alto impacto en la mañana."

### 6.4 Vista Simulador ("¿Qué pasaría si...?")

Panel interactivo para que el prevencionista explore escenarios:

**Controles (sliders/inputs):**
- Selector de empresa
- Slider: hallazgos abiertos (0-20)
- Slider: días desde última capacitación (0-365)
- Toggle: ¿llovió hoy? / alerta meteorológica
- Toggle: ¿hay evento masivo en la zona?
- Toggle: ¿hay congestión operacional alta?

**Resultado en tiempo real:**
- Score recalculado con parámetros modificados
- Comparación visual: score actual vs score simulado
- Cambio de semáforo si aplica
- Texto: "Si se realiza una capacitación, el score bajaría de 72 a 58 (criticidad Media)"

### 6.5 Vista Mapa de Calor Territorial (bonus)

- Mapa esquemático (no necesita Google Maps, puede ser SVG o grid) de comunas
- Cada comuna coloreada según el score máximo de empresas en esa zona
- Click en comuna → lista de empresas de esa zona con sus scores
- Útil para planificar rutas de visita

### 6.6 Vista Alertas y Notificaciones

- Lista de alertas activas ordenadas por severidad:
  - "🔴 Minería Cordillera: Score 76, lluvia con alerta meteorológica y sensibilidad alta"
  - "🟡 Bodega Central Express: 244 días sin capacitación"
  - "🔴 Constructora Andina: 2 comentarios críticos recientes + hallazgos sin cierre"
- Cada alerta con botón de acción rápida: "Agendar visita", "Llamar", "Ver detalle"

---

## 7. Lógica de Acciones Recomendadas

Basado en el score y factores específicos, generar recomendaciones:

```python
def generar_recomendacion(empresa):
    if empresa.preven_score >= 65:
        if empresa.dias_sin_visita > 30:
            return "Visita prioritaria hoy"
        else:
            return "Visita de seguimiento urgente"
    elif empresa.preven_score >= 45:
        if empresa.hallazgos_abiertos > 10:
            return "Llamado + revisión de hallazgos"
        elif empresa.dias_sin_capacitacion > 120:
            return "Programar capacitación"
        else:
            return "Llamado y seguimiento"
    else:
        return "Monitoreo estándar"
```

---

## 8. Stack Técnico

### Backend:
- **Python 3.10+**
- **FastAPI** — API REST
- **Pandas** — procesamiento de datos
- **scikit-learn** — modelo predictivo (GradientBoostingClassifier)
- **uvicorn** — servidor ASGI

### Frontend:
- **React 18** con Vite
- **Recharts** — gráficos (líneas, barras, donuts)
- **CSS custom** — basado en tokens ACHS (NO usar Tailwind, usar los tokens ACHS directamente)
- **React Router** — navegación entre vistas

### Importante:
- El backend debe servir datos precalculados (no entrenar el modelo en cada request)
- Al iniciar, cargar datos, entrenar modelo, calcular scores, y guardar en memoria
- El frontend consume la API con fetch

---

## 9. Pasos de Implementación (para Claude Code)

### Paso 1: Setup del proyecto
1. Crear estructura de carpetas
2. Copiar datasets a `backend/data/datasets/`
3. Instalar dependencias Python: `fastapi`, `uvicorn`, `pandas`, `scikit-learn`, `openpyxl`
4. Crear proyecto React con Vite

### Paso 2: Backend — Data pipeline
1. Implementar `loader.py`: leer y cruzar los 4 datasets
2. Limpiar datos: normalizar turno_critico, congestion_operacional, llenar NaN
3. Cruzar empresas_riesgo_historico con contexto_climatico (para datos del día actual)
4. Cruzar con comentarios_inspecciones para features NLP

### Paso 3: Backend — Modelo predictivo
1. Implementar feature engineering en `features.py`
2. Entrenar modelo en `model.py` con datos históricos
3. Implementar `nlp.py` para análisis de comentarios
4. Calcular Preven-Score compuesto por empresa
5. Validar contra ground_truth

### Paso 4: Backend — API
1. Implementar endpoints de FastAPI
2. Precalcular scores al iniciar la app
3. Endpoint de simulación recalcula score con parámetros custom

### Paso 5: Frontend — Dashboard
1. Implementar layout principal con navegación
2. Vista de ranking con tabla, KPIs y filtros
3. Vista detalle con desglose de score y explicabilidad
4. Vista agenda inteligente
5. Vista simulador
6. Aplicar estilos ACHS

### Paso 6: Integración y pruebas
1. Conectar frontend con backend
2. Verificar que scores coincidan con ground truth
3. Verificar explicabilidad y recomendaciones

---

## 10. Criterios de Éxito

1. **Correlación con ground truth:** El ranking generado debe tener las mismas 7 empresas "Alta" que el ground truth en el top 7
2. **Explicabilidad:** Cada score debe mostrar los factores que lo componen
3. **Accionabilidad:** Cada empresa debe tener una recomendación concreta
4. **Usabilidad:** El prevencionista debe poder entender el dashboard en 30 segundos
5. **Re-priorización:** La agenda sugerida debe ser visiblemente mejor que la actual

---

## 11. Datos de Referencia del Ground Truth

Para validación, estos son los scores esperados:

| Empresa | Score Ref | Criticidad | Recomendación |
|---|---|---|---|
| Minería Cordillera | 76.1 | Alta | Visita prioritaria hoy |
| Bodega Central Express | 71.9 | Alta | Visita prioritaria hoy |
| Constructora Andina | 71.7 | Alta | Visita prioritaria hoy |
| Agroindustrial Valle Verde | 69.8 | Alta | Visita prioritaria hoy |
| Obras Civiles Mapocho | 68.3 | Alta | Visita prioritaria hoy |
| Logística Ruta Sur | 67.7 | Alta | Visita prioritaria hoy |
| Planta Envases Pacífico | 67.1 | Alta | Visita prioritaria hoy |
| Servicios Clínicos Oriente | 54.3 | Media | Llamado y seguimiento |
| Metalúrgica Renca | 48.7 | Media | Llamado y seguimiento |
| Centro Operativo Maestranza | 46.0 | Media | Llamado y seguimiento |
| Transportes Santa Elena | 41.8 | Media | Llamado y seguimiento |
| Clínica Laboral Norte | 34.1 | Media | Llamado y seguimiento |