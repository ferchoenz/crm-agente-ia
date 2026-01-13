# CRM Agente IA

Sistema CRM SaaS Multi-Tenant con Agente de IA para automatización de ventas en WhatsApp y Facebook.

## Stack Tecnológico

- **Frontend**: Vue 3 + Vite + TailwindCSS + shadcn-vue
- **Backend**: Node.js + Express.js
- **Base de Datos**: MongoDB con Vector Search
- **IA**: LangChain.js + OpenAI GPT-4o-mini
- **Colas**: BullMQ + Redis
- **Mensajería**: WhatsApp Cloud API + Facebook Messenger API

## Estructura del Proyecto

```
crm-agente-ia/
├── apps/
│   ├── server/     # Backend Node.js
│   └── client/     # Frontend Vue.js
├── packages/
│   └── shared/     # Código compartido
└── docker/         # Configuración Docker
```

## Requisitos

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- MongoDB
- Redis

## Instalación

```bash
# Instalar dependencias
pnpm install

# Desarrollo
pnpm dev

# Solo backend
pnpm dev:server

# Solo frontend
pnpm dev:client
```

## Variables de Entorno

Copia `.env.example` a `.env` en cada app y configura las variables.

## Licencia

Privado - Todos los derechos reservados.
