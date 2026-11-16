import { useState } from 'react'
import { User, Key, Save, Trash2, Download, Upload, RefreshCw, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useChatStore } from '../stores/chatStore'
import { cn, formatDate } from '../lib/utils'

export function SettingsPage() {
  const { user, logout } = useAuthStore()
  const { conversations, deleteConversation, userApiKey, availableModels, selectedModel, baseUrl, setUserApiKey, setSelectedModel, setBaseUrl, fetchModels } = useChatStore()
  const [activeTab, setActiveTab] = useState<'account' | 'data' | 'api'>('account')
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState(userApiKey)
  const [fetchingModels, setFetchingModels] = useState(false)

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      showMessage('success', 'Profile updated (demo mode - not persisted to server)')
    } catch {
      showMessage('error', 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showMessage('error', 'Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      showMessage('error', 'Password must be at least 6 characters')
      return
    }
    setSaving(true)
    try {
      showMessage('success', 'Password changed (demo mode)')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      showMessage('error', 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const exportData = () => {
    const data = {
      conversations,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nvidia-chat-backup-${formatDate(new Date())}.json`
    a.click()
    URL.revokeObjectURL(url)
    showMessage('success', 'Data exported successfully')
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        if (data.conversations) {
          showMessage('success', `Imported ${data.conversations.length} conversations (demo mode)`)
        }
      } catch {
        showMessage('error', 'Invalid backup file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const clearAllData = () => {
    if (confirm('This will delete all your conversations locally. This cannot be undone. Continue?')) {
      conversations.forEach((c) => deleteConversation(c.id))
      showMessage('success', 'All local data cleared')
    }
  }

  const handleSaveApiKey = () => {
    setUserApiKey(apiKeyInput.trim())
    setShowApiKey(false)
    showMessage('success', 'API key saved')
    setFetchingModels(true)
    fetchModels().finally(() => setFetchingModels(false))
  }

  const handleFetchModels = () => {
    setFetchingModels(true)
    fetchModels().finally(() => setFetchingModels(false))
  }

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'data', label: 'Data', icon: Download },
    { id: 'api', label: 'API', icon: Key },
  ] as const

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-white text-nvidia-green shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {message && (
        <div className={cn(
          'p-4 rounded-lg flex items-center gap-3 animate-slide-in',
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        )}>
          <span className="flex-1">{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-current opacity-60 hover:opacity-100">×</button>
        </div>
      )}

      {activeTab === 'account' && (
        <div className="card p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                disabled
              />
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
            </div>
            <button onClick={handleSaveProfile} disabled={saving} className="btn-primary">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input"
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input"
                />
              </div>
              <button onClick={handleChangePassword} disabled={saving} className="btn-primary">
                <Key className="w-4 h-4" />
                {saving ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <button onClick={logout} className="btn-secondary text-red-600 border-red-300 hover:bg-red-50">
              <User className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="card p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Data Management</h2>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Export Data</h3>
            <p className="text-sm text-gray-600 mb-4">Download all your conversations as a JSON file.</p>
            <button onClick={exportData} className="btn-secondary">
              <Download className="w-4 h-4" />
              Export Conversations
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Import Data</h3>
            <p className="text-sm text-gray-600 mb-4">Restore conversations from a previously exported JSON file.</p>
            <label className="btn-secondary cursor-pointer">
              <Upload className="w-4 h-4" />
              Choose File
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>

          <div className="border border-red-200 bg-red-50 rounded-lg p-4">
            <h3 className="font-medium text-red-900 mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Danger Zone
            </h3>
            <p className="text-sm text-red-700 mb-4">Permanently delete all local conversations. This cannot be undone.</p>
            <button onClick={clearAllData} className="btn-secondary text-red-600 border-red-300 hover:bg-red-100">
              <Trash2 className="w-4 h-4" />
              Clear All Data
            </button>
          </div>
        </div>
      )}

      {activeTab === 'api' && (
        <div className="card p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">API Configuration</h2>
          
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">NVIDIA NGC API Key</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter your personal NVIDIA API key to access models. Get one from 
              <a href="https://build.nvidia.com" target="_blank" rel="noopener" className="text-nvidia-green hover:underline">NVIDIA Build</a>.
              If not provided, the app will use the server-configured key.
            </p>
            
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Enter your NVIDIA API key (nvapi-...)"
                  className="input pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <button onClick={handleSaveApiKey} className="btn-primary whitespace-nowrap">
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>

            {userApiKey && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Personal API key active (stored locally in browser)
              </p>
            )}

            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-medium text-gray-900 mb-3">Available Models</h3>
              <div className="flex gap-2 mb-4">
                <button 
                  onClick={handleFetchModels} 
                  disabled={fetchingModels || !apiKeyInput.trim()}
                  className="btn-secondary"
                >
                  <RefreshCw className={`w-4 h-4 ${fetchingModels ? 'animate-spin' : ''}`} />
                  {fetchingModels ? 'Fetching...' : 'Fetch Models'}
                </button>
                <span className="text-sm text-gray-500 self-center">
                  {availableModels.length > 0 
                    ? `${availableModels.length} models found` 
                    : 'No models fetched yet'}
                </span>
              </div>

              {availableModels.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableModels.map((model: string) => (
                    <label key={model} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <input
                        type="radio"
                        name="model"
                        value={model}
                        checked={selectedModel === model}
                        onChange={() => setSelectedModel(model)}
                        className="w-4 h-4 text-nvidia-green border-gray-300 focus:ring-nvidia-green"
                      />
                      <span className="text-sm font-mono text-gray-900 truncate flex-1">{model}</span>
                      {selectedModel === model && <CheckCircle className="w-5 h-5 text-nvidia-green" />}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-medium text-gray-900 mb-3">API Base URL</h3>
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://integrate.api.nvidia.com/v1"
                className="input max-w-md"
              />
              <p className="text-xs text-gray-500 mt-1">Default: https://integrate.api.nvidia.com/v1</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-medium text-gray-900 mb-3">Environment Variables (Server)</h3>
            <p className="text-sm text-gray-600 mb-4">
              These are configured on the server (Render dashboard) and used as fallback:
            </p>
            <div className="bg-gray-100 rounded-lg p-4 space-y-3 font-mono text-sm">
              <div><span className="text-gray-500">VITE_NVIDIA_API_KEY=</span><code className="text-nvidia-green">{import.meta.env.VITE_NVIDIA_API_KEY ? '••••••••' : 'not set'}</code></div>
              <div><span className="text-gray-500">VITE_NVIDIA_BASE_URL=</span><code className="text-nvidia-green">{import.meta.env.VITE_NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1'}</code></div>
              <div><span className="text-gray-500">VITE_NVIDIA_MODEL=</span><code className="text-nvidia-green">{import.meta.env.VITE_NVIDIA_MODEL || 'meta/llama-3.1-405b-instruct'}</code></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}