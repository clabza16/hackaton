import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, ArrowDown, ArrowUp, Filter } from 'lucide-react';

export default function Dashboard() {
  const [ranking, setRanking] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedZona, setSelectedZona] = useState('Todas');
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

  const zonas = ['Todas', ...new Set(ranking.map(e => e.zona).filter(z => z))];
  
  let filteredRanking = [...ranking];
  if (selectedZona !== 'Todas') {
    filteredRanking = filteredRanking.filter(e => e.zona === selectedZona);
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
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px"}}>
          <h2 className="card-title" style={{margin: 0}}>Ranking Priorizado de Intervención</h2>
          <div style={{display: "flex", gap: "16px"}}>
            <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
              <Filter size={16} className="text-gray-500" />
              <select 
                className="border rounded p-1"
                value={selectedZona}
                onChange={e => setSelectedZona(e.target.value)}
              >
                {zonas.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <button 
              onClick={() => setSortDesc(!sortDesc)}
              className="flex items-center gap-2 border rounded p-1 px-3 bg-gray-50 hover:bg-gray-100"
            >
              {sortDesc ? <ArrowDown size={16} /> : <ArrowUp size={16} />} 
              {sortDesc ? "Orden Descendente" : "Orden Ascendente"}
            </button>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Empresa</th>
              <th>Zona / Comuna</th>
              <th style={{width: "250px"}}>Preven-Score</th>
              <th>Clima (MeteoChile)</th>
              <th>Recomendación</th>
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
                  <div style={{fontWeight: 500}}>{emp.zona}</div>
                  <div style={{fontSize: "0.8rem", color: "#6b7280"}}>{emp.comuna}</div>
                </td>
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
