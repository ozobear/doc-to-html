import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  description: 'Términos y condiciones de uso del convertidor de documentos a HTML.',
}

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Términos y Condiciones</h1>
      
      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Aceptación de Términos</h2>
          <p className="text-gray-600 leading-relaxed">
            Al usar nuestro servicio de conversión de documentos, usted acepta estos términos y condiciones.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Uso del Servicio</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Nuestro servicio permite convertir documentos a formato HTML. El uso está sujeto a las siguientes limitaciones:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Archivos de máximo 10MB para usuarios registrados</li>
            <li>Archivos de máximo 3MB para usuarios anónimos</li>
            <li>Los archivos se eliminan automáticamente después de 3 horas</li>
            <li>Formatos soportados: Word (.doc, .docx), Excel (.xls, .xlsx), PDF, TXT, CSV, XML</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Privacidad y Seguridad</h2>
          <p className="text-gray-600 leading-relaxed">
            Sus documentos son procesados de forma segura y se eliminan automáticamente. No almacenamos 
            ni compartimos el contenido de sus documentos con terceros.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Limitaciones de Responsabilidad</h2>
          <p className="text-gray-600 leading-relaxed">
            El servicio se proporciona &quot;tal como está&quot;. No garantizamos la perfecta conversión de todos 
            los documentos ni nos hacemos responsables por pérdida de datos.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Contacto</h2>
          <p className="text-gray-600 leading-relaxed">
            Para preguntas sobre estos términos, contacte con nosotros a través de nuestros canales oficiales.
          </p>
        </section>
      </div>
    </div>
  )
}