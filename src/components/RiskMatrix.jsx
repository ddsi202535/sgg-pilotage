import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export default function RiskMatrix({ risks }) {
  const { t } = useLanguage();

  // Matrice 5x5
  const grid = Array(5).fill(null).map(() => Array(5).fill([]));

  // Remplir la grille
  risks.forEach(risk => {
    // S'assurer que les valeurs sont entre 1 et 5
    const p = Math.min(Math.max(risk.probability || 1, 1), 5);
    const i = Math.min(Math.max(risk.impact || 1, 1), 5);
    
    // Note: p and i are 1-based. arrays are 0-based.
    // Ligne (Probabilité) : 5 en haut (index 0) -> 1 en bas (index 4)
    const rowIndex = 5 - p; 
    // Colonne (Impact) : 1 à gauche (index 0) -> 5 à droite (index 4)
    const colIndex = i - 1;

    grid[rowIndex][colIndex] = [...grid[rowIndex][colIndex], risk];
  });

  const getCellColor = (p, i) => {
    const score = p * i;
    if (score >= 15) return 'bg-red-100 hover:bg-red-200 border-red-300';
    if (score >= 8) return 'bg-orange-100 hover:bg-orange-200 border-orange-300';
    if (score >= 4) return 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300';
    return 'bg-green-100 hover:bg-green-200 border-green-300';
  };

  const getTextColor = (p, i) => {
    const score = p * i;
    if (score >= 15) return 'text-red-800';
    if (score >= 8) return 'text-orange-800';
    if (score >= 4) return 'text-yellow-800';
    return 'text-green-800';
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('risk.matrix')}</h3>
      
      <div className="flex">
        {/* Axe Y - Probabilité */}
        <div className="flex flex-col justify-between pr-4 items-end text-sm text-gray-500 font-medium py-4">
          <span>5</span>
          <span>4</span>
          <span>3</span>
          <span>2</span>
          <span>1</span>
        </div>
        
        {/* Grille */}
        <div className="flex-1">
          <div className="grid grid-cols-5 gap-2 h-64">
            {grid.map((row, rowIndex) => (
              row.map((cellRisks, colIndex) => {
                const probability = 5 - rowIndex;
                const impact = colIndex + 1;
                return (
                  <div 
                    key={`${rowIndex}-${colIndex}`}
                    className={`border rounded-lg flex items-center justify-center relative transition cursor-pointer ${getCellColor(probability, impact)}`}
                    title={`Probabilité: ${probability}, Impact: ${impact}`}
                  >
                    {cellRisks.length > 0 && (
                      <span className={`text-lg font-bold ${getTextColor(probability, impact)}`}>
                        {cellRisks.length}
                      </span>
                    )}
                  </div>
                )
              })
            ))}
          </div>
          
          {/* Axe X - Impact */}
          <div className="flex justify-between pt-4 px-4 text-sm text-gray-500 font-medium">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center gap-6 mt-6 text-sm">
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div><span>{t('risk.low')}</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div><span>{t('risk.medium')}</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div><span>{t('risk.high')}</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div><span>{t('risk.critical')}</span></div>
      </div>
    </div>
  );
}
