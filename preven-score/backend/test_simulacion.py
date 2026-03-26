import requests

ranking = requests.get("http://localhost:8000/api/ranking").json()
if not ranking:
    print("No ranking data")
    exit(1)

empresa = ranking[0]
eid = empresa["empresa_id"]
print(f"Base Score for {eid}: {empresa['preven_score']} ({empresa['empresa_nombre']})")

sim = requests.get(f"http://localhost:8000/api/simulacion?empresa_id={eid}&hallazgos=&dias_cap=&lluvia=&alerta=&masivo=&congestion=").json()
print(f"Sim Score for {eid}: {sim['preven_score']}")
