"""
Model training and scoring module for Preven-Score.
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder
from scoring.features import add_derived_features
from scoring.nlp import compute_nlp_scores, get_empresa_nlp_detail

class PrevenScoreModel:
    def __init__(self):
        self.ml_model = GradientBoostingClassifier(random_state=42)
        self.label_encoders = {}
        self.features_num = [
            "dotacion", "dias_desde_ultima_capacitacion", "inspecciones_ult_90d",
            "hallazgos_abiertos", "accidentabilidad_12m", "ausentismo_pct",
            "dias_desde_ultima_visita_prevencion", "lluvia_mm", "temperatura_c"
        ]
        self.features_cat = [
            "rubro", "turno_critico", "temporada_alta", "alerta_meteorologica", 
            "congestion_operacional", "evento_masivo_zona"
        ]
        
    def preprocess(self, df: pd.DataFrame, is_training: bool = False):
        df_proc = df.copy()
        for cat in self.features_cat:
            if cat in df_proc.columns:
                df_proc[cat] = df_proc[cat].astype(str)
                if is_training:
                    le = LabelEncoder()
                    df_proc[cat] = le.fit_transform(df_proc[cat])
                    self.label_encoders[cat] = le
                else:
                    le = self.label_encoders.get(cat)
                    if le:
                        # Handle unseen labels by assigning a default or the first one
                        classes = set(le.classes_)
                        df_proc[cat] = df_proc[cat].apply(lambda x: x if x in classes else le.classes_[0])
                        df_proc[cat] = le.transform(df_proc[cat])
            else:
                df_proc[cat] = 0

        for num in self.features_num:
            if num not in df_proc.columns:
                df_proc[num] = 0.0
            else:
                df_proc[num] = pd.to_numeric(df_proc[num], errors='coerce').fillna(0)
                
        return df_proc[self.features_num + self.features_cat]

    def train(self, df_historico: pd.DataFrame, comentarios: pd.DataFrame):
        """Train ML layer with historical data."""
        # Add ML features
        df_feat = add_derived_features(df_historico, comentarios)
        
        # We need historical weather for training because it's in the feature list.
        # Assuming df_historico has those if provided, or we fill 0 for missing.
        
        X = self.preprocess(df_feat, is_training=True)
        y = df_feat["accidente_ocurrio_30d"].fillna(0).astype(int)
        self.ml_model.fit(X, y)

    def calculate_scores(self, df_actual: pd.DataFrame, contexto: pd.DataFrame, comentarios: pd.DataFrame):
        """Calculate final Preven-Score for the current state."""
        # Merge contexto to get weather and alerts
        df = df_actual.copy()
        
        # Deduplicate to have ONE row per empresa right now (take the latest if multiple)
        df = df.sort_values("fecha").groupby("empresa_id").last().reset_index()
        
        if not contexto.empty:
            df = df.merge(contexto[["empresa_id", "lluvia_mm", "temperatura_c", "alerta_meteorologica", 
                                    "congestion_operacional", "evento_masivo_zona", "sensibilidad_clima"]], 
                          on="empresa_id", how="left", suffixes=("", "_ctx"))
            
            # Use contextual values over historical ones for the current day
            for col in ["lluvia_mm", "temperatura_c", "alerta_meteorologica", "congestion_operacional", "evento_masivo_zona"]:
                ctx_col = col + "_ctx"
                if ctx_col in df.columns:
                    df[col] = df[ctx_col].fillna(df[col] if col in df.columns else 0)
        
        df_feat = add_derived_features(df, comentarios)
        
        # Capa 1: ML probability
        X = self.preprocess(df_feat, is_training=False)
        probs = self.ml_model.predict_proba(X)
        prob_accidente = probs[:, 1] if probs.shape[1] > 1 else np.zeros(len(X))
        
        # Calculate components
        scores = []
        nlp_scores = compute_nlp_scores(comentarios)
        
        for i, row in df_feat.iterrows():
            eid = row["empresa_id"]
            ml_prob = prob_accidente[i]
            
            # Operational Score (0-100)
            hallazgos = row.get("hallazgos_abiertos", 0)
            dotacion = row.get("dotacion", 1) or 1
            ratio_hallazgos = min((hallazgos / dotacion) * 1000, 100)
            
            dias_cap = min(row.get("dias_desde_ultima_capacitacion", 0), 365) / 365.0 * 100
            dias_vis = min(row.get("dias_desde_ultima_visita_prevencion", 0), 180) / 180.0 * 100
            acc_12m = min(row.get("accidentabilidad_12m", 0) * 10, 100) # scaling
            
            score_op = (ratio_hallazgos * 0.4 + dias_cap * 0.2 + dias_vis * 0.2 + acc_12m * 0.2)
            
            # NLP Score (0-100)
            score_nlp = nlp_scores.get(eid, 0)
            
            # Contextual Score (0-100)
            alerta = 100 if str(row.get("alerta_meteorologica", "no")).lower() == "si" else 0
            evento = 100 if str(row.get("evento_masivo_zona", "no")).lower() == "si" else 0
            
            cong = str(row.get("congestion_operacional", "Media")).lower()
            cong_val = 100 if cong == "alta" else (50 if cong == "media" else 0)
            
            lluvia_factor = row.get("lluvia_x_sensibilidad", 0)
            lluvia_score = min(lluvia_factor * 5, 100) # scale
            
            score_ctx = (alerta * 0.4 + evento * 0.2 + cong_val * 0.2 + lluvia_score * 0.2)
            
            # Capa 2: Final composite
            preven_score = (
                ml_prob * 40          # 40% weight
                + (score_op / 100.0) * 25   # 25% weight
                + (score_nlp / 100.0) * 20  # 20% weight
                + (score_ctx / 100.0) * 15  # 15% weight
            )
            
            record = {
                "empresa_id": eid,
                "empresa_nombre": row.get("empresa_nombre"),
                "rubro": row.get("rubro"),
                "comuna": row.get("comuna"),
                "preven_score": round(preven_score, 1),
                "componentes": {
                    "ml_prob_raw": round(ml_prob, 3),
                    "ml": round(ml_prob * 40, 1),
                    "operacional": round((score_op / 100.0) * 25, 1),
                    "nlp": round((score_nlp / 100.0) * 20, 1),
                    "contextual": round((score_ctx / 100.0) * 15, 1)
                },
                "metricas": {
                    "hallazgos_abiertos": hallazgos,
                    "dias_sin_capacitacion": row.get("dias_desde_ultima_capacitacion", 0),
                    "dias_sin_visita": row.get("dias_desde_ultima_visita_prevencion", 0),
                    "accidentabilidad": row.get("accidentabilidad_12m", 0)
                },
                "contexto": {
                    "lluvia_mm": row.get("lluvia_mm", 0),
                    "alerta": row.get("alerta_meteorologica", "no"),
                    "congestion": row.get("congestion_operacional", "Media"),
                }
            }
            
            # Recommendation logic
            if preven_score >= 65:
                if record["metricas"]["dias_sin_visita"] > 30:
                    record["recomendacion"] = "Visita prioritaria hoy"
                else:
                    record["recomendacion"] = "Visita de seguimiento urgente"
                record["criticidad"] = "Alta"
                record["semaforo"] = "rojo"
            elif preven_score >= 45:
                if hallazgos > 10:
                    record["recomendacion"] = "Llamado + revisión de hallazgos"
                elif record["metricas"]["dias_sin_capacitacion"] > 120:
                    record["recomendacion"] = "Programar capacitación"
                else:
                    record["recomendacion"] = "Llamado y seguimiento"
                record["criticidad"] = "Media"
                record["semaforo"] = "amarillo"
            else:
                record["recomendacion"] = "Monitoreo estándar"
                record["criticidad"] = "Baja"
                record["semaforo"] = "verde"
                
            scores.append(record)
            
        return sorted(scores, key=lambda x: x["preven_score"], reverse=True)
