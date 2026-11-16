import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Menu, X, LogOut, User, Settings, MessageSquare, Brain } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { cn } from '../lib/utils'

export function Layout() {
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = [
    { path: '/chat', label: 'Chat', icon: MessageSquare },
    { path: '/models', label: 'Models', icon: Brain },
    { path: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 lg:justify-center">
          <h1 className="text-xl font-bold text-nvidia-green flex items-center gap-2">
            <Brain className="w-6 h-6" />
            NVIDIA Chat
          </h1>
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-nvidia-green/10 text-nvidia-green'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-nvidia-green/10 flex items-center justify-center">
              <User className="w-5 h-5 text-nvidia-green" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full mt-3 flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 lg:hidden">
          <div className="flex h-full items-center justify-between px-4">
            <button
              className="p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-nvidia-green">NVIDIA Chat</h1>
            <div className="w-10" />
          </div>
        </header>

        <main className="p-4 lg:p-6"><Outlet /></main>
      </div>
    </div>
  )
}