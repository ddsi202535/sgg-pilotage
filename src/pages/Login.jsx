import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, ROLE_PERMISSIONS } from '../contexts/AuthContext'
import { Lock, Mail, UserCircle, ChevronDown, ArrowRight, Shield } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [profileId, setProfileId] = useState('SGG')
  const [showProfileSelect, setShowProfileSelect] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login, USER_PROFILES } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Veuillez remplir tous les champs')
      return
    }

    setSubmitting(true)
    try {
      const success = await login(email, password, profileId)
      if (success) {
        navigate('/dashboard')
      } else {
        setError('Identifiants invalides')
      }
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedProfile = USER_PROFILES[profileId]

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #00331a 0%, #006233 40%, #008547 100%)'
        }}
      >
        {/* Decorative shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-5"
            style={{ background: 'radial-gradient(circle, #D4AF37 0%, transparent 70%)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-white/5" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center border border-white/20">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>SGG</span>
              <span className="text-lg text-white/60 ml-2">Pilotage</span>
            </div>
          </div>

          <h1 className="text-4xl font-bold leading-tight mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Système de Pilotage<br />
            <span className="text-white/70">de la Stratégie 2023—2027</span>
          </h1>
          <p className="text-white/50 text-lg leading-relaxed max-w-md">
            Plateforme intégrée de suivi des projets, de gestion des risques et du pilotage budgétaire du Secrétariat Général du Gouvernement.
          </p>

          <div className="mt-16 grid grid-cols-3 gap-6">
            {[
              { val: '12', label: 'Projets' },
              { val: '850M', label: 'Budget DH' },
              { val: '5', label: 'Programmes' }
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>{s.val}</p>
                <p className="text-white/40 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
              style={{ background: 'linear-gradient(135deg, #006233, #008547)' }}>
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              SGG Pilotage
            </h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Connexion
            </h2>
            <p className="text-gray-500 mt-2">Accédez à votre espace de pilotage</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <span className="text-red-500 text-lg">!</span>
              </div>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Profile selector */}
            <div>
              <label htmlFor="profile-select" className="block text-sm font-medium text-gray-700 mb-2">
                Profil utilisateur
              </label>
              <div className="relative">
                <button
                  id="profile-select"
                  type="button"
                  onClick={() => setShowProfileSelect(!showProfileSelect)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-green-300 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full ring-2 ring-offset-1"
                      style={{ backgroundColor: selectedProfile?.color, ringColor: selectedProfile?.color + '40' }}
                    />
                    <span className="font-medium text-gray-900">{selectedProfile?.name}</span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showProfileSelect ? 'rotate-180' : ''}`} />
                </button>

                {showProfileSelect && (
                  <>
                    {/* Backdrop to close on click outside */}
                    <div className="fixed inset-0 z-10" onClick={() => setShowProfileSelect(false)} />
                    <div className="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-64 overflow-y-auto animate-slide-up">
                      {Object.entries(USER_PROFILES).map(([id, profile]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            setProfileId(id)
                            setShowProfileSelect(false)
                          }}
                          className={`w-full flex items-center px-4 py-3 text-left transition-colors ${
                            profileId === id ? 'bg-green-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div
                            className="w-3 h-3 rounded-full mr-3 flex-shrink-0"
                            style={{ backgroundColor: profile.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{profile.name}</p>
                            <p className="text-xs text-gray-400 truncate">
                              {(ROLE_PERMISSIONS[id] || []).slice(0, 3).join(', ')}
                            </p>
                          </div>
                          {profileId === id && (
                            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center ml-2">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  autoFocus
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all z-0"
                  placeholder="votre.email@sgg.gov.ma"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all z-0"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-3.5 text-base mt-2 group"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Connexion...
                </span>
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 p-4 bg-green-50/50 rounded-xl border border-green-100">
            <p className="text-xs text-gray-500 text-center">
              <strong className="text-gray-700">Comptes :</strong> admin@sgg.gov.ma / admin123 (profil SGG)
            </p>
          </div>

          <p className="text-center text-gray-400 text-xs mt-8">
            © 2024 Secrétariat Général du Gouvernement — Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  )
}
