<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-12">
        <router-link to="/login" class="inline-flex items-center gap-2 text-violet-600 hover:text-violet-700 mb-6">
          <ArrowLeftIcon class="w-4 h-4" />
          Volver al inicio
        </router-link>
        <h1 class="text-4xl font-bold text-slate-800 mb-4">Política de Privacidad</h1>
        <p class="text-slate-500">Última actualización: {{ lastUpdated }}</p>
      </div>

      <!-- Content -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 md:p-12 space-y-8">
        
        <section>
          <h2 class="text-2xl font-semibold text-slate-800 mb-4">1. Información que Recopilamos</h2>
          <p class="text-slate-600 leading-relaxed mb-4">
            Agentify Chat recopila la siguiente información para proporcionar nuestros servicios:
          </p>
          <ul class="list-disc list-inside text-slate-600 space-y-2 ml-4">
            <li><strong>Información de cuenta:</strong> Nombre, correo electrónico, y datos de la organización.</li>
            <li><strong>Datos de integración:</strong> Tokens de acceso de Facebook, Instagram y WhatsApp Business para permitir la comunicación con tus clientes.</li>
            <li><strong>Mensajes:</strong> Contenido de las conversaciones entre tu negocio y tus clientes a través de las plataformas conectadas.</li>
            <li><strong>Información de clientes:</strong> Nombres, números de teléfono y datos de contacto de los leads generados.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-semibold text-slate-800 mb-4">2. Cómo Usamos la Información</h2>
          <p class="text-slate-600 leading-relaxed mb-4">
            Utilizamos la información recopilada para:
          </p>
          <ul class="list-disc list-inside text-slate-600 space-y-2 ml-4">
            <li>Procesar y responder mensajes de tus clientes</li>
            <li>Proporcionar respuestas automatizadas mediante inteligencia artificial</li>
            <li>Gestionar leads y oportunidades de venta</li>
            <li>Programar citas y recordatorios</li>
            <li>Mejorar y personalizar nuestros servicios</li>
            <li>Enviar notificaciones relacionadas con el servicio</li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-semibold text-slate-800 mb-4">3. Integraciones con Terceros</h2>
          <p class="text-slate-600 leading-relaxed mb-4">
            Agentify Chat se integra con las siguientes plataformas:
          </p>
          <ul class="list-disc list-inside text-slate-600 space-y-2 ml-4">
            <li><strong>Meta (Facebook e Instagram):</strong> Para recibir y enviar mensajes a través de Facebook Messenger e Instagram Direct.</li>
            <li><strong>WhatsApp Business:</strong> Para comunicación a través de WhatsApp.</li>
            <li><strong>Google Calendar:</strong> Para agendar citas automáticamente.</li>
            <li><strong>OpenAI:</strong> Para procesamiento de lenguaje natural y respuestas automatizadas.</li>
          </ul>
          <p class="text-slate-600 leading-relaxed mt-4">
            Al conectar estas plataformas, aceptas sus respectivas políticas de privacidad y términos de servicio.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-semibold text-slate-800 mb-4">4. Seguridad de los Datos</h2>
          <p class="text-slate-600 leading-relaxed">
            Implementamos medidas de seguridad técnicas y organizativas para proteger tu información, incluyendo:
          </p>
          <ul class="list-disc list-inside text-slate-600 space-y-2 ml-4 mt-4">
            <li>Encriptación de datos sensibles y tokens de acceso</li>
            <li>Conexiones seguras mediante HTTPS/TLS</li>
            <li>Acceso restringido basado en roles</li>
            <li>Monitoreo y registro de actividades</li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-semibold text-slate-800 mb-4">5. Retención de Datos</h2>
          <p class="text-slate-600 leading-relaxed">
            Conservamos tu información mientras mantengas una cuenta activa con nosotros. Puedes solicitar la eliminación de tus datos en cualquier momento contactándonos. Los datos de mensajes pueden conservarse según los requisitos legales aplicables.
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-semibold text-slate-800 mb-4">6. Tus Derechos</h2>
          <p class="text-slate-600 leading-relaxed mb-4">
            Tienes derecho a:
          </p>
          <ul class="list-disc list-inside text-slate-600 space-y-2 ml-4">
            <li>Acceder a tu información personal</li>
            <li>Corregir datos inexactos</li>
            <li>Solicitar la eliminación de tus datos</li>
            <li>Revocar el acceso a las integraciones en cualquier momento</li>
            <li>Exportar tus datos</li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-semibold text-slate-800 mb-4">7. Uso de Datos de Facebook</h2>
          <p class="text-slate-600 leading-relaxed">
            Cuando conectas tu página de Facebook o cuenta de Instagram, obtenemos acceso limitado a:
          </p>
          <ul class="list-disc list-inside text-slate-600 space-y-2 ml-4 mt-4">
            <li>Mensajes recibidos en tu página o cuenta business</li>
            <li>Información básica de tu página</li>
            <li>Perfiles públicos de usuarios que te contactan</li>
          </ul>
          <p class="text-slate-600 leading-relaxed mt-4">
            <strong>No vendemos ni compartimos esta información con terceros</strong> excepto según sea necesario para proporcionar el servicio (por ejemplo, procesamiento de IA para respuestas automáticas).
          </p>
        </section>

        <section>
          <h2 class="text-2xl font-semibold text-slate-800 mb-4">8. Eliminación de Datos</h2>
          <p class="text-slate-600 leading-relaxed">
            Puedes solicitar la eliminación de todos tus datos contactándonos. También puedes:
          </p>
          <ul class="list-disc list-inside text-slate-600 space-y-2 ml-4 mt-4">
            <li>Desconectar integraciones desde la configuración de tu cuenta</li>
            <li>Revocar permisos directamente desde Facebook, Instagram o WhatsApp</li>
            <li>Eliminar tu cuenta completamente</li>
          </ul>
        </section>

        <section>
          <h2 class="text-2xl font-semibold text-slate-800 mb-4">9. Contacto</h2>
          <p class="text-slate-600 leading-relaxed">
            Si tienes preguntas sobre esta política de privacidad o deseas ejercer tus derechos, contáctanos en:
          </p>
          <div class="mt-4 p-4 bg-slate-50 rounded-xl">
            <p class="text-slate-700"><strong>Email:</strong> contacto@kogniastudio.com</p>
            <p class="text-slate-700"><strong>Sitio web:</strong> <a href="https://kogniastudio.com" target="_blank" class="text-violet-600 hover:underline">kogniastudio.com</a></p>
          </div>
        </section>

        <section>
          <h2 class="text-2xl font-semibold text-slate-800 mb-4">10. Cambios a Esta Política</h2>
          <p class="text-slate-600 leading-relaxed">
            Podemos actualizar esta política de privacidad ocasionalmente. Te notificaremos sobre cambios significativos mediante correo electrónico o un aviso en nuestro servicio.
          </p>
        </section>

      </div>

      <!-- Footer -->
      <div class="text-center mt-8 text-slate-500 text-sm">
        <p>© {{ currentYear }} Kognia Studio. Todos los derechos reservados.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowLeft as ArrowLeftIcon } from 'lucide-vue-next'

const lastUpdated = computed(() => {
  return new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const currentYear = computed(() => new Date().getFullYear())
</script>
