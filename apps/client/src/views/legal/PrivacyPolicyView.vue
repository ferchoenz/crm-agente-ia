<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-slate-100 py-12 px-4">
    <div class="max-w-4xl mx-auto">
      <!-- Header with Logo -->
      <header class="text-center mb-12">
        <router-link to="/login" class="inline-flex items-center gap-2 text-violet-600 hover:text-violet-700 transition-colors mb-8">
          <ArrowLeftIcon class="w-4 h-4" />
          <span>Volver al inicio</span>
        </router-link>
        
        <div class="mb-6">
          <img src="/logo-kognia.png" alt="Kognia Studio" class="h-20 mx-auto mb-4" />
        </div>
        
        <h1 class="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-4">
          Política de Privacidad
        </h1>
        <p class="text-slate-500 text-lg">Agentify Chat — Un producto de <strong class="text-violet-600">Kognia Studio</strong></p>
        <p class="text-slate-400 text-sm mt-2">Última actualización: {{ lastUpdated }}</p>
      </header>

      <!-- Main Content -->
      <main class="space-y-6">
        
        <!-- Intro Card -->
        <div class="bg-gradient-to-r from-violet-500 to-purple-600 rounded-3xl p-8 text-white shadow-xl shadow-violet-500/20">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ShieldCheckIcon class="w-5 h-5" />
            </div>
            <span class="font-semibold">Tu privacidad es nuestra prioridad</span>
          </div>
          <p class="text-white/90 leading-relaxed">
            <strong>Agentify Chat</strong> es un producto desarrollado y operado por <strong>Kognia Studio</strong>. 
            Esta política describe cómo recopilamos, usamos y protegemos tu información.
          </p>
        </div>

        <!-- Content Sections -->
        <div class="bg-white/70 backdrop-blur-sm rounded-3xl border border-slate-200/50 shadow-lg shadow-slate-200/50 p-8 md:p-12 space-y-10">
          
          <section>
            <div class="flex items-center gap-4 mb-4">
              <span class="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center font-bold text-sm">01</span>
              <h2 class="text-2xl font-bold text-slate-800">Información que Recopilamos</h2>
            </div>
            <p class="text-slate-600 leading-relaxed mb-4">
              Agentify Chat recopila la siguiente información para proporcionar nuestros servicios:
            </p>
            <ul class="space-y-3">
              <li class="flex items-start gap-3 text-slate-600">
                <span class="w-2 h-2 bg-violet-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong class="text-slate-800">Información de cuenta:</strong> Nombre, correo electrónico, y datos de la organización.</span>
              </li>
              <li class="flex items-start gap-3 text-slate-600">
                <span class="w-2 h-2 bg-violet-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong class="text-slate-800">Datos de integración:</strong> Tokens de acceso de Facebook, Instagram y WhatsApp Business.</span>
              </li>
              <li class="flex items-start gap-3 text-slate-600">
                <span class="w-2 h-2 bg-violet-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong class="text-slate-800">Mensajes:</strong> Contenido de las conversaciones entre tu negocio y tus clientes.</span>
              </li>
              <li class="flex items-start gap-3 text-slate-600">
                <span class="w-2 h-2 bg-violet-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong class="text-slate-800">Información de clientes:</strong> Nombres, números de teléfono y datos de contacto de leads.</span>
              </li>
            </ul>
          </section>

          <div class="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

          <section>
            <div class="flex items-center gap-4 mb-4">
              <span class="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center font-bold text-sm">02</span>
              <h2 class="text-2xl font-bold text-slate-800">Cómo Usamos la Información</h2>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl text-slate-600">
                <CheckCircleIcon class="w-5 h-5 text-emerald-500" />
                <span>Procesar y responder mensajes</span>
              </div>
              <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl text-slate-600">
                <CheckCircleIcon class="w-5 h-5 text-emerald-500" />
                <span>Respuestas automatizadas con IA</span>
              </div>
              <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl text-slate-600">
                <CheckCircleIcon class="w-5 h-5 text-emerald-500" />
                <span>Gestionar leads y ventas</span>
              </div>
              <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl text-slate-600">
                <CheckCircleIcon class="w-5 h-5 text-emerald-500" />
                <span>Programar citas y recordatorios</span>
              </div>
              <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl text-slate-600">
                <CheckCircleIcon class="w-5 h-5 text-emerald-500" />
                <span>Mejorar nuestros servicios</span>
              </div>
              <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl text-slate-600">
                <CheckCircleIcon class="w-5 h-5 text-emerald-500" />
                <span>Notificaciones del servicio</span>
              </div>
            </div>
          </section>

          <div class="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

          <section>
            <div class="flex items-center gap-4 mb-4">
              <span class="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center font-bold text-sm">03</span>
              <h2 class="text-2xl font-bold text-slate-800">Integraciones con Terceros</h2>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div class="text-center p-4 bg-slate-50 rounded-2xl">
                <div class="w-12 h-12 bg-blue-500 rounded-xl mx-auto mb-2"></div>
                <span class="text-sm text-slate-600">Meta</span>
              </div>
              <div class="text-center p-4 bg-slate-50 rounded-2xl">
                <div class="w-12 h-12 bg-emerald-500 rounded-xl mx-auto mb-2"></div>
                <span class="text-sm text-slate-600">WhatsApp</span>
              </div>
              <div class="text-center p-4 bg-slate-50 rounded-2xl">
                <div class="w-12 h-12 bg-sky-500 rounded-xl mx-auto mb-2"></div>
                <span class="text-sm text-slate-600">Google</span>
              </div>
              <div class="text-center p-4 bg-slate-50 rounded-2xl">
                <div class="w-12 h-12 bg-teal-600 rounded-xl mx-auto mb-2"></div>
                <span class="text-sm text-slate-600">OpenAI</span>
              </div>
            </div>
            <p class="text-slate-500 text-sm">Al conectar estas plataformas, aceptas sus políticas de privacidad.</p>
          </section>

          <div class="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

          <section>
            <div class="flex items-center gap-4 mb-4">
              <span class="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center font-bold text-sm">04</span>
              <h2 class="text-2xl font-bold text-slate-800">Seguridad de los Datos</h2>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="flex flex-col items-center gap-2 p-4 bg-violet-50 rounded-2xl">
                <LockIcon class="w-6 h-6 text-violet-600" />
                <span class="text-sm text-slate-600 text-center">Encriptación</span>
              </div>
              <div class="flex flex-col items-center gap-2 p-4 bg-violet-50 rounded-2xl">
                <ShieldIcon class="w-6 h-6 text-violet-600" />
                <span class="text-sm text-slate-600 text-center">HTTPS/TLS</span>
              </div>
              <div class="flex flex-col items-center gap-2 p-4 bg-violet-50 rounded-2xl">
                <KeyIcon class="w-6 h-6 text-violet-600" />
                <span class="text-sm text-slate-600 text-center">Acceso por roles</span>
              </div>
              <div class="flex flex-col items-center gap-2 p-4 bg-violet-50 rounded-2xl">
                <EyeIcon class="w-6 h-6 text-violet-600" />
                <span class="text-sm text-slate-600 text-center">Monitoreo</span>
              </div>
            </div>
          </section>

          <div class="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

          <section>
            <div class="flex items-center gap-4 mb-4">
              <span class="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center font-bold text-sm">05</span>
              <h2 class="text-2xl font-bold text-slate-800">Retención de Datos</h2>
            </div>
            <p class="text-slate-600 leading-relaxed">
              Conservamos tu información mientras mantengas una cuenta activa. Puedes solicitar la eliminación de tus datos en cualquier momento.
            </p>
          </section>

          <div class="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

          <section>
            <div class="flex items-center gap-4 mb-4">
              <span class="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center font-bold text-sm">06</span>
              <h2 class="text-2xl font-bold text-slate-800">Tus Derechos</h2>
            </div>
            <ul class="space-y-2">
              <li class="flex items-center gap-3 text-slate-600">
                <span class="w-2 h-2 bg-violet-500 rounded-full"></span>
                Acceder a tu información personal
              </li>
              <li class="flex items-center gap-3 text-slate-600">
                <span class="w-2 h-2 bg-violet-500 rounded-full"></span>
                Corregir datos inexactos
              </li>
              <li class="flex items-center gap-3 text-slate-600">
                <span class="w-2 h-2 bg-violet-500 rounded-full"></span>
                Solicitar eliminación de datos
              </li>
              <li class="flex items-center gap-3 text-slate-600">
                <span class="w-2 h-2 bg-violet-500 rounded-full"></span>
                Revocar acceso a integraciones
              </li>
              <li class="flex items-center gap-3 text-slate-600">
                <span class="w-2 h-2 bg-violet-500 rounded-full"></span>
                Exportar tus datos
              </li>
            </ul>
          </section>

          <div class="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

          <section>
            <div class="flex items-center gap-4 mb-4">
              <span class="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center font-bold text-sm">07</span>
              <h2 class="text-2xl font-bold text-slate-800">Uso de Datos de Facebook</h2>
            </div>
            <p class="text-slate-600 leading-relaxed mb-4">
              Cuando conectas tu página de Facebook o Instagram, obtenemos acceso limitado a mensajes e información básica.
            </p>
            <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircleIcon class="w-5 h-5 text-emerald-600 mt-0.5" />
              <p class="text-emerald-800"><strong>No vendemos ni compartimos esta información con terceros.</strong></p>
            </div>
          </section>

          <div class="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

          <section>
            <div class="flex items-center gap-4 mb-4">
              <span class="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center font-bold text-sm">08</span>
              <h2 class="text-2xl font-bold text-slate-800">Eliminación de Datos</h2>
            </div>
            <p class="text-slate-600 leading-relaxed mb-4">
              Puedes eliminar tus datos contactándonos, desconectando integraciones, o eliminando tu cuenta.
            </p>
          </section>

          <div class="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

          <section>
            <div class="flex items-center gap-4 mb-4">
              <span class="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center font-bold text-sm">09</span>
              <h2 class="text-2xl font-bold text-slate-800">Contacto</h2>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a href="mailto:info@kogniastudio.com" class="flex items-center gap-4 p-4 bg-violet-50 hover:bg-violet-100 rounded-2xl transition-colors group">
                <div class="w-12 h-12 bg-violet-500 rounded-xl flex items-center justify-center">
                  <MailIcon class="w-6 h-6 text-white" />
                </div>
                <div>
                  <span class="text-sm text-slate-500">Email</span>
                  <p class="text-violet-600 font-medium group-hover:underline">info@kogniastudio.com</p>
                </div>
              </a>
              <a href="https://kogniastudio.com" target="_blank" class="flex items-center gap-4 p-4 bg-violet-50 hover:bg-violet-100 rounded-2xl transition-colors group">
                <div class="w-12 h-12 bg-violet-500 rounded-xl flex items-center justify-center">
                  <GlobeIcon class="w-6 h-6 text-white" />
                </div>
                <div>
                  <span class="text-sm text-slate-500">Sitio web</span>
                  <p class="text-violet-600 font-medium group-hover:underline">kogniastudio.com</p>
                </div>
              </a>
            </div>
          </section>

          <div class="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

          <section>
            <div class="flex items-center gap-4 mb-4">
              <span class="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center font-bold text-sm">10</span>
              <h2 class="text-2xl font-bold text-slate-800">Cambios a Esta Política</h2>
            </div>
            <p class="text-slate-600 leading-relaxed">
              Podemos actualizar esta política ocasionalmente. Te notificaremos sobre cambios significativos.
            </p>
          </section>

        </div>
      </main>

      <!-- Footer -->
      <footer class="text-center mt-12 space-y-2">
        <img src="/logo-kognia.png" alt="Kognia Studio" class="h-12 mx-auto opacity-60" />
        <p class="text-slate-500 text-sm">© {{ currentYear }} Kognia Studio. Todos los derechos reservados.</p>
        <p class="text-slate-400 text-xs">Agentify Chat es un producto de Kognia Studio</p>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { 
  ArrowLeft as ArrowLeftIcon,
  ShieldCheck as ShieldCheckIcon,
  CheckCircle as CheckCircleIcon,
  Lock as LockIcon,
  Shield as ShieldIcon,
  Key as KeyIcon,
  Eye as EyeIcon,
  AlertCircle as AlertCircleIcon,
  Mail as MailIcon,
  Globe as GlobeIcon
} from 'lucide-vue-next'

const lastUpdated = computed(() => {
  return new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const currentYear = computed(() => new Date().getFullYear())
</script>
