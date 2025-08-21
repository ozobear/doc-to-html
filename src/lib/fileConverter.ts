import mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import xml2js from 'xml2js'

export interface ConversionResult {
  html: string
  css: string
  error?: string
}

export class FileConverter {
  static async convertFile(file: Buffer, filename: string): Promise<ConversionResult> {
    const extension = filename.split('.').pop()?.toLowerCase()

    try {
      switch (extension) {
        case 'txt':
          return this.convertTxt(file)
        case 'doc':
        case 'docx':
          return this.convertDocx(file)
        case 'csv':
          return this.convertCsv(file)
        case 'xlsx':
        case 'xls':
          return this.convertExcel(file)
        case 'xml':
          return this.convertXml(file)
        default:
          throw new Error(`Formato de archivo no soportado: ${extension}`)
      }
    } catch (error) {
      return {
        html: '',
        css: '',
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
  }

  private static convertTxt(file: Buffer): ConversionResult {
    const text = file.toString('utf-8')
    const sections = text.split('\n\n').filter(p => p.trim().length > 0)
    
    const html = sections.map(section => {
      const lines = section.split('\n').map(line => line.trim()).filter(line => line.length > 0)
      
      // Detectar títulos (líneas cortas, en mayúsculas o que terminan con :)
      if (lines.length === 1) {
        const line = lines[0]
        if (line.length < 80 && (line === line.toUpperCase() || line.endsWith(':') || /^[A-Z]/.test(line))) {
          const level = line.endsWith(':') ? 2 : 1
          return `    <h${level}>${this.escapeHtml(line.replace(/:$/, ''))}</h${level}>`
        }
      }
      
      // Detectar listas (líneas que empiezan con -, *, •, números)
      const listItems = lines.filter(line => /^[-*•]\s/.test(line) || /^\d+\.\s/.test(line))
      if (listItems.length === lines.length && listItems.length > 1) {
        const isOrdered = /^\d+\.\s/.test(listItems[0])
        const tag = isOrdered ? 'ol' : 'ul'
        const items = listItems.map(item => {
          const content = item.replace(/^[-*•]\s/, '').replace(/^\d+\.\s/, '')
          return `      <li>${this.escapeHtml(content)}</li>`
        }).join('\n')
        return `    <${tag}>\n${items}\n    </${tag}>`
      }
      
      // Párrafo normal
      const content = lines.join('<br>')
      return `    <p>${this.escapeHtml(content)}</p>`
    }).join('\n')

    const css = `
      p {
        margin-bottom: 1.2rem;
        line-height: 1.7;
        color: #374151;
        text-align: justify;
      }
      h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #1f2937;
        margin: 2rem 0 1rem 0;
        border-bottom: 2px solid #e5e7eb;
        padding-bottom: 0.5rem;
      }
      h2 {
        font-size: 1.5rem;
        font-weight: 600;
        color: #374151;
        margin: 1.5rem 0 0.8rem 0;
      }
      ul, ol {
        margin: 1rem 0;
        padding-left: 2rem;
      }
      li {
        margin-bottom: 0.5rem;
        line-height: 1.6;
        color: #4b5563;
      }
      ul li {
        list-style-type: disc;
      }
      ol li {
        list-style-type: decimal;
      }
    `

    return { html, css }
  }

  private static async convertDocx(file: Buffer): Promise<ConversionResult> {
    try {
      const result = await mammoth.convertToHtml({ buffer: file })
      
      const css = `
        p { margin-bottom: 1rem; line-height: 1.6; }
        h1, h2, h3, h4, h5, h6 { 
          margin-top: 2rem; 
          margin-bottom: 1rem; 
          color: #2563eb;
        }
        table { 
          border-collapse: collapse; 
          width: 100%; 
          margin: 1rem 0;
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 8px; 
          text-align: left;
        }
        th { background-color: #f3f4f6; }
      `

      return {
        html: result.value,
        css,
        error: result.messages.length > 0 ? result.messages.join('; ') : undefined
      }
    } catch (error) {
      throw new Error(`Error al procesar DOCX: ${error}`)
    }
  }

  private static convertCsv(file: Buffer): ConversionResult {
    const text = file.toString('utf-8')
    const lines = text.split('\n').filter(line => line.trim().length > 0)
    
    if (lines.length === 0) {
      throw new Error('El archivo CSV está vacío')
    }

    const rows = lines.map(line => {
      // Simple CSV parsing - puede mejorarse para manejar comillas
      return line.split(',').map(cell => cell.trim())
    })

    const html = `
      <table>
        <thead>
          <tr>
            ${rows[0].map(cell => `<th>${this.escapeHtml(cell)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.slice(1).map(row => `
            <tr>
              ${row.map(cell => `<td>${this.escapeHtml(cell)}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `

    const css = `
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 1rem 0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      th, td {
        padding: 12px;
        text-align: left;
        border: 1px solid #e5e7eb;
      }
      th {
        background-color: #f9fafb;
        font-weight: 600;
        color: #374151;
      }
      tr:nth-child(even) {
        background-color: #f9fafb;
      }
      tr:hover {
        background-color: #f3f4f6;
      }
    `

    return { html, css }
  }

  private static convertExcel(file: Buffer): ConversionResult {
    try {
      const workbook = XLSX.read(file, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]
      
      if (jsonData.length === 0) {
        throw new Error('La hoja de Excel está vacía')
      }

      const html = `
        <h2>Hoja: ${sheetName}</h2>
        <table>
          <thead>
            <tr>
              ${jsonData[0].map((cell: any) => `<th>${this.escapeHtml(String(cell || ''))}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${jsonData.slice(1).map((row: any[]) => `
              <tr>
                ${row.map((cell: any) => `<td>${this.escapeHtml(String(cell || ''))}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `

      const css = `
        h2 {
          color: #1f2937;
          margin-bottom: 1rem;
          font-size: 1.5rem;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        th, td {
          padding: 12px;
          text-align: left;
          border: 1px solid #d1d5db;
        }
        th {
          background-color: #f3f4f6;
          font-weight: 600;
          color: #374151;
        }
        tr:nth-child(even) {
          background-color: #f9fafb;
        }
      `

      return { html, css }
    } catch (error) {
      throw new Error(`Error al procesar Excel: ${error}`)
    }
  }

  private static async convertXml(file: Buffer): Promise<ConversionResult> {
    try {
      const text = file.toString('utf-8')
      const parser = new xml2js.Parser()
      await parser.parseStringPromise(text) // Validar que es XML válido
      
      const html = `
        <div class="xml-container">
          <h2>Contenido XML</h2>
          <pre class="xml-content">${this.escapeHtml(text)}</pre>
        </div>
      `

      const css = `
        .xml-container {
          background-color: #f8fafc;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        h2 {
          color: #1e40af;
          margin-bottom: 1rem;
        }
        .xml-content {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1rem;
          border-radius: 6px;
          overflow-x: auto;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 14px;
          line-height: 1.4;
        }
      `

      return { html, css }
    } catch (error) {
      throw new Error(`Error al procesar XML: ${error}`)
    }
  }

  private static escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }
    return text.replace(/[&<>"']/g, (m) => map[m])
  }

  // Función para formatear HTML con indentación y saltos de línea
  static formatHtmlContent(html: string, baseIndent: string = '            '): string {
    if (!html) return ''
    
    // Elementos que deben tener salto de línea antes y después
    const blockElements = [
      'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
      'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'section', 'article', 'header', 'footer', 'nav', 'aside',
      'blockquote', 'pre', 'form', 'fieldset'
    ]
    
    
    let formatted = html
    
    // Agregar saltos de línea antes de elementos de bloque de apertura
    blockElements.forEach(tag => {
      formatted = formatted.replace(new RegExp(`<${tag}([^>]*)>`, 'gi'), `\n${baseIndent}<${tag}$1>`)
    })
    
    // Agregar saltos de línea después de elementos de bloque de cierre
    blockElements.forEach(tag => {
      formatted = formatted.replace(new RegExp(`</${tag}>`, 'gi'), `</${tag}>\n${baseIndent}`)
    })
    
    // Manejar <br> como salto de línea
    formatted = formatted.replace(/<br\s*\/?>/gi, '<br>\n' + baseIndent)
    
    // Limpiar múltiples saltos de línea consecutivos
    formatted = formatted.replace(/\n\s*\n\s*\n/g, '\n\n' + baseIndent)
    
    // Limpiar espacios en líneas vacías
    formatted = formatted.replace(/\n\s*\n/g, '\n\n')
    
    // Agregar indentación adicional para elementos anidados
    const lines = formatted.split('\n')
    let indentLevel = 0
    const indentSize = '    ' // 4 espacios por nivel
    
    const formattedLines = lines.map(line => {
      const trimmed = line.trim()
      if (!trimmed) return ''
      
      // Detectar etiquetas de cierre
      if (trimmed.match(/^<\/[^>]+>$/)) {
        indentLevel = Math.max(0, indentLevel - 1)
      }
      
      const currentIndent = baseIndent + indentSize.repeat(indentLevel)
      
      // Detectar etiquetas de apertura (que no sean auto-cerradas)
      if (trimmed.match(/^<[^\/][^>]*>$/) && !trimmed.match(/^<[^>]*\/>$/)) {
        const result = currentIndent + trimmed
        indentLevel++
        return result
      }
      
      return currentIndent + trimmed
    })
    
    return formattedLines.join('\n')
  }

  static formatHtml(content: string, title: string, css: string): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(title)}</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            position: relative;
        }
        .header {
            border-bottom: 3px solid #e5e7eb;
            padding-bottom: 24px;
            margin-bottom: 32px;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .header h1 {
            color: #1f2937;
            margin: 0;
            font-size: 2.5rem;
            font-weight: 700;
            letter-spacing: -0.025em;
        }
        .header p {
            color: #6b7280;
            margin: 8px 0 0 0;
            font-size: 1rem;
            font-weight: 500;
        }
        .content {
            color: #374151;
            font-size: 1rem;
            line-height: 1.75;
        }
        .footer {
            margin-top: 48px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #9ca3af;
            font-size: 0.875rem;
        }
        @media print {
            body { background: white; }
            .container { 
                box-shadow: none; 
                border: 1px solid #e5e7eb; 
            }
        }
        ${css}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📄 ${this.escapeHtml(title)}</h1>
            <p>Convertido con Doc to HTML - ${new Date().toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
        </div>
        <div class="content">
${content}
        </div>
        <div class="footer">
            <p>Generado automáticamente por Doc to HTML Converter</p>
        </div>
    </div>
</body>
</html>`
  }
}