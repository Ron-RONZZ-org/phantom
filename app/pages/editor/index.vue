<template>
  <div class="editor-page">
    <nav class="top-nav">
      <NuxtLink to="/" class="nav-link">Home</NuxtLink>
      <NuxtLink to="/articles" class="nav-link">Articles</NuxtLink>
      <NuxtLink v-if="isAuthenticated" to="/admin" class="nav-link">Admin</NuxtLink>
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

    <div v-else class="editor-section" :class="{ 'fullscreen': isFullscreen }">
      <h1 v-if="!isFullscreen">{{ editMode ? 'Edit Article' : 'Create New Article' }}</h1>
      
      <!-- Error messages displayed -->
      <div v-if="error && !isFullscreen" class="error-banner">{{ error }}</div>
      
      <form @submit.prevent="handleSubmit" class="article-form">
        <div v-if="!isFullscreen" class="form-group">
          <label for="title">Title</label>
          <input 
            id="title"
            v-model="articleForm.title" 
            type="text" 
            required
            class="form-input"
          />
        </div>

        <div v-if="!isFullscreen" class="form-group">
          <label for="series">Series (optional)</label>
          <div class="series-container">
            <select 
              id="series"
              v-model="articleForm.seriesId" 
              class="form-input"
            >
              <option value="">No Series</option>
              <option v-for="series in allSeries" :key="series.id" :value="series.id">
                {{ series.name }}
              </option>
            </select>
            <button type="button" @click="showSeriesModal = true" class="btn btn-secondary">
              Create Series
            </button>
          </div>
        </div>

        <div v-if="!isFullscreen" class="form-group">
          <label for="customUrl">Custom URL (optional)</label>
          <input 
            id="customUrl"
            v-model="articleForm.customUrl" 
            type="text" 
            placeholder="my-article-slug"
            class="form-input"
          />
          <small v-if="articleForm.seriesId" class="url-preview">
            URL will be: /{{ getSeriesUrl() }}/{{ articleForm.customUrl || generateSlugFromTitle() }}
          </small>
          <small v-else-if="!articleForm.seriesId && articleForm.title" class="url-preview">
            URL will be: /{{ articleForm.customUrl || generateSlugFromTitle() }}
          </small>
        </div>

        <div v-if="!isFullscreen" class="form-group">
          <label for="tags">Tags (comma-separated)</label>
          <div class="tags-input-container">
            <input 
              id="tags"
              v-model="tagsInput" 
              type="text" 
              placeholder="javascript, web, tutorial"
              class="form-input"
              @input="filterTags"
              @focus="filterTags"
            />
            <div v-if="showTagSuggestions" class="tag-suggestions">
              <div 
                v-for="tag in filteredTags" 
                :key="tag" 
                class="tag-suggestion"
                @click="addTag(tag)"
              >
                {{ tag }}
              </div>
            </div>
          </div>
        </div>

        <div class="form-group content-editor" :class="{ 'fullscreen-editor': isFullscreen }">
          <div class="editor-header">
            <label for="content">Content (Markdown)</label>
            <button type="button" @click="toggleFullscreen" class="btn btn-secondary btn-sm">
              {{ isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Mode' }}
            </button>
            <button v-if="isFullscreen" type="button" @click="showPreview = !showPreview" class="btn btn-secondary btn-sm">
              {{ showPreview ? 'Hide Preview' : 'Show Preview' }}
            </button>
          </div>
          <div class="editor-content" :class="{ 'split-view': isFullscreen && showPreview }">
            <textarea 
              id="content"
              v-model="articleForm.content" 
              required
              class="form-textarea"
              :class="{ 'fullscreen-textarea': isFullscreen }"
              :rows="isFullscreen ? 30 : 20"
            ></textarea>
            <div v-if="isFullscreen && showPreview" class="preview-pane" v-html="renderedPreview"></div>
          </div>
        </div>

        <div v-if="!isFullscreen" class="form-group">
          <label class="checkbox-label">
            <input 
              v-model="articleForm.published" 
              type="checkbox"
            />
            <span>Publish article</span>
          </label>
        </div>

        <div v-if="!isFullscreen" class="form-actions">
          <button type="submit" class="btn btn-primary">
            {{ editMode ? 'Update Article' : 'Create Article' }}
          </button>
          <button v-if="editMode" type="button" class="btn btn-secondary" @click="resetForm">
            Cancel
          </button>
        </div>
      </form>

      <!-- Series Creation Modal -->
      <div v-if="showSeriesModal" class="modal-overlay" @click="showSeriesModal = false">
        <div class="modal-content" @click.stop>
          <h2>Create New Series</h2>
          <form @submit.prevent="createSeries">
            <div class="form-group">
              <label for="seriesName">Series Name</label>
              <input 
                id="seriesName"
                v-model="newSeries.name" 
                type="text" 
                required
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label for="seriesDescription">Description (optional)</label>
              <textarea 
                id="seriesDescription"
                v-model="newSeries.description" 
                class="form-textarea"
                rows="3"
              ></textarea>
            </div>
            <div class="form-group">
              <label for="seriesUrl">Custom URL (optional)</label>
              <input 
                id="seriesUrl"
                v-model="newSeries.customUrl" 
                type="text" 
                :placeholder="generateSeriesSlugPreview()"
                class="form-input"
              />
            </div>
            <div class="modal-actions">
              <button type="submit" class="btn btn-primary">Create</button>
              <button type="button" @click="showSeriesModal = false" class="btn btn-secondary">Cancel</button>
            </div>
            <p v-if="seriesError" class="error-message">{{ seriesError }}</p>
          </form>
        </div>
      </div>

      <!-- Success Modal -->
      <div v-if="showSuccessModal" class="modal-overlay" @click="showSuccessModal = false">
        <div class="modal-content success-modal" @click.stop>
          <div class="success-icon">✅</div>
          <h2>{{ successModalData.published ? 'Article Published!' : 'Draft Saved!' }}</h2>
          <p>{{ successModalData.published ? 'Your article has been published successfully.' : 'Your draft has been saved successfully.' }}</p>
          
          <div class="article-link-section">
            <label>Article Link:</label>
            <div class="link-display">
              <input 
                :value="successModalData.articleUrl" 
                readonly 
                class="link-input"
                ref="linkInput"
              />
            </div>
          </div>
          
          <div class="modal-actions">
            <button @click="copyArticleLink" class="btn btn-primary">
              🔗 Copy Direct Link
            </button>
            <button @click="showSuccessModal = false" class="btn btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'

// Import Prism CSS for preview highlighting
if (process.client) {
  import('prismjs/themes/prism-tomorrow.css')
}

const isAuthenticated = ref(false)
const requiresTotp = ref(false)
const error = ref('')
const message = ref('')
const editMode = ref(false)
const isFullscreen = ref(false)
const showPreview = ref(false)
const renderedPreview = ref('')

// Success modal for article creation
const showSuccessModal = ref(false)
const successModalData = ref({
  published: false,
  articleUrl: ''
})

// Series management
const allSeries = ref<any[]>([])
const showSeriesModal = ref(false)
const newSeries = ref({
  name: '',
  description: '',
  customUrl: ''
})
const seriesError = ref('')

// Tags management
const allTags = ref<string[]>([])
const filteredTags = ref<string[]>([])
const showTagSuggestions = ref(false)

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
  published: false,
  seriesId: ''
})

const tagsInput = ref('')

// Fetch series
const fetchSeries = async () => {
  try {
    const response = await $fetch('/api/series')
    allSeries.value = response.series
  } catch (err) {
    console.error('Error fetching series:', err)
  }
}

// Fetch tags
const fetchTags = async () => {
  try {
    const response = await $fetch('/api/tags')
    allTags.value = response.tags.map((tag: any) => tag.name)
  } catch (err) {
    console.error('Error fetching tags:', err)
  }
}

// Create series
const createSeries = async () => {
  seriesError.value = ''
  try {
    // Only send customUrl if it's not empty
    const seriesData = {
      name: newSeries.value.name,
      description: newSeries.value.description,
      customUrl: newSeries.value.customUrl.trim() || undefined
    }
    
    const response = await $fetch('/api/series/create', {
      method: 'POST',
      body: seriesData
    })
    allSeries.value.push(response.series)
    articleForm.value.seriesId = response.series.id
    showSeriesModal.value = false
    newSeries.value = { name: '', description: '', customUrl: '' }
  } catch (err: any) {
    seriesError.value = err.data?.statusMessage || 'Failed to create series'
  }
}

// Get series URL
const getSeriesUrl = () => {
  const series = allSeries.value.find(s => s.id === articleForm.value.seriesId)
  return series ? (series.customUrl || series.name.toLowerCase().replace(/\s+/g, '-')) : ''
}

// Generate slug from title for preview
const generateSlugFromTitle = () => {
  if (!articleForm.value.title) return 'article-slug'
  return articleForm.value.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// Generate slug preview for series
const generateSeriesSlugPreview = () => {
  if (!newSeries.value.name) return 'my-series'
  return newSeries.value.name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// Filter tags for auto-suggestion
const filterTags = () => {
  const lastTag = tagsInput.value.split(',').pop()?.trim() || ''
  if (lastTag) {
    filteredTags.value = allTags.value.filter(tag => 
      tag.toLowerCase().includes(lastTag.toLowerCase()) &&
      !tagsInput.value.includes(tag)
    )
    showTagSuggestions.value = filteredTags.value.length > 0
  } else {
    showTagSuggestions.value = false
  }
}

// Add tag from suggestion
const addTag = (tag: string) => {
  const tags = tagsInput.value.split(',').map(t => t.trim()).filter(t => t)
  tags[tags.length - 1] = tag
  tagsInput.value = tags.join(', ') + ', '
  showTagSuggestions.value = false
}

// Toggle fullscreen
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  if (!isFullscreen.value) {
    showPreview.value = false
  } else {
    // Render preview immediately when entering fullscreen if content exists
    if (articleForm.value.content && showPreview.value) {
      renderedPreview.value = marked(articleForm.value.content)
    }
  }
}

// Watch content for preview
watch(() => articleForm.value.content, (newContent) => {
  if (isFullscreen.value && showPreview.value) {
    renderedPreview.value = marked(newContent)
    // Apply syntax highlighting to preview
    if (process.client) {
      nextTick(async () => {
        try {
          const Prism = await import('prismjs')
          await import('prismjs/components/prism-javascript')
          await import('prismjs/components/prism-typescript')
          await import('prismjs/components/prism-python')
          await import('prismjs/components/prism-bash')
          await import('prismjs/components/prism-json')
          await import('prismjs/components/prism-markdown')
          await import('prismjs/components/prism-css')
          Prism.default.highlightAll()
        } catch (error) {
          console.error('Error loading Prism in preview:', error)
        }
      })
    }
  }
})

// Watch showPreview to render immediately when toggled on
watch(() => showPreview.value, async (show) => {
  if (show && isFullscreen.value && articleForm.value.content) {
    renderedPreview.value = marked(articleForm.value.content)
    // Apply syntax highlighting to preview
    if (process.client) {
      nextTick(async () => {
        try {
          const Prism = await import('prismjs')
          await import('prismjs/components/prism-javascript')
          await import('prismjs/components/prism-typescript')
          await import('prismjs/components/prism-python')
          await import('prismjs/components/prism-bash')
          await import('prismjs/components/prism-json')
          await import('prismjs/components/prism-markdown')
          await import('prismjs/components/prism-css')
          Prism.default.highlightAll()
        } catch (error) {
          console.error('Error loading Prism in preview:', error)
        }
      })
    }
  }
})

const checkAuth = async () => {
  try {
    await $fetch('/api/auth/me')
    isAuthenticated.value = true
    fetchSeries()
    fetchTags()
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

    let createdArticle: any = null

    if (editMode.value) {
      // Update existing article
      const response = await $fetch(`/api/articles/${articleForm.value.id}`, {
        method: 'PUT',
        body: data
      })
      createdArticle = response.article
    } else {
      // Create new article
      const response = await $fetch('/api/articles/create', {
        method: 'POST',
        body: data
      })
      createdArticle = response.article
    }

    // Generate article URL
    const articleSlug = createdArticle.customUrl || createdArticle.id
    let articlePath = ''
    
    if (createdArticle.series) {
      const seriesSlug = createdArticle.series.customUrl || createdArticle.series.name.toLowerCase().replace(/\s+/g, '-')
      articlePath = `/articles/${seriesSlug}/${articleSlug}`
    } else {
      articlePath = `/articles/${articleSlug}`
    }

    // Get full URL
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const fullUrl = `${baseUrl}${articlePath}`

    // Show success modal
    successModalData.value = {
      published: articleForm.value.published,
      articleUrl: fullUrl
    }
    showSuccessModal.value = true

    if (!editMode.value) {
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
    published: false,
    seriesId: ''
  }
  tagsInput.value = ''
  editMode.value = false
  message.value = ''
  error.value = ''
}

// Copy article link to clipboard
const linkInput = ref<HTMLInputElement | null>(null)
const copyArticleLink = async () => {
  try {
    if (linkInput.value) {
      linkInput.value.select()
      await navigator.clipboard.writeText(successModalData.value.articleUrl)
      // Could show a brief "Copied!" message, but keeping it simple
      alert('Link copied to clipboard!')
    }
  } catch (err) {
    console.error('Failed to copy link:', err)
  }
}

onMounted(() => {
  checkAuth()
  
  // Check if we should load an article from query parameter
  if (process.client) {
    const urlParams = new URLSearchParams(window.location.search)
    const articleId = urlParams.get('id')
    if (articleId) {
      loadArticleForEdit(articleId)
    }
  }
})

const loadArticleForEdit = async (articleId: string) => {
  try {
    const response = await $fetch('/api/admin/article', {
      params: { id: articleId }
    })
    
    if (response.article) {
      const article = response.article
      articleForm.value = {
        id: article.id,
        title: article.title,
        content: article.content,
        customUrl: article.customUrl || '',
        published: article.published,
        seriesId: article.seriesId || ''
      }
      tagsInput.value = article.tags.map((t: any) => t.name).join(', ')
      editMode.value = true
    }
  } catch (err) {
    console.error('Failed to load article:', err)
    error.value = 'Failed to load article for editing'
  }
}

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

.btn-sm {
  padding: 6px 12px;
  font-size: 0.85rem;
}

.error-message {
  color: #dc3545;
  margin-top: 15px;
}

.success-banner {
  color: #155724;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  padding: 15px 20px;
  margin-bottom: 20px;
  font-weight: 500;
  font-size: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.error-banner {
  color: #721c24;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 15px 20px;
  margin-bottom: 20px;
  font-weight: 500;
  font-size: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.success-message {
  color: #155724;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  padding: 12px 20px;
  margin-top: 15px;
  font-weight: 500;
}

/* Series Management */
.series-container {
  display: flex;
  gap: 10px;
  align-items: center;
}

.series-container select {
  flex: 1;
}

.url-preview {
  display: block;
  margin-top: 5px;
  color: #666;
  font-size: 0.85rem;
}

/* Tags Auto-suggestion */
.tags-input-container {
  position: relative;
}

.tag-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #007bff;
  border-top: none;
  border-radius: 0 0 4px 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
}

.tag-suggestion {
  padding: 10px 15px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.tag-suggestion:hover {
  background-color: #f0f0f0;
}

/* Fullscreen Editor */
.editor-section.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  max-width: none;
  margin: 0;
  padding: 20px;
  z-index: 1000;
  overflow-y: auto;
  background: white;
}

.fullscreen .article-form {
  max-width: none;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.fullscreen .content-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.fullscreen .editor-content {
  flex: 1;
  display: flex;
  min-height: 0;
}

.content-editor {
  position: relative;
}

.editor-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.editor-header label {
  flex: 1;
  margin: 0;
}

.editor-content.split-view {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.fullscreen-textarea {
  width: 100% !important;
  min-height: 500px;
  flex: 1;
}

.fullscreen .editor-content.split-view .fullscreen-textarea {
  height: 100%;
  min-height: auto;
}

.preview-pane {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 15px;
  overflow-y: auto;
  background: white;
  flex: 1;
  height: 100%;
}

.preview-pane :deep(h1),
.preview-pane :deep(h2),
.preview-pane :deep(h3) {
  margin-top: 20px;
  margin-bottom: 10px;
}

/* Success Modal */
.success-modal {
  min-width: 500px;
  text-align: center;
}

.success-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.success-modal h2 {
  color: #155724;
  margin-bottom: 10px;
}

.success-modal p {
  color: #666;
  margin-bottom: 25px;
}

.article-link-section {
  margin-bottom: 25px;
  text-align: left;
}

.article-link-section label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.link-display {
  display: flex;
  gap: 10px;
}

.link-input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
  background-color: #f8f9fa;
  color: #495057;
}

.link-input:focus {
  outline: none;
  border-color: #007bff;
  background-color: #fff;
}

.preview-pane :deep(p) {
  margin-bottom: 15px;
}

.preview-pane :deep(code) {
  background-color: #f4f4f4;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

.preview-pane :deep(pre) {
  background-color: #f4f4f4;
  padding: 15px;
  border-radius: 5px;
  overflow-x: auto;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
</style>
