<template>
  <div class="editor-page">
    <nav class="top-nav">
      <NuxtLink to="/" class="nav-link">Home</NuxtLink>
      <NuxtLink to="/articles" class="nav-link">Articles</NuxtLink>
      <NuxtLink v-if="isAuthenticated" to="/settings" class="nav-link">Settings</NuxtLink>
      <span v-if="isAuthenticated" class="nav-link" @click="handleLogout">Logout</span>
    </nav>

    <div v-if="!isAuthenticated" class="auth-section">
      <h1>Editor Login</h1>
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">Username</label>
          <input 
            id="username"
            v-model="loginForm.username" 
            type="text" 
            required
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input 
            id="password"
            v-model="loginForm.password" 
            type="password" 
            required
            class="form-input"
          />
        </div>
        <div v-if="requiresTotp" class="form-group">
          <label for="totp">TOTP Token</label>
          <input 
            id="totp"
            v-model="loginForm.totpToken" 
            type="text" 
            placeholder="6-digit code"
            class="form-input"
          />
        </div>
        <button type="submit" class="btn btn-primary">Login</button>
        <p v-if="error" class="error-message">{{ error }}</p>
      </form>
    </div>

    <div v-else class="editor-section">
      <h1>{{ editMode ? 'Edit Article' : 'Create New Article' }}</h1>
      
      <form @submit.prevent="handleSubmit" class="article-form">
        <div class="form-group">
          <label for="title">Title</label>
          <input 
            id="title"
            v-model="articleForm.title" 
            type="text" 
            required
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="customUrl">Custom URL (optional)</label>
          <input 
            id="customUrl"
            v-model="articleForm.customUrl" 
            type="text" 
            placeholder="my-article-slug"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="tags">Tags (comma-separated)</label>
          <input 
            id="tags"
            v-model="tagsInput" 
            type="text" 
            placeholder="javascript, web, tutorial"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="content">Content (Markdown)</label>
          <textarea 
            id="content"
            v-model="articleForm.content" 
            required
            class="form-textarea"
            rows="20"
          ></textarea>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input 
              v-model="articleForm.published" 
              type="checkbox"
            />
            <span>Publish article</span>
          </label>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary">
            {{ editMode ? 'Update Article' : 'Create Article' }}
          </button>
          <button v-if="editMode" type="button" class="btn btn-secondary" @click="resetForm">
            Cancel
          </button>
        </div>
        
        <p v-if="message" class="success-message">{{ message }}</p>
        <p v-if="error" class="error-message">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const isAuthenticated = ref(false)
const requiresTotp = ref(false)
const error = ref('')
const message = ref('')
const editMode = ref(false)

const loginForm = ref({
  username: '',
  password: '',
  totpToken: ''
})

const articleForm = ref({
  id: '',
  title: '',
  content: '',
  customUrl: '',
  published: false
})

const tagsInput = ref('')

const checkAuth = async () => {
  try {
    await $fetch('/api/auth/me')
    isAuthenticated.value = true
  } catch {
    isAuthenticated.value = false
  }
}

const handleLogin = async () => {
  try {
    error.value = ''
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: loginForm.value
    })

    if (response.requireTotp) {
      requiresTotp.value = true
      error.value = 'Please enter your TOTP token'
    } else {
      isAuthenticated.value = true
      requiresTotp.value = false
    }
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Login failed'
  }
}

const handleLogout = async () => {
  try {
    await $fetch('/api/auth/logout', {
      method: 'POST'
    })
    isAuthenticated.value = false
    resetForm()
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Logout failed'
  }
}

const handleSubmit = async () => {
  try {
    error.value = ''
    message.value = ''

    const tags = tagsInput.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)

    const data = {
      ...articleForm.value,
      tags
    }

    if (editMode.value) {
      // Update existing article
      await $fetch(`/api/articles/${articleForm.value.id}`, {
        method: 'PUT',
        body: data
      })
      message.value = 'Article updated successfully!'
    } else {
      // Create new article
      await $fetch('/api/articles/create', {
        method: 'POST',
        body: data
      })
      message.value = 'Article created successfully!'
      resetForm()
    }
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Failed to save article'
  }
}

const resetForm = () => {
  articleForm.value = {
    id: '',
    title: '',
    content: '',
    customUrl: '',
    published: false
  }
  tagsInput.value = ''
  editMode.value = false
  message.value = ''
  error.value = ''
}

onMounted(() => {
  checkAuth()
})
</script>

<style scoped>
.editor-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.top-nav {
  display: flex;
  gap: 20px;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.nav-link {
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 4px;
  transition: background-color 0.2s;
  cursor: pointer;
}

.nav-link:hover {
  background-color: #f0f0f0;
}

.auth-section,
.editor-section {
  background: white;
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

h1 {
  font-size: 2rem;
  margin-bottom: 30px;
  color: #333;
}

h2 {
  font-size: 1.5rem;
  margin: 40px 0 20px 0;
  color: #333;
}

.login-form,
.article-form {
  max-width: 500px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 15px;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  border-color: #007bff;
}

.form-textarea {
  resize: vertical;
  font-family: 'Courier New', monospace;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
}

.form-actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}

.btn {
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 500;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}

.error-message {
  color: #dc3545;
  margin-top: 15px;
}

.success-message {
  color: #28a745;
  margin-top: 15px;
}
</style>
