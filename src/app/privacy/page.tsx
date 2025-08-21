import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Política de privacidad del convertidor de documentos a HTML.',
}

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Política de Privacidad</h1>
      
      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Información que Recopilamos</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Recopilamos mínima información necesaria para proporcionar nuestro servicio:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Documentos que usted sube para conversión (eliminados automáticamente en 3 horas)</li>
            <li>Información de autenticación de Google (si elige registrarse)</li>
            <li>Direcciones IP para seguridad y prevención de abuso</li>
            <li>Datos de uso anónimos para mejorar el servicio</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Cómo Usamos su Información</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Usamos su información únicamente para:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Procesar y convertir sus documentos</li>
            <li>Proporcionar autenticación y gestión de cuenta</li>
            <li>Prevenir abuso y mantener la seguridad del servicio</li>
            <li>Mejorar la calidad del servicio</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Protección de Datos</h2>
          <p className="text-gray-600 leading-relaxed">
            Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Encriptación en tránsito y en reposo</li>
            <li>Eliminación automática de archivos</li>
            <li>Acceso restringido a sistemas</li>
            <li>Monitoreo de seguridad continuo</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Compartir Información</h2>
          <p className="text-gray-600 leading-relaxed">
            No vendemos, alquilamos ni compartimos su información personal con terceros, excepto:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Cuando sea requerido por ley</li>
            <li>Para proteger nuestros derechos legales</li>
            <li>Con proveedores de servicios esenciales (bajo estrictos acuerdos de confidencialidad)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Sus Derechos</h2>
          <p className="text-gray-600 leading-relaxed">
            Usted tiene derecho a:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>Acceder a su información personal</li>
            <li>Corregir información inexacta</li>
            <li>Eliminar su cuenta y datos asociados</li>
            <li>Retirar el consentimiento en cualquier momento</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Contacto</h2>
          <p className="text-gray-600 leading-relaxed">
            Para ejercer sus derechos o hacer preguntas sobre esta política, contáctenos a través de 
            nuestros canales oficiales.
          </p>
        </section>

        <p className="text-sm text-gray-500 mt-8">
          Última actualización: {new Date().toLocaleDateString('es-ES')}
        </p>
      </div>
    </div>
  )
}