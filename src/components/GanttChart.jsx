import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export default function GanttChart({ project }) {
  const { t, language } = useLanguage();
  
  if (!project.phases || project.phases.length === 0) return null;

  const totalPhases = project.phases.length;
  const rtl = language === 'ar';

  return (
    <div className="mt-6 border rounded-lg overflow-hidden bg-white">
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <h3 className="font-medium text-gray-900">{t('project.gantt')}</h3>
        <div className="text-sm text-gray-500">
          {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
        </div>
      </div>
      <div className="p-4 overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Gantt Header Timeline */}
          <div className="flex border-b border-gray-200 pb-2 mb-4">
            <div className="w-1/4 font-medium text-sm text-gray-500">Phase</div>
            <div className="w-3/4 flex justify-between px-2 text-xs text-gray-400">
              <span>0% (Début)</span>
              <span>50%</span>
              <span>100% (Fin)</span>
            </div>
          </div>
          
          {/* Gantt Rows */}
          <div className="space-y-4">
            {project.phases.map((phase, index) => {
              // Simulate phase distribution linearly
              const width = 100 / totalPhases;
              const margin = index * width;
              
              let bgColor = 'bg-gray-200';
              let progressColor = 'bg-gray-400';
              if (phase.status === 'done') {
                bgColor = 'bg-green-100';
                progressColor = 'bg-green-500';
              } else if (phase.status === 'in_progress') {
                bgColor = 'bg-blue-100';
                progressColor = 'bg-blue-500';
              }

              return (
                <div key={phase.id} className="flex items-center">
                  <div className="w-1/4 pr-4">
                    <div className="text-sm font-medium text-gray-800 truncate" title={phase.name}>
                      {phase.name}
                    </div>
                  </div>
                  <div className="w-3/4 relative h-6 bg-gray-50 rounded">
                    <div 
                      className={`absolute top-0 h-6 rounded-md ${bgColor} flex items-center overflow-hidden border border-white/20`}
                      style={{ 
                        width: `${width}%`, 
                        [rtl ? 'right' : 'left']: `${margin}%` 
                      }}
                    >
                      <div 
                        className={`h-full ${progressColor} transition-all duration-500`}
                        style={{ width: `${phase.progress}%` }}
                      ></div>
                      <span className="absolute z-10 w-full text-center text-xs font-semibold text-gray-700">
                        {phase.progress}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
