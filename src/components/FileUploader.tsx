'use client'

import React, { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface FileUploaderProps {
  onUploadSuccess: (fileId: string, batchInfo?: { batchId?: string, mergedFileId?: string, isMerged?: boolean }) => void
  onUploadError: (error: string) => void
  onAuthRequired?: () => void
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  onUploadSuccess, 
  onUploadError, 
  onAuthRequired 
}) => {
  const { data: session } = useSession()
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [mergeFiles, setMergeFiles] = useState(false)

  const allowedTypes = ['.txt', '.doc', '.docx', '.csv', '.xlsx', '.xls', '.xml']

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files)
      setSelectedFiles(files)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setSelectedFiles(files)
    }
  }

  const uploadFile = async (file: File, batchId?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    if (batchId) {
      formData.append('batchId', batchId)
    }
    if (mergeFiles && selectedFiles.length > 1) {
      formData.append('isMerged', 'true')
    }

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.requiresAuth) {
          const authError = new Error(data.error || 'Autenticación requerida')
          ;(authError as any).requiresAuth = true
          throw authError
        }
        throw new Error(data.error || 'Error al subir archivo')
      }

      return data
    } catch (error) {
      throw error
    }
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    setUploading(true)
    
    try {
      // Calcular el peso total si es un batch merged
      const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0)
      const maxSize = session?.user ? 10 * 1024 * 1024 : 3 * 1024 * 1024 // 10MB o 3MB
      
      // Si es merge y excede el límite, requerir autenticación
      if (mergeFiles && selectedFiles.length > 1 && totalSize > maxSize) {
        if (!session?.user) {
          onUploadError(`Los archivos unidos (${formatFileSize(totalSize)}) exceden el límite de 3MB. Inicia sesión para subir hasta 10MB.`)
          if (onAuthRequired) {
            onAuthRequired()
          }
          return
        } else if (totalSize > 10 * 1024 * 1024) {
          onUploadError(`Los archivos unidos (${formatFileSize(totalSize)}) exceden el límite máximo de 10MB.`)
          return
        }
      }
      
      // Generar un batchId único si hay múltiples archivos
      const batchId = selectedFiles.length > 1 ? `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : undefined
      const uploadedFileIds: string[] = []
      
      for (const file of selectedFiles) {
        // Validar tipo de archivo
        const extension = '.' + file.name.split('.').pop()?.toLowerCase()
        if (!allowedTypes.includes(extension)) {
          onUploadError(`Tipo de archivo no soportado: ${file.name}`)
          continue
        }

        // Validar tamaño
        const absoluteMaxSize = 10 * 1024 * 1024 // 10MB
        if (file.size > absoluteMaxSize) {
          onUploadError(`El archivo "${file.name}" (${formatFileSize(file.size)}) excede el límite máximo de 10MB.`)
          continue
        }

        try {
          const result = await uploadFile(file, batchId)
          if (result) {
            uploadedFileIds.push(result.id)
            onUploadSuccess(result.id, {
              batchId: result.batchId,
              mergedFileId: result.mergedFileId,
              isMerged: result.isMerged
            })
          }
        } catch (fileError) {
          if (fileError instanceof Error && (fileError as any).requiresAuth) {
            onUploadError(`${fileError.message} - Se requiere autenticación para archivos grandes.`)
            if (onAuthRequired) {
              onAuthRequired()
            }
            return
          }
          
          const errorMessage = fileError instanceof Error ? fileError.message : 'Error desconocido'
          onUploadError(`Error al subir "${file.name}": ${errorMessage}`)
        }
      }
      
      // Si es merge y hay archivos subidos exitosamente, procesar la unión
      if (mergeFiles && selectedFiles.length > 1 && batchId && uploadedFileIds.length > 1) {
        try {
          console.log(`🔄 Iniciando merge para batch ${batchId} con ${uploadedFileIds.length} archivos`)
          
          // Esperar un poco para asegurar que todos los archivos estén procesados
          await new Promise(resolve => setTimeout(resolve, 500))
          
          const mergeResponse = await fetch('/api/merge-batch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ batchId }),
          })

          const mergeData = await mergeResponse.json()

          if (mergeResponse.ok) {
            console.log(`✅ Merge completado: ${mergeData.id}`)
            // Notificar que el archivo merged está listo
            onUploadSuccess(mergeData.id, {
              batchId,
              mergedFileId: mergeData.id,
              isMerged: false // Este es el archivo merged final
            })
          } else {
            console.error('❌ Error en merge:', mergeData.error)
            onUploadError(`Error al unir archivos: ${mergeData.error}`)
          }
        } catch (mergeError) {
          console.error('❌ Error al procesar merge:', mergeError)
          onUploadError('Error al unir archivos')
        }
      }
      
      setSelectedFiles([])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      onUploadError(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="w-full">
      {/* Área de arrastrar y soltar */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-16 text-center transition-all duration-300 ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          multiple
          accept={allowedTypes.join(',')}
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />
        
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Arrastra tus archivos aquí
            </h3>
            <p className="text-gray-600 mb-4">
              o haz clic para seleccionar archivos
            </p>
            
            <button
              type="button"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              SELECCIONAR ARCHIVOS
            </button>
            
            <div className="mt-6 text-sm text-gray-500">
              <p className="mb-2">Formatos soportados:</p>
              <div className="flex flex-wrap justify-center gap-1">
                {allowedTypes.map((type, index) => (
                  <span key={type}>
                    {type.replace('.', '').toUpperCase()}
                    {index < allowedTypes.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
              {session ? (
                <div className="mt-2 flex items-center justify-center text-green-600">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Máximo 10MB por archivo (usuario registrado)</span>
                </div>
              ) : (
                <p className="mt-2">Máximo 3MB por archivo (sin registro)</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de archivos seleccionados */}
      {selectedFiles.length > 0 && (
        <div className="mt-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Archivos seleccionados ({selectedFiles.length})
            </h4>
            
            <div className="space-y-2">
              {selectedFiles.map((file, index) => {
                const absoluteMaxSize = 10 * 1024 * 1024 // 10MB límite absoluto
                const authRequiredSize = 3 * 1024 * 1024 // 3MB - requiere auth
                const extension = '.' + (file.name.split('.').pop()?.toLowerCase() || '')
                const isUnsupportedType = !allowedTypes.includes(extension)
                const isOversizedAbsolute = file.size > absoluteMaxSize
                const requiresAuth = !session && file.size > authRequiredSize && file.size <= absoluteMaxSize
                const hasError = isOversizedAbsolute || isUnsupportedType
                
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      hasError 
                        ? 'bg-red-50 border-red-200' 
                        : requiresAuth
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        hasError 
                          ? 'bg-red-100' 
                          : requiresAuth 
                            ? 'bg-amber-100' 
                            : 'bg-blue-100'
                      }`}>
                        {hasError ? (
                          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        ) : requiresAuth ? (
                          <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium truncate ${
                          hasError 
                            ? 'text-red-900' 
                            : requiresAuth 
                              ? 'text-amber-900' 
                              : 'text-gray-900'
                        }`}>
                          {file.name}
                        </p>
                        <p className={`text-xs ${
                          hasError 
                            ? 'text-red-600' 
                            : requiresAuth 
                              ? 'text-amber-600' 
                              : 'text-gray-500'
                        }`}>
                          {formatFileSize(file.size)} • {file.name.split('.').pop()?.toUpperCase()}
                          {requiresAuth && (
                            <span className="ml-2 text-amber-600 font-medium">
                              • Requiere iniciar sesión
                            </span>
                          )}
                          {isOversizedAbsolute && (
                            <span className="ml-2 text-red-600 font-medium">
                              • Excede 10MB
                            </span>
                          )}
                          {isUnsupportedType && (
                            <span className="ml-2 text-red-600 font-medium">
                              • Formato no soportado
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded"
                      disabled={uploading}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Opción para unir archivos cuando hay múltiples */}
          {selectedFiles.length > 1 && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-3">
                🔗 Opciones para múltiples archivos
              </h4>
              
              <div className="space-y-3">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="mergeOption"
                    checked={!mergeFiles}
                    onChange={() => setMergeFiles(false)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div>
                    <div className="font-medium text-blue-900">Procesar por separado</div>
                    <div className="text-sm text-blue-700">
                      Cada archivo se convertirá individualmente. Obtendrás {selectedFiles.length} archivos HTML separados.
                    </div>
                  </div>
                </label>
                
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="mergeOption"
                    checked={mergeFiles}
                    onChange={() => setMergeFiles(true)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div>
                    <div className="font-medium text-blue-900">Unir en un solo archivo</div>
                    <div className="text-sm text-blue-700">
                      Todos los archivos se combinarán en un único archivo HTML con índice y navegación.
                    </div>
                    {mergeFiles && (() => {
                      const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0)
                      const maxSize = session?.user ? 10 * 1024 * 1024 : 3 * 1024 * 1024
                      const exceeds = totalSize > maxSize
                      const exceedsAbsolute = totalSize > 10 * 1024 * 1024
                      
                      return (
                        <div className={`mt-2 text-xs p-2 rounded ${
                          exceedsAbsolute 
                            ? 'bg-red-100 text-red-700' 
                            : exceeds 
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-green-100 text-green-700'
                        }`}>
                          <div className="font-medium">
                            Peso total: {formatFileSize(totalSize)}
                          </div>
                          {exceedsAbsolute ? (
                            <div>❌ Excede el límite máximo de 10MB</div>
                          ) : exceeds ? (
                            <div>⚠️ Requiere iniciar sesión (límite sin registro: 3MB)</div>
                          ) : (
                            <div>✅ Dentro del límite permitido</div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                </label>
              </div>
            </div>
          )}
          
          <button
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0 || (() => {
              if (mergeFiles && selectedFiles.length > 1) {
                const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0)
                return totalSize > 10 * 1024 * 1024 // Deshabilitar si excede 10MB absoluto
              }
              return false
            })()}
            className={`w-full py-4 px-6 rounded-lg font-semibold text-base transition-all duration-200 ${
              uploading || (() => {
                if (mergeFiles && selectedFiles.length > 1) {
                  const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0)
                  return totalSize > 10 * 1024 * 1024
                }
                return false
              })()
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
            }`}
          >
            {uploading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Convirtiendo archivos...</span>
              </div>
            ) : (
              <span>
                {mergeFiles && selectedFiles.length > 1 
                  ? `Unir ${selectedFiles.length} archivos en uno` 
                  : `Convertir ${selectedFiles.length} archivo${selectedFiles.length > 1 ? 's' : ''}`
                }
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export default FileUploader