<template>
  <div class="min-h-screen bg-[#f8f9fc] py-12 px-4">
    <div class="max-w-4xl mx-auto">
      <!-- Header with Logo -->
      <header class="text-center mb-12">
        <router-link to="/" class="inline-flex items-center gap-2 text-violet-600 hover:text-violet-700 transition-colors mb-8">
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
                <div class="w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <svg viewBox="0 0 36 36" fill="none" class="w-10 h-10">
                    <path d="M18 0C8.059 0 0 8.059 0 18c0 8.94 6.504 16.355 15.047 17.772V23.203h-4.523v-5.203h4.523v-3.963c0-4.468 2.661-6.938 6.738-6.938 1.953 0 3.996.349 3.996.349v4.391h-2.251c-2.218 0-2.909 1.377-2.909 2.789V18h4.95l-.791 5.203h-4.159v12.569C29.496 34.355 36 26.94 36 18c0-9.941-8.059-18-18-18z" fill="#1877F2"/>
                  </svg>
                </div>
                <span class="text-sm text-slate-600 font-medium">Meta</span>
              </div>
              <div class="text-center p-4 bg-slate-50 rounded-2xl">
                <div class="w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <svg viewBox="0 0 32 32" fill="none" class="w-10 h-10">
                    <path d="M16 0C7.163 0 0 7.163 0 16c0 2.837.738 5.502 2.032 7.812L0 32l8.413-2.005A15.916 15.916 0 0016 32c8.837 0 16-7.163 16-16S24.837 0 16 0z" fill="#25D366"/>
                    <path d="M23.5 19.278c-.363-.182-2.147-1.059-2.48-1.181-.333-.121-.575-.182-.818.182-.242.363-.94 1.181-1.151 1.424-.212.242-.424.273-.787.091-.364-.182-1.535-.566-2.923-1.803-1.08-.963-1.81-2.154-2.022-2.517-.212-.364-.023-.56.159-.742.164-.163.364-.424.545-.637.182-.212.242-.364.364-.606.121-.242.06-.454-.03-.637-.091-.182-.818-1.969-1.12-2.696-.295-.709-.595-.613-.818-.624-.212-.01-.454-.012-.697-.012-.242 0-.636.091-.97.454-.333.364-1.272 1.242-1.272 3.03s1.302 3.515 1.484 3.757c.182.242 2.565 3.916 6.216 5.494.869.375 1.547.599 2.075.766.872.277 1.665.238 2.293.144.699-.104 2.148-.878 2.451-1.727.303-.848.303-1.575.212-1.727-.09-.152-.333-.242-.697-.424z" fill="white"/>
                  </svg>
                </div>
                <span class="text-sm text-slate-600 font-medium">WhatsApp</span>
              </div>
              <div class="text-center p-4 bg-slate-50 rounded-2xl">
                <div class="w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" class="w-10 h-10">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                <span class="text-sm text-slate-600 font-medium">Google</span>
              </div>
              <div class="text-center p-4 bg-slate-50 rounded-2xl">
                <div class="w-12 h-12 mx-auto mb-2 flex items-center justify-center bg-black rounded-lg">
                  <svg viewBox="0 0 24 24" fill="none" class="w-6 h-6">
                    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.895zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681v6.722zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" fill="white"/>
                  </svg>
                </div>
                <span class="text-sm text-slate-600 font-medium">OpenAI</span>
              </div>
            </div>
            <p class="text-slate-500 text-sm mb-3">Al conectar estas plataformas, aceptas sus políticas de privacidad.</p>
            <router-link to="/ai-policy" class="inline-flex items-center gap-2 text-violet-600 text-sm font-medium hover:text-violet-700 transition-colors">
              <span>Ver nuestra Política de IA Generativa →</span>
            </router-link>
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
import { computed, onMounted } from 'vue'
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

onMounted(() => {
  window.scrollTo({ top: 0, behavior: 'instant' })
})

const lastUpdated = computed(() => {
  return new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const currentYear = computed(() => new Date().getFullYear())
</script>
