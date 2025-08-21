'use client'

import React, { useState, useEffect, useRef } from 'react'

interface FileStatusProps {
  fileId: string
  onDownloadReady: (downloadData: { html: string; filename: string }) => void
}

interface FileStatus {
  id: string
  filename: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  error?: string
  expiresAt: string
  createdAt: string
}

const FileStatus: React.FC<FileStatusProps> = ({ fileId, onDownloadReady }) => {
  const [status, setStatus] = useState<FileStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const downloadDataFetched = useRef(false)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/status/${fileId}`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Error al verificar estado')
          stopPolling()
          return
        }

        setStatus(data)

        if (data.status === 'COMPLETED' && !downloadDataFetched.current) {
          // Solo obtener datos de descarga una vez
          downloadDataFetched.current = true
          try {
            const downloadResponse = await fetch(`/api/download/${fileId}`)
            const downloadData = await downloadResponse.json()

            if (downloadResponse.ok) {
              onDownloadReady(downloadData)
            }
          } catch (downloadError) {
            console.error('Error downloading:', downloadError)
          }
          stopPolling()
        } else if (data.status === 'FAILED') {
          setError(data.error || 'Error en la conversión')
          stopPolling()
        } else if (data.status === 'PROCESSING' || data.status === 'PENDING') {
          // Continuar polling si está procesando
          if (!intervalRef.current) {
            startPolling()
          }
        }
      } catch {
        setError('Error de conexión')
        stopPolling()
      } finally {
        setLoading(false)
      }
    }

    const startPolling = () => {
      if (intervalRef.current) return
      intervalRef.current = setInterval(checkStatus, 2000)
    }

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    // Primer check
    checkStatus()

    return () => {
      stopPolling()
    }
  }, [fileId, onDownloadReady])

  if (loading) {
    return (
      <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-blue-800">Verificando estado...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
        <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <div>
          <p className="text-red-800 font-medium">Error</p>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!status) {
    return null
  }

  const getStatusColor = () => {
    switch (status.status) {
      case 'COMPLETED':
        return 'text-green-800 bg-green-50 border-green-200'
      case 'PROCESSING':
      case 'PENDING':
        return 'text-blue-800 bg-blue-50 border-blue-200'
      case 'FAILED':
        return 'text-red-800 bg-red-50 border-red-200'
      default:
        return 'text-gray-800 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = () => {
    switch (status.status) {
      case 'COMPLETED':
        return (
          <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )
      case 'PROCESSING':
      case 'PENDING':
        return (
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        )
      case 'FAILED':
        return (
          <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      default:
        return null
    }
  }

  const getStatusText = () => {
    switch (status.status) {
      case 'COMPLETED':
        return 'Conversión completada'
      case 'PROCESSING':
        return 'Procesando archivo...'
      case 'PENDING':
        return 'En espera...'
      case 'FAILED':
        return 'Error en la conversión'
      default:
        return 'Estado desconocido'
    }
  }

  return (
    <div className={`flex items-center space-x-3 p-4 rounded-lg border ${getStatusColor()}`}>
      {getStatusIcon()}
      <div className="flex-1">
        <p className="font-medium">{status.filename}</p>
        <p className="text-sm opacity-75">{getStatusText()}</p>
        {status.status === 'FAILED' && status.error && (
          <p className="text-sm mt-1 opacity-75">{status.error}</p>
        )}
        {status.status === 'COMPLETED' && (
          <p className="text-sm mt-1 opacity-75">¡Listo para descargar!</p>
        )}
      </div>
    </div>
  )
}

export default FileStatus