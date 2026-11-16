import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AuthPage } from './pages/AuthPage'
import { ChatPage } from './pages/ChatPage'
import { ModelsPage } from './pages/ModelsPage'
import { SettingsPage } from './pages/SettingsPage'
import { useAuthStore } from './stores/authStore'

function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

function PublicRoute() {
  const { isAuthenticated } = useAuthStore()
  return !isAuthenticated ? <Outlet /> : <Navigate to="/chat" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute />}>
        <Route index element={<AuthPage />} />
      </Route>
      
      <Route path="/" element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="chat" element={<ChatPage />} />
          <Route path="models" element={<ModelsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  )
}