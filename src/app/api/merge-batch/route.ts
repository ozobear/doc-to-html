import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { FileConverter } from '@/lib/fileConverter'

// Función helper para escapar HTML
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

// Función para crear contenido unificado
interface FileContent {
  id: string;
  originalFilename: string;
  htmlContent: string | null;
  cssContent: string | null;
  status: string;
  createdAt: Date;
  expiresAt: Date;
  userId: string | null;
}

function createMergedContent(files: FileContent[]) {
  console.log(`🔍 createMergedContent recibió ${files.length} archivos:`)
  files.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file.originalFilename} (${file.id})`)
    console.log(`     - HTML length: ${file.htmlContent?.length || 0}`)
    console.log(`     - CSS length: ${file.cssContent?.length || 0}`)
    console.log(`     - Status: ${file.status}`)
  })
  
  const tocEntries: string[] = []
  const contentSections: string[] = []
  const allCss: string[] = []

  files.forEach((file, index) => {
    const anchor = `section-${index + 1}`
    const filename = file.originalFilename.replace(/\.[^/.]+$/, '')
    
    console.log(`📝 Procesando archivo ${index + 1}: ${filename}`)
    
    // Agregar entrada al índice
    tocEntries.push(`        <li><a href="#${anchor}" class="toc-link">${escapeHtml(filename)}</a></li>`)
    
    // Agregar sección de contenido con formato mejorado
    const rawHtmlContent = file.htmlContent || '<p>Sin contenido</p>'
    const formattedHtmlContent = FileConverter.formatHtmlContent(rawHtmlContent, '                ')
    contentSections.push(`
        <section id="${anchor}" class="file-section">
            <div class="file-header">
                <h2>📄 ${escapeHtml(filename)}</h2>
                <div class="file-meta">
                    <span>Archivo ${index + 1} de ${files.length}</span>
                    <span>•</span>
                    <span>${new Date(file.createdAt).toLocaleDateString('es-ES')}</span>
                </div>
            </div>
            <div class="file-content">
${formattedHtmlContent}
            </div>
        </section>`)
    
    console.log(`✅ Sección ${index + 1} agregada. Content length: ${rawHtmlContent.length}`)
    
    // Recopilar CSS
    if (file.cssContent) {
      allCss.push(file.cssContent)
    }
  })

  const html = `
        <div class="merged-document">
            <header class="document-header">
                <h1>📁 Documentos Unidos</h1>
                <p>Colección de ${files.length} archivo${files.length > 1 ? 's' : ''} convertido${files.length > 1 ? 's' : ''}</p>
            </header>
            
            <nav class="table-of-contents">
                <h3>📋 Índice de Contenidos</h3>
                <ul>
${tocEntries.join('\n')}
                </ul>
            </nav>
            
            <main class="merged-content">
${contentSections.join('\n')}
            </main>
        </div>`

  const css = `
        .merged-document {
            max-width: none;
        }
        .document-header {
            text-align: center;
            padding: 2rem 0;
            border-bottom: 3px solid #e5e7eb;
            margin-bottom: 2rem;
        }
        .document-header h1 {
            font-size: 2.5rem;
            color: #1f2937;
            margin-bottom: 0.5rem;
        }
        .document-header p {
            color: #6b7280;
            font-size: 1.1rem;
        }
        .table-of-contents {
            background: #f8fafc;
            padding: 1.5rem;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            margin-bottom: 2rem;
        }
        .table-of-contents h3 {
            margin-top: 0;
            color: #374151;
            font-size: 1.2rem;
        }
        .table-of-contents ul {
            list-style: none;
            padding: 0;
            margin: 1rem 0 0 0;
        }
        .table-of-contents li {
            margin-bottom: 0.5rem;
        }
        .toc-link {
            color: #2563eb;
            text-decoration: none;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            display: block;
            transition: all 0.2s;
        }
        .toc-link:hover {
            background: #dbeafe;
            color: #1d4ed8;
            text-decoration: none;
        }
        .file-section {
            margin-bottom: 3rem;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
        }
        .file-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1.5rem 2rem;
        }
        .file-header h2 {
            margin: 0 0 0.5rem 0;
            font-size: 1.5rem;
        }
        .file-meta {
            font-size: 0.9rem;
            opacity: 0.9;
        }
        .file-meta span {
            margin-right: 0.5rem;
        }
        .file-content {
            padding: 2rem;
        }
        .merged-content {
            scroll-behavior: smooth;
        }
        
        /* Integrar CSS de archivos individuales */
        ${allCss.join('\n\n')}
        
        /* Responsive */
        @media (max-width: 768px) {
            .document-header h1 {
                font-size: 2rem;
            }
            .file-header {
                padding: 1rem 1.5rem;
            }
            .file-content {
                padding: 1.5rem;
            }
        }`

  console.log(`📋 Resultado del merge:`)
  console.log(`   - Entradas en índice: ${tocEntries.length}`)
  console.log(`   - Secciones de contenido: ${contentSections.length}`)
  console.log(`   - HTML total length: ${html.length}`)
  console.log(`   - CSS files combinados: ${allCss.length}`)

  return { html, css }
}

export async function POST(request: NextRequest) {
  try {
    const { batchId } = await request.json()

    if (!batchId) {
      return NextResponse.json(
        { error: 'batchId requerido' },
        { status: 400 }
      )
    }

    console.log(`🔄 Procesando merge manual para batch: ${batchId}`)
    
    // Obtener todos los archivos del batch (que son parte del merge)
    const allBatchFiles = await prisma.convertedFile.findMany({
      where: {
        batchId,
        NOT: {
          originalFilename: { endsWith: '_merged.html' }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    console.log(`📁 Archivos encontrados en batch ${batchId}:`, allBatchFiles.map(f => ({ 
      id: f.id, 
      filename: f.originalFilename, 
      status: f.status,
      isMerged: f.isMerged 
    })))

    // Obtener solo los completados que están marcados para merge
    const completedFiles = allBatchFiles.filter(file => file.status === 'COMPLETED' && file.isMerged)
    
    console.log(`✅ Archivos completados para merge:`, completedFiles.length)
    
    if (completedFiles.length === 0) {
      return NextResponse.json(
        { error: 'No hay archivos completados para unir' },
        { status: 400 }
      )
    }

    // Verificar si ya existe un archivo merged para este batch
    const existingMerged = await prisma.convertedFile.findFirst({
      where: {
        batchId,
        originalFilename: { endsWith: '_merged.html' }
      }
    })

    if (existingMerged) {
      console.log(`♻️ Archivo merged ya existe: ${existingMerged.id}`)
      return NextResponse.json({
        id: existingMerged.id,
        message: 'Archivo merged ya existe'
      })
    }

    console.log(`🔨 Creando contenido unificado con ${completedFiles.length} archivos`)
    
    // Crear el contenido unificado
    const mergedContent = createMergedContent(completedFiles)
    
    // Crear un nuevo registro para el archivo unificado
    const mergedFile = await prisma.convertedFile.create({
      data: {
        originalFilename: `${completedFiles.length}_archivos_unidos_merged.html`,
        fileSize: mergedContent.html.length,
        status: 'COMPLETED',
        htmlContent: mergedContent.html,
        cssContent: mergedContent.css,
        expiresAt: completedFiles[0].expiresAt,
        userId: completedFiles[0].userId,
        batchId,
        isMerged: false, // El archivo merged no es parte del merge
      },
    })

    console.log(`🎉 Archivo unificado creado: ${mergedFile.id} para batch ${batchId}`)
    
    return NextResponse.json({
      id: mergedFile.id,
      message: 'Archivo merged creado exitosamente'
    })

  } catch (error) {
    console.error('❌ Error al procesar merge de batch:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}