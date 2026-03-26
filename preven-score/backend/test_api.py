import pandas as pd
import requests

print("TESTING ENCODING...")
path = "data/datasets/empresas_riesgo_historico_v2.csv"
try:
    df = pd.read_csv(path, encoding='utf-8')
    print("UTF-8:", df['empresa_nombre'].unique()[:3])
except Exception as e:
    print("UTF-8 failed:", e)

try:
    df = pd.read_csv(path, encoding='latin-1')
    print("LATIN-1:", df['empresa_nombre'].unique()[:3])
    # Also test if we just read it without the double encode hack
except Exception as e:
    print("LATIN-1 failed:", e)

try:
    df = pd.read_csv(path, encoding='utf-8-sig')
    print("UTF-8-SIG:", df['empresa_nombre'].unique()[:3])
except Exception as e:
    print("UTF-8-SIG failed:", e)
    
print("\nTESTING METEO CHILE API...")
try:
    # Just a simple JSON API from meteochile or weather snippet
    res = requests.get("https://climatologia.meteochile.gob.cl/application/productos/pronosticoRegion/2", timeout=5)
    print("Meteochile Status:", res.status_code)
except Exception as e:
    print("Meteochile Error:", e)
    
try:
    # alternative 
    res = requests.get("https://api.boostr.cl/weather.json", timeout=5)
    print("Boostr Status:", res.status_code)
    if res.status_code == 200:
        print("Data sample:", str(res.json())[:100])
except Exception as e:
    print("Boostr Error:", e)
