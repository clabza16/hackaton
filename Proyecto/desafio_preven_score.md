# 🛡️ Desafío Hackathon: Panel Maestro - Radar de Riesgo Predictivo ("Preven-Score")

## 1. Contexto
En ACHS, el experto en prevención suele operar de manera reactiva: atiende primero a la empresa que más presiona, a la que reporta un incidente reciente o a la que logra visibilizar mejor su urgencia.

Esto genera varios problemas:
- dispersión de información entre múltiples fuentes
- baja priorización basada en evidencia
- dificultad para anticipar alzas de riesgo
- agenda del experto definida por urgencia percibida y no por riesgo real

La oportunidad es construir un panel que ayude a decidir **dónde intervenir primero**, usando señales históricas y contextuales para anticipar empresas con mayor probabilidad de accidente o deterioro operacional.

---

## 2. Problema
¿Cómo priorizar, de forma proactiva y explicable, qué empresas requieren atención preventiva inmediata, en vez de reaccionar solo a quien “grita más fuerte”?

---

## 3. Objetivo
Construir un MVP que permita:
- consolidar señales relevantes de riesgo por empresa
- calcular un **Preven-Score** o score predictivo de riesgo
- visualizar prioridades en un panel de alto impacto
- sugerir a qué empresas visitar o contactar primero
- incorporar explicabilidad básica sobre qué factores elevan el riesgo

---

## 4. Input

### Empresas / señales operacionales
- empresa_id
- empresa_nombre
- rubro
- comuna
- region
- dotacion
- dias_desde_ultima_capacitacion
- inspecciones_ult_90d
- hallazgos_abiertos
- accidentabilidad_12m
- ausentismo_pct
- turno_critico
- dias_desde_ultima_visita_prevencion
- temporada_alta

### Factores contextuales
- fecha
- lluvia_mm
- temperatura_c
- alerta_meteorologica
- congestion_operacional
- evento_masivo_zona

### Comentarios de inspección
- inspection_id
- empresa_id
- inspection_date
- inspector_name
- observation_text

---

## 5. Aplicación de Inteligencia Artificial

### Machine Learning / analítica predictiva
Se espera que la solución combine variables históricas y contextuales para estimar riesgo de accidente o deterioro operacional.

Ejemplos:
- aumento de lluvia y riesgo en construcción
- muchos días sin capacitación
- hallazgos abiertos acumulados
- baja frecuencia de visitas preventivas
- accidentabilidad alta reciente

### NLP / Procesamiento de lenguaje natural
Se pueden analizar comentarios de inspecciones para detectar:
- señales de desorden o caos operativo
- tono de desidia o baja adherencia
- recurrencia de temas críticos
- palabras gatillantes asociadas a incumplimientos

---

## 6. Output esperado

### Vista operativa
- ranking priorizado de empresas
- Preven-Score por empresa
- semáforo de criticidad
- variables explicativas principales
- recomendación de acción

### Riesgos esperados
- aumento de probabilidad de accidente
- deterioro de condiciones de seguridad
- baja adherencia a medidas preventivas
- empresas “silenciosas” con alto riesgo latente

### Acciones sugeridas
- agendar visita prioritaria
- llamar al contacto de la empresa
- acelerar capacitación
- activar seguimiento reforzado
- revisar hallazgos pendientes

---

## 7. Artefactos posibles
- dashboard ejecutivo
- mapa de calor por comuna o rubro
- ranking dinámico de empresas
- agente conversacional para consultar riesgo
- simulador de escenarios
- tablero con recomendaciones explicables

---

## 8. Entregables
1. Entendimiento del problema
2. Lógica de score o modelo predictivo
3. MVP funcional
4. Uso de IA o analítica avanzada
5. Valor para el experto en prevención
6. Roadmap de escalamiento

---

## 9. Evaluación
- Impacto operativo / preventivo (25%)
- Uso de IA o analítica (25%)
- Utilidad real para priorización (20%)
- Claridad de la solución (15%)
- Innovación / explicabilidad (15%)

---

## 10. Bonus
- simulación de agenda diaria del experto
- comparación entre score actual y semana anterior
- alertas automáticas
- explicación del score en lenguaje simple
- vista territorial en mapa

---

## 11. Pregunta guía
¿Cómo logramos que el experto en prevención actúe antes de que ocurra el problema, y no después?
