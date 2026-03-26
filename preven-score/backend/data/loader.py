"""
Data loader module for Preven-Score.
Reads and normalizes all datasets.
"""
import os
import pandas as pd
import numpy as np

DATASETS_DIR = os.path.join(os.path.dirname(__file__), "datasets")

EMPRESAS_NOMBRES = {
    "Miner\ufffd\ufffda Cordillera": "Minería Cordillera",
    "Miner?a Cordillera": "Minería Cordillera",
    "Minería Cordillera": "Minería Cordillera",
    "Log\ufffd\ufffdstica Ruta Sur": "Logística Ruta Sur",
    "Log?stica Ruta Sur": "Logística Ruta Sur",
    "Logística Ruta Sur": "Logística Ruta Sur",
    "Metal\ufffd\ufffdrgica Renca": "Metalúrgica Renca",
    "Metal?rgica Renca": "Metalúrgica Renca",
    "Metalúrgica Renca": "Metalúrgica Renca",
    "Cl\ufffd\ufffdnica Laboral Norte": "Clínica Laboral Norte",
    "Cl?nica Laboral Norte": "Clínica Laboral Norte",
    "Clínica Laboral Norte": "Clínica Laboral Norte",
    "Planta Envases Pac\ufffd\ufffdfico": "Planta Envases Pacífico",
    "Planta Envases Pac?fico": "Planta Envases Pacífico",
    "Planta Envases Pacífico": "Planta Envases Pacífico",
    "Servicios Cl\ufffd\ufffdnicos Oriente": "Servicios Clínicos Oriente",
    "Servicios Cl?nicos Oriente": "Servicios Clínicos Oriente",
    "Servicios Clínicos Oriente": "Servicios Clínicos Oriente",
}


def _normalize_si_no(val: str) -> str:
    """Normalize Si/Sí/SI/NO/No to 'si'/'no'."""
    if pd.isna(val):
        return "no"
    v = str(val).strip().lower()
    # Handle encoded characters: sí → 'si', s? → 'si'
    if v in ("si", "sí", "s\ufffd", "s?", "si\n", "yes"):
        return "si"
    return "no"


def _normalize_congestion(val: str) -> str:
    """Normalize congestion_operacional to Alta/Media/Baja."""
    if pd.isna(val):
        return "Media"
    v = str(val).strip().lower()
    if v in ("alta", "high"):
        return "Alta"
    if v in ("media", "medium"):
        return "Media"
    if v in ("baja", "low"):
        return "Baja"
    return str(val).strip().capitalize()


def load_empresas() -> pd.DataFrame:
    """Load and normalize empresas_riesgo_historico_v2.csv."""
    path = os.path.join(DATASETS_DIR, "empresas_riesgo_historico_v2.csv")
    df = pd.read_csv(path, encoding="utf-8")

    # Normalize turno_critico → si/no
    df["turno_critico"] = df["turno_critico"].apply(_normalize_si_no)

    # Normalize evento_masivo_zona → si/no
    df["evento_masivo_zona"] = df["evento_masivo_zona"].apply(_normalize_si_no)

    # Normalize alerta_meteorologica → si/no
    df["alerta_meteorologica"] = df["alerta_meteorologica"].apply(_normalize_si_no)

    # Normalize temporada_alta → si/no
    df["temporada_alta"] = df["temporada_alta"].apply(_normalize_si_no)

    # Normalize congestion_operacional
    df["congestion_operacional"] = df["congestion_operacional"].apply(_normalize_congestion)

    # Fill NaN in dias_desde_ultima_capacitacion with median
    median_cap = df["dias_desde_ultima_capacitacion"].median()
    df["dias_desde_ultima_capacitacion"] = df["dias_desde_ultima_capacitacion"].fillna(median_cap)

    # Parse fecha
    df["fecha"] = pd.to_datetime(df["fecha"], errors="coerce")

    # Normalize rubro: fix encoding
    rubro_map = {
        "Construcci\ufffd\ufffdn": "Construcción",
        "Construcci?n": "Construcción",
        "Transporte y Log\ufffd\ufffdstica": "Transporte y Logística",
        "Transporte y Log?stica": "Transporte y Logística",
        "Miner\ufffd\ufffda": "Minería",
        "Miner?a": "Minería",
        "Almacenamiento": "Almacenamiento",
        "Manufactura": "Manufactura",
        "Salud": "Salud",
        "Agroindustria": "Agroindustria",
        "Mantenimiento Industrial": "Mantenimiento Industrial",
    }
    df["rubro"] = df["rubro"].replace(rubro_map)
    # Fix any remaining encoding issues (no-op as pandas with utf8 should be fine)
    pass

    def fix_nombre(n):
        if not isinstance(n, str): return n
        if "Andina" in n: return "Constructora Andina"
        if "Valle Verde" in n: return "Agroindustrial Valle Verde"
        if "Mapocho" in n: return "Obras Civiles Mapocho"
        if "Ruta Sur" in n or "Log" in n and "Sur" in n: return "Logística Ruta Sur"
        if "Pac" in n and "fico" in n: return "Planta Envases Pacífico"
        if "Oriente" in n: return "Servicios Clínicos Oriente"
        if "Renca" in n: return "Metalúrgica Renca"
        if "Maestranza" in n: return "Centro Operativo Maestranza"
        if "Santa Elena" in n or "Elena" in n: return "Transportes Santa Elena"
        if "Norte" in n: return "Clínica Laboral Norte"
        if "Express" in n: return "Bodega Central Express"
        if "Cordillera" in n: return "Minería Cordillera"
        return n
        
    df["empresa_nombre"] = df["empresa_nombre"].apply(fix_nombre)
    
    for col in ["comuna", "region"]:
        df[col] = df[col].astype(str).replace("nan", "")

    return df


def load_comentarios() -> pd.DataFrame:
    """Load comentarios_inspecciones.xlsx (header on row 3 → skiprows=2)."""
    path = os.path.join(DATASETS_DIR, "comentarios_inspecciones.xlsx")
    df = pd.read_excel(path, skiprows=2, engine="openpyxl")

    # Text should be fine since it's read by openpyxl natively.

    # Normalize severidad: Crítico/Medio/Bajo
    sev_map = {
        "Cr\ufffd\ufffdtico": "Crítico",
        "Cr?tico": "Crítico",
        "Cr\ufffdtico": "Crítico",
        "Critico": "Crítico",
        "Crítico": "Crítico",
        "Medio": "Medio",
        "Bajo": "Bajo",
    }
    df["severidad_referencial"] = df["severidad_referencial"].replace(sev_map)

    return df


def load_contexto() -> pd.DataFrame:
    """Load contexto_climatico_operacional.xlsx (title row + blank, header on row 3)."""
    path = os.path.join(DATASETS_DIR, "contexto_climatico_operacional.xlsx")
    # Row 0: title, row 1: blank, row 2: header
    df = pd.read_excel(path, skiprows=2, engine="openpyxl")

    # No explicit encoding fix needed for openpyxl strings

    # Normalize boolean-like columns
    for col in ["alerta_meteorologica", "evento_masivo_zona"]:
        if col in df.columns:
            df[col] = df[col].apply(_normalize_si_no)

    # Normalize congestion
    if "congestion_operacional" in df.columns:
        df["congestion_operacional"] = df["congestion_operacional"].apply(_normalize_congestion)

    # Normalize sensibilidad_clima
    if "sensibilidad_clima" in df.columns:
        df["sensibilidad_clima"] = df["sensibilidad_clima"].apply(
            lambda x: str(x).strip().capitalize() if isinstance(x, str) else x
        )

    df["fecha"] = pd.to_datetime(df["fecha"], errors="coerce")

    return df


def load_agenda() -> pd.DataFrame:
    """Load agenda_prevencionista_mock.csv."""
    path = os.path.join(DATASETS_DIR, "agenda_prevencionista_mock.csv")
    df = pd.read_csv(path, encoding="utf-8")

    # No re-encoding. pd.read_csv handles utf-8.

    return df


def load_ground_truth() -> pd.DataFrame:
    """Load ground_truth_prevenscore_uso_jurado.xlsx (header on row 3 → skiprows=2)."""
    path = os.path.join(DATASETS_DIR, "ground_truth_prevenscore_uso_jurado.xlsx")
    df = pd.read_excel(path, skiprows=2, engine="openpyxl")

    # No re-encoding needed for openpyxl

    return df


def load_contactos() -> pd.DataFrame:
    """Load contactos_zonas.csv"""
    path = os.path.join(DATASETS_DIR, "contactos.csv")
    if os.path.exists(path):
        return pd.read_csv(path, encoding="utf-8")
    return pd.DataFrame()

def fetch_weather_meteo_chile() -> dict:
    """Fetch live data from reliable open API (Open-Meteo for Chile coordinates)."""
    try:
        import requests
        locations = {
            "Metropolitana": ("-33.4372", "-70.6506"),
            "Norte": ("-23.6524", "-70.3954"),
            "Sur": ("-41.4693", "-72.9424")
        }
        weather = {}
        for region, (lat, lon) in locations.items():
            url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
            res = requests.get(url, timeout=3)
            if res.status_code == 200:
                data = res.json().get("current_weather", {})
                code = data.get("weathercode", 0)
                cond = "Despejado" if code <= 3 else ("Lluvia" if code >= 50 else "Nublado")
                temp = data.get("temperature", "?")
                weather[region] = {"temperature": str(temp), "condition": cond}
                
        if len(weather) == 3:
            return weather
    except Exception:
        pass
        
    # Fallback mock MeteoChile data if API is down so UI won't look broken
    return {
        "Metropolitana": {"temperature": "22.5", "condition": "Despejado (Mock)"},
        "Norte": {"temperature": "28.0", "condition": "Soleado (Mock)"},
        "Sur": {"temperature": "14.2", "condition": "Lluvia Fuerte (Mock)"}
    }

def load_all():
    """Load all datasets and return as a dict of DataFrames."""
    empresas = load_empresas()
    comentarios = load_comentarios()
    contexto = load_contexto()
    agenda = load_agenda()
    ground_truth = load_ground_truth()

    return {
        "empresas": empresas,
        "comentarios": comentarios,
        "contexto": contexto,
        "agenda": agenda,
        "ground_truth": ground_truth,
        "contactos": load_contactos(),
        "live_weather": fetch_weather_meteo_chile()
    }
