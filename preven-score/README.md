# Preven-Score: Dashboard de Riesgo Predictivo ACHS

**Preven-Score** es una plataforma analítica diseñada para expertos en prevención de riesgos de la ACHS. Su objetivo es transformar datos operativos, históricos y contextuales en una prioridad de intervención clara, permitiendo pasar de una prevención reactiva a una proactiva.

## 🚀 Vision General

El sistema se compone de un **Backend en FastAPI** que procesa modelos de Machine Learning y lógica de negocio, y un **Frontend en React (Vite)** que ofrece una interfaz premium, iconográfica y altamente interactiva para la toma de decisiones.

## 🧠 Cálculo del Preven-Score

El core del proyecto es el algoritmo de scoring, que combina cuatro capas de información para generar un índice de riesgo del **0 al 100**.

### 1. Capa de Machine Learning (40%)
Utiliza un modelo `GradientBoostingClassifier` entrenado con datos históricos de accidentes. 
- **Entrada**: Series temporales de dotación, capacitaciones y accidentes previos.
- **Salida**: Probabilidad estadística de que ocurra un accidente en los próximos 30 días.

### 2. Capa Operacional (25%)
Mide el "estado de salud" preventivo interno de la empresa.
- **Hallazgos**: Ratio de brechas detectadas normalizado por la dotación.
- **Capacitación**: Días transcurridos desde la última instrucción de seguridad.
- **Visitas**: Días desde la última intervención de un experto ACHS.
- **Accidentabilidad**: Tasa de frecuencia de los últimos 12 meses.

### 3. Capa NLP - Inteligencia de Texto (20%)
Transforma los comentarios cualitativos de los inspectores en datos cuantitativos.
- Analiza el sentimiento y la urgencia en los reportes de inspección.
- Detecta palabras clave de alto riesgo que los indicadores numéricos podrían omitir.

### 4. Capa Contextual - Riesgo Externo (15%)
Evalúa factores del entorno en tiempo real que afectan la operación.
- **Clima**: Alertas meteorológicas y milímetros de lluvia previstos (usando sensibilidad por rubro).
- **Entorno**: Eventos masivos en la zona y congestión operacional detectada.

---

## 🛠️ Características Principales

- **Ranking Priorizado**: Las empresas se ordenan automáticamente según su nivel de riesgo real y actual.
- **Agenda Inteligente**: Re-priorización automática de la jornada del experto basada en el scoring.
- **Configuración Dinámica**: Panel para ajustar los pesos de cada capa del modelo en tiempo real.
- **Simulador de Escenarios**: Herramienta "What-if" para proyectar cómo cambiaría el riesgo si se cierran hallazgos o mejora la capacitación.
- **Segmentación por Dotación**: Categorización automática (Micro, Pequeña, Mediana, Grande) para un trato personalizado.

## 💻 Instalación y Uso Local

### Requisitos
- Python 3.9+
- Node.js 18+

### Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```
El servidor correrá en `http://localhost:8000`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Accede a la interfaz en `http://localhost:5173`.

---

## 📊 Estructura de Datos
El sistema consume archivos CSV ubicados en `backend/data/datasets/`:
- `v2.csv`: Datos históricos y demográficos.
- `comentarios.csv`: Logs de inspección para el motor NLP.
- `contactos.csv`: Información de contacto y zona geográfica.
- `weights.json`: Persistencia de la configuración del modelo.

---
*Desarrollado para el Hackathon ACHS - Transformando la prevención con datos.*
