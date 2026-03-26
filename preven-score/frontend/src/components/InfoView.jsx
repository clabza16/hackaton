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
      
      <div className="card mt-6 bg-[var(--danger-light)] border border-[var(--danger)]">
        <h2 className="card-title text-[var(--danger)]">Rango de Decisiones (Semáforo)</h2>
        <div className="grid grid-cols-3 gap-4 text-center mt-4">
          <div className="p-4 bg-white rounded-xl shadow-sm border border-red-200">
            <div className="text-2xl font-black text-[var(--danger)]">&gt;= 65</div>
            <div className="font-bold text-gray-700">Riesgo Alto</div>
            <div className="text-sm text-gray-500 mt-2">Requiere visita física inmediata.</div>
          </div>
          <div className="p-4 bg-white rounded-xl shadow-sm border border-yellow-200">
            <div className="text-2xl font-black text-[var(--warning)]">45 a 64</div>
            <div className="font-bold text-gray-700">Riesgo Medio</div>
            <div className="text-sm text-gray-500 mt-2">Llamado, seguimiento o capacitaciones urgentes.</div>
          </div>
          <div className="p-4 bg-white rounded-xl shadow-sm border border-green-200">
            <div className="text-2xl font-black text-[var(--success)]">&lt; 45</div>
            <div className="font-bold text-gray-700">Riesgo Bajo</div>
            <div className="text-sm text-gray-500 mt-2">Monitoreo estándar.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
