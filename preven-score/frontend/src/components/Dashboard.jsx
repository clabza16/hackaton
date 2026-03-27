import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, ArrowDown, ArrowUp, Filter, MapPin, Briefcase, Users, ShieldCheck } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [ranking, setRanking] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedComuna, setSelectedComuna] = useState('Todas');
  const [selectedRubro, setSelectedRubro] = useState('Todas');
  const [selectedSegmento, setSelectedSegmento] = useState('Todos');
  const [selectedExperto, setSelectedExperto] = useState('Todos');
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rankRes, resuRes] = await Promise.all([
          fetch('http://localhost:8000/api/ranking'),
          fetch('http://localhost:8000/api/resumen')
        ]);
        const rankData = await rankRes.json();
        const resuData = await resuRes.json();
        setRanking(rankData);
        setResumen(resuData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8"><Loader className="animate-spin" /> Cargando datos...</div>;

  const comunas = ['Todas', ...new Set(ranking.map(e => e.comuna).filter(c => c))];
  const rubros = ['Todas', ...new Set(ranking.map(e => e.rubro).filter(r => r))];
  const segmentos = ['Todos', ...new Set(ranking.map(e => e.segmento).filter(s => s))];
  const expertos = ['Todos', ...new Set(ranking.map(e => e.experto_asignado).filter(x => x))];
  
  let filteredRanking = [...ranking];
  if (selectedComuna !== 'Todas') {
    filteredRanking = filteredRanking.filter(e => e.comuna === selectedComuna);
  }
  if (selectedRubro !== 'Todas') {
    filteredRanking = filteredRanking.filter(e => e.rubro === selectedRubro);
  }
  if (selectedSegmento !== 'Todos') {
    filteredRanking = filteredRanking.filter(e => e.segmento === selectedSegmento);
  }
  if (selectedExperto !== 'Todos') {
    filteredRanking = filteredRanking.filter(e => e.experto_asignado === selectedExperto);
  }
  
  if (!sortDesc) {
    filteredRanking.reverse();
  }

  return (
    <div className="dashboard">
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px"}}>
        <h1 className="text-2xl font-bold">Panel General - Preven-Score</h1>
      </div>
      
      {/* KPIs */}
      {resumen && (
        <div className="kpi-grid">
          <div className="kpi-card">
            <span className="kpi-label">Total Empresas</span>
            <span className="kpi-value">{resumen.total_empresas}</span>
          </div>
          <div className="kpi-card danger">
            <span className="kpi-label">Criticidad Alta</span>
            <span className="kpi-value text-red-600">{resumen.criticas} <span className="text-sm font-normal text-gray-500">({resumen.criticas_pct.toFixed(0)}%)</span></span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Score Promedio</span>
            <span className="kpi-value">{resumen.score_promedio}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Sin Visita &gt; 30d</span>
            <span className="kpi-value text-orange-500">{resumen.empresas_sin_visita_30d}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Alertas Climáticas</span>
            <span className="kpi-value text-red-500">{resumen.alertas_activas_hoy}</span>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="card table-container">
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px", flexWrap: "wrap", gap: "16px"}}>
          <div>
            <h2 className="card-title" style={{margin: 0}}>Ranking Priorizado de Intervención</h2>
            <p style={{fontSize: "0.85rem", color: "#64748b", marginTop: "4px"}}>Utiliza los filtros inteligentes para segmentar el riesgo operacional.</p>
          </div>
          
          <div style={{display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap"}}>
            <div className="filter-container">
              <div className="filter-group">
                <MapPin size={14} className="text-gray-400" />
                <span className="filter-label">Comuna</span>
                <select className="filter-select" value={selectedComuna} onChange={e => setSelectedComuna(e.target.value)}>
                  {comunas.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <Briefcase size={14} className="text-gray-400" />
                <span className="filter-label">Rubro</span>
                <select className="filter-select" value={selectedRubro} onChange={e => setSelectedRubro(e.target.value)}>
                  {rubros.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <Users size={14} className="text-gray-400" />
                <span className="filter-label">Segmento</span>
                <select className="filter-select" value={selectedSegmento} onChange={e => setSelectedSegmento(e.target.value)}>
                  {segmentos.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <ShieldCheck size={14} className="text-gray-400" />
                <span className="filter-label">Experto</span>
                <select className="filter-select" value={selectedExperto} onChange={e => setSelectedExperto(e.target.value)}>
                  {expertos.map(x => <option key={x} value={x}>{x}</option>)}
                </select>
              </div>
            </div>

            <button 
              onClick={() => setSortDesc(!sortDesc)}
              style={{
                display: "flex", 
                alignItems: "center", 
                gap: "8px", 
                backgroundColor: "white", 
                border: "1px solid #e2e8f0", 
                padding: "8px 16px", 
                borderRadius: "12px", 
                fontSize: "0.875rem", 
                fontWeight: 600,
                color: "#475569",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                transition: "all 0.2s"
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = "#f8fafc"}
              onMouseOut={e => e.currentTarget.style.backgroundColor = "white"}
            >
              {sortDesc ? <ArrowDown size={16} /> : <ArrowUp size={16} />} 
              {sortDesc ? "Mayor Riesgo" : "Menor Riesgo"}
            </button>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th title="Posición en el ranking de prioridad">#</th>
              <th title="Nombre de la empresa adherida">Empresa</th>
              <th title="Ubicación geográfica de la faena">Comuna</th>
              <th title="Segmentación por dotación">Segmento</th>
              <th style={{width: "250px"}} title="Puntaje de riesgo calculado (0-100)">Preven-Score</th>
              <th title="Datos climáticos en tiempo vivo (MeteoChile/OpenMeteo)">Clima (MeteoChile)</th>
              <th title="Sugerencia de intervención inmediata">Recomendación</th>
            </tr>
          </thead>
          <tbody>
            {filteredRanking.map((emp, idx) => (
              <tr 
                key={emp.empresa_id} 
                onClick={() => navigate(`/empresa/${emp.empresa_id}`)}
                style={{cursor: "pointer"}}
                className="hover:bg-blue-50 transition-colors"
                title="Haz clic para ver el detalle de la empresa"
              >
                <td>{sortDesc ? (idx + 1) : (filteredRanking.length - idx)}</td>
                <td>
                  <div style={{fontWeight: 600}}>{emp.empresa_nombre}</div>
                  <div style={{fontSize: "0.8rem", color: "#6b7280"}}>{emp.rubro} • {emp.experto_asignado}</div>
                </td>
                <td>
                  <div style={{fontWeight: 500}}>{emp.comuna}</div>
                </td>
                <td style={{fontSize: "0.85rem", whiteSpace: "nowrap"}}>{emp.segmento}</td>
                <td>
                  <div style={{display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold"}}>
                    <div className={`score-circle ${emp.semaforo}`}></div>
                    {emp.preven_score}
                  </div>
                  <div className="progress-bg">
                    <div className={`progress-fill ${emp.semaforo}`} style={{width: `${emp.preven_score}%`}}></div>
                  </div>
                </td>
                <td style={{fontSize: "0.9rem", color: "#4b5563"}}>{emp.contexto?.clima_live || "N/A"}</td>
                <td>
                  <span className={`badge badge-${emp.semaforo}`}>
                    {emp.recomendacion}
                  </span>
                </td>
              </tr>
            ))}
            {filteredRanking.length === 0 && (
              <tr>
                <td colSpan="6" style={{textAlign: "center", padding: "32px", color: "#6b7280"}}>
                  No hay empresas que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
