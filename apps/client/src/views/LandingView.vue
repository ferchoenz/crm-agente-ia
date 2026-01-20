<template>
  <div class="landing">
    <!-- Animated BG -->
    <div class="bg-canvas">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
      <div class="mesh-grid"></div>
    </div>
    <div class="particles">
      <div v-for="i in 15" :key="i" class="particle" :style="getParticleStyle(i)"></div>
    </div>

    <!-- Header -->
    <header class="header" :class="{ scrolled: isScrolled }">
      <div class="header-inner">
        <router-link to="/" class="logo">
          <img src="/logo-agentify.png" alt="Agentify" class="logo-img" />
        </router-link>
        <nav class="nav" :class="{ open: menuOpen }">
          <a href="#features" @click="menuOpen = false">Funcionalidades</a>
          <a href="#use-cases" @click="menuOpen = false">Casos de uso</a>
          <a href="#support" @click="menuOpen = false">Soporte</a>
          <router-link to="/privacy" @click="menuOpen = false">Privacidad</router-link>
        </nav>
        <div class="header-actions">
          <router-link to="/login" class="btn-ghost">Iniciar sesión</router-link>
          <a href="#contact" class="btn-primary">Demo gratis</a>
        </div>
        <button class="menu-toggle" @click="menuOpen = !menuOpen">
          <span></span><span></span><span></span>
        </button>
      </div>
    </header>

    <!-- Hero -->
    <section class="hero">
      <div class="hero-content">
        <div class="hero-badge glass-card">
          <span class="pulse"></span>
          CRM con IA Integrada
        </div>
        <h1>Automatiza tu atención<br/><span class="gradient-text">con Inteligencia Artificial</span></h1>
        <p>Centraliza WhatsApp, Messenger e Instagram. Responde automáticamente con IA y convierte más leads.</p>
        <div class="hero-ctas">
          <a href="#contact" class="btn-primary btn-lg">Solicita una demo</a>
          <router-link to="/login" class="btn-outline">Iniciar sesión</router-link>
        </div>
      </div>
      <div class="hero-demo">
        <div class="chat-window glass-card">
          <div class="chat-header">
            <div class="chat-avatar">
              <img src="/logo-agentify.png" alt="" />
            </div>
            <div>
              <strong>Agentify Bot</strong>
              <span class="online">En línea</span>
            </div>
          </div>
          <div class="chat-body">
            <div class="msg" v-for="(m, i) in visibleMsgs" :key="i">{{ m }}</div>
            <div class="typing" v-if="isTyping"><span></span><span></span><span></span></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Why Section -->
    <section class="section section-light" id="why">
      <div class="container">
        <h2 class="section-title">¿Por qué Agentify Chat?</h2>
        <div class="divider"></div>
        <div class="benefits-grid">
          <div class="glass-card benefit">
            <div class="benefit-icon"><MessageCircleIcon /></div>
            <h3>Omnicanalidad</h3>
            <p>WhatsApp, Messenger e Instagram en una sola bandeja.</p>
          </div>
          <div class="glass-card benefit">
            <div class="benefit-icon"><BrainIcon /></div>
            <h3>IA Conversacional</h3>
            <p>Respuestas automáticas que entienden el contexto.</p>
          </div>
          <div class="glass-card benefit">
            <div class="benefit-icon"><BarChart3Icon /></div>
            <h3>CRM Integrado</h3>
            <p>Gestiona leads y ventas sin salir de la plataforma.</p>
          </div>
          <div class="glass-card benefit">
            <div class="benefit-icon"><ZapIcon /></div>
            <h3>Productividad</h3>
            <p>Automatiza tareas y céntrate en cerrar ventas.</p>
          </div>
        </div>
        <div class="meta-badge glass-card">
          <img src="https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg" alt="Meta" class="meta-logo" />
          <span>Partner Oficial de Meta</span>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="section" id="features">
      <div class="container">
        <span class="label">Funcionalidades</span>
        <h2 class="section-title">Todo lo que necesitas</h2>
        <div class="features-bento">
          <div class="glass-card feature-main">
            <div class="feature-content">
              <h3>Inteligencia Artificial</h3>
              <p>Potenciada por los mejores modelos de lenguaje del mercado.</p>
            </div>
            <div class="ai-models">
              <div class="model" v-for="(m, i) in aiModels" :key="i" :class="{ active: activeModel === i }">
                <component :is="m.icon" />
                <span>{{ m.name }}</span>
              </div>
            </div>
          </div>
          <div class="glass-card feature-wa">
            <div class="wa-icon"><MessageCircleIcon /></div>
            <h4>WhatsApp Business API</h4>
            <p>Conecta tu número oficial de forma segura.</p>
            <div class="wa-status"><span class="dot"></span>Conectado</div>
          </div>
          <div class="glass-card feature-kb">
            <div class="kb-icon"><DatabaseIcon /></div>
            <h4>Base de Conocimiento</h4>
            <p>Entrena la IA con tu información personalizada.</p>
          </div>
        </div>
        <div class="features-cards">
          <div class="glass-card feature-card">
            <PackageIcon class="fc-icon" />
            <h4>Catálogo de Productos</h4>
            <p>Comparte productos y cotizaciones en el chat.</p>
          </div>
          <div class="glass-card feature-card">
            <SmileIcon class="fc-icon" />
            <h4>Análisis de Sentimiento</h4>
            <p>Detecta el estado emocional de tus clientes.</p>
          </div>
          <div class="glass-card feature-card">
            <TargetIcon class="fc-icon" />
            <h4>Sistema SPIN</h4>
            <p>Metodología de ventas integrada con IA.</p>
          </div>
          <div class="glass-card feature-card">
            <SparklesIcon class="fc-icon" />
            <h4>Insights de IA</h4>
            <p>Recomendaciones inteligentes para cada lead.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="cta-bg"></div>
      <div class="container cta-content">
        <div class="cta-text">
          <h2>La forma más rápida de implementar IA</h2>
          <p>Automatiza la atención, captura más leads y cierra más ventas.</p>
          <a href="#contact" class="btn-white">Comenzar ahora</a>
        </div>
        <div class="cta-image glass-card">
          <div class="crm-preview">
            <div class="crm-header">
              <div class="crm-dots"><span></span><span></span><span></span></div>
              <span>Dashboard</span>
            </div>
            <div class="crm-body">
              <div class="crm-stat">
                <span class="crm-stat-value">1,234</span>
                <span class="crm-stat-label">Leads</span>
              </div>
              <div class="crm-stat">
                <span class="crm-stat-value">89%</span>
                <span class="crm-stat-label">Respuesta</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Use Cases -->
    <section class="section section-light" id="use-cases">
      <div class="container">
        <h2 class="section-title">¿Para quién es Agentify Chat?</h2>
        <div class="use-cases-tabs">
          <button v-for="(uc, i) in useCases" :key="i" :class="{ active: activeUC === i }" @click="activeUC = i">
            {{ uc.label }}
          </button>
        </div>
        <div class="use-case-panel glass-card">
          <div class="uc-image">
            <div class="uc-image-bg"></div>
            <component :is="useCases[activeUC].icon" class="uc-icon-big" />
          </div>
          <div class="uc-content">
            <h3>{{ useCases[activeUC].title }}</h3>
            <p>{{ useCases[activeUC].desc }}</p>
            <blockquote>"{{ useCases[activeUC].quote }}"</blockquote>
          </div>
        </div>
      </div>
    </section>

    <!-- Metrics -->
    <section class="section metrics-section" ref="metricsRef">
      <div class="container">
        <h2 class="section-title">El efecto Agentify</h2>
        <p class="section-sub">Resultados reales de nuestros clientes</p>
        <div class="metrics-grid">
          <div class="glass-card metric" v-for="(m, i) in metrics" :key="i">
            <span class="metric-value">{{ animatedMetrics[i] }}<small>{{ m.suffix }}</small></span>
            <span class="metric-label">{{ m.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Support -->
    <section class="section section-light" id="support">
      <div class="container">
        <h2 class="section-title">Soporte y Capacitación</h2>
        <p class="section-sub">Te acompañamos en cada paso del camino</p>
        <div class="support-grid">
          <div class="glass-card support-card">
            <GraduationCapIcon class="support-icon" />
            <h4>Capacitación Inicial</h4>
            <p>Sesiones personalizadas para tu equipo.</p>
          </div>
          <div class="glass-card support-card">
            <HeadphonesIcon class="support-icon" />
            <h4>Soporte en Vivo</h4>
            <p>Equipo disponible por chat y WhatsApp.</p>
          </div>
          <div class="glass-card support-card">
            <BookOpenIcon class="support-icon" />
            <h4>Base de Conocimiento</h4>
            <p>Tutoriales, guías y videos.</p>
          </div>
          <div class="glass-card support-card">
            <RefreshCwIcon class="support-icon" />
            <h4>Actualizaciones</h4>
            <p>Nuevas funciones cada mes.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer" id="contact">
      <div class="footer-bg">
        <div class="footer-orb"></div>
      </div>
      <div class="container footer-content">
        <div class="footer-cta glass-card">
          <h2>¿Listo para transformar tu atención?</h2>
          <a href="mailto:info@kogniastudio.com" class="btn-primary btn-lg">Contactar ahora</a>
        </div>
        <div class="footer-grid">
          <div class="footer-brand">
            <img src="/logo-agentify.png" alt="Agentify" class="footer-logo" />
            <p>Un producto de <strong>Kognia Studio</strong></p>
          </div>
          <div class="footer-links">
            <h5>Producto</h5>
            <a href="#features">Funcionalidades</a>
            <a href="#use-cases">Casos de uso</a>
          </div>
          <div class="footer-links">
            <h5>Legal</h5>
            <router-link to="/privacy">Privacidad</router-link>
          </div>
          <div class="footer-links">
            <h5>Contacto</h5>
            <a href="mailto:info@kogniastudio.com">info@kogniastudio.com</a>
          </div>
        </div>
        <div class="footer-bottom">
          <p>© {{ currentYear }} Agentify Chat. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  MessageCircle as MessageCircleIcon, Brain as BrainIcon, BarChart3 as BarChart3Icon,
  Zap as ZapIcon, Database as DatabaseIcon, Package as PackageIcon, Smile as SmileIcon,
  Target as TargetIcon, Sparkles as SparklesIcon, GraduationCap as GraduationCapIcon,
  Headphones as HeadphonesIcon, BookOpen as BookOpenIcon, RefreshCw as RefreshCwIcon,
  ShoppingCart as ShoppingCartIcon, Building as BuildingIcon, Users as UsersIcon, Briefcase as BriefcaseIcon
} from 'lucide-vue-next'

const currentYear = computed(() => new Date().getFullYear())
const menuOpen = ref(false)
const isScrolled = ref(false)
const activeModel = ref(0)
const activeUC = ref(0)
const metricsRef = ref(null)
const animatedMetrics = ref([0, 0, 0, 0])

const aiModels = [
  { name: 'Gemini', icon: SparklesIcon },
  { name: 'Llama', icon: BrainIcon },
  { name: 'DeepSeek', icon: TargetIcon }
]

const metrics = [
  { value: 85, suffix: '%', label: 'Reducción en tiempo de respuesta' },
  { value: 3, suffix: 'x', label: 'Más leads capturados' },
  { value: 40, suffix: '%', label: 'Aumento en conversiones' },
  { value: 24, suffix: '/7', label: 'Atención automatizada' }
]

const useCases = [
  { label: 'Ventas', icon: BriefcaseIcon, title: 'Equipos de Ventas', desc: 'Gestiona grandes volúmenes de leads con todas las interacciones centralizadas y enriquecidas con IA.', quote: 'Ahora es mucho más sencillo dar seguimiento sin perder el contexto.' },
  { label: 'E-commerce', icon: ShoppingCartIcon, title: 'Tiendas en Línea', desc: 'Automatiza la atención de tu tienda. Responde sobre productos, stock y envíos 24/7.', quote: 'Nuestras ventas aumentaron 40% con el bot de Agentify.' },
  { label: 'Servicios', icon: BuildingIcon, title: 'Empresas de Servicios', desc: 'Gestiona citas, cotizaciones y seguimiento de clientes de forma automatizada.', quote: 'Redujimos el tiempo de respuesta de horas a segundos.' },
  { label: 'Soporte', icon: UsersIcon, title: 'Atención al Cliente', desc: 'Resuelve tickets, responde FAQs y escala casos complejos automáticamente.', quote: 'El 80% de consultas se resuelven sin intervención humana.' }
]

// Chat animation
const messages = ['¡Hola! ¿En qué puedo ayudarte? 👋', 'Tenemos promociones especiales 🎉', '¿Te envío más información?']
const visibleMsgs = ref([])
const isTyping = ref(false)

function animateChat() {
  let i = 0
  const next = () => {
    if (i < messages.length) {
      isTyping.value = true
      setTimeout(() => {
        isTyping.value = false
        visibleMsgs.value.push(messages[i])
        i++
        setTimeout(next, 1500)
      }, 1000)
    } else {
      setTimeout(() => { visibleMsgs.value = []; i = 0; next() }, 3000)
    }
  }
  next()
}

// AI model rotation
let modelInterval
onMounted(() => {
  animateChat()
  modelInterval = setInterval(() => { activeModel.value = (activeModel.value + 1) % aiModels.length }, 2000)
  window.addEventListener('scroll', handleScroll)
  handleScroll()
})

onUnmounted(() => {
  clearInterval(modelInterval)
  window.removeEventListener('scroll', handleScroll)
})

function handleScroll() {
  isScrolled.value = window.scrollY > 50
  // Animate metrics on scroll
  if (metricsRef.value) {
    const rect = metricsRef.value.getBoundingClientRect()
    if (rect.top < window.innerHeight * 0.8) animateMetrics()
  }
}

let metricsAnimated = false
function animateMetrics() {
  if (metricsAnimated) return
  metricsAnimated = true
  metrics.forEach((m, i) => {
    let start = 0
    const step = m.value / 30
    const interval = setInterval(() => {
      start += step
      if (start >= m.value) { start = m.value; clearInterval(interval) }
      animatedMetrics.value[i] = Math.round(start)
    }, 30)
  })
}

// UC auto-switch
let ucInterval
onMounted(() => { ucInterval = setInterval(() => { activeUC.value = (activeUC.value + 1) % useCases.length }, 4000) })
onUnmounted(() => clearInterval(ucInterval))

function getParticleStyle(i) {
  return { width: `${Math.random() * 4 + 2}px`, height: `${Math.random() * 4 + 2}px`, left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 8}s`, animationDuration: `${Math.random() * 10 + 15}s` }
}
</script>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }
.landing { font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #f0fdfa 100%); color: #1f2937; min-height: 100vh; position: relative; overflow-x: hidden; }

/* BG */
.bg-canvas { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.gradient-orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.5; animation: float 20s ease-in-out infinite; }
.orb-1 { width: 500px; height: 500px; background: linear-gradient(135deg, #818cf8, #c084fc); top: -150px; left: -100px; }
.orb-2 { width: 400px; height: 400px; background: linear-gradient(135deg, #2dd4bf, #22d3ee); bottom: -100px; right: -50px; animation-delay: -5s; }
.orb-3 { width: 300px; height: 300px; background: linear-gradient(135deg, #fb7185, #fbbf24); top: 50%; left: 50%; opacity: 0.3; animation-delay: -10s; }
.mesh-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px); background-size: 60px 60px; }
.particles { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.particle { position: absolute; background: linear-gradient(135deg, #818cf8, #c084fc); border-radius: 50%; bottom: -20px; opacity: 0.5; animation: rise linear infinite; }
@keyframes rise { 0% { transform: translateY(0); opacity: 0; } 10% { opacity: 0.5; } 90% { opacity: 0.5; } 100% { transform: translateY(-100vh); opacity: 0; } }
@keyframes float { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(30px, -30px) scale(1.05); } }

/* Glass */
.glass-card { background: rgba(255,255,255,0.6); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.8); border-radius: 20px; box-shadow: 0 8px 32px rgba(99,102,241,0.1); }

/* Header */
.header { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 1rem 2rem; transition: all 0.3s; }
.header.scrolled { background: rgba(255,255,255,0.8); backdrop-filter: blur(20px); box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
.header-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 2rem; }
.logo-img { height: 48px; }
.nav { display: flex; gap: 2rem; }
.nav a { color: #4b5563; text-decoration: none; font-weight: 500; font-size: 0.9rem; transition: color 0.2s; }
.nav a:hover { color: #6366f1; }
.header-actions { display: flex; gap: 1rem; align-items: center; }
.btn-ghost { color: #6366f1; font-weight: 600; text-decoration: none; }
.btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 0.7rem 1.5rem; border-radius: 50px; font-weight: 600; text-decoration: none; box-shadow: 0 4px 15px rgba(99,102,241,0.3); transition: all 0.3s; }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(99,102,241,0.4); }
.btn-lg { padding: 1rem 2rem; font-size: 1rem; }
.btn-outline { border: 2px solid rgba(99,102,241,0.3); color: #6366f1; padding: 0.9rem 1.8rem; border-radius: 50px; font-weight: 600; text-decoration: none; transition: all 0.3s; }
.btn-outline:hover { background: rgba(99,102,241,0.1); }
.btn-white { background: white; color: #6366f1; padding: 1rem 2rem; border-radius: 50px; font-weight: 600; text-decoration: none; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
.menu-toggle { display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; }
.menu-toggle span { width: 24px; height: 2px; background: #1f2937; }
@media (max-width: 768px) {
  .nav { position: absolute; top: 100%; left: 0; right: 0; flex-direction: column; background: white; padding: 1rem 2rem; gap: 1rem; display: none; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
  .nav.open { display: flex; }
  .header-actions { display: none; }
  .menu-toggle { display: flex; }
}

/* Hero */
.hero { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 3rem; max-width: 1200px; margin: 0 auto; padding: 8rem 2rem 4rem; position: relative; z-index: 1; }
.hero-badge { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; font-size: 0.8rem; font-weight: 600; color: #6366f1; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1.5rem; }
.pulse { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; animation: pulse 2s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.hero h1 { font-size: clamp(2.5rem, 5vw, 3.5rem); font-weight: 800; line-height: 1.1; margin-bottom: 1.5rem; }
.gradient-text { background: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7); -webkit-background-clip: text; background-clip: text; color: transparent; }
.hero p { font-size: 1.1rem; color: #6b7280; max-width: 500px; margin-bottom: 2rem; line-height: 1.7; }
.hero-ctas { display: flex; gap: 1rem; flex-wrap: wrap; }
.hero-demo { display: flex; justify-content: center; }
.chat-window { width: 100%; max-width: 380px; overflow: hidden; }
.chat-header { display: flex; align-items: center; gap: 0.75rem; padding: 1rem; border-bottom: 1px solid rgba(99,102,241,0.1); }
.chat-avatar { width: 40px; height: 40px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.chat-avatar img { width: 28px; height: 28px; }
.chat-header strong { display: block; font-size: 0.9rem; }
.online { font-size: 0.75rem; color: #22c55e; }
.chat-body { padding: 1rem; min-height: 180px; display: flex; flex-direction: column; gap: 0.5rem; }
.msg { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 0.75rem 1rem; border-radius: 1rem 1rem 1rem 0; font-size: 0.9rem; max-width: 85%; animation: fadeIn 0.3s; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.typing { display: flex; gap: 4px; padding: 0.75rem 1rem; background: rgba(99,102,241,0.1); border-radius: 1rem; width: fit-content; }
.typing span { width: 8px; height: 8px; background: #6366f1; border-radius: 50%; animation: typing 1.4s infinite; }
.typing span:nth-child(2) { animation-delay: 0.2s; }
.typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
@media (max-width: 1024px) { .hero { grid-template-columns: 1fr; text-align: center; } .hero-content { order: 1; } .hero p { margin: 0 auto 2rem; } .hero-ctas { justify-content: center; } .hero-demo { order: 2; } }
@media (max-width: 768px) { .hero-demo { display: none; } }

/* Sections */
.section { padding: 6rem 2rem; position: relative; z-index: 1; }
.section-light { background: rgba(255,255,255,0.5); }
.container { max-width: 1200px; margin: 0 auto; }
.section-title { font-size: clamp(1.8rem, 4vw, 2.5rem); font-weight: 700; text-align: center; margin-bottom: 0.5rem; }
.section-sub { text-align: center; color: #6b7280; margin-bottom: 3rem; }
.divider { width: 60px; height: 4px; background: linear-gradient(90deg, #6366f1, #8b5cf6); margin: 1rem auto 3rem; border-radius: 2px; }
.label { display: block; text-align: center; color: #6366f1; font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.5rem; }

/* Benefits */
.benefits-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
.benefit { padding: 2rem; text-align: center; transition: all 0.3s; }
.benefit:hover { transform: translateY(-5px); box-shadow: 0 15px 40px rgba(99,102,241,0.15); }
.benefit-icon { width: 60px; height: 60px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; color: white; }
.benefit-icon svg { width: 28px; height: 28px; }
.benefit h3 { font-size: 1.1rem; margin-bottom: 0.5rem; }
.benefit p { font-size: 0.9rem; color: #6b7280; }
.meta-badge { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 1rem 2rem; width: fit-content; margin: 0 auto; }
.meta-logo { height: 24px; }
.meta-badge span { font-weight: 600; color: #1877f2; }

/* Features Bento */
.features-bento { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto auto; gap: 1.5rem; margin-bottom: 2rem; }
.feature-main { grid-row: span 2; padding: 2rem; display: flex; flex-direction: column; justify-content: space-between; }
.feature-main h3 { font-size: 1.5rem; margin-bottom: 0.5rem; }
.feature-main p { color: #6b7280; margin-bottom: 2rem; }
.ai-models { display: flex; gap: 1rem; flex-wrap: wrap; }
.model { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; background: rgba(99,102,241,0.1); border-radius: 12px; font-weight: 500; font-size: 0.9rem; transition: all 0.3s; opacity: 0.5; }
.model.active { opacity: 1; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; box-shadow: 0 4px 15px rgba(99,102,241,0.3); }
.model svg { width: 20px; height: 20px; }
.feature-wa, .feature-kb { padding: 1.5rem; }
.feature-wa h4, .feature-kb h4 { font-size: 1rem; margin-bottom: 0.5rem; }
.feature-wa p, .feature-kb p { font-size: 0.85rem; color: #6b7280; margin-bottom: 1rem; }
.wa-icon, .kb-icon { width: 40px; height: 40px; background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; margin-bottom: 1rem; }
.kb-icon { background: linear-gradient(135deg, #f59e0b, #d97706); }
.wa-icon svg, .kb-icon svg { width: 20px; height: 20px; }
.wa-status { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #22c55e; font-weight: 500; }
.dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; }
.features-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
.feature-card { padding: 1.5rem; text-align: center; transition: all 0.3s; }
.feature-card:hover { transform: translateY(-3px); }
.fc-icon { width: 32px; height: 32px; color: #6366f1; margin-bottom: 0.75rem; }
.feature-card h4 { font-size: 0.95rem; margin-bottom: 0.5rem; }
.feature-card p { font-size: 0.8rem; color: #6b7280; }
@media (max-width: 768px) { .features-bento { grid-template-columns: 1fr; } .feature-main { grid-row: span 1; } }

/* CTA Section */
.cta-section { position: relative; padding: 6rem 2rem; overflow: hidden; }
.cta-bg { position: absolute; inset: 0; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); }
.cta-content { position: relative; z-index: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center; }
.cta-text { color: white; }
.cta-text h2 { font-size: clamp(1.5rem, 3vw, 2rem); margin-bottom: 1rem; }
.cta-text p { opacity: 0.9; margin-bottom: 2rem; }
.cta-image { padding: 1rem; }
.crm-preview { background: white; border-radius: 12px; overflow: hidden; }
.crm-header { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; background: #f3f4f6; }
.crm-dots { display: flex; gap: 4px; }
.crm-dots span { width: 8px; height: 8px; border-radius: 50%; background: #d1d5db; }
.crm-dots span:first-child { background: #ef4444; }
.crm-dots span:nth-child(2) { background: #f59e0b; }
.crm-dots span:nth-child(3) { background: #22c55e; }
.crm-header span { font-size: 0.75rem; color: #6b7280; margin-left: auto; }
.crm-body { padding: 1.5rem; display: flex; gap: 2rem; justify-content: center; }
.crm-stat { text-align: center; }
.crm-stat-value { display: block; font-size: 2rem; font-weight: 700; color: #6366f1; }
.crm-stat-label { font-size: 0.75rem; color: #6b7280; }
@media (max-width: 768px) { .cta-content { grid-template-columns: 1fr; text-align: center; } .cta-image { display: none; } }

/* Use Cases */
.use-cases-tabs { display: flex; justify-content: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 2rem; }
.use-cases-tabs button { padding: 0.75rem 1.5rem; border-radius: 50px; border: 1px solid #e5e7eb; background: white; font-weight: 500; cursor: pointer; transition: all 0.2s; }
.use-cases-tabs button.active { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border-color: transparent; box-shadow: 0 4px 15px rgba(99,102,241,0.3); }
.use-case-panel { display: grid; grid-template-columns: 1fr 2fr; gap: 2rem; padding: 2rem; }
.uc-image { position: relative; display: flex; align-items: center; justify-content: center; min-height: 200px; }
.uc-image-bg { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2)); border-radius: 16px; }
.uc-icon-big { position: relative; width: 80px; height: 80px; color: #6366f1; }
.uc-content h3 { font-size: 1.5rem; margin-bottom: 1rem; }
.uc-content p { color: #6b7280; margin-bottom: 1rem; line-height: 1.7; }
.uc-content blockquote { font-style: italic; color: #6b7280; border-left: 3px solid #6366f1; padding-left: 1rem; }
@media (max-width: 768px) { .use-case-panel { grid-template-columns: 1fr; } .uc-image { min-height: 120px; } }

/* Metrics */
.metrics-section { background: linear-gradient(135deg, #1e1b4b, #312e81); color: white; }
.metrics-section .section-title, .metrics-section .section-sub { color: white; }
.metrics-section .section-sub { opacity: 0.8; }
.metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
.metric { padding: 2rem; text-align: center; background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }
.metric-value { display: block; font-size: 3rem; font-weight: 800; }
.metric-value small { font-size: 1.5rem; opacity: 0.7; }
.metric-label { font-size: 0.85rem; opacity: 0.8; margin-top: 0.5rem; display: block; }

/* Support */
.support-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; }
.support-card { padding: 2rem; text-align: center; transition: all 0.3s; }
.support-card:hover { transform: translateY(-5px); }
.support-icon { width: 48px; height: 48px; color: #6366f1; margin: 0 auto 1rem; }
.support-card h4 { font-size: 1rem; margin-bottom: 0.5rem; }
.support-card p { font-size: 0.85rem; color: #6b7280; }

/* Footer */
.footer { position: relative; padding: 4rem 2rem 2rem; overflow: hidden; z-index: 1; }
.footer-bg { position: absolute; inset: 0; background: linear-gradient(135deg, #1e1b4b, #312e81); z-index: 0; }
.footer-orb { position: absolute; width: 400px; height: 400px; background: radial-gradient(circle, rgba(99,102,241,0.3), transparent); border-radius: 50%; bottom: -200px; right: -100px; animation: float 15s ease-in-out infinite; }
.footer-content { position: relative; z-index: 1; }
.footer-cta { text-align: center; padding: 3rem; margin-bottom: 3rem; background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }
.footer-cta h2 { color: white; font-size: 1.5rem; margin-bottom: 1.5rem; }
.footer-grid { display: grid; grid-template-columns: 2fr repeat(3, 1fr); gap: 2rem; color: white; margin-bottom: 3rem; }
.footer-logo { height: 60px; margin-bottom: 1rem; }
.footer-brand p { opacity: 0.7; font-size: 0.9rem; }
.footer-links h5 { font-size: 0.9rem; margin-bottom: 1rem; }
.footer-links a { display: block; color: rgba(255,255,255,0.7); text-decoration: none; font-size: 0.85rem; margin-bottom: 0.5rem; transition: color 0.2s; }
.footer-links a:hover { color: white; }
.footer-bottom { text-align: center; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.1); }
.footer-bottom p { color: rgba(255,255,255,0.5); font-size: 0.8rem; }
@media (max-width: 768px) { .footer-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 480px) { .footer-grid { grid-template-columns: 1fr; text-align: center; } }
</style>
