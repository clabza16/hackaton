import React, { useState, useEffect } from 'react';
import { Loader, TrendingUp, Briefcase, Users } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export default function HistoricoView() {
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [selectedRubro, setSelectedRubro] = useState('Todas');
  const [selectedSegmento, setSelectedSegmento] = useState('Todos');
  const [segmentoMapping, setSegmentoMapping] = useState({});
  const [rubroMapping, setRubroMapping] = useState({});

  useEffect(() => {
    fetch('http://localhost:8000/api/historico_global')
      .then(res => res.json())
      .then(d => {
        const chartDocs = [];
        const foundCompanies = new Set();
        const mapping = {};
        const segMapping = {};
        d.forEach(mesGroup => {
          const doc = { name: mesGroup.mes };
          mesGroup.empresas.forEach(emp => {
            doc[emp.empresa_nombre] = emp.score_real;
            foundCompanies.add(emp.empresa_nombre);
            mapping[emp.empresa_nombre] = emp.rubro;
            segMapping[emp.empresa_nombre] = emp.segmento;
          });
          chartDocs.push(doc);
        });
        setHistorico(chartDocs);
        setRubroMapping(mapping);
        setSegmentoMapping(segMapping);
        const companiesArr = Array.from(foundCompanies);
        setSelectedCompanies(companiesArr); // All selected by default
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (loading) return <div className="p-8"><Loader className="animate-spin" /> Cargando histórico...</div>;

  const colors = ["#27933E", "#FF7466", "#EAC52F", "#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#14b8a6", "#6366f1", "#84cc16", "#06b6d4", "#d946ef"];
  
  const rubros = ['Todas', ...new Set(Object.values(rubroMapping))];
  const segmentos = ['Todos', ...new Set(Object.values(segmentoMapping))];
  
  // Filter companies by rubro
  const allCompanies = new Set();
  historico.forEach(doc => {
    Object.keys(doc).forEach(k => {
      if (k !== 'name') {
        const matchesRubro = selectedRubro === 'Todas' || rubroMapping[k] === selectedRubro;
        const matchesSegmento = selectedSegmento === 'Todos' || segmentoMapping[k] === selectedSegmento;
        if (matchesRubro && matchesSegmento) {
          allCompanies.add(k);
        }
      }
    });
  });
  const companies = Array.from(allCompanies);

  const toggleCompany = (name) => {
    if (selectedCompanies.includes(name)) {
      setSelectedCompanies(selectedCompanies.filter(c => c !== name));
    } else {
      setSelectedCompanies([...selectedCompanies, name]);
    }
  };

  return (
    <div className="historico-view">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <TrendingUp /> Panel de Evolución Mensual (Proxy)
      </h1>
      
            <div style={{display: "grid", gridTemplateColumns: "1fr 4fr", gap: "24px"}}>
        <div className="card">
          <div className="mb-6">
            <label className="filter-label mb-2 block">Rubro / Industria</label>
            <div className="filter-group w-full">
              <Briefcase size={14} className="text-gray-400" />
              <select 
                className="filter-select w-full"
                value={selectedRubro}
                onChange={e => setSelectedRubro(e.target.value)}
              >
                {rubros.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="filter-label mb-2 block">Segmentación</label>
            <div className="filter-group w-full">
              <Users size={14} className="text-gray-400" />
              <select 
                className="filter-select w-full"
                value={selectedSegmento}
                onChange={e => setSelectedSegmento(e.target.value)}
              >
                {segmentos.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <h2 className="card-title text-sm uppercase tracking-wider text-gray-500">Comparar Empresas</h2>
          <div style={{display: "flex", flexDirection: "column", gap: "8px", maxHeight: "500px", overflowY: "auto", paddingRight: "8px"}}>
            {companies.map((c, idx) => (
              <label key={c} style={{display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", cursor: "pointer", padding: "4px", borderRadius: "4px", backgroundColor: selectedCompanies.includes(c) ? "#f0fdf4" : "transparent"}}>
                <input 
                  type="checkbox" 
                  checked={selectedCompanies.includes(c)} 
                  onChange={() => toggleCompany(c)} 
                />
                <span style={{width: "12px", height: "12px", borderRadius: "2px", backgroundColor: colors[idx % colors.length]}}></span>
                {c}
              </label>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t" style={{display: "flex", gap: "8px"}}>
             <button onClick={() => setSelectedCompanies(companies)} className="text-xs text-blue-600 hover:underline">Todas</button>
             <button onClick={() => setSelectedCompanies([])} className="text-xs text-blue-600 hover:underline">Ninguna</button>
          </div>
        </div>

        <div className="card" style={{height: "600px"}}>
          <h2 className="card-title">Tendencia de Riesgo por Empresa</h2>
          <p className="text-gray-500 mb-4 text-sm">El gráfico ilustra la variación histórica mensual del comportamiento de prevencion del riesgo de las empresas.</p>
          
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={historico} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend wrapperStyle={{fontSize: "11px", paddingTop: "20px"}} />
              {companies.filter(c => selectedCompanies.includes(c)).map((c, idx) => {
                const globalIdx = companies.indexOf(c);
                return (
                  <Line key={c} type="monotone" dataKey={c} name={`${c} (Score)`} stroke={colors[globalIdx % colors.length]} strokeWidth={2} dot={{r: 4}} activeDot={{ r: 8 }} />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
