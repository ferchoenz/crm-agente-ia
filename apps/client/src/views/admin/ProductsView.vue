<template>
  <div class="space-y-4 md:space-y-6">
    <!-- Header - Responsive -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-800">Catálogo de Productos</h2>
        <p class="text-slate-500 text-sm">{{ products.length }} productos</p>
      </div>
      <button @click="showModal = true" class="btn-primary w-full sm:w-auto">
        <PlusIcon class="w-5 h-5 mr-2" />
        Nuevo Producto
      </button>
    </div>
    
    <!-- Search - Responsive -->
    <div class="relative">
      <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        v-model="search"
        type="text"
        class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
        placeholder="Buscar productos..."
        @input="debouncedSearch"
      />
    </div>
    
    <!-- Products Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div
        v-for="product in filteredProducts"
        :key="product._id"
        class="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all cursor-pointer group"
        @click="editProduct(product)"
      >
        <!-- Image or Placeholder -->
        <div class="aspect-square bg-slate-100 overflow-hidden">
          <img 
            v-if="product.media?.[0]?.url" 
            :src="product.media[0].url" 
            :alt="product.name"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <PackageIcon class="w-12 h-12 text-slate-300" />
          </div>
        </div>
        
        <!-- Info -->
        <div class="p-4">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-semibold text-slate-800">{{ product.name }}</h3>
              <p class="text-sm text-slate-500">{{ product.category }}</p>
            </div>
            <span class="px-2 py-1 rounded-full text-xs font-medium" :class="product.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'">
              {{ product.status === 'active' ? 'Activo' : 'Inactivo' }}
            </span>
          </div>
          
          <p class="text-sm text-slate-600 mt-2 line-clamp-2">{{ product.description }}</p>
          
          <div class="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <span class="text-lg font-bold text-primary-600">{{ formatPrice(product.price) }}</span>
            <span class="text-sm text-slate-500">
              Stock: {{ product.inventory?.quantity ?? '∞' }}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-if="products.length === 0 && !loading" class="bg-white rounded-2xl border border-slate-200 text-center py-12">
      <PackageIcon class="w-16 h-16 mx-auto mb-4 text-slate-300" />
      <h3 class="text-lg font-semibold text-slate-800">No hay productos</h3>
      <p class="text-slate-500 mb-4">Añade productos para que el agente IA pueda recomendarlos</p>
      <button @click="showModal = true" class="btn-primary">
        Añadir primer producto
      </button>
    </div>
    
    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div class="sticky top-0 bg-white border-b border-slate-100 p-6 rounded-t-2xl">
          <h3 class="text-lg font-semibold text-slate-800">
            {{ editingProduct ? 'Editar Producto' : 'Nuevo Producto' }}
          </h3>
        </div>
        
        <form @submit.prevent="saveProduct" class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <!-- Item Type Toggle -->
            <div class="col-span-2">
              <label class="block text-sm font-medium text-slate-600 mb-2">Tipo de Item</label>
              <div class="flex gap-3">
                <button
                  type="button"
                  @click="form.itemType = 'product'"
                  class="flex-1 px-4 py-3 rounded-xl border-2 font-medium transition-all flex items-center justify-center gap-2"
                  :class="form.itemType === 'product' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'"
                >
                  <PackageIcon class="w-5 h-5" />
                  Producto
                </button>
                <button
                  type="button"
                  @click="form.itemType = 'service'"
                  class="flex-1 px-4 py-3 rounded-xl border-2 font-medium transition-all flex items-center justify-center gap-2"
                  :class="form.itemType === 'service' ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'"
                >
                  <WrenchIcon class="w-5 h-5" />
                  Servicio
                </button>
              </div>
            </div>

            <div class="col-span-2">
              <label class="block text-sm font-medium text-slate-600 mb-1.5">{{ form.itemType === 'service' ? 'Nombre del servicio' : 'Nombre del producto' }}</label>
              <input v-model="form.name" type="text" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" :placeholder="form.itemType === 'service' ? 'Ej: Desarrollo Web' : 'Ej: Lentes de sol Ray-Ban'" required />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1.5">Categoría</label>
              <input v-model="form.category" type="text" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" :placeholder="form.itemType === 'service' ? 'Ej: Desarrollo' : 'Ej: Lentes de sol'" />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1.5">SKU / Código</label>
              <input v-model="form.sku" type="text" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" placeholder="Código único" />
            </div>
            
            <div class="col-span-2">
              <label class="block text-sm font-medium text-slate-600 mb-1.5">Descripción</label>
              <textarea v-model="form.description" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none" rows="3" :placeholder="form.itemType === 'service' ? 'Descripción detallada del servicio para el agente IA' : 'Descripción del producto para el agente IA'"></textarea>
            </div>

            <!-- Pricing Type (Services) -->
            <div class="col-span-2" v-if="form.itemType === 'service'">
              <label class="block text-sm font-medium text-slate-600 mb-2">Tipo de Precio</label>
              <div class="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  @click="form.pricingType = 'fixed'"
                  class="px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all"
                  :class="form.pricingType === 'fixed' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'"
                >
                  💰 Precio Fijo
                </button>
                <button
                  type="button"
                  @click="form.pricingType = 'quote'"
                  class="px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all"
                  :class="form.pricingType === 'quote' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'"
                >
                  📋 Cotizar
                </button>
              </div>
            </div>
            
            <!-- Fixed Price -->
            <div v-if="form.pricingType === 'fixed' || form.itemType === 'product'">
              <label class="block text-sm font-medium text-slate-600 mb-1.5">Precio</label>
              <input v-model.number="form.price" type="number" step="0.01" min="0" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" placeholder="0.00" :required="form.pricingType === 'fixed'" />
            </div>
            
            <div v-if="form.pricingType === 'fixed' || form.itemType === 'product'">
              <label class="block text-sm font-medium text-slate-600 mb-1.5">Precio de oferta (opcional)</label>
              <input v-model.number="form.salePrice" type="number" step="0.01" min="0" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" placeholder="0.00" />
            </div>

            <!-- Quote Pricing Factors -->
            <div class="col-span-2" v-if="form.pricingType === 'quote' && form.itemType === 'service'">
              <label class="block text-sm font-medium text-slate-600 mb-1.5">Factores que afectan el precio</label>
              <input v-model="form.priceFactorsStr" type="text" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" placeholder="Ej: complejidad, número de páginas, horas estimadas" />
              <p class="text-xs text-slate-500 mt-1">Separados por coma. El agente IA explicará que el precio depende de estos factores.</p>
            </div>

            <!-- Service-specific fields -->
            <div v-if="form.itemType === 'service'">
              <label class="block text-sm font-medium text-slate-600 mb-1.5">Duración estimada</label>
              <input v-model="form.duration" type="text" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" placeholder="Ej: 2-4 semanas, por hora" />
            </div>

            <div v-if="form.itemType === 'service'">
              <label class="block text-sm font-medium text-slate-600 mb-1.5">Entregables</label>
              <input v-model="form.deliverablesStr" type="text" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" placeholder="Ej: diseño, código, documentación" />
            </div>
            
            <!-- Stock (Products only) -->
            <div v-if="form.itemType === 'product'">
              <label class="block text-sm font-medium text-slate-600 mb-1.5">Stock</label>
              <input v-model.number="form.quantity" type="number" min="0" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" placeholder="Cantidad disponible" />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1.5">Estado</label>
              <select v-model="form.status" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all">
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option v-if="form.itemType === 'product'" value="out_of_stock">Sin stock</option>
              </select>
            </div>
            
            <div class="col-span-2">
              <label class="block text-sm font-medium text-slate-600 mb-1.5">URL de imagen (opcional)</label>
              <input v-model="form.imageUrl" type="url" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" placeholder="https://..." />
            </div>
            
            <div class="col-span-2">
              <label class="block text-sm font-medium text-slate-600 mb-1.5">Etiquetas (separadas por coma)</label>
              <input v-model="form.tagsStr" type="text" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" placeholder="Ej: nuevo, oferta, popular" />
            </div>
          </div>
          
          <div class="flex gap-3 pt-4 border-t border-slate-100">
            <button type="button" @click="closeModal" class="flex-1 px-4 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors">
              Cancelar
            </button>
            <button v-if="editingProduct" type="button" @click="deleteProduct" class="px-6 py-3 text-white bg-rose-500 hover:bg-rose-600 rounded-xl font-medium transition-colors">
              Eliminar
            </button>
            <button type="submit" class="btn-primary flex-1" :disabled="saving">
              {{ saving ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import api from '@/services/api'
import {
  Search as SearchIcon,
  Plus as PlusIcon,
  Package as PackageIcon,
  Wrench as WrenchIcon
} from 'lucide-vue-next'

const loading = ref(true)
const saving = ref(false)
const products = ref([])
const search = ref('')
const showModal = ref(false)
const editingProduct = ref(null)

const form = reactive({
  itemType: 'product',
  name: '',
  description: '',
  category: '',
  sku: '',
  price: 0,
  salePrice: null,
  pricingType: 'fixed',
  priceFactorsStr: '',
  duration: '',
  deliverablesStr: '',
  quantity: null,
  status: 'active',
  imageUrl: '',
  tagsStr: ''
})

const filteredProducts = computed(() => {
  if (!search.value) return products.value
  const q = search.value.toLowerCase()
  return products.value.filter(p => 
    p.name?.toLowerCase().includes(q) ||
    p.category?.toLowerCase().includes(q) ||
    p.sku?.toLowerCase().includes(q)
  )
})

const debouncedSearch = useDebounceFn(() => {}, 300)

onMounted(loadProducts)

async function loadProducts() {
  loading.value = true
  try {
    const response = await api.get('/admin/products')
    products.value = response.data.products || []
  } catch (error) {
    console.error('Failed to load products:', error)
  } finally {
    loading.value = false
  }
}

function editProduct(product) {
  editingProduct.value = product
  form.itemType = product.itemType || 'product'
  form.name = product.name
  form.description = product.description || ''
  form.category = product.category || ''
  form.sku = product.sku || ''
  form.price = product.price || 0
  form.salePrice = product.compareAtPrice || null
  form.pricingType = product.pricingType || 'fixed'
  form.priceFactorsStr = product.priceFactors?.join(', ') || ''
  form.duration = product.duration || ''
  form.deliverablesStr = product.deliverables?.join(', ') || ''
  form.quantity = product.stock ?? null
  form.status = product.status || 'active'
  form.imageUrl = product.images?.[0]?.url || ''
  form.tagsStr = product.tags?.join(', ') || ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingProduct.value = null
  Object.assign(form, {
    itemType: 'product',
    name: '',
    description: '',
    category: '',
    sku: '',
    price: 0,
    salePrice: null,
    pricingType: 'fixed',
    priceFactorsStr: '',
    duration: '',
    deliverablesStr: '',
    quantity: null,
    status: 'active',
    imageUrl: '',
    tagsStr: ''
  })
}

async function saveProduct() {
  saving.value = true
  
  try {
    const data = {
      itemType: form.itemType,
      name: form.name,
      description: form.description,
      category: form.category,
      sku: form.sku,
      status: form.status,
      tags: form.tagsStr ? form.tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [],
      images: form.imageUrl ? [{ url: form.imageUrl, isPrimary: true }] : undefined,
    }

    // Pricing based on type
    if (form.itemType === 'service' && form.pricingType === 'quote') {
      data.pricingType = 'quote'
      data.priceFactors = form.priceFactorsStr ? form.priceFactorsStr.split(',').map(f => f.trim()).filter(Boolean) : []
    } else {
      data.pricingType = 'fixed'
      data.price = form.price
      data.compareAtPrice = form.salePrice || undefined
    }

    // Service-specific fields
    if (form.itemType === 'service') {
      data.duration = form.duration || undefined
      data.deliverables = form.deliverablesStr ? form.deliverablesStr.split(',').map(d => d.trim()).filter(Boolean) : []
    }

    // Product-specific fields (inventory)
    if (form.itemType === 'product') {
      data.stock = form.quantity ?? -1
      data.trackInventory = form.quantity !== null
    }
    
    if (editingProduct.value) {
      await api.put(`/admin/products/${editingProduct.value._id}`, data)
    } else {
      await api.post('/admin/products', data)
    }
    
    await loadProducts()
    closeModal()
  } catch (error) {
    console.error('Failed to save product:', error)
    alert(error.response?.data?.error || 'Error al guardar')
  } finally {
    saving.value = false
  }
}

async function deleteProduct() {
  if (!confirm('¿Seguro que quieres eliminar este producto?')) return
  
  try {
    await api.delete(`/admin/products/${editingProduct.value._id}`)
    await loadProducts()
    closeModal()
  } catch (error) {
    console.error('Failed to delete product:', error)
    alert('Error al eliminar producto')
  }
}

function formatPrice(price) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price || 0)
}
</script>
