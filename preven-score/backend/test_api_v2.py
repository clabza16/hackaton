import requests

try:
    print("Testing /api/historico_global")
    res = requests.get("http://localhost:8000/api/historico_global", timeout=5)
    print("Status code:", res.status_code)
    try:
        data = res.json()
        print("Data type:", type(data))
        if isinstance(data, dict) and "detail" in data:
            print("Server error detail:", data["detail"])
        elif isinstance(data, list):
            print("First item:", data[0])
    except Exception as e:
        print("JSON parse error, raw text:", res.text[:200])

    print("\nTesting /api/ranking for Weather and Encoding")
    res2 = requests.get("http://localhost:8000/api/ranking", timeout=5)
    print("Status code:", res2.status_code)
    data2 = res2.json()
    for item in data2[:3]:
        clima = item.get("contexto", {}).get("clima_live", "MISSING")
        print(f"Company: {item['empresa_nombre']}, Clima: {clima}, Zona: {item.get('zona')}")
except Exception as e:
    print("Failed to connect:", e)
