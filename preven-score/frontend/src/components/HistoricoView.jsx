import React, { useState, useEffect } from 'react';
import { Loader, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export default function HistoricoView() {
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/historico_global')
      .then(res => res.json())
      .then(d => {
        // Transform purely hierarchical monthly data to a flattened chart-friendly format
        // Recharts prefers: [{ name: "2025-12", "Empresa A": 50, "Empresa B": 60 }]
        const chartDocs = [];
        d.forEach(mesGroup => {
          const doc = { name: mesGroup.mes };
          mesGroup.empresas.forEach(emp => {
            doc[emp.empresa_nombre] = emp.score_proxy;
          });
          chartDocs.push(doc);
        });
        setHistorico(chartDocs);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (loading) return <div className="p-8"><Loader className="animate-spin" /> Cargando histórico...</div>;

  const colors = ["#27933E", "#FF7466", "#EAC52F", "#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#14b8a6", "#6366f1", "#84cc16", "#06b6d4", "#d946ef"];
  
  // Get all unique company names across all months
  const allCompanies = new Set();
  historico.forEach(doc => {
    Object.keys(doc).forEach(k => {
      if (k !== 'name') allCompanies.add(k);
    });
  });
  const companies = Array.from(allCompanies);

  return (
    <div className="historico-view">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <TrendingUp /> Panel de Evolución Mensual (Proxy)
      </h1>
      
      <div className="card" style={{height: "600px"}}>
        <h2 className="card-title">Tendencia de Riesgo por Empresa</h2>
        <p className="text-gray-500 mb-4 text-sm">El gráfico ilustra la variación histórica mensual del comportamiento de prevencion del riesgo de las empresas.</p>
        
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={historico} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend wrapperStyle={{fontSize: "12px", paddingTop: "20px"}} />
            {companies.map((c, idx) => (
              <Line key={c} type="monotone" dataKey={c} stroke={colors[idx % colors.length]} strokeWidth={2} dot={{r: 4}} activeDot={{ r: 8 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
