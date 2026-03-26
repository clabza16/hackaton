"""
Feature engineering for Preven-Score.
"""
import pandas as pd
import numpy as np


def add_derived_features(df: pd.DataFrame, comentarios: pd.DataFrame) -> pd.DataFrame:
    """Add derived features to the empresas DataFrame."""
    df = df.copy()

    # hallazgos_por_100_trabajadores
    df["hallazgos_por_100_trabajadores"] = (
        df["hallazgos_abiertos"] / df["dotacion"].replace(0, np.nan) * 100
    ).fillna(0)

    # brecha_capacitacion: 1 si dias_desde_ultima_capacitacion > 90
    df["brecha_capacitacion"] = (df["dias_desde_ultima_capacitacion"] > 90).astype(int)

    # empresa_silenciosa: 1 si inspecciones_ult_90d == 0 AND dias_desde_ultima_visita > 60
    df["empresa_silenciosa"] = (
        (df["inspecciones_ult_90d"] == 0) & (df["dias_desde_ultima_visita_prevencion"] > 60)
    ).astype(int)

    # lluvia_x_sensibilidad: requires sensibilidad_clima from contexto
    # Will be added after merge, defaulting to lluvia_mm * 0.5 if not present
    if "sensibilidad_clima" in df.columns:
        def sensibilidad_factor(s):
            if isinstance(s, str):
                s = s.strip().capitalize()
            if s == "Alta":
                return 1.0
            elif s == "Media":
                return 0.5
            else:
                return 0.0
        df["lluvia_x_sensibilidad"] = df["lluvia_mm"] * df["sensibilidad_clima"].apply(sensibilidad_factor)
    else:
        df["lluvia_x_sensibilidad"] = df["lluvia_mm"] * 0.5

    # comentarios_criticos_pct: proportion of Crítico comments per empresa
    if not comentarios.empty:
        crit_counts = comentarios[comentarios["severidad_referencial"] == "Crítico"].groupby("empresa_id").size()
        total_counts = comentarios.groupby("empresa_id").size()
        pct = (crit_counts / total_counts.replace(0, np.nan) * 100).fillna(0)
        df["comentarios_criticos_pct"] = df["empresa_id"].map(pct).fillna(0)
    else:
        df["comentarios_criticos_pct"] = 0.0

    return df
