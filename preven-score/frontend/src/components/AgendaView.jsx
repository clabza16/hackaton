import React, { useState, useEffect } from 'react';
import { Loader, ArrowRight, Filter } from 'lucide-react';

export default function AgendaView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expertoFilter, setExpertoFilter] = useState("Todos");

  const loadAgenda = (experto) => {
    setLoading(true);
    const qs = experto && experto !== "Todos" ? `?experto=${encodeURIComponent(experto)}` : "";
    fetch(`http://localhost:8000/api/agenda${qs}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadAgenda(expertoFilter);
  }, [expertoFilter]);

  if (!data && loading) return <div className="p-8"><Loader className="animate-spin" /> Cargando agenda...</div>;

  return (
    <div className="agenda-view">
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px"}}>
        <h1 className="text-2xl font-bold">Agenda Inteligente Re-priorizada</h1>
        <div style={{display: "flex", alignItems: "center", gap: "12px", background: "white", padding: "8px 16px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)"}}>
          <Filter size={18} className="text-gray-500" />
          <span style={{fontWeight: 600}}>Experto:</span>
          <select 
            value={expertoFilter} 
            onChange={(e) => setExpertoFilter(e.target.value)}
            style={{border: "1px solid #e5e7eb", borderRadius: "4px", padding: "4px 8px"}}
          >
            <option value="Todos">Todos los expertos</option>
            {data?.expertos_disponibles?.map(exp => (
              <option key={exp} value={exp}>{exp}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="card" style={{backgroundColor: "#E6F7E4", border: "1px solid var(--success)", marginBottom: "24px"}}>
        <p style={{margin: 0, color: "var(--success)"}}>
          <strong>Insight:</strong> La agenda original presentaba ineficiencias críticas. La vista actual prioriza intervenciones de alto impacto en la mañana basadas en el Preven-Score actualizado a la fecha de hoy.
        </p>
      </div>

      {loading && <div style={{textAlign: "center", padding: "24px", color: "var(--success)"}}><Loader className="animate-spin mx-auto" /> Actualizando vista...</div>}

      {!loading && data && (
        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px"}}>
          <div>
            <h2 className="card-title">Agenda Original (Reactiva)</h2>
            <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
              {data.actual.length === 0 ? <p className="text-gray-500 italic">No hay visitas asignadas a este experto para hoy.</p> : data.actual.map((item, i) => (
                <div key={i} style={{background: "white", padding: "16px", borderRadius: "8px", border: "1px solid #e5e7eb", opacity: 0.7}}>
                  <div style={{fontWeight: "bold", color: "#6b7280", marginBottom: "4px"}}>{item.slot_hora}</div>
                  <div style={{fontSize: "1.1rem", fontWeight: 600}}>{item.empresa_nombre}</div>
                  <div style={{fontSize: "0.9rem", color: "#4b5563", marginTop: "4px"}}>
                    <div>{item.motivo_actual} (Prioridad org: {item.prioridad_actual})</div>
                    <div style={{color: "#9ca3af", fontStyle: "italic", marginTop: "2px"}}>Responsable: {item.experto}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div style={{position: "relative"}}>
            <div style={{position: "absolute", left: "-24px", top: "50%", transform: "translateY(-50%)", color: "var(--success)"}}>
              <ArrowRight size={32} />
            </div>
            <h2 className="card-title" style={{color: "var(--success)"}}>Agenda Sugerida Preven-Score</h2>
            <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
              {data.sugerida.length === 0 ? <p className="text-gray-500 italic">No hay visitas sugeridas.</p> : data.sugerida.map((item, i) => {
                const semaforo = item.preven_score >= 65 ? "rojo" : item.preven_score >= 45 ? "amarillo" : "verde";
                return (
                  <div key={i} style={{background: "white", padding: "16px", borderRadius: "8px", borderLeft: `4px solid var(--${semaforo === "rojo" ? "danger" : semaforo === "amarillo" ? "warning" : "success"})`, boxShadow: "0 2px 4px rgba(0,0,0,0.05)"}}>
                    <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px"}}>
                      <div style={{fontWeight: "bold", fontSize: "1.1rem"}}>{item.nuevo_slot_hora}</div>
                      <div className={`badge badge-${semaforo}`}>Score: {item.preven_score.toFixed(1)}</div>
                    </div>
                    <div style={{fontSize: "1.1rem", fontWeight: 600}}>{item.empresa_nombre}</div>
                    <div style={{fontSize: "0.9rem", color: "#4b5563", marginTop: "4px"}}>
                      <div><strong>Acción:</strong> {item.motivo_sugerido}</div>
                      <div style={{color: "#9ca3af", fontStyle: "italic", marginTop: "4px"}}>Responsable: {item.experto}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
