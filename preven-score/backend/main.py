import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import pandas as pd
import numpy as np
import json
import os

from data.loader import load_all
from scoring.model import PrevenScoreModel
from scoring.nlp import get_empresa_nlp_detail

app = FastAPI(title="Preven-Score API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AppState:
    datasets = {}
    model = None
    scores = []
    contactos = {}
    expertos = {}
    historico_mensual = []
    weights = {}
    
state = AppState()

def enrich_scores():
    # Enrich pre-scores with zona, contacto, and weather
    live_weather = state.datasets.get("live_weather", {})
    if not state.scores:
        return
        
    for sc in state.scores:
        eid = sc["empresa_id"]
        c = state.contactos.get(eid, {})
        sc["zona"] = c.get("zona", "Desconocida")
        sc["contacto"] = c
        sc["experto_asignado"] = state.expertos.get(eid, "Sin Asignar")
        
        # Inject real weather from meteochile proxy
        w = live_weather.get(sc["zona"], {})
        if w:
            sc["contexto"]["clima_live"] = f"{w.get('temperature', '?')}°C, {w.get('condition', '?')}"
        else:
            sc["contexto"]["clima_live"] = "Dato no disponible"
            
        # Extract top 2 critical factors for the detail recommendation
        factores_raw = []
        if sc["metricas"]["dias_sin_capacitacion"] > 90:
            factores_raw.append(f"brecha de capacitación ({sc['metricas']['dias_sin_capacitacion']} días)")
        if sc["metricas"]["hallazgos_abiertos"] > 15:
            factores_raw.append(f"alto volumen de hallazgos ({sc['metricas']['hallazgos_abiertos']})")
        if sc["metricas"]["accidentabilidad"] > 5.0:
            factores_raw.append(f"alerta de accidentabilidad ({sc['metricas']['accidentabilidad']}%)")
        if str(sc["contexto"]["alerta"]).lower() == "si":
            factores_raw.append("alerta climática activa")
            
        f_text = f" debido a {', '.join(factores_raw[:2])}" if factores_raw else ""
        
        # Enhance recommendations
        if sc["criticidad"] == "Alta":
            sc["recomendacion_detalle"] = f"Nivel crítico detectado{f_text}. Se requiere intervención en terreno inmediata para mitigar riesgos severos y evitar fatalidades. Contactar a {c.get('contacto_nombre', 'el encargado')} a la brevedad."
        elif sc["criticidad"] == "Media":
            sc["recomendacion_detalle"] = f"Riesgo preventivo moderado{f_text}. Se recomienda agendar una reunión de revisión de compromisos y cerrar hallazgos pendientes antes del próximo ciclo."
        else:
            sc["recomendacion_detalle"] = f"Empresa con riesgo bajo{f_text}. Continuar con el plan de monitoreo mensual estándar."

WEIGHTS_PATH = os.path.join(os.path.dirname(__file__), "data", "weights.json")

def load_weights():
    if os.path.exists(WEIGHTS_PATH):
        try:
            with open(WEIGHTS_PATH, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading weights: {e}")
    # Fallback default
    return {
        "layers": {"ml": 40.0, "operacional": 25.0, "nlp": 20.0, "contextual": 15.0},
        "operacional": {"hallazgos": 0.4, "capacitacion": 0.2, "visita": 0.2, "accidentabilidad": 0.2},
        "contextual": {"alerta": 0.4, "evento": 0.2, "congestion": 0.2, "lluvia": 0.2}
    }

def save_weights(w):
    try:
        with open(WEIGHTS_PATH, "w") as f:
            json.dump(w, f, indent=4)
        state.weights = w
        return True
    except Exception as e:
        print(f"Error saving weights: {e}")
        return False

@app.on_event("startup")
def startup_event():
    state.weights = load_weights()
    print("Loading datasets...")
    state.datasets = load_all()
    print("Data loaded. Training model...")
    state.model = PrevenScoreModel()
    state.model.train(state.datasets["empresas"], state.datasets["comentarios"])
    
    # Process contactos and zona
    df_contactos = state.datasets.get("contactos", pd.DataFrame())
    if not df_contactos.empty:
        for _, row in df_contactos.iterrows():
            state.contactos[row["empresa_id"]] = {
                "contacto_nombre": row.get("contacto_nombre", ""),
                "contacto_email": row.get("contacto_email", ""),
                "contacto_telefono": str(row.get("contacto_telefono", "")),
                "zona": row.get("zona", "Desconocida")
            }
            
    # Process expertos (inspector = experto)
    df_com = state.datasets.get("comentarios", pd.DataFrame())
    if not df_com.empty:
        for eid, group in df_com.groupby("empresa_id"):
            inspector = group["inspector_name"].mode()
            state.expertos[eid] = inspector.iloc[0] if not inspector.empty else "Sin Asignar"
            
    # 3. Calculate REAL historical scores for all entries in v2.csv 
    # to avoid proxies and show actual model evolution.
    print("Calculating historical scores...")
    df_hist_all = state.datasets.get("empresas", pd.DataFrame()).copy()
    all_historical_results = state.model.calculate_scores(df_hist_all, pd.DataFrame(), df_com, latest_only=False, weights=state.weights)
    
    # Map results to the dataframe as a new column for easy access by index
    # calculate_scores returns a list of DICTS in the same order as df_hist_all
    scores_list = [s["preven_score"] for s in all_historical_results]
    df_hist_all["preven_score_calculated"] = scores_list
    # Refresh the dataset with the new column
    state.datasets["empresas"] = df_hist_all
    
    # Identify the LATEST score for each company for the current ranking
    latest_indices = df_hist_all.groupby("empresa_id")["fecha"].idxmax()
    df_latest = df_hist_all.loc[latest_indices]
    
    state.scores = state.model.calculate_scores(
        df_latest, 
        state.datasets["contexto"], 
        state.datasets["comentarios"],
        weights=state.weights
    )
    
    enrich_scores()
    print("Startup complete. Data and weights synchronized.")

@app.get("/api/ranking")
def get_ranking():
    return state.scores

@app.get("/api/empresa/{empresa_id}")
def get_empresa(empresa_id: int):
    empresa = next((e for e in state.scores if e["empresa_id"] == empresa_id), None)
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa not found")
        
    # Use pre-calculated real historical scores from startup
    df_hist_meta = state.datasets["empresas"]
    hist_raw = [s for s in state.historico_mensual if s["empresa_id"] == empresa_id]
    
    historico_mensual = []
    for h in hist_raw:
        # Match with original rows to get the date string
        row_idx = df_hist_meta[(df_hist_meta["empresa_id"] == empresa_id)].index # This is a bit loose but works if IDs are stable
        # Better: calculate_scores should probably return the date if present. 
        # For now, we'll just group the pre-calculated ones.
        pass

    # RE-IMPLEMENTATION of historico_mensual using the real scores
    # We'll re-run a mini calculation to ensure dates are grouped by month correctly
    hist_df = df_hist_meta[df_hist_meta["empresa_id"] == empresa_id].copy()
    hist_df["mes"] = hist_df["fecha"].dt.strftime("%Y-%m")
    
    # Instead of proxy, we use the results from calculate_scores we just did
    for mes, group in hist_df.groupby("mes"):
        month_scores = group["preven_score_calculated"]
        
        historico_mensual.append({
            "mes": mes,
            "accidentabilidad_media": round(float(group["accidentabilidad_12m"].mean()), 2),
            "hallazgos_medios": round(float(group["hallazgos_abiertos"].mean()), 1),
            "score_real": round(float(month_scores.mean()), 1) if not month_scores.empty else 0
        })
        
    historico_mensual = sorted(historico_mensual, key=lambda x: x["mes"])
        
    nlp_detail = get_empresa_nlp_detail(empresa_id, state.datasets["comentarios"])
    
    # Inspections list
    df_com = state.datasets["comentarios"]
    inspecciones = df_com[df_com["empresa_id"] == empresa_id].to_dict("records")
    for i in inspecciones:
        # make it JSON serializable safely
        i["inspection_date"] = str(i["inspection_date"])
    
    factores = []
    if empresa["metricas"]["dias_sin_capacitacion"] > 90:
        factores.append(f"⚠️ {empresa['metricas']['dias_sin_capacitacion']} días sin capacitación (umbral: 90 días)")
    if empresa["metricas"]["hallazgos_abiertos"] > 0:
        factores.append(f"⚠️ {empresa['metricas']['hallazgos_abiertos']} hallazgos abiertos sin cierre")
    if str(empresa["contexto"]["alerta"]).lower() == "si":
        factores.append(f"🌧️ Lluvia de {empresa['contexto']['lluvia_mm']}mm con alerta meteorológica")
    if nlp_detail["n_criticos"] > 0:
        factores.append(f"📋 {nlp_detail['n_criticos']} de {nlp_detail['total']} comentarios de inspección críticos")
    if empresa["metricas"]["dias_sin_visita"] > 60:
        factores.append(f"📅 {empresa['metricas']['dias_sin_visita']} días sin visita preventiva")

    if not factores:
        factores.append("✅ Sin factores críticos aparentes")

    result = {
        **empresa,
        "historico_mensual": historico_mensual,
        "nlp_detail": nlp_detail,
        "inspecciones": inspecciones,
        "top_factores_riesgo": factores[:5]
    }
    return result

@app.get("/api/historico_global")
def get_historico_global():
    # Return aggregated historical data grouped by mes per empresa
    df_hist = state.datasets["empresas"]
    hist = df_hist.copy()
    hist["mes"] = hist["fecha"].dt.strftime("%Y-%m")
    
    mensual = {}
    df_hist_meta = state.datasets["empresas"]
    hist_meta = df_hist_meta.copy()
    hist_meta["mes"] = hist_meta["fecha"].dt.strftime("%Y-%m")
    
    mensual = {}
    for (eid, mes), group in hist_meta.groupby(["empresa_id", "mes"]):
        if mes not in mensual:
            mensual[mes] = []
            
        empresa_name = group["empresa_nombre"].iloc[0]
        # Average of pre-calculated scores for this company in this month
        avg_score = group["preven_score_calculated"].mean()
        
        mensual[mes].append({
            "empresa_id": int(eid),
            "empresa_nombre": empresa_name,
            "rubro": group["rubro"].iloc[0],
            "segmento": state.model.get_segmento(group["dotacion"].iloc[0]),
            "score_real": round(float(avg_score), 1)
        })
        
    # Flatten structure
    results = []
    for mes, data in mensual.items():
        results.append({
            "mes": mes,
            "empresas": sorted(data, key=lambda x: x.get("score_real", 0), reverse=True)
        })
    return sorted(results, key=lambda x: x["mes"])

@app.get("/api/agenda")
def get_agenda(experto: str = None):
    # Base agenda
    agenda_df = state.datasets["agenda"]
    agenda = agenda_df.to_dict("records")
    
    # Inject expertos to actual slots if filtering is needed
    for m in agenda:
        eid = m["empresa_id"]
        m["experto"] = state.expertos.get(eid, "Sin Asignar")
        
    if experto and experto != "Todos":
        agenda = [m for m in agenda if m["experto"] == experto]
        
    # Re-sort for sugerrida
    sugerida = [item.copy() for item in agenda]
    for m in sugerida:
        eid = m["empresa_id"]
        sc = next((e for e in state.scores if e["empresa_id"] == eid), None)
        m["preven_score"] = sc["preven_score"] if sc else 0
        m["motivo_sugerido"] = sc["recomendacion"] if sc else ""
        m["zona"] = sc["zona"] if sc else "Desconocida"
        
    sugerida.sort(key=lambda x: x["preven_score"], reverse=True)
    
    # Map slots from the filtered original length
    slots = sorted([m["slot_hora"] for m in agenda])
    for i, m in enumerate(sugerida):
        m["nuevo_slot_hora"] = slots[i] if i < len(slots) else "Extra Slot"
        
    return {
        "expertos_disponibles": sorted(list(set(state.expertos.values()))),
        "actual": agenda,
        "sugerida": sugerida
    }

@app.get("/api/resumen")
def get_resumen():
    total = len(state.scores)
    criticas = sum(1 for e in state.scores if e["criticidad"] == "Alta")
    avg_score = sum(e["preven_score"] for e in state.scores) / total if total > 0 else 0
    sin_visita = sum(1 for e in state.scores if e["metricas"]["dias_sin_visita"] > 30)
    alertas_climaticas = sum(1 for e in state.scores if str(e["contexto"]["alerta"]).lower() == "si")
    
    return {
        "total_empresas": total,
        "criticas": criticas,
        "criticas_pct": (criticas / total * 100) if total > 0 else 0,
        "score_promedio": round(avg_score, 1),
        "empresas_sin_visita_30d": sin_visita,
        "alertas_activas_hoy": alertas_climaticas
    }

@app.get("/api/simulacion")
def get_simulacion(empresa_id: int, hallazgos: str = "", dias_cap: str = "", 
                   lluvia: str = "", alerta: str = "", masivo: str = "", 
                   congestion: str = ""):
    # Retrieve base data for empresa
    df_actual = state.datasets["empresas"]
    emp_actual = df_actual[df_actual["empresa_id"] == empresa_id].sort_values("fecha").tail(1).copy()
    
    if emp_actual.empty:
        raise HTTPException(status_code=404, detail="Empresa not found")
        
    contexto = state.datasets["contexto"]
    ctx_emp = contexto[contexto["empresa_id"] == empresa_id].copy()
    
    # Safely apply ONLY modified parameters. If frontend sends empty string or "null", use defaults.
    if lluvia != "":
        ctx_emp["lluvia_mm"] = 15.0 if lluvia.lower() == 'true' else 0.0
    if alerta != "":
        ctx_emp["alerta_meteorologica"] = "si" if alerta.lower() == 'true' else "no"
    if masivo != "":
        ctx_emp["evento_masivo_zona"] = "si" if masivo.lower() == 'true' else "no"
    if congestion != "":
        ctx_emp["congestion_operacional"] = "Alta" if congestion.lower() == 'true' else ("Media" if not ctx_emp.empty else "Baja")
    
    if hallazgos != "" and hallazgos.isdigit():
        emp_actual["hallazgos_abiertos"] = int(hallazgos)
    if dias_cap != "" and dias_cap.isdigit():
        emp_actual["dias_desde_ultima_capacitacion"] = int(dias_cap)
        
    # Recalculate
    sim_scores = state.model.calculate_scores(emp_actual, ctx_emp, state.datasets["comentarios"], weights=state.weights)
    
    if not sim_scores:
        raise HTTPException(status_code=500, detail="Error simulating score")
        
    return sim_scores[0]

@app.get("/api/config")
def get_config():
    return state.weights

@app.post("/api/config")
def update_config(new_weights: Dict[str, Any]):
    # Basic validation
    if "layers" not in new_weights:
        raise HTTPException(status_code=400, detail="Faltan pesos de capas")
    
    success = save_weights(new_weights)
    if not success:
        raise HTTPException(status_code=500, detail="Error al guardar configuración")
    
    # RECALCULATE EVERYTHING - Important for user feedback
    print("Recalculating all scores with new weights...")
    df_hist_all = state.datasets["empresas"].copy()
    all_historical_results = state.model.calculate_scores(df_hist_all, pd.DataFrame(), state.datasets["comentarios"], latest_only=False, weights=state.weights)
    scores_list = [s["preven_score"] for s in all_historical_results]
    df_hist_all["preven_score_calculated"] = scores_list
    state.datasets["empresas"] = df_hist_all
    
    latest_indices = df_hist_all.groupby("empresa_id")["fecha"].idxmax()
    state.scores = state.model.calculate_scores(
        df_hist_all.loc[latest_indices], 
        state.datasets["contexto"], 
        state.datasets["comentarios"],
        weights=state.weights
    )
    
    enrich_scores()
    
    return {"status": "success", "message": "Configuración guardada y scores recalculados"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
