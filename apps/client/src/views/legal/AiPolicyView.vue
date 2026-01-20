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
          Funciones de IA Generativa
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
              <SparklesIcon class="w-5 h-5" />
            </div>
            <span class="font-semibold">Inteligencia Artificial responsable</span>
          </div>
          <p class="text-white/90 leading-relaxed">
            En <strong>Agentify Chat</strong>, utilizamos IA generativa (GenAI) para mejorar y facilitar
            el uso de nuestros productos y servicios. Esta página describe cómo funcionan estas características
            y qué considerar al usarlas.
          </p>
        </div>

        <!-- Content Sections -->
        <div class="bg-white/70 backdrop-blur-sm rounded-3xl border border-slate-200/50 shadow-lg shadow-slate-200/50 p-8 md:p-12 space-y-10">
          
          <section>
            <div class="flex items-center gap-4 mb-4">
              <span class="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center font-bold text-sm">01</span>
              <h2 class="text-2xl font-bold text-slate-800">¿Qué funciones utilizan IA?</h2>
            </div>
            <p class="text-slate-600 leading-relaxed mb-4">
              Agentify Chat incorpora IA generativa en varias funciones del producto:
            </p>
            <ul class="space-y-3">
              <li class="flex items-start gap-3 text-slate-600">
                <span class="w-2 h-2 bg-violet-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong class="text-slate-800">Asistente de atención automática:</strong> Responde automáticamente a mensajes de clientes usando el contexto de tu negocio.</span>
              </li>
              <li class="flex items-start gap-3 text-slate-600">
                <span class="w-2 h-2 bg-violet-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong class="text-slate-800">Base de conocimiento:</strong> Entrena la IA con información personalizada de tu empresa para respuestas más precisas.</span>
              </li>
              <li class="flex items-start gap-3 text-slate-600">
                <span class="w-2 h-2 bg-violet-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong class="text-slate-800">Sugerencias inteligentes:</strong> Genera recomendaciones de respuestas basadas en el contexto de la conversación.</span>
              </li>
              <li class="flex items-start gap-3 text-slate-600">
                <span class="w-2 h-2 bg-violet-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong class="text-slate-800">Análisis de leads:</strong> Extrae y organiza información clave de las conversaciones con clientes.</span>
              </li>
            </ul>
          </section>

          <div class="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

          <section>
            <div class="flex items-center gap-4 mb-4">
              <span class="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center font-bold text-sm">02</span>
              <h2 class="text-2xl font-bold text-slate-800">Modelos de IA que utilizamos</h2>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div class="text-center p-5 bg-slate-50 rounded-2xl">
                <img src="/gemini-logo.png" alt="Gemini" class="w-12 h-12 mx-auto mb-3" />
                <span class="text-sm font-semibold text-slate-700">Google Gemini</span>
              </div>
              <div class="text-center p-5 bg-slate-50 rounded-2xl">
                <img src="/llama-logo.png" alt="Llama" class="w-12 h-12 mx-auto mb-3" />
                <span class="text-sm font-semibold text-slate-700">Meta Llama</span>
              </div>
              <div class="text-center p-5 bg-slate-50 rounded-2xl">
                <img src="/deepseek-logo.png" alt="DeepSeek" class="w-12 h-12 mx-auto mb-3" />
                <span class="text-sm font-semibold text-slate-700">DeepSeek</span>
              </div>
            </div>
            <p class="text-slate-500 text-sm">
              La información que ingrese al utilizar funciones de IA puede compartirse con estos proveedores para procesar sus solicitudes.
            </p>
          </section>

          <div class="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

          <section>
            <div class="flex items-center gap-4 mb-4">
              <span class="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center font-bold text-sm">03</span>
              <h2 class="text-2xl font-bold text-slate-800">Nuestro Compromiso</h2>
            </div>
            <p class="text-slate-600 leading-relaxed mb-4">
              Estamos comprometidos a incorporar las funciones de IA de manera responsable:
            </p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div class="flex items-center gap-3 p-3 bg-violet-50 rounded-xl text-slate-600">
                <CheckCircleIcon class="w-5 h-5 text-violet-500" />
                <span>Monitoreo continuo del rendimiento</span>
              </div>
              <div class="flex items-center gap-3 p-3 bg-violet-50 rounded-xl text-slate-600">
                <CheckCircleIcon class="w-5 h-5 text-violet-500" />
                <span>Mejoras basadas en retroalimentación</span>
              </div>
              <div class="flex items-center gap-3 p-3 bg-violet-50 rounded-xl text-slate-600">
                <CheckCircleIcon class="w-5 h-5 text-violet-500" />
                <span>Transparencia en el uso de IA</span>
              </div>
              <div class="flex items-center gap-3 p-3 bg-violet-50 rounded-xl text-slate-600">
                <CheckCircleIcon class="w-5 h-5 text-violet-500" />
                <span>Control de calidad de respuestas</span>
              </div>
            </div>
          </section>

          <div class="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

          <section>
            <div class="flex items-center gap-4 mb-4">
              <span class="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center font-bold text-sm">04</span>
              <h2 class="text-2xl font-bold text-slate-800">Limitaciones Importantes</h2>
            </div>
            <div class="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-4">
              <div class="flex items-start gap-3">
                <AlertTriangleIcon class="w-6 h-6 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p class="text-amber-800 font-semibold mb-2">La IA generativa es una tecnología relativamente nueva</p>
                  <p class="text-amber-700">
                    Trabajamos para mejorar nuestras funciones de IA, pero como cualquier tecnología nueva, 
                    puede cometer errores y proporcionar información incorrecta, incompleta o desactualizada.
                  </p>
                </div>
              </div>
            </div>
            <ul class="space-y-3">
              <li class="flex items-start gap-3 text-slate-600">
                <XCircleIcon class="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <span>Las respuestas generadas <strong>no sustituyen asesoramiento legal, financiero o médico</strong>.</span>
              </li>
              <li class="flex items-start gap-3 text-slate-600">
                <XCircleIcon class="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <span>Las respuestas pueden <strong>no reflejar las políticas oficiales</strong> de tu negocio si la base de conocimiento está incompleta.</span>
              </li>
              <li class="flex items-start gap-3 text-slate-600">
                <XCircleIcon class="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <span>Información sobre precios, disponibilidad o promociones <strong>puede estar desactualizada</strong>.</span>
              </li>
              <li class="flex items-start gap-3 text-slate-600">
                <XCircleIcon class="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <span>Siempre <strong>verifica de manera independiente</strong> las respuestas antes de tomar decisiones importantes.</span>
              </li>
            </ul>
          </section>

          <div class="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

          <section>
            <div class="flex items-center gap-4 mb-4">
              <span class="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center font-bold text-sm">05</span>
              <h2 class="text-2xl font-bold text-slate-800">Consideraciones al Usar IA</h2>
            </div>
            <div class="space-y-4">
              <div class="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                <InfoIcon class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <p class="text-slate-600">Las respuestas y sugerencias del chatbot <strong>deben usarse únicamente como referencia</strong>.</p>
              </div>
              <div class="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                <InfoIcon class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <p class="text-slate-600">Es posible que la información usada para generar respuestas esté <strong>desactualizada o incompleta</strong>.</p>
              </div>
              <div class="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                <InfoIcon class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <p class="text-slate-600">Evita ingresar <strong>información personal confidencial o sensible</strong> al interactuar con funciones de IA.</p>
              </div>
              <div class="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                <InfoIcon class="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <p class="text-slate-600">Revisa las respuestas automáticas y <strong>mantén tu base de conocimiento actualizada</strong> para mejores resultados.</p>
              </div>
            </div>
          </section>

          <div class="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

          <section>
            <div class="flex items-center gap-4 mb-4">
              <span class="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center font-bold text-sm">06</span>
              <h2 class="text-2xl font-bold text-slate-800">Uso de Datos con IA</h2>
            </div>
            <p class="text-slate-600 leading-relaxed mb-4">
              Para proporcionar funciones de IA, procesamos cierta información:
            </p>
            <ul class="space-y-2 mb-4">
              <li class="flex items-center gap-3 text-slate-600">
                <span class="w-2 h-2 bg-violet-500 rounded-full"></span>
                Contenido de conversaciones para generar respuestas
              </li>
              <li class="flex items-center gap-3 text-slate-600">
                <span class="w-2 h-2 bg-violet-500 rounded-full"></span>
                Base de conocimiento de tu negocio
              </li>
              <li class="flex items-center gap-3 text-slate-600">
                <span class="w-2 h-2 bg-violet-500 rounded-full"></span>
                Contexto de la conversación actual
              </li>
            </ul>
            <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
              <ShieldCheckIcon class="w-5 h-5 text-emerald-600 mt-0.5" />
              <p class="text-emerald-800"><strong>No usamos tus datos para entrenar modelos de IA de terceros.</strong> Tu información se procesa de forma segura.</p>
            </div>
          </section>

          <div class="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

          <section>
            <div class="flex items-center gap-4 mb-4">
              <span class="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center font-bold text-sm">07</span>
              <h2 class="text-2xl font-bold text-slate-800">Más Información</h2>
            </div>
            <p class="text-slate-600 leading-relaxed mb-4">
              Para conocer más sobre cómo Agentify Chat maneja tus datos, consulta nuestra Política de Privacidad.
            </p>
            <router-link to="/privacy" class="inline-flex items-center gap-2 text-violet-600 font-medium hover:text-violet-700 transition-colors">
              <FileTextIcon class="w-4 h-4" />
              <span>Ver Política de Privacidad</span>
            </router-link>
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
  Sparkles as SparklesIcon,
  CheckCircle as CheckCircleIcon,
  AlertTriangle as AlertTriangleIcon,
  XCircle as XCircleIcon,
  Info as InfoIcon,
  ShieldCheck as ShieldCheckIcon,
  FileText as FileTextIcon
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
