import React, { useState, useEffect } from 'react';
import { Loader, Info } from 'lucide-react';

export default function SimulatorView() {
  const [empresas, setEmpresas] = useState([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  
  // Parámetros usando string vacío en vez de falses para identificar que el
  // back-end use el fallback ("default del sistema actual") si no se tocan.
  const [params, setParams] = useState({
    hallazgos: "",
    dias_cap: "",
    lluvia: "",
    alerta: "",
    masivo: "",
    congestion: ""
  });
  
  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('http://localhost:8000/api/ranking')
      .then(res => res.json())
      .then(d => {
        setEmpresas(d);
        if (d.length > 0) {
          setSelectedEmpresa(d[0].empresa_id);
        }
      });
  }, []);

  const runSimulation = () => {
    setLoading(true);
    const qs = new URLSearchParams({
      empresa_id: selectedEmpresa,
      hallazgos: params.hallazgos,
      dias_cap: params.dias_cap,
      lluvia: params.lluvia,
      alerta: params.alerta,
      masivo: params.masivo,
      congestion: params.congestion
    });
    
    fetch(`http://localhost:8000/api/simulacion?${qs.toString()}`)
      .then(res => res.json())
      .then(d => {
        setSimResult(d);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  };

  const actualEmp = empresas.find(e => e.empresa_id.toString() === selectedEmpresa.toString());

  return (
    <div className="simulator-view">
      <h1 className="text-2xl font-bold mb-6">Simulador de Escenarios (What-If)</h1>
      
      <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px"}}>
        <div className="card">
          <h2 className="card-title">Parámetros a Simular</h2>
          <p className="text-sm text-gray-500 mb-6 italic">Si no modificas un valor, la simulación utilizará exactamente la realidad actual de la empresa, retornando su score real con precisión.</p>
          
          <div style={{marginBottom: "16px"}}>
            <label style={{display: "block", marginBottom: "8px", fontWeight: "bold"}}>Empresa Activa</label>
            <select 
              value={selectedEmpresa} 
              onChange={e => {
                setSelectedEmpresa(e.target.value);
                setSimResult(null); // recargar sim
                setParams({ hallazgos: "", dias_cap: "", lluvia: "", alerta: "", masivo: "", congestion: "" });
              }}
              style={{width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc"}}
            >
              {empresas.map(e => <option key={e.empresa_id} value={e.empresa_id}>{e.empresa_nombre} (Score Real: {e.preven_score})</option>)}
            </select>
          </div>
          
          <div style={{marginBottom: "24px", background: "#f9fafb", padding: "16px", borderRadius: "8px", border: "1px solid #e5e7eb"}}>
            <label style={{display: "flex", justifyContent: "space-between", marginBottom: "4px", fontWeight: "bold"}}>
              <span>📋 Hallazgos Abiertos Simulados</span>
              <span className="text-blue-600 font-bold">{params.hallazgos === "" ? "Usando Realidad" : params.hallazgos}</span>
            </label>
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1" title="Cantidad de brechas de seguridad detectadas en inspecciones que aún no han sido cerradas formalmente. Un valor alto incrementa significativamente el riesgo operacional."><Info size={12}/> Cantidad de hallazgos operacionales pendientes por cierre.</p>
            <input 
              type="range" min="0" max="50" 
              value={params.hallazgos === "" ? (actualEmp?.metricas?.hallazgos_abiertos || 0) : params.hallazgos} 
              onChange={e => setParams({...params, hallazgos: e.target.value})} 
              style={{width: "100%"}}
            />
          </div>
          
          <div style={{marginBottom: "24px", background: "#f9fafb", padding: "16px", borderRadius: "8px", border: "1px solid #e5e7eb"}}>
            <label style={{display: "flex", justifyContent: "space-between", marginBottom: "4px", fontWeight: "bold"}}>
              <span>🎓 Días sin Capacitación Simulados</span>
              <span className="text-blue-600 font-bold">{params.dias_cap === "" ? "Usando Realidad" : params.dias_cap}</span>
            </label>
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1" title="Días transcurridos desde el último taller preventivo. Según norma ACHS, superar los 90 días sin capacitación es un factor de riesgo crítico."><Info size={12}/> Días continuos sin entrenar trabajadores (+90 es penalizante).</p>
            <input 
              type="range" min="0" max="365" 
              value={params.dias_cap === "" ? (actualEmp?.metricas?.dias_sin_capacitacion || 0) : params.dias_cap} 
              onChange={e => setParams({...params, dias_cap: e.target.value})} 
              style={{width: "100%"}}
            />
          </div>
          
          <h3 className="font-bold mb-3 border-b pb-2">Variables Ambientales</h3>
          <p className="text-xs text-gray-500 mb-4 flex items-center gap-1"><Info size={12}/> Selecciona para forzar condición, déjalo sin click para usar los datos vivos de MeteoChile.</p>
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px"}}>
            
            <label className="flex items-center gap-2 p-2 rounded border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" checked={params.lluvia === 'true'} onChange={e => setParams({...params, lluvia: e.target.checked ? 'true' : ''})} />
              🌧️ Lluvia Intensa (15mm)
            </label>
            <label className="flex items-center gap-2 p-2 rounded border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" checked={params.alerta === 'true'} onChange={e => setParams({...params, alerta: e.target.checked ? 'true' : ''})} />
              ⚠️ Alerta Meteorológica
            </label>
            <label className="flex items-center gap-2 p-2 rounded border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" checked={params.masivo === 'true'} onChange={e => setParams({...params, masivo: e.target.checked ? 'true' : ''})} />
              🏟️ Evento Masivo Cerca
            </label>
            <label className="flex items-center gap-2 p-2 rounded border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" checked={params.congestion === 'true'} onChange={e => setParams({...params, congestion: e.target.checked ? 'true' : ''})} />
              🚥 Congestión Operacional Alta
            </label>
          </div>
          
          <button 
            onClick={runSimulation}
            style={{background: "var(--success)", color: "white", border: "none", padding: "14px 24px", borderRadius: "8px", fontSize: "1.1rem", fontWeight: "bold", cursor: "pointer", width: "100%", boxShadow: "0 4px 6px rgba(39, 147, 62, 0.2)"}}
          >
            {loading ? "Calculando Red Neuronal..." : "Ejecutar Simulación"}
          </button>
        </div>
        
        <div className="card">
          <h2 className="card-title">Monitor de Resultados</h2>
          
          {actualEmp && (
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#f3f4f6", borderRadius: "8px", marginBottom: "16px"}}>
              <div>
                <div style={{fontWeight: "bold", color: "#6b7280"}}>Score Actual (Línea Base)</div>
                <div style={{fontSize: "2rem", fontWeight: "bold", color: "var(--gray-800)"}}>{actualEmp.preven_score}</div>
              </div>
              <div className={`badge badge-${actualEmp.semaforo}`}>{actualEmp.criticidad} Base</div>
            </div>
          )}
          
          {simResult && (
            <div className="animate-in fade-in" style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px", background: `var(--${simResult.semaforo === "rojo" ? "danger" : simResult.semaforo === "amarillo" ? "warning" : "success"}-light)`, border: `2px solid var(--${simResult.semaforo === "rojo" ? "danger" : simResult.semaforo === "amarillo" ? "warning" : "success"})`, borderRadius: "8px", marginTop: "16px"}}>
              <div>
                <div style={{fontWeight: "bold", color: "var(--gray-800)"}}>Score Proyectado</div>
                <div style={{fontSize: "3.5rem", fontWeight: "bold", color: `var(--${simResult.semaforo === "rojo" ? "danger" : simResult.semaforo === "amarillo" ? "warning" : "success"})`, lineHeight: 1}}>{simResult.preven_score}</div>
                <div className="mt-2 text-sm text-gray-700 font-medium">Variación: {(simResult.preven_score - actualEmp.preven_score) > 0 ? "+" : ""}{(simResult.preven_score - actualEmp.preven_score).toFixed(1)} ptos</div>
              </div>
              <div style={{textAlign: "right", maxWidth: "50%"}}>
                <div className={`badge badge-${simResult.semaforo} mb-2`}>{simResult.criticidad} Proyectada</div>
                <div style={{fontWeight: "bold", color: `var(--${simResult.semaforo === "rojo" ? "danger" : simResult.semaforo === "amarillo" ? "warning" : "success"})`}}>{simResult.recomendacion}</div>
              </div>
            </div>
          )}
          
          {!simResult && !loading && (
            <div style={{padding: "32px", textAlign: "center", color: "#6b7280", border: "2px dashed #ccc", borderRadius: "8px", marginTop: "16px"}}>
              <FlaskConical size={48} className="mx-auto mb-4 text-gray-300" />
              Esperando parámetros para calcular el nuevo vector de riesgo.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// fallback implementation of flaskconical so we dont need to import it up top if omitted
function FlaskConical(props) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.52 16h12.96"/></svg>
}
