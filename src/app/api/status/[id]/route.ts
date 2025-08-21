import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
        error: true,
        expiresAt: true,
        createdAt: true,
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

    return NextResponse.json({
      id: file.id,
      filename: file.originalFilename,
      status: file.status,
      error: file.error,
      expiresAt: file.expiresAt,
      createdAt: file.createdAt,
    })

  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}