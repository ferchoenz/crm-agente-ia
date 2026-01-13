<template>
  <div class="privacy-page">
    <!-- Animated Background -->
    <div class="bg-effects">
      <div class="gradient-blob gradient-blob-1"></div>
      <div class="gradient-blob gradient-blob-2"></div>
      <div class="gradient-blob gradient-blob-3"></div>
    </div>
    
    <div class="content-wrapper">
      <!-- Header with Logo -->
      <header class="privacy-header">
        <router-link to="/login" class="back-link">
          <ArrowLeftIcon class="w-4 h-4" />
          <span>Volver al inicio</span>
        </router-link>
        
        <div class="brand-section">
          <!-- Logo placeholder - will be replaced with actual logo -->
          <div class="logo-container">
            <div class="logo-placeholder">
              <SparklesIcon class="logo-icon" />
            </div>
          </div>
          <div class="brand-text">
            <h1 class="brand-title">Política de Privacidad</h1>
            <p class="brand-subtitle">Agentify Chat — Un producto de <strong>Kognia Studio</strong></p>
          </div>
        </div>
        
        <p class="last-updated">Última actualización: {{ lastUpdated }}</p>
      </header>

      <!-- Main Content -->
      <main class="privacy-content">
        <div class="content-card">
          
          <!-- Introduction -->
          <section class="intro-section">
            <div class="intro-badge">
              <ShieldCheckIcon class="badge-icon" />
              <span>Tu privacidad es nuestra prioridad</span>
            </div>
            <p class="intro-text">
              <strong>Agentify Chat</strong> es un producto desarrollado y operado por <strong>Kognia Studio</strong>. 
              Esta política describe cómo recopilamos, usamos y protegemos tu información.
            </p>
          </section>

          <div class="divider"></div>
          
          <section>
            <h2 class="section-title">
              <span class="section-number">01</span>
              Información que Recopilamos
            </h2>
            <p class="section-text">
              Agentify Chat recopila la siguiente información para proporcionar nuestros servicios:
            </p>
            <ul class="feature-list">
              <li><strong>Información de cuenta:</strong> Nombre, correo electrónico, y datos de la organización.</li>
              <li><strong>Datos de integración:</strong> Tokens de acceso de Facebook, Instagram y WhatsApp Business para permitir la comunicación con tus clientes.</li>
              <li><strong>Mensajes:</strong> Contenido de las conversaciones entre tu negocio y tus clientes a través de las plataformas conectadas.</li>
              <li><strong>Información de clientes:</strong> Nombres, números de teléfono y datos de contacto de los leads generados.</li>
            </ul>
          </section>

          <section>
            <h2 class="section-title">
              <span class="section-number">02</span>
              Cómo Usamos la Información
            </h2>
            <p class="section-text">
              Utilizamos la información recopilada para:
            </p>
            <ul class="feature-list">
              <li>Procesar y responder mensajes de tus clientes</li>
              <li>Proporcionar respuestas automatizadas mediante inteligencia artificial</li>
              <li>Gestionar leads y oportunidades de venta</li>
              <li>Programar citas y recordatorios</li>
              <li>Mejorar y personalizar nuestros servicios</li>
              <li>Enviar notificaciones relacionadas con el servicio</li>
            </ul>
          </section>

          <section>
            <h2 class="section-title">
              <span class="section-number">03</span>
              Integraciones con Terceros
            </h2>
            <p class="section-text">
              Agentify Chat se integra con las siguientes plataformas:
            </p>
            <div class="integrations-grid">
              <div class="integration-card">
                <div class="integration-icon meta"></div>
                <span>Meta (Facebook e Instagram)</span>
              </div>
              <div class="integration-card">
                <div class="integration-icon whatsapp"></div>
                <span>WhatsApp Business</span>
              </div>
              <div class="integration-card">
                <div class="integration-icon google"></div>
                <span>Google Calendar</span>
              </div>
              <div class="integration-card">
                <div class="integration-icon openai"></div>
                <span>OpenAI</span>
              </div>
            </div>
            <p class="section-text mt-4">
              Al conectar estas plataformas, aceptas sus respectivas políticas de privacidad y términos de servicio.
            </p>
          </section>

          <section>
            <h2 class="section-title">
              <span class="section-number">04</span>
              Seguridad de los Datos
            </h2>
            <p class="section-text">
              Implementamos medidas de seguridad técnicas y organizativas para proteger tu información:
            </p>
            <div class="security-grid">
              <div class="security-item">
                <LockIcon class="security-icon" />
                <span>Encriptación de datos sensibles</span>
              </div>
              <div class="security-item">
                <ShieldIcon class="security-icon" />
                <span>Conexiones seguras HTTPS/TLS</span>
              </div>
              <div class="security-item">
                <KeyIcon class="security-icon" />
                <span>Acceso basado en roles</span>
              </div>
              <div class="security-item">
                <EyeIcon class="security-icon" />
                <span>Monitoreo de actividades</span>
              </div>
            </div>
          </section>

          <section>
            <h2 class="section-title">
              <span class="section-number">05</span>
              Retención de Datos
            </h2>
            <p class="section-text">
              Conservamos tu información mientras mantengas una cuenta activa con nosotros. Puedes solicitar la eliminación de tus datos en cualquier momento contactándonos. Los datos de mensajes pueden conservarse según los requisitos legales aplicables.
            </p>
          </section>

          <section>
            <h2 class="section-title">
              <span class="section-number">06</span>
              Tus Derechos
            </h2>
            <p class="section-text">
              Tienes derecho a:
            </p>
            <ul class="feature-list">
              <li>Acceder a tu información personal</li>
              <li>Corregir datos inexactos</li>
              <li>Solicitar la eliminación de tus datos</li>
              <li>Revocar el acceso a las integraciones en cualquier momento</li>
              <li>Exportar tus datos</li>
            </ul>
          </section>

          <section>
            <h2 class="section-title">
              <span class="section-number">07</span>
              Uso de Datos de Facebook
            </h2>
            <p class="section-text">
              Cuando conectas tu página de Facebook o cuenta de Instagram, obtenemos acceso limitado a:
            </p>
            <ul class="feature-list">
              <li>Mensajes recibidos en tu página o cuenta business</li>
              <li>Información básica de tu página</li>
              <li>Perfiles públicos de usuarios que te contactan</li>
            </ul>
            <div class="highlight-box">
              <AlertCircleIcon class="highlight-icon" />
              <p><strong>No vendemos ni compartimos esta información con terceros</strong> excepto según sea necesario para proporcionar el servicio.</p>
            </div>
          </section>

          <section>
            <h2 class="section-title">
              <span class="section-number">08</span>
              Eliminación de Datos
            </h2>
            <p class="section-text">
              Puedes solicitar la eliminación de todos tus datos contactándonos. También puedes:
            </p>
            <ul class="feature-list">
              <li>Desconectar integraciones desde la configuración de tu cuenta</li>
              <li>Revocar permisos directamente desde Facebook, Instagram o WhatsApp</li>
              <li>Eliminar tu cuenta completamente</li>
            </ul>
          </section>

          <section>
            <h2 class="section-title">
              <span class="section-number">09</span>
              Contacto
            </h2>
            <p class="section-text">
              Si tienes preguntas sobre esta política de privacidad o deseas ejercer tus derechos, contáctanos:
            </p>
            <div class="contact-card">
              <div class="contact-item">
                <MailIcon class="contact-icon" />
                <div>
                  <span class="contact-label">Email</span>
                  <a href="mailto:info@kogniastudio.com" class="contact-value">info@kogniastudio.com</a>
                </div>
              </div>
              <div class="contact-item">
                <GlobeIcon class="contact-icon" />
                <div>
                  <span class="contact-label">Sitio web</span>
                  <a href="https://kogniastudio.com" target="_blank" class="contact-value">kogniastudio.com</a>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 class="section-title">
              <span class="section-number">10</span>
              Cambios a Esta Política
            </h2>
            <p class="section-text">
              Podemos actualizar esta política de privacidad ocasionalmente. Te notificaremos sobre cambios significativos mediante correo electrónico o un aviso en nuestro servicio.
            </p>
          </section>

        </div>
      </main>

      <!-- Footer -->
      <footer class="privacy-footer">
        <div class="footer-brand">
          <SparklesIcon class="footer-icon" />
          <span>Kognia Studio</span>
        </div>
        <p>© {{ currentYear }} Kognia Studio. Todos los derechos reservados.</p>
        <p class="footer-note">Agentify Chat es un producto de Kognia Studio</p>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { 
  ArrowLeft as ArrowLeftIcon,
  Sparkles as SparklesIcon,
  ShieldCheck as ShieldCheckIcon,
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

<style scoped>
.privacy-page {
  min-height: 100vh;
  position: relative;
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
  color: #e2e8f0;
  overflow-x: hidden;
}

/* Animated Background */
.bg-effects {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.gradient-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
  animation: float 20s ease-in-out infinite;
}

.gradient-blob-1 {
  width: 600px;
  height: 600px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  top: -200px;
  right: -200px;
}

.gradient-blob-2 {
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);
  bottom: -150px;
  left: -150px;
  animation-delay: -7s;
}

.gradient-blob-3 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #14b8a6 0%, #22d3ee 100%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -14s;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}

.content-wrapper {
  position: relative;
  z-index: 10;
  max-width: 900px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
}

/* Header */
.privacy-header {
  text-align: center;
  margin-bottom: 3rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #a78bfa;
  text-decoration: none;
  font-size: 0.875rem;
  margin-bottom: 2rem;
  transition: all 0.2s;
}

.back-link:hover {
  color: #c4b5fd;
}

.brand-section {
  margin-bottom: 1.5rem;
}

.logo-container {
  margin-bottom: 1.5rem;
}

.logo-placeholder {
  width: 80px;
  height: 80px;
  margin: 0 auto;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 20px 40px rgba(99, 102, 241, 0.3);
}

.logo-icon {
  width: 40px;
  height: 40px;
  color: white;
}

.brand-title {
  font-size: 3rem;
  font-weight: 800;
  background: linear-gradient(135deg, #fff 0%, #c4b5fd 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.brand-subtitle {
  font-size: 1.125rem;
  color: #94a3b8;
}

.brand-subtitle strong {
  color: #c4b5fd;
}

.last-updated {
  color: #64748b;
  font-size: 0.875rem;
}

/* Content Card */
.content-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 2rem;
  padding: 3rem;
  backdrop-filter: blur(20px);
}

/* Intro Section */
.intro-section {
  text-align: center;
  padding-bottom: 2rem;
}

.intro-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  color: #4ade80;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 1rem;
}

.badge-icon {
  width: 18px;
  height: 18px;
}

.intro-text {
  color: #cbd5e1;
  font-size: 1.125rem;
  line-height: 1.8;
}

.divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  margin: 2rem 0;
}

/* Sections */
section {
  margin-bottom: 2.5rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 1rem;
}

.section-number {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.1);
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
}

.section-text {
  color: #94a3b8;
  line-height: 1.8;
}

.mt-4 {
  margin-top: 1rem;
}

/* Feature List */
.feature-list {
  list-style: none;
  padding: 0;
  margin: 1rem 0;
}

.feature-list li {
  padding: 0.75rem 0 0.75rem 2rem;
  color: #cbd5e1;
  position: relative;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.feature-list li:last-child {
  border-bottom: none;
}

.feature-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 1.1rem;
  width: 8px;
  height: 8px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 50%;
}

.feature-list li strong {
  color: #f1f5f9;
}

/* Integrations Grid */
.integrations-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin: 1.5rem 0;
}

.integration-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 1rem;
  color: #cbd5e1;
}

.integration-icon {
  width: 40px;
  height: 40px;
  border-radius: 0.75rem;
}

.integration-icon.meta {
  background: linear-gradient(135deg, #1877f2, #0668e1);
}

.integration-icon.whatsapp {
  background: linear-gradient(135deg, #25d366, #128c7e);
}

.integration-icon.google {
  background: linear-gradient(135deg, #4285f4, #34a853);
}

.integration-icon.openai {
  background: linear-gradient(135deg, #10a37f, #1a7f64);
}

/* Security Grid */
.security-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin: 1.5rem 0;
}

.security-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #cbd5e1;
  font-size: 0.9rem;
}

.security-icon {
  width: 20px;
  height: 20px;
  color: #6366f1;
}

/* Highlight Box */
.highlight-box {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 1rem;
  padding: 1.25rem;
  margin-top: 1.5rem;
}

.highlight-icon {
  width: 24px;
  height: 24px;
  color: #4ade80;
  flex-shrink: 0;
  margin-top: 2px;
}

.highlight-box p {
  color: #a3e635;
  margin: 0;
  line-height: 1.6;
}

/* Contact Card */
.contact-card {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 1.5rem;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 1rem;
}

.contact-icon {
  width: 24px;
  height: 24px;
  color: #a78bfa;
}

.contact-label {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
  margin-bottom: 0.25rem;
}

.contact-value {
  color: #c4b5fd;
  text-decoration: none;
  font-weight: 500;
}

.contact-value:hover {
  text-decoration: underline;
}

/* Footer */
.privacy-footer {
  text-align: center;
  padding-top: 3rem;
  color: #64748b;
  font-size: 0.875rem;
}

.footer-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #a78bfa;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.footer-icon {
  width: 18px;
  height: 18px;
}

.footer-note {
  margin-top: 0.5rem;
  font-size: 0.75rem;
}

/* Responsive */
@media (max-width: 768px) {
  .content-card {
    padding: 2rem 1.5rem;
  }
  
  .brand-title {
    font-size: 2rem;
  }
  
  .integrations-grid,
  .security-grid,
  .contact-card {
    grid-template-columns: 1fr;
  }
}
</style>
