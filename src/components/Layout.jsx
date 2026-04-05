import React, { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { notificationsAPI } from '../services/api'
import {
  LayoutDashboard, FolderKanban, Wallet, ShieldAlert,
  BarChart3, Settings, LogOut, Menu, X, Bell, User, Users, Languages, Shield, ChevronRight, Check, Target, Flag, GitBranch
} from 'lucide-react'

const navigationKeys = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'projects', href: '/projects', icon: FolderKanban },
  { key: 'budget', href: '/budget', icon: Wallet },
  { key: 'risks', href: '/risks', icon: ShieldAlert },
  { key: 'bi', href: '/bi', icon: BarChart3 },
  { key: 'programmes', href: '/programmes', icon: GitBranch },
  { key: 'strategic', href: '/strategic', icon: Target },
  { key: 'alerts', href: '/alerts', icon: Flag },
  { key: 'settings', href: '/settings', icon: Settings }
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const { user, logout, USER_PROFILES, isAdmin, isReadOnly, can } = useAuth()
  const { language, toggleLanguage, t } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)

  React.useEffect(() => {
    const fetchNotifs = async () => {
      if (user) {
        try {
          const data = await notificationsAPI.getAll()
          if (Array.isArray(data)) setNotifications(data)
        } catch (err) {}
      }
    }
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 15000)
    return () => clearInterval(interval)
  }, [user])

  const handleReadNotification = async (id) => {
    try {
      await notificationsAPI.markAsRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    } catch (err) {}
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ═══ Sidebar ═══ */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-[260px] transform transition-all duration-300 ease-out flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
        style={{
          background: 'linear-gradient(180deg, #001f14 0%, #00331a 30%, #004d28 70%, #006233 100%)'
        }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-white text-lg tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>SGG</span>
                <span className="text-white/40 text-sm ml-1.5">Pilotage</span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>

          {/* Divider */}
          <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Navigation */}
          <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
            {navigationKeys.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href))
              return (
                <Link
                  key={item.key}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    group flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200
                    ${isActive
                      ? 'bg-white/[0.12] text-white'
                      : 'text-white/50 hover:bg-white/[0.06] hover:text-white/80'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-[18px] h-[18px] transition-colors ${isActive ? 'text-green-300' : 'text-white/40 group-hover:text-white/60'}`} />
                    <span className="font-medium text-[0.8125rem]">{t(`nav.${item.key}`) || item.key}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-white/30" />}
                </Link>
              )
            })}
            {/* Admin or Chef Manager link */}
            {(isAdmin || can('manage_chefs')) && (
              <Link
                to="/admin/users"
                onClick={() => setSidebarOpen(false)}
                className={`
                  group flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200
                  ${location.pathname.startsWith('/admin') ? 'bg-white/[0.12] text-white' : 'text-white/50 hover:bg-white/[0.06] hover:text-white/80'}
                `}
              >
                <div className="flex items-center gap-3">
                  <Users className={`w-[18px] h-[18px] ${location.pathname.startsWith('/admin') ? 'text-green-300' : 'text-white/40 group-hover:text-white/60'}`} />
                  <span className="font-medium text-[0.8125rem]">Utilisateurs</span>
                </div>
              </Link>
            )}
          </nav>

          {/* User info bottom */}
          <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3 px-2 py-2">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                style={{ background: USER_PROFILES[user?.profileId]?.color || '#6b7280' }}
              >
                {user?.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/90 truncate">{user?.name}</p>
                <p className="text-xs truncate" style={{ color: USER_PROFILES[user?.profileId]?.color || '#9ca3af' }}>
                  {USER_PROFILES[user?.profileId]?.name || user?.profileId}
                  {isReadOnly && ' 🔒'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ═══ Main content ═══ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="glass-header">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              {/* Language toggle */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-all text-sm font-medium text-gray-600"
              >
                <Languages className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">{language === 'fr' ? 'AR' : 'FR'}</span>
              </button>

              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`relative p-2.5 rounded-xl transition-colors ${showNotifications ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                >
                  <Bell className="w-[18px] h-[18px] text-gray-500" />
                  {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-slide-up origin-top-right">
                    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                      <p className="text-sm font-bold text-gray-900">Notifications</p>
                      {unreadCount > 0 && <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-sm text-center text-gray-400 py-8">Aucune notification.</p>
                      ) : (
                        notifications.map(notif => (
                          <div 
                            key={notif.id} 
                            onClick={() => !notif.isRead && handleReadNotification(notif.id)}
                            className={`px-4 py-3 border-b border-gray-50 flex items-start gap-3 transition-colors ${notif.isRead ? 'opacity-60 bg-white' : 'bg-blue-50/50 cursor-pointer hover:bg-blue-50'}`}
                          >
                            <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${notif.isRead ? 'bg-gray-300' : 'bg-blue-500'}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-800 leading-snug">{notif.message}</p>
                              <p className="text-[10px] text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleString('fr-FR')}</p>
                            </div>
                            {!notif.isRead && (
                              <button onClick={(e) => { e.stopPropagation(); handleReadNotification(notif.id); }} className="text-blue-500 hover:text-blue-700" title="Marquer comme lu">
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="w-px h-8 bg-gray-200 mx-1" />

              {/* Profile */}
              <div className="relative">
                <button
                  onClick={() => setShowProfile(!showProfile)}
                  className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-all"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                    style={{ background: 'linear-gradient(135deg, #006233, #008547)' }}>
                    {user?.name?.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-800 leading-tight">{user?.name}</p>
                    <p className="text-[0.6875rem] text-gray-400 leading-tight">{USER_PROFILES[user?.profileId]?.name || user?.profileId}</p>
                  </div>
                </button>

                {showProfile && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-slide-up">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{USER_PROFILES[user?.profileId]?.name || user?.profileId}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 sm:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
