<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isDark = ref(false)

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark)
}

function toggleTheme() {
  isDark.value = !isDark.value
  applyTheme(isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

onMounted(() => {
  isDark.value = localStorage.getItem('theme') === 'dark'
  applyTheme(isDark.value)
})
</script>

<template>
  <header class="app-header">
    <span class="app-title">Agendamento de Transferências</span>
    <nav>
      <RouterLink to="/">Agendar</RouterLink>
      <RouterLink to="/statement">Extrato</RouterLink>
    </nav>
    <button class="theme-toggle" @click="toggleTheme">
      {{ isDark ? 'Modo claro' : 'Modo escuro' }}
    </button>
  </header>

  <main class="app-main">
    <RouterView />
  </main>
</template>

<style>
:root {
  --color-bg: #f9fafb;
  --color-surface: #ffffff;
  --color-surface-subtle: #f3f4f6;
  --color-surface-hover: #f9fafb;
  --color-text-primary: #111827;
  --color-text-secondary: #374151;
  --color-text-muted: #6b7280;
  --color-border: #d1d5db;
  --color-border-light: #f3f4f6;
  --color-success-bg: #f0fdf4;
  --color-success-text: #166534;
  --color-success-border: #bbf7d0;
  --color-error-bg: #fef2f2;
  --color-error-text: #991b1b;
  --color-error-border: #fecaca;
  --color-info-bg: #f9fafb;
  --color-info-text: #6b7280;
  --color-info-border: #e5e7eb;
}

html.dark {
  --color-bg: #111827;
  --color-surface: #1f2937;
  --color-surface-subtle: #374151;
  --color-surface-hover: #374151;
  --color-text-primary: #f9fafb;
  --color-text-secondary: #e5e7eb;
  --color-text-muted: #9ca3af;
  --color-border: #4b5563;
  --color-border-light: #374151;
  --color-success-bg: #052e16;
  --color-success-text: #86efac;
  --color-success-border: #166534;
  --color-error-bg: #450a0a;
  --color-error-text: #fca5a5;
  --color-error-border: #991b1b;
  --color-info-bg: #1f2937;
  --color-info-text: #9ca3af;
  --color-info-border: #374151;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Inter, system-ui, sans-serif;
  background: var(--color-bg);
  color: var(--color-text-primary);
  transition: background 0.2s, color 0.2s;
}
</style>

<style scoped>
.app-header {
  background: #1e3a5f;
  padding: 0 2rem;
  height: 56px;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.app-title {
  color: #fff;
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 0.01em;
  flex: 1;
}

nav {
  display: flex;
  gap: 1.5rem;
}

nav a {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  padding-bottom: 2px;
  border-bottom: 2px solid transparent;
  transition: color 0.2s, border-color 0.2s;
}

nav a:hover,
nav a.router-link-exact-active {
  color: #fff;
  border-bottom-color: #60a5fa;
}

.theme-toggle {
  padding: 0.25rem 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.theme-toggle:hover {
  background: rgba(255, 255, 255, 0.2);
}

.app-main {
  padding: 2rem;
  max-width: 960px;
  margin: 0 auto;
}
</style>
