import React from 'react';
import { Info as InfoIcon, Calculator as CalcIcon, Map as MapIcon, ListChecks as ListIcon, FileText as FileIcon } from 'lucide-react';

export default function InfoView() {
  return (
    <div className="info-view p-4">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-[var(--success)]">
        <InfoIcon /> ¿Cómo se calcula el Preven-Score?
      </h1>
      
      <div className="card text-lg leading-relaxed space-y-4">
        <p>El <strong>Preven-Score</strong> (0-100) es un modelo predictivo unificado diseñado para identificar oportunamente a las empresas afiliadas a ACHS que requieren atención preventiva inmediata.</p>
        <p>A diferencia de un modelo rígido, utiliza un ensamble computacional de 4 capas ponderadas:</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card border-t-4 border-blue-500">
          <h2 className="card-title flex items-center gap-2"><CalcIcon className="text-blue-500"/> 1. ML Probabilidad base (40%)</h2>
          <p className="text-gray-600">Un modelo <strong>Gradient Boosting</strong> entrenado con datos históricos evalúa la probabilidad de ocurrencia de accidentes basándose en variables cruzadas crudas. Mientras mayor es la probabilidad inferida, más cerca de 100 ptos sube esta capa.</p>
        </div>
        
        <div className="card border-t-4 border-yellow-500">
          <h2 className="card-title flex items-center gap-2"><ListIcon className="text-yellow-500"/> 2. Riesgo Operacional (25%)</h2>
          <p className="text-gray-600">Variables duras que señalan deterioro de condiciones:</p>
          <ul className="list-disc ml-6 mt-2 text-gray-600">
            <li>Ratio de hallazgos abiertos por cada 1000 trabajadores.</li>
            <li>Días transcurridos sin capacitación (mayor de 90 días penaliza fuertemente).</li>
            <li>Días sin intervención preventiva y Tasa de accidentabilidad 12M.</li>
          </ul>
        </div>
        
        <div className="card border-t-4 border-purple-500">
          <h2 className="card-title flex items-center gap-2"><FileIcon className="text-purple-500"/> 3. Señales NLP (Texto) (20%)</h2>
          <p className="text-gray-600">Mediante Procesamiento de Lenguaje Natural, se analizan los comentarios de inspección buscando "señales de riesgo crónico" como: <span className="italic">"negligencia, improvisación, abandono, sin cierre"</span>. Mayor concentración de frases críticas elevan fuertemente este factor.</p>
        </div>
        
        <div className="card border-t-4 border-green-500">
          <h2 className="card-title flex items-center gap-2"><MapIcon className="text-green-500"/> 4. Contexto Ambiental (15%)</h2>
          <p className="text-gray-600">Factores externos tomados en tiempo real (consultados vía Direccion Meteorologica de Chile) que alteran drásticamente operaciones sensibles:</p>
          <ul className="list-disc ml-6 mt-2 text-gray-600">
            <li>Lluvia intensa o Alertas meteorológicas sobre rubros "A Cielo Abierto".</li>
            <li>Eventos masivos cercanos o altas congestiones.</li>
          </ul>
        </div>
      </div>
      
      <div className="card mt-6">
        <h2 className="card-title flex items-center gap-2"><CalcIcon className="text-[var(--success)]"/> Resumen de Ponderación Final</h2>
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="p-3 border">Componente</th>
                <th className="p-3 border">Peso</th>
                <th className="p-3 border">Variables Clave</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3 border font-semibold">Capa ML (Gradient Boosting)</td>
                <td className="p-3 border">40%</td>
                <td className="p-3 border text-gray-600">Dotación, Accidentabilidad histórica, Turnos críticos, Hallazgos previos.</td>
              </tr>
              <tr>
                <td className="p-3 border font-semibold">Riesgo Operacional</td>
                <td className="p-3 border">25%</td>
                <td className="p-3 border text-gray-600">Ratio Hallazgos/Dotación (40%), Brecha Capacitación (20%), Brecha Visita (20%), Accidentabilidad 12M (20%).</td>
              </tr>
              <tr>
                <td className="p-3 border font-semibold">Análisis de Texto (NLP)</td>
                <td className="p-3 border">20%</td>
                <td className="p-3 border text-gray-600">Detección de negligencia, abandono, desorden grave o falta de EPP en observaciones.</td>
              </tr>
              <tr>
                <td className="p-3 border font-semibold">Contexto y Clima</td>
                <td className="p-3 border">15%</td>
                <td className="p-3 border text-gray-600">Alertas meteorológicas (40%), Lluvia x Sensibilidad (20%), Congestión Operacional (20%), Eventos Masivos (20%).</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card mt-6 bg-[var(--danger-light)] border border-[var(--danger)]">
        <h2 className="card-title text-[var(--danger)]">Rango de Decisiones (Semáforo)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mt-4">
          <div className="p-4 bg-white rounded-xl shadow-sm border border-red-200">
            <div className="text-2xl font-black text-[var(--danger)]">&gt;= 65</div>
            <div className="font-bold text-gray-700">Riesgo Alto</div>
            <div className="text-sm text-gray-500 mt-2">Prioridad 1: Visita técnica presencial obligatoria dentro de las primeras 24 horas.</div>
          </div>
          <div className="p-4 bg-white rounded-xl shadow-sm border border-yellow-200">
            <div className="text-2xl font-black text-[var(--warning)]">45 a 64</div>
            <div className="font-bold text-gray-700">Riesgo Medio</div>
            <div className="text-sm text-gray-500 mt-2">Prioridad 2: Contacto telefónico preventivo, revisión remota de hallazgos o agendamiento de capacitación.</div>
          </div>
          <div className="p-4 bg-white rounded-xl shadow-sm border border-green-200">
            <div className="text-2xl font-black text-[var(--success)]">&lt; 45</div>
            <div className="font-bold text-gray-700">Riesgo Bajo</div>
            <div className="text-sm text-gray-500 mt-2">Prioridad 3: Mantención de estándares, seguimiento administrativo mensual.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
