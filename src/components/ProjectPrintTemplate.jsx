import React, { forwardRef } from 'react'
import { Calendar, Wallet, CheckCircle, Clock, AlertCircle } from 'lucide-react'

const getStatusIcon = (status) => {
  switch (status) {
    case 'done': return <CheckCircle className="w-4 h-4 text-green-500" />
    case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />
    default: return <AlertCircle className="w-4 h-4 text-gray-400" />
  }
}

const ProjectPrintTemplate = forwardRef(({ project }, ref) => {
  if (!project) return null

  const projectStatusConfig = {
    en_cours: 'En cours',
    planification: 'Planification',
    termine: 'Terminé',
    en_retard: 'En retard'
  }

  const psc = projectStatusConfig[project.status] || 'En cours'
  const riskCount = project.risks?.length || 0

  return (
    <div ref={ref} className="p-10 bg-white text-gray-900 mx-auto" style={{ width: '100%', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      
      {/* HEADER OFFICIAL */}
      <div className="flex justify-between items-start border-b-2 border-green-700 pb-6 mb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-800 tracking-tight uppercase">MINISTÈRE DU SECRÉTARIAT GÉNÉRAL DU GOUVERNEMENT</h2>
          <p className="text-sm text-gray-500 mt-1 italic">Direction des Systèmes d'Information</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Date d'édition : {new Date().toLocaleDateString('fr-FR')}</p>
          <div className="inline-block mt-2 px-3 py-1 bg-gray-100 border border-gray-300 rounded font-mono text-sm font-bold">
            Fiche Projet N° {project.code}
          </div>
        </div>
      </div>

      {/* PROJECT TITLE */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-green-800 mb-2 leading-tight">{project.name}</h1>
        <p className="text-base text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">{project.description || 'Aucune description fournie.'}</p>
      </div>

      {/* KEY INFOS GRID */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="border border-gray-200 rounded-xl p-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Informations Générales</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between"><span className="text-gray-500">Chef de projet :</span> <span className="font-bold">{project.manager}</span></li>
            <li className="flex justify-between"><span className="text-gray-500">Direction :</span> <span className="font-bold">{project.directorate}</span></li>
            <li className="flex justify-between"><span className="text-gray-500">Type de projet :</span> <span className="font-bold capitalize">{project.type}</span></li>
            <li className="flex justify-between"><span className="text-gray-500">Statut :</span> <span className="font-bold">{psc}</span></li>
          </ul>
        </div>
        
        <div className="border border-gray-200 rounded-xl p-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">Délais & Engagements</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between"><span className="text-gray-500">Date de début :</span> <span className="font-bold">{new Date(project.startDate).toLocaleDateString('fr-FR')}</span></li>
            <li className="flex justify-between"><span className="text-gray-500">Date de fin :</span> <span className="font-bold">{new Date(project.endDate).toLocaleDateString('fr-FR')}</span></li>
            <li className="flex justify-between"><span className="text-gray-500">Risques détectés :</span> <span className="font-bold text-orange-600">{riskCount} risque(s)</span></li>
          </ul>
        </div>
      </div>

      {/* PROGRESSION & FINANCES */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-green-600 pl-3">État d'Avancement</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Avancement Physique</span>
              <span className="font-bold text-green-700">{project.physicalProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${project.physicalProgress}%` }}></div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Consommation du Budget</span>
              <span className="font-bold text-blue-700">{project.financialProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${project.financialProgress}%` }}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Engagé : {(project.consumed / 1000000).toFixed(2)} MDH</span>
              <span>Total : {(project.budget / 1000000).toFixed(2)} MDH</span>
            </div>
          </div>
        </div>
      </div>

      {/* PHASES */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-green-600 pl-3">Détail des Phases</h3>
        {project.phases && project.phases.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phase</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Progression</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {project.phases.map(phase => (
                <tr key={phase.id}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{phase.name}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center">
                      {getStatusIcon(phase.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium">
                    {phase.progress}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-500 italic">Aucune phase définie pour ce projet.</p>
        )}
      </div>

      {/* Footer */}
      <div className="pt-8 mt-12 border-t border-gray-200 text-center text-xs text-gray-400">
        Document généré automatiquement par le système SGG Pilotage. <br />
        Ce document annule et remplace les versions précédentes.
      </div>
    </div>
  )
})

export default ProjectPrintTemplate
