import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function validateFile(file: File, maxSize = 10 * 1024 * 1024) {
  const allowedTypes = [
    'image/', 'text/', 'application/pdf',
    'application/json', 'application/xml',
    'application/javascript', 'application/typescript',
  ]
  if (!allowedTypes.some((t) => file.type.startsWith(t))) {
    return 'File type not supported'
  }
  if (file.size > maxSize) {
    return `File size exceeds ${formatFileSize(maxSize)}`
  }
  return null
}