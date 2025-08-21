'use client'

import React, { useState } from 'react'
import { useSession, signIn, getProviders } from 'next-auth/react'
import FileUploader from '@/components/FileUploader'
import FileStatus from '@/components/FileStatus'
import AuthModal from '@/components/AuthModal'
import UserMenu from '@/components/UserMenu'
export default function Home() {
  // Datos estructurados para SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Doc to HTML Converter",
    "description": "Convierte tus documentos Word, Excel, PDF y más a HTML de forma gratuita y segura",
    "url": "https://your-domain.vercel.app",
    "applicationCategory": "Productivity",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "Conversión de Word a HTML",
      "Conversión de Excel a HTML", 
      "Conversión de PDF a HTML",
      "Unión de múltiples archivos",
      "Eliminación automática de archivos"
    ]
  }
  const { data: session } = useSession()
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [convertedFiles, setConvertedFiles] = useState<{ [key: string]: { html: string; filename: string } }>({})
  const [errors, setErrors] = useState<string[]>([])
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [providers, setProviders] = useState<any>(null)
  const [batches, setBatches] = useState<{ [batchId: string]: { files: string[], mergedFileId?: string, isMerged: boolean } }>({})

  React.useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders()
      setProviders(res)
    }
    fetchProviders()
  }, [])

  const handleUploadSuccess = (fileId: string, batchInfo?: { batchId?: string, mergedFileId?: string, isMerged?: boolean }) => {
    setUploadedFiles(prev => [...prev, fileId])
    
    // Si hay información de batch, gestionarla
    if (batchInfo?.batchId) {
      setBatches(prev => {
        const existing = prev[batchInfo.batchId!] || { files: [], isMerged: false }
        return {
          ...prev,
          [batchInfo.batchId!]: {
            ...existing,
            files: [...existing.files, fileId],
            mergedFileId: batchInfo.mergedFileId || existing.mergedFileId,
            isMerged: batchInfo.isMerged || existing.isMerged
          }
        }
      })
    }
    
    // Limpiar errores previos
    setErrors([])
  }

  const handleUploadError = (error: string) => {
    setErrors(prev => [...prev, error])
  }

  const handleAuthRequired = () => {
    setShowAuthModal(true)
  }

  const handleDownloadReady = (fileId: string, downloadData: { html: string; filename: string }) => {
    setConvertedFiles(prev => ({
      ...prev,
      [fileId]: downloadData
    }))
  }

  const downloadFile = (fileId: string) => {
    const fileData = convertedFiles[fileId]
    if (!fileData) return

    const blob = new Blob([fileData.html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileData.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const clearError = (index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index))
  }

  const clearAllErrors = () => {
    setErrors([])
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                Doc to HTML Converter
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {session ? (
                <UserMenu />
              ) : providers?.google ? (
                <button
                  onClick={() => signIn('google')}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Iniciar Sesión con Google</span>
                </button>
              ) : (
                <div className="text-sm text-gray-600">
                  <span>Configurando autenticación...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Convierte tus documentos a HTML
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transforma fácilmente archivos TXT, Word, Excel, XML y más a HTML con estilos incluidos
          </p>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-red-800 mb-2">
                      {errors.length === 1 ? 'Error encontrado:' : `${errors.length} errores encontrados:`}
                    </h3>
                    <ul className="space-y-1">
                      {errors.map((error, index) => (
                        <li key={index} className="flex items-start justify-between">
                          <span className="text-sm text-red-700">{error}</span>
                          <button
                            onClick={() => clearError(index)}
                            className="ml-4 text-red-400 hover:text-red-600"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <button
                  onClick={clearAllErrors}
                  className="text-red-400 hover:text-red-600"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* File Uploader */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
          <FileUploader
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            onAuthRequired={handleAuthRequired}
          />
        </div>

        {/* File Status */}
        {uploadedFiles.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Estado de Conversión
            </h3>
            <div className="space-y-4">
              {(() => {
                // Determinar qué archivos mostrar
                const filesToShow = []
                const processedBatches = new Set()
                
                for (const fileId of uploadedFiles) {
                  // Buscar si este archivo pertenece a un batch
                  const batchEntry = Object.entries(batches).find(([_, batch]) => 
                    batch.files.includes(fileId)
                  )
                  
                  if (batchEntry) {
                    const [batchId, batch] = batchEntry
                    
                    // Si ya procesamos este batch, saltarlo
                    if (processedBatches.has(batchId)) continue
                    processedBatches.add(batchId)
                    
                    // Si hay un archivo merged, mostrar solo ese
                    if (batch.mergedFileId && batch.isMerged) {
                      filesToShow.push({
                        id: batch.mergedFileId,
                        type: 'merged',
                        batchId,
                        fileCount: batch.files.length
                      })
                    } else {
                      // Si no hay merged, mostrar archivos individuales
                      batch.files.forEach(id => {
                        filesToShow.push({ id, type: 'individual' })
                      })
                    }
                  } else {
                    // Archivo individual (no parte de batch)
                    filesToShow.push({ id: fileId, type: 'individual' })
                  }
                }
                
                return filesToShow.map((item) => (
                  <div key={`${item.type}-${item.id}`}>
                    {item.type === 'merged' && (
                      <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600">🔗</span>
                          <span className="text-sm font-medium text-blue-800">
                            Archivos unidos ({item.fileCount} archivos combinados)
                          </span>
                        </div>
                      </div>
                    )}
                    <FileStatus
                      fileId={item.id}
                      onDownloadReady={(downloadData) => handleDownloadReady(item.id, downloadData)}
                    />
                    {convertedFiles[item.id] && (
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => downloadFile(item.id)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {item.type === 'merged' ? 'Descargar Archivo Unido' : 'Descargar HTML'}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              })()}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Conversión Rápida</h3>
            <p className="text-gray-600">Procesa tus archivos en segundos con nuestra tecnología optimizada.</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Múltiples Formatos</h3>
            <p className="text-gray-600">Soporta TXT, DOC, DOCX, CSV, XLSX, XLS, XML y más formatos.</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Seguro y Privado</h3>
            <p className="text-gray-600">Tus archivos se eliminan automáticamente después de 3 horas.</p>
          </div>
        </div>
      </main>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Footer */}
      <footer className="bg-gray-50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex justify-center space-x-6 mb-4">
              <a href="/privacy" className="text-sm text-gray-600 hover:text-gray-900">
                Política de Privacidad
              </a>
              <a href="/terms" className="text-sm text-gray-600 hover:text-gray-900">
                Términos y Condiciones
              </a>
            </div>
            <p className="text-gray-600">
              &copy; 2024 Doc to HTML Converter. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
      </div>
    </>
  )
}
