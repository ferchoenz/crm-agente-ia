<template>
  <div class="login-container">
    <!-- Animated Background -->
    <div class="bg-canvas">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
      <div class="mesh-grid"></div>
    </div>

    <!-- Floating Particles -->
    <div class="particles">
      <div v-for="i in 20" :key="i" class="particle" :style="getParticleStyle(i)"></div>
    </div>

    <!-- Main Content -->
    <div class="login-wrapper">
      <!-- Left Side - Branding -->
      <div class="login-branding">
        <div class="brand-content">
          <!-- Hero Logo with Glow -->
          <div class="hero-logo-wrapper">
            <div class="logo-glow-ring"></div>
            <div class="logo-frame">
              <img src="/logo-agentify.png" alt="Agentify Chat" class="hero-logo" />
            </div>
          </div>
          
          <!-- Brand Name -->
          <h1 class="hero-title">Agentify Chat</h1>
          
          <!-- Tagline -->
          <p class="hero-tagline">
            CRM con Inteligencia Artificial
          </p>
          
          <!-- Divider -->
          <div class="hero-divider"></div>

          <!-- Features -->
          <div class="features-list">
            <div class="feature-chip">
              <MessageCircleIcon class="w-4 h-4" />
              <span>WhatsApp & Messenger</span>
            </div>
            <div class="feature-chip">
              <BrainIcon class="w-4 h-4" />
              <span>IA Conversacional</span>
            </div>
            <div class="feature-chip">
              <TrendingUpIcon class="w-4 h-4" />
              <span>Lead Scoring</span>
            </div>
            <div class="feature-chip">
              <CalendarIcon class="w-4 h-4" />
              <span>Agenda Automática</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side - Login Form -->
      <div class="login-form-section">
        <div class="form-card">
          <div class="form-header">
            <h2>Bienvenido</h2>
            <p>Ingresa tus credenciales para continuar</p>
          </div>

          <form @submit.prevent="handleLogin" class="login-form">
            <!-- Email Field -->
            <div class="input-group">
              <label>Correo electrónico</label>
              <div class="input-wrapper" :class="{ 'focused': emailFocused, 'has-value': email }">
                <MailIcon class="input-icon" />
                <input
                  v-model="email"
                  type="email"
                  placeholder="tu@email.com"
                  required
                  :disabled="loading"
                  @focus="emailFocused = true"
                  @blur="emailFocused = false"
                />
                <div class="input-border"></div>
              </div>
            </div>

            <!-- Password Field -->
            <div class="input-group">
              <div class="label-row">
                <label>Contraseña</label>
                <a href="https://kogniastudio.com/contacto" target="_blank" class="forgot-link">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div class="input-wrapper" :class="{ 'focused': passwordFocused, 'has-value': password }">
                <LockIcon class="input-icon" />
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="••••••••"
                  required
                  :disabled="loading"
                  @focus="passwordFocused = true"
                  @blur="passwordFocused = false"
                />
                <button type="button" @click="showPassword = !showPassword" class="toggle-password">
                  <component :is="showPassword ? EyeOffIcon : EyeIcon" />
                </button>
                <div class="input-border"></div>
              </div>
            </div>

            <!-- Remember Me -->
            <label class="remember-checkbox">
              <input type="checkbox" v-model="rememberMe" />
              <span class="checkbox-custom"></span>
              <span class="checkbox-label">Mantener sesión iniciada</span>
            </label>

            <!-- Error Message -->
            <Transition name="shake">
              <div v-if="error" class="error-message">
                <AlertCircleIcon class="error-icon" />
                <span>{{ error }}</span>
              </div>
            </Transition>

            <!-- Submit Button -->
            <button type="submit" class="submit-btn" :class="{ 'loading': loading }" :disabled="loading">
              <span class="btn-content">
                <span v-if="!loading">Iniciar sesión</span>
                <span v-else>Verificando...</span>
              </span>
              <div class="btn-shimmer"></div>
              <ArrowRightIcon v-if="!loading" class="btn-arrow" />
              <LoaderIcon v-else class="btn-loader" />
            </button>
          </form>

          <!-- Request Access -->
          <div class="request-access">
            <p>¿No tienes cuenta?</p>
            <a href="https://kogniastudio.com" target="_blank" class="access-link">
              <SparklesIcon class="access-icon" />
              Conoce más sobre este sistema
            </a>
          </div>
        </div>

        <!-- Footer Branding -->
        <div class="login-footer">
          <p>© {{ currentYear }} Todos los derechos reservados</p>
          <div class="footer-links">
            <router-link to="/privacy" class="footer-link">Política de Privacidad</router-link>
          </div>
          <div class="powered-by">
            <span>Powered by</span>
            <a href="https://kogniastudio.com" target="_blank" class="kognia-brand">
              <SparklesIcon class="kognia-icon" />
              <span>Kognia Studio</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import {
  Sparkles as SparklesIcon,
  Mail as MailIcon,
  Lock as LockIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  ArrowRight as ArrowRightIcon,
  Loader2 as LoaderIcon,
  AlertCircle as AlertCircleIcon,
  MessageCircle as MessageCircleIcon,
  Brain as BrainIcon,
  TrendingUp as TrendingUpIcon,
  Calendar as CalendarIcon
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(false)
const loading = ref(false)
const error = ref('')
const emailFocused = ref(false)
const passwordFocused = ref(false)

const currentYear = computed(() => new Date().getFullYear())

function getParticleStyle(index) {
  const size = Math.random() * 4 + 2
  const left = Math.random() * 100
  const delay = Math.random() * 8
  const duration = Math.random() * 10 + 15
  
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
}

async function handleLogin() {
  loading.value = true
  error.value = ''
  
  try {
    await authStore.login(email.value, password.value)
    
    if (authStore.user?.role === 'super_admin') {
      router.push('/superadmin/dashboard')
    } else {
      router.push('/dashboard')
    }
  } catch (err) {
    error.value = err.response?.data?.error || 'Credenciales inválidas'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #f0fdfa 100%);
}

/* Animated Background */
.bg-canvas {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.6;
  animation: float 20s ease-in-out infinite;
}

.orb-1 {
  width: 600px;
  height: 600px;
  background: linear-gradient(135deg, #818cf8 0%, #c084fc 100%);
  top: -200px;
  left: -100px;
}

.orb-2 {
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #2dd4bf 0%, #22d3ee 100%);
  bottom: -150px;
  right: -100px;
  animation-delay: -5s;
}

.orb-3 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #fb7185 0%, #fbbf24 100%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -10s;
  opacity: 0.3;
}

.mesh-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
}

/* Floating Particles */
.particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.particle {
  position: absolute;
  background: linear-gradient(135deg, #818cf8, #c084fc);
  border-radius: 50%;
  bottom: -20px;
  opacity: 0.6;
  animation: rise linear infinite;
}

@keyframes rise {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.6;
  }
  90% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(-100vh) rotate(720deg);
    opacity: 0;
  }
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -30px) scale(1.05);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.95);
  }
}

/* Main Wrapper */
.login-wrapper {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  max-width: 1100px;
  min-height: 650px;
  margin: 2rem;
  border-radius: 32px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  box-shadow: 
    0 0 0 1px rgba(255, 255, 255, 0.5),
    0 25px 50px -12px rgba(0, 0, 0, 0.15),
    0 0 100px rgba(129, 140, 248, 0.1);
}

/* Left Branding Side */
.login-branding {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%);
  padding: 3rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.login-branding::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.brand-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* Hero Logo */
.hero-logo-wrapper {
  position: relative;
  margin-bottom: 2rem;
}

.logo-glow-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
  border-radius: 50%;
  animation: glowPulse 3s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.1); }
}

.logo-frame {
  position: relative;
  width: 160px;
  height: 160px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 32px;
  padding: 16px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.25);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
}

/* Hero Title */
.hero-title {
  font-size: 2.75rem;
  font-weight: 800;
  background: linear-gradient(135deg, #ffffff 0%, #fde68a 50%, #fbbf24 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.75rem;
  letter-spacing: -0.02em;
}

/* Hero Tagline */
.hero-tagline {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
  margin-bottom: 2rem;
}

/* Divider */
.hero-divider {
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
  border-radius: 2px;
  margin-bottom: 2rem;
}

/* Features List */
.features-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  width: 100%;
  max-width: 320px;
}

.feature-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s;
}

.feature-chip:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}


/* Right Form Side */
.login-form-section {
  padding: 3rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: white;
}

.form-card {
  max-width: 380px;
  margin: 0 auto;
  width: 100%;
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;
}

.form-header h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.form-header p {
  color: #6b7280;
  font-size: 0.95rem;
}

/* Input Group */
.input-group {
  margin-bottom: 1.5rem;
}

.input-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.forgot-link {
  font-size: 0.8rem;
  color: #6366f1;
  text-decoration: none;
  transition: color 0.2s;
}

.forgot-link:hover {
  color: #4f46e5;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 3rem;
  font-size: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: #f9fafb;
  color: #1f2937;
  transition: all 0.3s ease;
  outline: none;
}

.input-wrapper input::placeholder {
  color: #9ca3af;
}

.input-wrapper.focused input,
.input-wrapper.has-value input {
  border-color: #6366f1;
  background: white;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.input-icon {
  position: absolute;
  left: 1rem;
  width: 20px;
  height: 20px;
  color: #9ca3af;
  transition: color 0.3s;
  pointer-events: none;
}

.input-wrapper.focused .input-icon,
.input-wrapper.has-value .input-icon {
  color: #6366f1;
}

.toggle-password {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  padding: 0.25rem;
  display: flex;
  transition: color 0.2s;
}

.toggle-password:hover {
  color: #6366f1;
}

.toggle-password svg {
  width: 20px;
  height: 20px;
}

/* Remember Checkbox */
.remember-checkbox {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  margin-bottom: 1.5rem;
}

.remember-checkbox input {
  display: none;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 6px;
  position: relative;
  transition: all 0.2s;
}

.remember-checkbox input:checked + .checkbox-custom {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-color: transparent;
}

.remember-checkbox input:checked + .checkbox-custom::after {
  content: '';
  position: absolute;
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-label {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Error Message */
.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  margin-bottom: 1.5rem;
}

.error-icon {
  width: 18px;
  height: 18px;
  color: #ef4444;
  flex-shrink: 0;
}

.error-message span {
  font-size: 0.875rem;
  color: #dc2626;
}

/* Submit Button */
.submit-btn {
  width: 100%;
  padding: 1rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-shimmer {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  100% { left: 100%; }
}

.btn-arrow, .btn-loader {
  width: 20px;
  height: 20px;
  transition: transform 0.3s;
}

.submit-btn:hover .btn-arrow {
  transform: translateX(4px);
}

.btn-loader {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

/* Request Access */
.request-access {
  margin-top: 2rem;
  text-align: center;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.request-access p {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.75rem;
}

.access-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%);
  border: 1px solid #e0e7ff;
  border-radius: 10px;
  color: #6366f1;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
}

.access-link:hover {
  background: linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%);
  transform: translateY(-1px);
}

.access-icon {
  width: 18px;
  height: 18px;
}

/* Footer */
.login-footer {
  margin-top: 2rem;
  text-align: center;
}

.login-footer > p {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-bottom: 0.5rem;
}

.powered-by {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #6b7280;
}

.kognia-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: #6366f1;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
}

.kognia-brand:hover {
  color: #4f46e5;
}

.kognia-icon {
  width: 14px;
  height: 14px;
}

.footer-links {
  margin: 0.5rem 0;
}

.footer-link {
  color: #6366f1;
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.2s;
}

.footer-link:hover {
  color: #4f46e5;
  text-decoration: underline;
}

/* Animations */
.shake-enter-active {
  animation: shake 0.5s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}

/* Responsive */
@media (max-width: 900px) {
  .login-wrapper {
    grid-template-columns: 1fr;
    max-width: 450px;
  }
  
  .login-branding {
    display: none;
  }
  
  .login-form-section {
    padding: 2rem;
  }
}
</style>
