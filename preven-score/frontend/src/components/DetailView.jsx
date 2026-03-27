import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader, AlertTriangle, Calendar, Mail, Phone, User, Users } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function DetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8000/api/empresa/${id}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(console.error);
  }, [id]);

  if (loading) return <div className="p-8"><Loader className="animate-spin" /> Cargando detalle...</div>;
  if (!data) return <div className="p-8">Error cargando datos.</div>;

  const chartData = [
    { name: "ML Probabilidad", score: data.componentes.ml, fill: "#3b82f6" },
    { name: "Riesgo Operacional", score: data.componentes.operacional, fill: "#f59e0b" },
    { name: "Señales Texto (NLP)", score: data.componentes.nlp, fill: "#8b5cf6" },
    { name: "Contexto", score: data.componentes.contextual, fill: "#10b981" }
  ];

  return (
    <div className="detail-view">
      <button 
        onClick={() => navigate(-1)} 
        style={{display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", color: "#6b7280", marginBottom: "16px"}}
      >
        <ArrowLeft size={16} /> Volver al Ranking
      </button>
      
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px"}}>
        <div>
          <h1 style={{fontSize: "2rem", fontWeight: "bold", margin: "0 0 8px 0"}}>{data.empresa_nombre}</h1>
          <div style={{color: "#404b53", fontWeight: 600, fontSize: "0.9rem", marginBottom: "4px"}}>Segmento: {data.segmento}</div>
          <div style={{color: "#4b5563", fontSize: "1.1rem"}}>{data.rubro} • {data.comuna} ({data.zona})</div>
          <div style={{color: "#6b7280", fontSize: "0.95rem", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px"}}>
            <Users size={16}/> Prevencionista a cargo: <strong className="text-gray-800">{data.experto_asignado}</strong>
          </div>
        </div>
        <div style={{textAlign: "right"}}>
          <div style={{fontSize: "3rem", fontWeight: "bold", color: `var(--${data.semaforo === "rojo" ? "danger" : data.semaforo === "amarillo" ? "warning" : "success" })`, lineHeight: 1}}>
            {data.preven_score}
          </div>
          <div style={{marginTop: "8px"}}>
            <span className={`badge badge-${data.semaforo}`}>{data.criticidad} Criticidad</span>
          </div>
        </div>
      </div>

      <div style={{display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px", marginBottom: "24px"}}>
        {/* Left Column */}
        <div style={{display: "flex", flexDirection: "column", gap: "24px"}}>
          
          <div className="card" style={{backgroundColor: "var(--danger-light)", border: "1px solid var(--danger)", boxShadow: "none"}}>
            <h2 className="card-title" style={{color: "var(--danger)", margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: "10px"}}>
              <AlertTriangle size={20} />
              Recomendación: {data.recomendacion}
            </h2>
            <p style={{fontSize: "1.05rem", color: "#b91c1c", margin: "0 0 16px 0", lineHeight: "1.5", fontWeight: 500}}>
              {data.recomendacion_detalle}
            </p>
            <div style={{fontSize: "0.85rem", color: "#991b1b", borderTop: "1px solid rgba(255, 116, 102, 0.3)", paddingTop: "12px"}}>
              <strong>Factores Críticos Detectados:</strong>
              <ul className="mt-2 space-y-1">
                {data.top_factores_riesgo.map((f, i) => (
                  <li key={i} className="flex gap-2"><span>•</span> {f}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card" style={{flex: 1}}>
            <h2 className="card-title">Desglose del Preven-Score</h2>
            <div style={{ height: "250px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 40]} />
                  <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12}} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div style={{display: "flex", flexDirection: "column", gap: "24px"}}>
          
          <div className="card">
            <h2 className="card-title" style={{display: "flex", alignItems: "center", gap: "8px"}}>
              <User size={20} className="text-blue-500" />
              Contacto Autorizado
            </h2>
            <div className="space-y-4 text-gray-700">
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-2 rounded-full"><User size={16}/></div>
                <div>{data.contacto?.contacto_nombre || "No registrado"}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-2 rounded-full"><Phone size={16}/></div>
                <div>{data.contacto?.contacto_telefono || "No registrado"}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-2 rounded-full"><Mail size={16}/></div>
                <div>{data.contacto?.contacto_email || "No registrado"}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="card-title" style={{display: "flex", alignItems: "center", gap: "8px"}}>
              <AlertTriangle size={20} color="var(--danger)" />
              Detalle de Factores de Riesgo
            </h2>
            <div className="space-y-3">
               <div className="flex justify-between items-center bg-gray-50 p-3 rounded">
                 <span className="text-sm">Hallazgos Abiertos (x1000 trab)</span>
                 <span className="font-bold">{(data.metricas.hallazgos_abiertos / data.dotacion * 1000).toFixed(1)}</span>
               </div>
               <div className="flex justify-between items-center bg-gray-50 p-3 rounded">
                 <span className="text-sm">Días sin Capacitación (+90 penaliza)</span>
                 <span className={`font-bold ${data.metricas.dias_sin_capacitacion > 90 ? 'text-red-600' : ''}`}>{data.metricas.dias_sin_capacitacion}</span>
               </div>
               <div className="flex justify-between items-center bg-gray-50 p-3 rounded">
                 <span className="text-sm">Accidentabilidad 12M</span>
                 <span className="font-bold">{data.metricas.accidentabilidad}%</span>
               </div>
               <div className="flex justify-between items-center bg-gray-50 p-3 rounded">
                 <span className="text-sm">Señales Críticas NLP</span>
                 <span className="font-bold">{data.nlp_detail.n_criticos} alertas</span>
               </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Comentarios destacados</h3>
              <ul style={{listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px"}}>
                {data.top_factores_riesgo.map((f, i) => (
                  <li key={i} style={{backgroundColor: "#f9fafb", padding: "10px 14px", borderRadius: "8px", borderLeft: "3px solid var(--danger)", fontSize: "0.85rem"}}>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
        </div>
      </div>

      <div className="card">
        <h2 className="card-title mb-4">Métricas y Contexto General</h2>
        <div style={{display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px"}}>
          <div style={{background: "#f3f4f6", padding: "16px", borderRadius: "8px", textAlign: "center"}}>
            <div style={{fontSize: "1.75rem", fontWeight: "bold"}}>{data.metricas.hallazgos_abiertos}</div>
            <div style={{fontSize: "0.8rem", color: "#6b7280"}}>Hallazgos Abiertos</div>
          </div>
          <div style={{background: "#f3f4f6", padding: "16px", borderRadius: "8px", textAlign: "center"}}>
            <div style={{fontSize: "1.75rem", fontWeight: "bold", color: data.metricas.dias_sin_capacitacion > 90 ? "var(--danger)" : "inherit"}}>{data.metricas.dias_sin_capacitacion}</div>
            <div style={{fontSize: "0.8rem", color: "#6b7280"}}>Días s/ Capacitación</div>
          </div>
          <div style={{background: "#f3f4f6", padding: "16px", borderRadius: "8px", textAlign: "center"}}>
            <div style={{fontSize: "1.75rem", fontWeight: "bold", color: data.metricas.dias_sin_visita > 60 ? "var(--danger)" : "inherit"}}>{data.metricas.dias_sin_visita}</div>
            <div style={{fontSize: "0.8rem", color: "#6b7280"}}>Días s/ Visita</div>
          </div>
          <div style={{background: "#f3f4f6", padding: "16px", borderRadius: "8px", textAlign: "center"}}>
            <div style={{fontSize: "1.75rem", fontWeight: "bold"}}>{data.metricas.accidentabilidad}</div>
            <div style={{fontSize: "0.8rem", color: "#6b7280"}}>Accidentabilidad %</div>
          </div>
          <div style={{background: "#f3f4f6", padding: "16px", borderRadius: "8px", textAlign: "center"}}>
            <div style={{fontSize: "1.5rem", fontWeight: "bold"}}>{data.contexto?.clima_live?.split(',')[0] || "N/A"}</div>
            <div style={{fontSize: "0.8rem", color: "#6b7280"}}>Clima (Meteo)</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title mb-4">Historial de Inspecciones NLP</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Inspector</th>
                <th>Tema Principal</th>
                <th>Observación</th>
                <th>Severidad</th>
              </tr>
            </thead>
            <tbody>
              {data.inspecciones?.length === 0 ? (
                <tr><td colSpan="5" className="text-center text-gray-500 py-4">No hay inspecciones registradas.</td></tr>
              ) : data.inspecciones.map((insp, ix) => (
                <tr key={ix}>
                  <td className="whitespace-nowrap">{String(insp.inspection_date).substring(0, 10)}</td>
                  <td>{insp.inspector_name}</td>
                  <td><span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">{insp.tema_principal}</span></td>
                  <td className="text-sm">{insp.observation_text}</td>
                  <td>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${insp.severidad_referencial === 'Crítico' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {insp.severidad_referencial}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
