import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Budget from './pages/Budget'
import Risks from './pages/Risks'
import BI from './pages/BI'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Strategic from './pages/Strategic'
import Alerts from './pages/Alerts'
import UserManagement from './pages/UserManagement'
import ProgrammeDashboard from './pages/ProgrammeDashboard'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { DataProvider } from './contexts/DataContext'
import { LanguageProvider } from './contexts/LanguageContext'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Routes><Route path="*" element={<Login />} /></Routes>
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="budget" element={<Budget />} />
        <Route path="risks" element={<Risks />} />
        <Route path="bi" element={<BI />} />
        <Route path="programmes" element={<ProgrammeDashboard />} />
        <Route path="strategic" element={<Strategic />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="admin/users" element={<UserManagement />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <DataProvider>
            <AppRoutes />
          </DataProvider>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  )
}

export default App
