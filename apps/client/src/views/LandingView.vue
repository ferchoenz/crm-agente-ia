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
          <a href="https://kogniastudio.com/contacto" target="_blank" class="btn-primary">Demo gratis</a>
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
          <a href="https://kogniastudio.com/contacto" target="_blank" class="btn-primary btn-lg">Solicita una demo</a>
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
          <div class="glass-card feature-main feature-ai">
            <div class="feature-content">
              <h3>Inteligencia Artificial</h3>
              <p>Potenciada por los mejores modelos de lenguaje del mercado.</p>
            </div>
            <div class="ai-logos-showcase">
              <div class="ai-logo-item" v-for="(m, i) in aiModels" :key="i" :class="{ active: activeModel === i }">
                <img :src="m.logo" :alt="m.name" />
                <span>{{ m.name }}</span>
              </div>
            </div>
            <div class="ai-models-badges">
              <div class="model-badge" v-for="(m, i) in aiModels" :key="i" :class="{ active: activeModel === i }">
                {{ m.name }}
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
      <div class="cta-particles">
        <div v-for="i in 8" :key="i" class="cta-particle"></div>
      </div>
      <div class="container cta-content">
        <div class="cta-text">
          <h2 class="cta-title">La forma <span class="text-glow">más rápida</span> de implementar <span class="text-gradient-gold">IA</span></h2>
          <p>Automatiza la atención, captura más leads y cierra más ventas.</p>
          <a href="https://kogniastudio.com/contacto" target="_blank" class="btn-cta">🚀 Comenzar ahora</a>
        </div>
        <div class="cta-image">
          <div class="crm-preview crm-animated">
            <div class="crm-glow"></div>
            <div class="crm-header">
              <div class="crm-dots"><span></span><span></span><span></span></div>
              <span>Agentify Dashboard</span>
            </div>
            <div class="crm-body">
              <div class="crm-stat">
                <span class="crm-stat-value">{{ animatedLeads.toLocaleString() }}</span>
                <span class="crm-stat-label">Leads activos</span>
              </div>
              <div class="crm-stat">
                <span class="crm-stat-value">{{ animatedResponse }}%</span>
                <span class="crm-stat-label">Tasa respuesta</span>
              </div>
              <div class="crm-stat">
                <span class="crm-stat-value">{{ animatedConversion }}%</span>
                <span class="crm-stat-label">Conversión</span>
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
            <img :src="useCases[activeUC].image" :alt="useCases[activeUC].title" class="uc-img" />
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
        <h2 class="section-title metrics-title"><span class="text-gradient-white">El efecto</span> <span class="text-gradient-gold">Agentify</span></h2>
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
        <div class="support-carousel">
          <div class="carousel-track" :style="{ transform: `translateX(-${activeSupport * 25}%)` }">
            <div class="carousel-item glass-card" v-for="(s, i) in supportItems" :key="i" :class="{ active: activeSupport === i }">
              <div class="support-icon-wrap">
                <component :is="s.icon" class="support-icon" />
              </div>
              <h4>{{ s.title }}</h4>
              <p>{{ s.desc }}</p>
            </div>
          </div>
          <div class="carousel-dots">
            <button v-for="(s, i) in supportItems" :key="i" :class="{ active: activeSupport === i }" @click="activeSupport = i"></button>
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
          <div class="footer-logo-frame">
            <div class="logo-glow"></div>
            <img src="/logo-agentify.png" alt="Agentify" class="footer-cta-logo" />
          </div>
          <h2>¿Listo para transformar tu atención al cliente?</h2>
          <p class="footer-cta-sub">Agenda una demo gratuita y descubre cómo la IA puede impulsar tus ventas en minutos.</p>
          <a href="https://kogniastudio.com/contacto" target="_blank" class="btn-primary btn-lg btn-glow">🚀 Solicitar demo gratuita</a>
        </div>
        <div class="footer-grid">
          <div class="footer-brand">
            <img src="/logo-agentify.png" alt="Agentify" class="footer-logo" />
            <p>CRM con Inteligencia Artificial para equipos que quieren vender más.</p>
            <p class="footer-powered">Un producto de <strong>Kognia Studio</strong></p>
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
const animatedLeads = ref(0)
const animatedResponse = ref(0)
const animatedConversion = ref(0)
const activeSupport = ref(0)

const supportItems = [
  { icon: GraduationCapIcon, title: 'Capacitación Inicial', desc: 'Sesiones personalizadas para que tu equipo domine la plataforma desde el día uno.' },
  { icon: HeadphonesIcon, title: 'Soporte en Vivo', desc: 'Equipo de expertos disponible por chat y WhatsApp para resolver cualquier duda.' },
  { icon: BookOpenIcon, title: 'Base de Conocimiento', desc: 'Tutoriales, guías paso a paso y videos para aprender a tu ritmo.' },
  { icon: RefreshCwIcon, title: 'Actualizaciones', desc: 'Nuevas funciones y mejoras cada mes sin costo adicional.' }
]

const aiModels = [
  { name: 'Gemini', logo: '/gemini-logo.png' },
  { name: 'Llama', logo: '/llama-logo.png' },
  { name: 'DeepSeek', logo: '/deepseek-logo.png' }
]

const metrics = [
  { value: 85, suffix: '%', label: 'Reducción en tiempo de respuesta' },
  { value: 3, suffix: 'x', label: 'Más leads capturados' },
  { value: 40, suffix: '%', label: 'Aumento en conversiones' },
  { value: 24, suffix: '/7', label: 'Atención automatizada' }
]

const useCases = [
  { label: 'Ventas', image: '/uc-ventas.png', title: 'Equipos de Ventas', desc: 'Gestiona grandes volúmenes de leads con todas las interacciones centralizadas y enriquecidas con IA.', quote: 'Ahora es mucho más sencillo dar seguimiento sin perder el contexto.' },
  { label: 'E-commerce', image: '/uc-ecommerce.png', title: 'Tiendas en Línea', desc: 'Automatiza la atención de tu tienda. Responde sobre productos, stock y envíos 24/7.', quote: 'Nuestras ventas aumentaron 40% con el bot de Agentify.' },
  { label: 'Servicios', image: '/uc-servicios.png', title: 'Empresas de Servicios', desc: 'Gestiona citas, cotizaciones y seguimiento de clientes de forma automatizada.', quote: 'Redujimos el tiempo de respuesta de horas a segundos.' },
  { label: 'Soporte', image: '/uc-soporte.png', title: 'Atención al Cliente', desc: 'Resuelve tickets, responde FAQs y escala casos complejos automáticamente.', quote: 'El 80% de consultas se resuelven sin intervención humana.' }
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
  animateDashboard()
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

// Support carousel auto-switch
let supportInterval
onMounted(() => { supportInterval = setInterval(() => { activeSupport.value = (activeSupport.value + 1) % supportItems.length }, 3500) })
onUnmounted(() => clearInterval(supportInterval))

// Dashboard animation
function animateDashboard() {
  const targets = { leads: 1247, response: 94, conversion: 67 }
  const duration = 2000
  const steps = 60
  let step = 0
  const interval = setInterval(() => {
    step++
    const progress = step / steps
    animatedLeads.value = Math.round(targets.leads * progress)
    animatedResponse.value = Math.round(targets.response * progress)
    animatedConversion.value = Math.round(targets.conversion * progress)
    if (step >= steps) clearInterval(interval)
  }, duration / steps)
}

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
.glass-card { 
  background: linear-gradient(135deg, rgba(255,255,255,0.8), rgba(245,243,255,0.7)); 
  backdrop-filter: blur(20px); 
  border: 1px solid rgba(139,92,246,0.2); 
  border-radius: 20px; 
  box-shadow: 0 8px 32px rgba(99,102,241,0.12), inset 0 1px 0 rgba(255,255,255,0.8); 
  transition: all 0.3s ease;
}
.glass-card:hover {
  box-shadow: 0 15px 45px rgba(99,102,241,0.18), inset 0 1px 0 rgba(255,255,255,0.9);
  border-color: rgba(139,92,246,0.35);
}

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
.benefit { padding: 2.5rem 2rem; text-align: center; transition: all 0.3s; background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.12)); border: 1px solid rgba(99,102,241,0.2); backdrop-filter: blur(10px); }
.benefit:hover { transform: translateY(-8px); box-shadow: 0 20px 50px rgba(99,102,241,0.2); border-color: rgba(99,102,241,0.35); background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(245,243,255,0.85)); }
.benefit-icon { width: 70px; height: 70px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 18px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; color: white; box-shadow: 0 8px 25px rgba(99,102,241,0.3); }
.benefit-icon svg { width: 32px; height: 32px; }
.benefit h3 { font-size: 1.15rem; margin-bottom: 0.75rem; color: #1f2937; }
.benefit p { font-size: 0.9rem; color: #6b7280; line-height: 1.6; }
.meta-badge { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 1.25rem 2.5rem; width: fit-content; margin: 0 auto; background: linear-gradient(135deg, rgba(24,119,242,0.08), rgba(24,119,242,0.12)); border: 1px solid rgba(24,119,242,0.2); }
.meta-logo { height: 28px; }
.meta-badge span { font-weight: 600; color: #1877f2; font-size: 0.95rem; }

/* Features Bento */
.features-bento { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto auto; gap: 1.5rem; margin-bottom: 2rem; }
.feature-main { grid-row: span 2; padding: 2.5rem; display: flex; flex-direction: column; justify-content: flex-start; gap: 1.5rem; }
.feature-ai { background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.15)); border: 1px solid rgba(99,102,241,0.25); }
.feature-main h3 { font-size: 1.5rem; margin-bottom: 0.5rem; }
.feature-main p { color: #6b7280; margin-bottom: 0; }
.ai-logos-showcase { display: flex; gap: 1.5rem; justify-content: center; align-items: center; padding: 2rem 1rem; margin-top: auto; }
.ai-logo-item { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 1.5rem; background: rgba(255,255,255,0.7); border-radius: 16px; transition: all 0.4s; opacity: 0.4; transform: scale(0.9); }
.ai-logo-item.active { opacity: 1; transform: scale(1.1); background: white; box-shadow: 0 10px 30px rgba(99,102,241,0.2); }
.ai-logo-item img { width: 60px; height: 60px; object-fit: contain; }
.ai-logo-item span { font-size: 0.85rem; font-weight: 600; color: #4b5563; }
.ai-models-badges { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
.model-badge { padding: 0.5rem 1rem; background: rgba(99,102,241,0.1); border-radius: 50px; font-size: 0.8rem; font-weight: 500; color: #6366f1; transition: all 0.3s; }
.model-badge.active { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; box-shadow: 0 4px 12px rgba(99,102,241,0.3); }
.feature-wa, .feature-kb { padding: 1.5rem; background: linear-gradient(135deg, rgba(255,255,255,0.8), rgba(245,243,255,0.7)); }
.feature-wa h4, .feature-kb h4 { font-size: 1rem; margin-bottom: 0.5rem; }
.feature-wa p, .feature-kb p { font-size: 0.85rem; color: #6b7280; margin-bottom: 1rem; }
.wa-icon, .kb-icon { width: 44px; height: 44px; background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; margin-bottom: 1rem; box-shadow: 0 4px 12px rgba(34,197,94,0.3); }
.kb-icon { background: linear-gradient(135deg, #f59e0b, #d97706); box-shadow: 0 4px 12px rgba(245,158,11,0.3); }
.wa-icon svg, .kb-icon svg { width: 22px; height: 22px; }
.wa-status { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #22c55e; font-weight: 600; }
.dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; animation: pulse 2s infinite; }
.features-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; }
.feature-card { padding: 2rem 1.5rem; text-align: center; transition: all 0.3s; background: linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.1)); border: 1px solid rgba(99,102,241,0.15); position: relative; overflow: hidden; }
.feature-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #6366f1, #8b5cf6); transform: scaleX(0); transition: transform 0.3s; }
.feature-card:hover { transform: translateY(-5px); box-shadow: 0 15px 35px rgba(99,102,241,0.12); }
.feature-card:hover::before { transform: scaleX(1); }
.fc-icon { width: 40px; height: 40px; color: #6366f1; margin-bottom: 1rem; padding: 8px; background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.15)); border-radius: 12px; }
.feature-card h4 { font-size: 1rem; margin-bottom: 0.5rem; color: #1f2937; }
.feature-card p { font-size: 0.85rem; color: #6b7280; line-height: 1.5; }
@media (max-width: 768px) { .features-bento { grid-template-columns: 1fr; } .feature-main { grid-row: span 1; } .ai-logos-showcase { flex-wrap: wrap; } }

/* CTA Section */
.cta-section { position: relative; padding: 8rem 2rem; overflow: hidden; }
.cta-bg { position: absolute; inset: 0; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%); }
.cta-particles { position: absolute; inset: 0; overflow: hidden; }
.cta-particle { position: absolute; width: 6px; height: 6px; background: rgba(255,255,255,0.3); border-radius: 50%; animation: floatParticle 8s infinite; }
.cta-particle:nth-child(1) { left: 10%; top: 20%; animation-delay: 0s; }
.cta-particle:nth-child(2) { left: 20%; top: 80%; animation-delay: 1s; }
.cta-particle:nth-child(3) { left: 60%; top: 30%; animation-delay: 2s; }
.cta-particle:nth-child(4) { left: 80%; top: 70%; animation-delay: 3s; }
.cta-particle:nth-child(5) { left: 40%; top: 50%; animation-delay: 4s; }
.cta-particle:nth-child(6) { left: 90%; top: 40%; animation-delay: 5s; }
.cta-particle:nth-child(7) { left: 30%; top: 10%; animation-delay: 6s; }
.cta-particle:nth-child(8) { left: 70%; top: 90%; animation-delay: 7s; }
@keyframes floatParticle { 0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; } 50% { transform: translateY(-20px) scale(1.5); opacity: 0.6; } }
.cta-content { position: relative; z-index: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
.cta-text { color: white; }
.cta-title { font-size: clamp(1.8rem, 4vw, 2.8rem); margin-bottom: 1.5rem; line-height: 1.2; }
.text-glow { text-shadow: 0 0 30px rgba(255,255,255,0.5); }
.text-gradient-gold { background: linear-gradient(135deg, #fbbf24, #f59e0b, #fcd34d); -webkit-background-clip: text; background-clip: text; color: transparent; }
.text-gradient-white { background: linear-gradient(135deg, #fff, #e0e7ff); -webkit-background-clip: text; background-clip: text; color: transparent; }
.cta-text p { opacity: 0.9; margin-bottom: 2.5rem; font-size: 1.1rem; }
.btn-cta { display: inline-flex; align-items: center; gap: 0.5rem; background: white; color: #6366f1; padding: 1.25rem 2.5rem; border-radius: 50px; font-weight: 700; font-size: 1.1rem; text-decoration: none; box-shadow: 0 10px 40px rgba(0,0,0,0.2); transition: all 0.3s; }
.btn-cta:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 15px 50px rgba(0,0,0,0.3); }
.btn-glow { animation: btnGlow 2s infinite; }
@keyframes btnGlow { 0%, 100% { box-shadow: 0 4px 15px rgba(99,102,241,0.4); } 50% { box-shadow: 0 4px 30px rgba(99,102,241,0.7), 0 0 60px rgba(99,102,241,0.3); } }
.cta-image { perspective: 1000px; }
.crm-preview { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.25); }
.crm-animated { animation: floatDashboard 4s ease-in-out infinite; position: relative; }
.crm-glow { position: absolute; inset: -2px; background: linear-gradient(135deg, #6366f1, #a855f7, #6366f1); border-radius: 18px; z-index: -1; animation: rotateGlow 3s linear infinite; }
@keyframes floatDashboard { 0%, 100% { transform: translateY(0) rotateX(2deg); } 50% { transform: translateY(-10px) rotateX(-2deg); } }
@keyframes rotateGlow { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg); } }
.crm-header { display: flex; align-items: center; gap: 0.5rem; padding: 1rem 1.25rem; background: linear-gradient(135deg, #f8fafc, #f1f5f9); }
.crm-dots { display: flex; gap: 6px; }
.crm-dots span { width: 10px; height: 10px; border-radius: 50%; }
.crm-dots span:first-child { background: #ef4444; }
.crm-dots span:nth-child(2) { background: #f59e0b; }
.crm-dots span:nth-child(3) { background: #22c55e; }
.crm-header > span { font-size: 0.8rem; color: #64748b; margin-left: auto; font-weight: 500; }
.crm-body { padding: 2rem; display: flex; gap: 2rem; justify-content: center; background: white; }
.crm-stat { text-align: center; padding: 0 1rem; }
.crm-stat-value { display: block; font-size: 2.5rem; font-weight: 800; background: linear-gradient(135deg, #6366f1, #8b5cf6); -webkit-background-clip: text; background-clip: text; color: transparent; }
.crm-stat-label { font-size: 0.8rem; color: #64748b; font-weight: 500; }
@media (max-width: 768px) { .cta-content { grid-template-columns: 1fr; text-align: center; } .cta-image { display: none; } }

/* Use Cases */
.use-cases-tabs { display: flex; justify-content: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 2rem; }
.use-cases-tabs button { padding: 0.75rem 1.5rem; border-radius: 50px; border: 1px solid #e5e7eb; background: white; font-weight: 500; cursor: pointer; transition: all 0.2s; }
.use-cases-tabs button.active { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border-color: transparent; box-shadow: 0 4px 15px rgba(99,102,241,0.3); }
.use-case-panel { display: grid; grid-template-columns: 1fr 2fr; gap: 2rem; padding: 2.5rem; background: linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.1)); }
.uc-image { position: relative; display: flex; align-items: center; justify-content: center; min-height: 250px; overflow: hidden; border-radius: 16px; }
.uc-image-bg { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.3)); border-radius: 16px; backdrop-filter: blur(10px); }
.uc-img { position: relative; width: 100%; height: 100%; object-fit: cover; border-radius: 12px; z-index: 1; animation: ucFadeIn 0.5s ease; box-shadow: 0 10px 30px rgba(99,102,241,0.2); }
@keyframes ucFadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
.uc-content h3 { font-size: 1.5rem; margin-bottom: 1rem; }
.uc-content p { color: #6b7280; margin-bottom: 1rem; line-height: 1.7; }
.uc-content blockquote { font-style: italic; color: #6b7280; border-left: 3px solid #6366f1; padding-left: 1rem; }
@media (max-width: 768px) { .use-case-panel { grid-template-columns: 1fr; } .uc-image { min-height: 120px; } }

/* Metrics */
.metrics-section { background: linear-gradient(135deg, #1e1b4b, #312e81, #4c1d95); color: white; position: relative; overflow: hidden; }
.metrics-section::before { content: ''; position: absolute; inset: 0; background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); }
.metrics-section .section-title, .metrics-section .section-sub { color: white; position: relative; }
.metrics-title { font-size: clamp(2rem, 5vw, 3rem); }
.metrics-section .section-sub { opacity: 0.8; }
.metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; position: relative; }
.metric { padding: 2.5rem 2rem; text-align: center; background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05)); border: 1px solid rgba(255,255,255,0.15); backdrop-filter: blur(10px); transition: all 0.3s; }
.metric:hover { transform: translateY(-5px); background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08)); }
.metric-value { display: block; font-size: 3.5rem; font-weight: 800; background: linear-gradient(135deg, #fff, #c4b5fd); -webkit-background-clip: text; background-clip: text; color: transparent; }
.metric-value small { font-size: 1.5rem; opacity: 0.8; }
.metric-label { font-size: 0.9rem; opacity: 0.85; margin-top: 0.75rem; display: block; }

/* Support Carousel */
.support-carousel { position: relative; overflow: hidden; padding: 1rem 0; }
.carousel-track { display: flex; gap: 1.5rem; transition: transform 0.5s ease; padding: 1rem; }
.carousel-item { min-width: calc(25% - 1.125rem); flex-shrink: 0; padding: 2.5rem 2rem; text-align: center; background: linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.1)); border: 1px solid rgba(99,102,241,0.15); transition: all 0.4s; opacity: 0.6; transform: scale(0.95); filter: blur(1px); }
.carousel-item.active { opacity: 1; transform: scale(1.05); filter: blur(0); box-shadow: 0 20px 50px rgba(99,102,241,0.2); border-color: rgba(99,102,241,0.3); background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(245,243,255,0.85)); }
.support-icon-wrap { width: 70px; height: 70px; margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 20px; box-shadow: 0 8px 25px rgba(99,102,241,0.3); }
.support-icon { width: 32px; height: 32px; color: white; }
.carousel-item h4 { font-size: 1.2rem; margin-bottom: 0.75rem; color: #1f2937; }
.carousel-item p { font-size: 0.9rem; color: #6b7280; line-height: 1.6; }
.carousel-dots { display: flex; justify-content: center; gap: 0.75rem; margin-top: 2rem; }
.carousel-dots button { width: 12px; height: 12px; border-radius: 50%; border: none; background: rgba(99,102,241,0.2); cursor: pointer; transition: all 0.3s; }
.carousel-dots button.active { background: linear-gradient(135deg, #6366f1, #8b5cf6); transform: scale(1.2); box-shadow: 0 2px 8px rgba(99,102,241,0.4); }
@media (max-width: 1024px) { .carousel-item { min-width: calc(50% - 0.75rem); } }
@media (max-width: 640px) { .carousel-item { min-width: 100%; } }

/* Footer */
.footer { position: relative; padding: 5rem 2rem 2rem; overflow: hidden; z-index: 1; }
.footer-bg { position: absolute; inset: 0; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%); z-index: 0; }
.footer-orb { position: absolute; width: 500px; height: 500px; background: radial-gradient(circle, rgba(139,92,246,0.4), transparent 70%); border-radius: 50%; bottom: -250px; right: -150px; animation: float 15s ease-in-out infinite; }
.footer-orb::before { content: ''; position: absolute; width: 300px; height: 300px; background: radial-gradient(circle, rgba(99,102,241,0.3), transparent 70%); border-radius: 50%; top: -100px; left: -200px; animation: float 12s ease-in-out infinite reverse; }
.footer-content { position: relative; z-index: 1; }
.footer-cta { text-align: center; padding: 4rem 3rem; margin-bottom: 4rem; background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05)); border: 1px solid rgba(255,255,255,0.15); backdrop-filter: blur(20px); }
.footer-logo-frame { position: relative; width: 100px; height: 100px; margin: 0 auto 2rem; display: flex; align-items: center; justify-content: center; }
.logo-glow { position: absolute; inset: -10px; background: radial-gradient(circle, rgba(139,92,246,0.6), transparent 70%); border-radius: 50%; animation: glowPulse 3s ease-in-out infinite; }
@keyframes glowPulse { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.1); } }
.footer-cta-logo { position: relative; width: 80px; height: 80px; object-fit: contain; filter: drop-shadow(0 0 15px rgba(139,92,246,0.5)); }
.footer-cta h2 { color: white; font-size: clamp(1.5rem, 3vw, 2.2rem); margin-bottom: 1rem; }
.footer-cta-sub { color: rgba(255,255,255,0.8); font-size: 1rem; margin-bottom: 2rem; max-width: 500px; margin-left: auto; margin-right: auto; line-height: 1.6; }
.footer-grid { display: grid; grid-template-columns: 2fr repeat(3, 1fr); gap: 3rem; color: white; margin-bottom: 3rem; }
.footer-logo { height: 70px; margin-bottom: 1rem; animation: floatLogo 3s ease-in-out infinite; filter: drop-shadow(0 0 20px rgba(139,92,246,0.5)); }
@keyframes floatLogo { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
.footer-brand p { opacity: 0.8; font-size: 0.95rem; line-height: 1.6; margin-bottom: 0.75rem; }
.footer-powered { opacity: 0.6; font-size: 0.85rem; }
.footer-links h5 { font-size: 0.95rem; margin-bottom: 1.25rem; font-weight: 600; }
.footer-links a { display: block; color: rgba(255,255,255,0.7); text-decoration: none; font-size: 0.9rem; margin-bottom: 0.75rem; transition: all 0.2s; }
.footer-links a:hover { color: white; transform: translateX(3px); }
.footer-bottom { text-align: center; padding-top: 2.5rem; border-top: 1px solid rgba(255,255,255,0.1); }
.footer-bottom p { color: rgba(255,255,255,0.6); font-size: 0.85rem; }
@media (max-width: 768px) { .footer-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 480px) { .footer-grid { grid-template-columns: 1fr; text-align: center; } }
</style>
