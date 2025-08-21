import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FileConverter } from '@/lib/fileConverter'
import { SecurityUtils } from '@/lib/security'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ANONYMOUS_MAX_SIZE = 3 * 1024 * 1024 // 3MB
const ALLOWED_EXTENSIONS = ['.txt', '.doc', '.docx', '.csv', '.xlsx', '.xls', '.xml']




export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const formData = await request.formData()
    const file = formData.get('file') as File
    const batchId = formData.get('batchId') as string | null
    const isMerged = formData.get('isMerged') === 'true'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Verificar tamaño de archivo
    const maxSize = session?.user ? MAX_FILE_SIZE : ANONYMOUS_MAX_SIZE
    if (file.size > maxSize) {
      return NextResponse.json(
        { 
          error: `El archivo es demasiado grande. Máximo permitido: ${maxSize / (1024 * 1024)}MB`,
          requiresAuth: !session?.user
        },
        { status: 413 }
      )
    }

    // Sanitizar nombre de archivo
    const sanitizedFilename = SecurityUtils.sanitizeFilename(file.name)
    
    // Verificar extensión
    const extension = '.' + sanitizedFilename.split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        { error: `Formato no soportado. Permitidos: ${ALLOWED_EXTENSIONS.join(', ')}` },
        { status: 400 }
      )
    }

    // Convertir archivo a buffer para validaciones de seguridad
    const buffer = Buffer.from(await file.arrayBuffer())

    // Validar contenido del archivo
    const validation = SecurityUtils.validateFileContent(buffer, sanitizedFilename)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: `Archivo rechazado: ${validation.reason}` },
        { status: 400 }
      )
    }

    // Generar hash del archivo para evitar duplicados
    const fileHash = SecurityUtils.generateFileHash(buffer)

    // Crear registro en base de datos
    const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000) // 3 horas
    const convertedFile = await prisma.convertedFile.create({
      data: {
        originalFilename: sanitizedFilename,
        fileSize: file.size,
        status: 'PROCESSING',
        expiresAt,
        userId: (session?.user as any)?.id,
        batchId,
        isMerged,
      },
    })

    // Procesar archivo
    try {
      const result = await FileConverter.convertFile(buffer, sanitizedFilename)

      if (result.error) {
        await prisma.convertedFile.update({
          where: { id: convertedFile.id },
          data: {
            status: 'FAILED',
            error: result.error,
          },
        })

        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        )
      }

      // Actualizar registro con resultado
      await prisma.convertedFile.update({
        where: { id: convertedFile.id },
        data: {
          status: 'COMPLETED',
          htmlContent: result.html,
          cssContent: result.css,
        },
      })

      // El merge ahora se maneja por separado a través del endpoint /api/merge-batch
      const mergedFileId: string | null = null
      // if (batchId && isMerged) {
      //   mergedFileId = await processBatchMerge(batchId)
      // }

      // Si es parte de un batch merged, verificar si ya está el archivo merged
      let finalMergedFileId: string | null = mergedFileId
      if (batchId && isMerged && !mergedFileId) {
        // Buscar si ya existe un archivo merged para este batch
        const existingMerged = await prisma.convertedFile.findFirst({
          where: {
            batchId,
            originalFilename: { endsWith: '_merged.html' }
          }
        })
        if (existingMerged) {
          finalMergedFileId = existingMerged.id
        }
      }

      return NextResponse.json({
        id: convertedFile.id,
        status: 'COMPLETED',
        message: 'Archivo convertido exitosamente',
        mergedFileId: finalMergedFileId, // Incluir el ID del archivo merged si existe
        batchId,
        isMerged,
      })

    } catch (conversionError) {
      await prisma.convertedFile.update({
        where: { id: convertedFile.id },
        data: {
          status: 'FAILED',
          error: conversionError instanceof Error ? conversionError.message : 'Error de conversión',
        },
      })

      return NextResponse.json(
        { error: 'Error al procesar el archivo' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}