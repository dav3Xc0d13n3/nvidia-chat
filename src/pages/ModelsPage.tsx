import { Brain, Check, ExternalLink, Info } from 'lucide-react'
import { cn } from '../lib/utils'

const AVAILABLE_MODELS = [
  { id: 'meta/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', description: 'Most capable model for complex reasoning', context: '128K' },
  { id: 'meta/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', description: 'Balanced performance and speed', context: '128K' },
  { id: 'meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', description: 'Fast and efficient for everyday tasks', context: '128K' },
  { id: 'nvidia/nemotron-3-ultra', name: 'Nemotron 3 Ultra', description: 'NVIDIA\'s flagship reasoning model', context: '128K' },
  { id: 'mistralai/mixtral-8x22b-instruct', name: 'Mixtral 8x22B', description: 'Mixture of experts model', context: '64K' },
  { id: 'google/gemma-2-27b-it', name: 'Gemma 2 27B', description: 'Google\'s open model', context: '8K' },
  { id: 'microsoft/phi-3.5-mini-instruct', name: 'Phi 3.5 Mini', description: 'Small but capable model', context: '128K' },
]

export function ModelsPage() {
  const currentModel = import.meta.env.VITE_NVIDIA_MODEL || 'meta/llama-3.1-405b-instruct'

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Brain className="w-8 h-8 text-nvidia-green" />
          Available Models
        </h1>
        <p className="mt-2 text-gray-600">Choose a model for your conversations. Changes apply to new chats.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {AVAILABLE_MODELS.map((model) => {
          const isActive = model.id === currentModel
          return (
            <div
              key={model.id}
              className={cn(
                'card p-5 transition-all',
                isActive ? 'border-nvidia-green/50 bg-nvidia-green/5' : 'hover:border-gray-300'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 truncate">{model.name}</h3>
                    {isActive && <Check className="w-5 h-5 text-nvidia-green flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{model.description}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded">
                      <Info className="w-3 h-3" />
                      {model.context} context
                    </span>
                  </div>
                </div>
              </div>
              {isActive && (
                <div className="mt-4 pt-4 border-t border-nvidia-green/20 text-sm text-nvidia-green">
                  Currently selected
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="card p-6 border-nvidia-green/20 bg-nvidia-green/5">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Info className="w-5 h-5 text-nvidia-green" />
          Model Configuration
        </h3>
        <div className="space-y-3 text-sm text-gray-600">
          <p>Current model is set via environment variable: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-nvidia-green font-mono">VITE_NVIDIA_MODEL</code></p>
          <p>To change models, update your <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">.env</code> file and rebuild.</p>
          <p>API endpoint: <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">{import.meta.env.VITE_NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1'}</code></p>
        </div>
        <a
          href="https://build.nvidia.com/explore/discover"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm text-nvidia-green hover:underline"
        >
          Browse all models on NVIDIA NGC <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  )
}