import React from 'react'
import { useAuth, USER_PROFILES, ROLE_PERMISSIONS } from '../contexts/AuthContext'
import { User, Shield, Bell, Database, Settings as SettingsIcon } from 'lucide-react'

export default function Settings() {
  const { user, USER_PROFILES } = useAuth()

  const settingsSections = [
    {
      id: 'profile',
      name: 'Profil utilisateur',
      icon: User,
      content: (
        <div className="space-y-4">
          {[
            { label: 'Nom', value: user?.name },
            { label: 'Email', value: user?.email },
            { label: 'Profil', value: USER_PROFILES[user?.profileId]?.name || user?.profileId }
          ].map((field) => (
            <div key={field.label}>
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">{field.label}</label>
              <input type="text" defaultValue={field.value} className="input-field" readOnly />
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'permissions',
      name: 'Permissions',
      icon: Shield,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Votre profil <strong className="text-gray-800">{USER_PROFILES[user?.profileId]?.name || user?.profileId}</strong> dispose des permissions suivantes :
          </p>
          <div className="flex flex-wrap gap-2">
            {(ROLE_PERMISSIONS[user?.profileId] || []).map((perm, index) => (
              <span key={index} className="badge bg-green-50 text-green-700 px-3 py-1.5 text-xs">
                {perm}
              </span>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: Bell,
      content: (
        <div className="space-y-4">
          {[
            { name: 'Alertes de retard', desc: 'Recevoir des notifications pour les projets en retard', defaultOn: true },
            { name: 'Alertes budgétaires', desc: 'Recevoir des notifications en cas de dépassement', defaultOn: true },
            { name: 'Rapports hebdomadaires', desc: 'Recevoir un récapitulatif chaque semaine', defaultOn: false }
          ].map((notif) => (
            <div key={notif.name} className="flex items-center justify-between p-3 bg-gray-50/60 rounded-xl hover:bg-gray-100/60 transition-colors">
              <div>
                <p className="font-medium text-gray-800 text-sm">{notif.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{notif.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
                <input type="checkbox" className="sr-only peer" defaultChecked={notif.defaultOn} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-500/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'data',
      name: 'Données',
      icon: Database,
      content: (
        <div className="space-y-4">
          <button className="btn-secondary w-full">
            Exporter toutes les données
          </button>
          <p className="text-xs text-gray-400 text-center">
            Dernière synchronisation: {new Date().toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </p>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-sm text-gray-400 mb-1">Configuration</p>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Paramètres</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar navigation */}
        <div className="lg:col-span-1 space-y-5">
          <nav className="card-static overflow-hidden">
            {settingsSections.map((section, index) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={`flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-all ${
                  index === 0
                    ? 'bg-green-50/80 text-green-700 border-l-[3px] border-green-600'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 border-l-[3px] border-transparent'
                }`}
              >
                <section.icon className="w-4 h-4" />
                {section.name}
              </a>
            ))}
          </nav>

          {/* User profile card */}
          <div className="card-static p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                style={{ background: 'linear-gradient(135deg, #006233, #008547)' }}>
                {user?.name?.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{user?.name}</p>
                <p className="text-xs text-gray-400">{USER_PROFILES[user?.profileId]?.name || user?.profileId}</p>
              </div>
            </div>
            <div className="pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
              <p className="text-[0.6875rem] text-gray-400 font-medium">ID Utilisateur</p>
              <p className="text-sm font-mono text-gray-600 mt-0.5">{user?.id}</p>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-5">
          {settingsSections.map((section) => (
            <div key={section.id} id={section.id} className="card-static p-6">
              <h3 className="section-title">
                <section.icon className="w-4 h-4 text-green-600" />
                {section.name}
              </h3>
              {section.content}
            </div>
          ))}

          {/* Available profiles */}
          <div className="card-static p-6">
            <h3 className="section-title">
              <Shield className="w-4 h-4 text-gray-400" />
              Profils utilisateurs disponibles
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(USER_PROFILES).map(([id, profile]) => (
                <div
                  key={id}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    user?.profileId === id
                      ? 'border-green-200 bg-green-50/30'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: profile.color }} />
                    <span className="font-medium text-gray-900 text-sm">{profile.name}</span>
                    {user?.profileId === id && (
                      <span className="badge bg-green-50 text-green-600 ml-auto">Actif</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {(ROLE_PERMISSIONS[id] || []).join(' · ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
