import React, { useState, useEffect } from 'react';
import { Loader, Save, RefreshCw, Settings as SettingsIcon, ShieldCheck, Activity, MessageSquare, Cloud } from 'lucide-react';

export default function SettingsView() {
  const [weights, setWeights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/config')
      .then(res => res.json())
      .then(d => {
        setWeights(d);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const handleLayerChange = (layer, value) => {
    setWeights({
      ...weights,
      layers: { ...weights.layers, [layer]: parseFloat(value) }
    });
  };

  const handleSubWeightChange = (category, param, value) => {
    setWeights({
      ...weights,
      [category]: { ...weights[category], [param]: parseFloat(value) }
    });
  };

  const saveConfig = () => {
    setSaving(true);
    setMessage(null);
    fetch('http://localhost:8000/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(weights)
    })
    .then(res => res.json())
    .then(d => {
      setSaving(false);
      setMessage({ type: 'success', text: 'Configuración guardada. Los scores han sido recalculados en todo el sistema.' });
      setTimeout(() => setMessage(null), 5000);
    })
    .catch(err => {
      setSaving(false);
      setMessage({ type: 'error', text: 'Error al guardar la configuración.' });
    });
  };

  if (loading) return <div className="p-8"><Loader className="animate-spin" /> Cargando configuración...</div>;

  const totalLayers = Object.values(weights.layers).reduce((a, b) => a + b, 0);

  return (
    <div className="settings-view">
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px"}}>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <SettingsIcon /> Configuración del Modelo Predictivo
        </h1>
        <button 
          onClick={saveConfig} 
          disabled={saving}
          style={{
            background: "var(--success)", 
            color: "white", 
            padding: "10px 20px", 
            borderRadius: "8px", 
            border: "none",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            opacity: saving ? 0.7 : 1,
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
          }}
        >
          {saving ? <RefreshCw className="animate-spin" size={18}/> : <Save size={18}/>}
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>

      {message && (
        <div style={{
          padding: "16px", 
          borderRadius: "8px", 
          marginBottom: "24px", 
          border: `1px solid ${message.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
          backgroundColor: message.type === 'success' ? 'var(--success-light)' : 'var(--danger-light)',
          color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
          fontWeight: "bold"
        }}>
          {message.text}
        </div>
      )}

      <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px"}}>
        {/* Pesos de Capas Globales */}
        <div className="card">
          <h2 className="card-title" style={{borderBottom: "1px solid #eee", paddingBottom: "12px", marginBottom: "20px"}}>
            <ShieldCheck style={{verticalAlign: "middle", marginRight: "8px", color: "var(--success)"}} /> Pesos de Capas Principales
          </h2>
          <p className="text-sm text-gray-500 mb-6 italic">Define cuánto influye cada capa en el Preven-Score final (Suma total recomendada: 100%).</p>
          
          <div style={{display: "flex", flexDirection: "column", gap: "24px"}}>
            {Object.entries(weights.layers).map(([key, val]) => (
              <div key={key}>
                <div style={{display: "flex", justifyContent: "space-between", marginBottom: "8px"}}>
                  <span style={{fontWeight: "bold", textTransform: "uppercase", fontSize: "0.75rem", color: "#666"}}>{key === 'ml' ? 'IA Predictiva' : key}</span>
                  <span style={{fontWeight: "bold", color: "var(--success)"}}>{val}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" step="1"
                  value={val} 
                  onChange={(e) => handleLayerChange(key, e.target.value)}
                  style={{width: "100%", accentColor: "var(--success)"}}
                />
              </div>
            ))}
          </div>

          <div style={{
            marginTop: "32px", 
            padding: "12px", 
            borderRadius: "6px", 
            textAlign: "center", 
            fontWeight: "bold",
            backgroundColor: Math.abs(totalLayers - 100) < 0.1 ? 'var(--success-light)' : '#fef3c7',
            color: Math.abs(totalLayers - 100) < 0.1 ? 'var(--success)' : '#92400e'
          }}>
            Suma Total: {totalLayers}% {Math.abs(totalLayers - 100) > 0.1 && "(Se recomienda ajustar a 100%)"}
          </div>
        </div>

        {/* Pesos Internos */}
        <div className="card">
          <h2 className="card-title" style={{borderBottom: "1px solid #eee", paddingBottom: "12px", marginBottom: "20px"}}>
            <Activity style={{verticalAlign: "middle", marginRight: "8px", color: "#f97316"}} /> Detalle Capa Operacional
          </h2>
          <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
            {Object.entries(weights.operacional).map(([key, val]) => (
              <div key={key}>
                <div style={{display: "flex", justifyContent: "space-between", marginBottom: "4px"}}>
                  <span style={{textTransform: "capitalize", fontSize: "0.875rem"}}>{key.replace('_', ' ')}</span>
                  <span style={{color: "#666", fontSize: "0.75rem"}}>{(val * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.05"
                  value={val} 
                  onChange={(e) => handleSubWeightChange('operacional', key, e.target.value)}
                  style={{width: "100%", accentColor: "#f97316"}}
                />
              </div>
            ))}
          </div>

          <h2 className="card-title" style={{borderBottom: "1px solid #eee", paddingBottom: "12px", marginBottom: "20px", marginTop: "40px"}}>
            <Cloud style={{verticalAlign: "middle", marginRight: "8px", color: "#60a5fa"}} /> Detalle Capa Contextual
          </h2>
          <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
            {Object.entries(weights.contextual).map(([key, val]) => (
              <div key={key}>
                <div style={{display: "flex", justifyContent: "space-between", marginBottom: "4px"}}>
                  <span style={{textTransform: "capitalize", fontSize: "0.875rem"}}>{key}</span>
                  <span style={{color: "#666", fontSize: "0.75rem"}}>{(val * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.05"
                  value={val} 
                  onChange={(e) => handleSubWeightChange('contextual', key, e.target.value)}
                  style={{width: "100%", accentColor: "#60a5fa"}}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
