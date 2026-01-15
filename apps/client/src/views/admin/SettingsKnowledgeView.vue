<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">Base de Conocimiento</h2>
        <p class="text-slate-500">Sube documentos para que la IA use información real de tu empresa</p>
      </div>
      <button @click="showUploadModal = true" class="btn-primary">
        <PlusIcon class="w-4 h-4 mr-2" />
        Agregar Documento
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-3 gap-4">
      <div class="bg-white rounded-xl border border-slate-200 p-4">
        <div class="text-2xl font-bold text-slate-800">{{ documents.length }}</div>
        <div class="text-sm text-slate-500">Documentos totales</div>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 p-4">
        <div class="text-2xl font-bold text-emerald-600">{{ activeDocuments }}</div>
        <div class="text-sm text-slate-500">Documentos activos</div>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 p-4">
        <div class="text-2xl font-bold text-primary-600">{{ totalChunks }}</div>
        <div class="text-sm text-slate-500">Fragmentos indexados</div>
      </div>
    </div>

    <!-- Documents List -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="p-4 border-b border-slate-200">
        <h3 class="font-semibold text-slate-800">Documentos</h3>
      </div>
      
      <div v-if="loading" class="p-8 text-center">
        <LoaderIcon class="w-8 h-8 mx-auto animate-spin text-primary-500" />
        <p class="mt-2 text-slate-500">Cargando documentos...</p>
      </div>
      
      <div v-else-if="documents.length === 0" class="p-8 text-center">
        <FileTextIcon class="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <p class="text-slate-500">No hay documentos todavía</p>
        <button @click="showUploadModal = true" class="btn-secondary mt-3">
          Subir primer documento
        </button>
      </div>
      
      <div v-else class="divide-y divide-slate-100">
        <div 
          v-for="doc in documents" 
          :key="doc._id"
          class="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" :class="getTypeColor(doc.type)">
              <component :is="getTypeIcon(doc.type)" class="w-5 h-5" />
            </div>
            <div>
              <h4 class="font-medium text-slate-800">{{ doc.title }}</h4>
              <div class="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                <span class="badge" :class="getCategoryBadge(doc.category)">{{ getCategoryLabel(doc.category) }}</span>
                <span>{{ doc.totalChunks }} fragmentos</span>
                <span>{{ formatDate(doc.createdAt) }}</span>
              </div>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <!-- Status -->
            <span 
              class="px-2 py-1 rounded-lg text-xs font-medium"
              :class="getStatusClass(doc.status)"
            >
              {{ getStatusLabel(doc.status) }}
            </span>
            
            <!-- Toggle Active -->
            <button
              @click="toggleActive(doc)"
              class="p-2 rounded-lg transition-colors"
              :class="doc.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'"
              :title="doc.isActive ? 'Desactivar' : 'Activar'"
            >
              <PowerIcon class="w-4 h-4" />
            </button>
            
            <!-- Delete -->
            <button
              @click="confirmDelete(doc)"
              class="p-2 rounded-lg bg-slate-100 text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition-colors"
            >
              <TrashIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Modal -->
    <div v-if="showUploadModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-slate-200">
          <h3 class="text-lg font-semibold text-slate-800">Agregar Documento</h3>
          <p class="text-sm text-slate-500 mt-1">Sube un PDF o ingresa texto directamente</p>
        </div>
        
        <div class="p-6 space-y-4">
          <!-- Upload Type Tabs -->
          <div class="flex gap-2">
            <button
              @click="uploadType = 'file'"
              class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
              :class="uploadType === 'file' ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600'"
            >
              <UploadIcon class="w-4 h-4 inline mr-2" />
              Subir Archivo
            </button>
            <button
              @click="uploadType = 'text'"
              class="flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
              :class="uploadType === 'text' ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600'"
            >
              <FileTextIcon class="w-4 h-4 inline mr-2" />
              Escribir Texto
            </button>
          </div>

          <!-- Title -->
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1">Título *</label>
            <input 
              v-model="newDoc.title"
              type="text"
              class="input"
              placeholder="Ej: Política de devoluciones"
            />
          </div>

          <!-- Category -->
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1">Categoría</label>
            <select v-model="newDoc.category" class="input">
              <option value="general">General</option>
              <option value="productos">Productos/Servicios</option>
              <option value="servicios">Servicios</option>
              <option value="politicas">Políticas</option>
              <option value="faq">Preguntas Frecuentes</option>
              <option value="empresa">Información de la Empresa</option>
            </select>
          </div>

          <!-- File Upload -->
          <div v-if="uploadType === 'file'">
            <label class="block text-sm font-medium text-slate-600 mb-1">Archivo (PDF o TXT)</label>
            <div 
              class="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary-400 transition-colors"
              @click="$refs.fileInput.click()"
              @drop.prevent="handleDrop"
              @dragover.prevent
            >
              <input
                ref="fileInput"
                type="file"
                accept=".pdf,.txt"
                class="hidden"
                @change="handleFileSelect"
              />
              <UploadIcon class="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p v-if="!selectedFile" class="text-slate-500 text-sm">
                Arrastra un archivo o haz clic para seleccionar
              </p>
              <p v-else class="text-primary-600 text-sm font-medium">
                {{ selectedFile.name }}
              </p>
            </div>
          </div>

          <!-- Text Content -->
          <div v-else>
            <label class="block text-sm font-medium text-slate-600 mb-1">Contenido *</label>
            <textarea
              v-model="newDoc.content"
              class="input resize-none"
              rows="8"
              placeholder="Pega o escribe aquí la información de tu empresa, políticas, servicios, etc."
            ></textarea>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1">Descripción (opcional)</label>
            <input 
              v-model="newDoc.description"
              type="text"
              class="input"
              placeholder="Breve descripción del contenido"
            />
          </div>
        </div>
        
        <div class="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button @click="closeModal" class="btn-secondary">Cancelar</button>
          <button @click="uploadDocument" class="btn-primary" :disabled="uploading">
            <LoaderIcon v-if="uploading" class="w-4 h-4 mr-2 animate-spin" />
            {{ uploading ? 'Procesando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import api from '@/services/api'
import {
  Plus as PlusIcon,
  FileText as FileTextIcon,
  Upload as UploadIcon,
  Trash2 as TrashIcon,
  Power as PowerIcon,
  Loader2 as LoaderIcon,
  FileCheck as FileCheckIcon,
  BookOpen as BookOpenIcon
} from 'lucide-vue-next'

const loading = ref(true)
const uploading = ref(false)
const documents = ref([])
const showUploadModal = ref(false)
const uploadType = ref('file')
const selectedFile = ref(null)

const newDoc = ref({
  title: '',
  content: '',
  description: '',
  category: 'general'
})

const activeDocuments = computed(() => documents.value.filter(d => d.isActive && d.status === 'ready').length)
const totalChunks = computed(() => documents.value.reduce((sum, d) => sum + (d.totalChunks || 0), 0))

onMounted(async () => {
  await loadDocuments()
})

async function loadDocuments() {
  loading.value = true
  try {
    const response = await api.get('/admin/knowledge')
    documents.value = response.data.documents
  } catch (error) {
    console.error('Error loading documents:', error)
  } finally {
    loading.value = false
  }
}

function handleFileSelect(e) {
  selectedFile.value = e.target.files[0]
}

function handleDrop(e) {
  const file = e.dataTransfer.files[0]
  if (file && (file.type === 'application/pdf' || file.type === 'text/plain')) {
    selectedFile.value = file
  }
}

async function uploadDocument() {
  if (!newDoc.value.title) {
    alert('El título es requerido')
    return
  }

  uploading.value = true

  try {
    if (uploadType.value === 'file') {
      if (!selectedFile.value) {
        alert('Selecciona un archivo')
        uploading.value = false
        return
      }

      const formData = new FormData()
      formData.append('file', selectedFile.value)
      formData.append('title', newDoc.value.title)
      formData.append('description', newDoc.value.description)
      formData.append('category', newDoc.value.category)

      await api.post('/admin/knowledge/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    } else {
      if (!newDoc.value.content) {
        alert('El contenido es requerido')
        uploading.value = false
        return
      }

      await api.post('/admin/knowledge/text', {
        title: newDoc.value.title,
        content: newDoc.value.content,
        description: newDoc.value.description,
        category: newDoc.value.category
      })
    }

    closeModal()
    await loadDocuments()
    alert('Documento guardado. Se está procesando en segundo plano.')
  } catch (error) {
    console.error('Upload error:', error)
    alert('Error: ' + (error.response?.data?.error || error.message))
  } finally {
    uploading.value = false
  }
}

async function toggleActive(doc) {
  try {
    await api.patch(`/admin/knowledge/${doc._id}/toggle`, { isActive: !doc.isActive })
    doc.isActive = !doc.isActive
  } catch (error) {
    console.error('Toggle error:', error)
  }
}

async function confirmDelete(doc) {
  if (!confirm(`¿Eliminar "${doc.title}"? Esta acción no se puede deshacer.`)) return

  try {
    await api.delete(`/admin/knowledge/${doc._id}`)
    documents.value = documents.value.filter(d => d._id !== doc._id)
  } catch (error) {
    console.error('Delete error:', error)
    alert('Error al eliminar')
  }
}

function closeModal() {
  showUploadModal.value = false
  selectedFile.value = null
  newDoc.value = { title: '', content: '', description: '', category: 'general' }
}

function getTypeIcon(type) {
  switch (type) {
    case 'pdf': return FileTextIcon
    case 'faq': return BookOpenIcon
    default: return FileTextIcon
  }
}

function getTypeColor(type) {
  switch (type) {
    case 'pdf': return 'bg-rose-100 text-rose-600'
    case 'faq': return 'bg-amber-100 text-amber-600'
    default: return 'bg-primary-100 text-primary-600'
  }
}

function getCategoryLabel(cat) {
  const labels = {
    general: 'General',
    productos: 'Productos',
    servicios: 'Servicios',
    politicas: 'Políticas',
    faq: 'FAQ',
    empresa: 'Empresa'
  }
  return labels[cat] || cat
}

function getCategoryBadge(cat) {
  switch (cat) {
    case 'productos': return 'badge-info'
    case 'servicios': return 'badge-info'
    case 'politicas': return 'badge-warning'
    case 'empresa': return 'badge-success'
    default: return 'badge-secondary'
  }
}

function getStatusClass(status) {
  switch (status) {
    case 'ready': return 'bg-emerald-100 text-emerald-700'
    case 'processing': return 'bg-amber-100 text-amber-700'
    case 'error': return 'bg-rose-100 text-rose-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

function getStatusLabel(status) {
  switch (status) {
    case 'ready': return 'Listo'
    case 'processing': return 'Procesando...'
    case 'error': return 'Error'
    default: return 'Pendiente'
  }
}

function formatDate(date) {
  return format(new Date(date), 'd MMM yyyy', { locale: es })
}
</script>
