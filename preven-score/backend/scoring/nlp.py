"""
NLP analysis of inspection observations for Preven-Score.
"""
import pandas as pd
import numpy as np


PALABRAS_RIESGO_ALTO = [
    "negligencia", "sin responsable", "no se evidencia", "incumplimiento",
    "reiterado", "sin cierre", "improvisaci", "deteriorad", "insegur",
    "fatiga", "sobrecarga", "abandono", "caos", "desorden grave",
    "falta de", "no usan", "sin epp"
]

PALABRAS_RIESGO_MEDIO = [
    "parcial", "pendiente", "falta seguimiento", "regular"
]

PALABRAS_RIESGO_BAJO = [
    "cumple", "aceptable", "buena disposici", "sin incidentes"
]


def _classify_comment(text: str) -> str:
    """Classify a single comment as 'alto', 'medio', or 'bajo'."""
    if not isinstance(text, str):
        return "bajo"
    t = text.lower()
    for kw in PALABRAS_RIESGO_ALTO:
        if kw in t:
            return "alto"
    for kw in PALABRAS_RIESGO_MEDIO:
        if kw in t:
            return "medio"
    return "bajo"


def compute_nlp_scores(comentarios: pd.DataFrame) -> pd.Series:
    """
    Compute NLP risk score per empresa_id.

    Score = (n_altos * 3 + n_medios * 1) / total * 100, scaled to 0-100.
    Returns a Series indexed by empresa_id.
    """
    if comentarios.empty:
        return pd.Series(dtype=float)

    df = comentarios.copy()
    df["nivel_nlp"] = df["observation_text"].apply(_classify_comment)

    results = {}
    for eid, group in df.groupby("empresa_id"):
        total = len(group)
        n_altos = (group["nivel_nlp"] == "alto").sum()
        n_medios = (group["nivel_nlp"] == "medio").sum()
        raw = (n_altos * 3 + n_medios * 1) / total * 100 if total > 0 else 0
        # Scale: max raw when all are alto = 300, so scale to 0-100
        score = min(raw / 3.0, 100.0)
        results[eid] = round(score, 2)

    return pd.Series(results)


def get_empresa_nlp_detail(empresa_id: int, comentarios: pd.DataFrame) -> dict:
    """Get detailed NLP analysis for a single empresa."""
    df = comentarios[comentarios["empresa_id"] == empresa_id].copy()
    if df.empty:
        return {"score": 0, "n_criticos": 0, "n_medios": 0, "n_bajos": 0, "total": 0}

    df["nivel_nlp"] = df["observation_text"].apply(_classify_comment)
    total = len(df)
    n_altos = int((df["nivel_nlp"] == "alto").sum())
    n_medios = int((df["nivel_nlp"] == "medio").sum())
    n_bajos = int((df["nivel_nlp"] == "bajo").sum())
    raw = (n_altos * 3 + n_medios * 1) / total * 100 if total > 0 else 0
    score = min(raw / 3.0, 100.0)

    return {
        "score": round(score, 2),
        "n_criticos": n_altos,
        "n_medios": n_medios,
        "n_bajos": n_bajos,
        "total": total,
    }
