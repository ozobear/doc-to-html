import crypto from 'crypto'

export class SecurityUtils {
  // Validar que el archivo no contenga contenido malicioso
  static validateFileContent(buffer: Buffer, filename: string): { isValid: boolean; reason?: string } {
    // Verificar magic numbers (firmas de archivo)
    const magicNumbers = {
      pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
      docx: [0x50, 0x4B, 0x03, 0x04], // PK (ZIP)
      xlsx: [0x50, 0x4B, 0x03, 0x04], // PK (ZIP)
      doc: [0xD0, 0xCF, 0x11, 0xE0], // OLE2
      txt: null, // No magic number for plain text
      csv: null, // No magic number for CSV
      xml: [0x3C, 0x3F, 0x78, 0x6D], // <?xm
    }

    const extension = filename.split('.').pop()?.toLowerCase()
    if (!extension) {
      return { isValid: false, reason: 'Archivo sin extensión' }
    }

    const expectedMagic = magicNumbers[extension as keyof typeof magicNumbers]
    if (expectedMagic) {
      const fileMagic = Array.from(buffer.subarray(0, expectedMagic.length))
      if (!expectedMagic.every((byte, index) => byte === fileMagic[index])) {
        return { isValid: false, reason: 'Tipo de archivo no coincide con la extensión' }
      }
    }

    // Verificar tamaño de archivo razonable
    if (buffer.length > 50 * 1024 * 1024) { // 50MB máximo
      return { isValid: false, reason: 'Archivo demasiado grande' }
    }

    // Para archivos de texto, verificar que no contengan scripts maliciosos
    if (['txt', 'csv', 'xml'].includes(extension)) {
      const content = buffer.toString('utf8', 0, Math.min(buffer.length, 10000)) // Primeros 10KB
      const dangerousPatterns = [
        /<script[^>]*>/i,
        /javascript:/i,
        /vbscript:/i,
        /on\w+\s*=/i, // onclick, onload, etc.
        /<iframe[^>]*>/i,
        /<object[^>]*>/i,
        /<embed[^>]*>/i,
      ]

      for (const pattern of dangerousPatterns) {
        if (pattern.test(content)) {
          return { isValid: false, reason: 'Contenido potencialmente malicioso detectado' }
        }
      }
    }

    return { isValid: true }
  }

  // Generar hash del archivo para detección de duplicados
  static generateFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex')
  }

  // Sanitizar nombre de archivo
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^\w\-_.]/g, '_') // Reemplazar caracteres especiales
      .replace(/_{2,}/g, '_') // Reemplazar múltiples guiones bajos
      .substring(0, 255) // Limitar longitud
  }

  // Validar entrada de usuario
  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remover caracteres peligrosos
      .substring(0, 1000) // Limitar longitud
  }

  // Verificar si una IP está en lista negra (ejemplo básico)
  static isBlacklistedIP(ip: string): boolean {
    const blacklist: string[] = [
      // Agregar IPs problemáticas aquí
    ]
    return blacklist.includes(ip)
  }

  // Generar token CSRF
  static generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  // Validar token CSRF
  static validateCSRFToken(token: string, sessionToken: string): boolean {
    return crypto.timingSafeEqual(
      Buffer.from(token, 'hex'),
      Buffer.from(sessionToken, 'hex')
    )
  }
}