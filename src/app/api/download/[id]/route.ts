import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FileConverter } from '@/lib/fileConverter'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const file = await prisma.convertedFile.findUnique({
      where: { id },
      select: {
        id: true,
        originalFilename: true,
        status: true,
        htmlContent: true,
        cssContent: true,
        expiresAt: true,
      },
    })

    if (!file) {
      return NextResponse.json(
        { error: 'Archivo no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si ha expirado
    if (new Date() > file.expiresAt) {
      await prisma.convertedFile.delete({
        where: { id },
      })
      return NextResponse.json(
        { error: 'Archivo expirado y eliminado' },
        { status: 404 }
      )
    }

    if (file.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Conversión no completada' },
        { status: 400 }
      )
    }

    // Aplicar formato al contenido HTML primero
    const rawContent = file.htmlContent || ''
    const formattedContent = FileConverter.formatHtmlContent(rawContent, '            ')
    
    // Generar HTML completo con formateo mejorado
    const fullHtml = FileConverter.formatHtml(
      formattedContent,
      file.originalFilename,
      file.cssContent || ''
    )

    const filename = file.originalFilename.replace(/\.[^/.]+$/, '') + '.html'

    return NextResponse.json({
      html: fullHtml,
      filename: filename,
    })

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}