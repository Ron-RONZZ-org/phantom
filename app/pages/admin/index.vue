<template>
  <div class="admin-page">
    <nav class="top-nav">
      <NuxtLink to="/" class="nav-link">Home</NuxtLink>
      <NuxtLink to="/articles" class="nav-link">Articles</NuxtLink>
      <NuxtLink to="/editor" class="nav-link">Editor</NuxtLink>
      <NuxtLink to="/admin" class="nav-link active">Admin</NuxtLink>
      <NuxtLink to="/settings" class="nav-link">Settings</NuxtLink>
      <span class="nav-link" @click="handleLogout">Logout</span>
    </nav>

    <div v-if="!isAuthenticated" class="auth-required">
      <h1>Authentication Required</h1>
      <p>Please <NuxtLink to="/editor">login</NuxtLink> to access the admin panel.</p>
    </div>

    <div v-else class="admin-section">
      <h1>Admin Panel</h1>
      
      <!-- Tabs -->
      <div class="tabs">
        <button 
          :class="['tab', { active: currentTab === 'articles' }]"
          @click="currentTab = 'articles'"
        >
          All Articles
        </button>
        <button 
          :class="['tab', { active: currentTab === 'recycle' }]"
          @click="currentTab = 'recycle'"
        >
          Recycle Bin
        </button>
      </div>

      <!-- Filters and Actions -->
      <div v-if="currentTab === 'articles'" class="filters-section">
        <div class="filter-group">
          <label>Status:</label>
          <select v-model="filter.status" @change="loadArticles" class="filter-select">
            <option value="all">All</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Series:</label>
          <select v-model="filter.series" @change="loadArticles" class="filter-select">
            <option value="">All Series</option>
            <option v-for="series in allSeries" :key="series.id" :value="series.id">
              {{ series.name }}
            </option>
          </select>
        </div>

        <div class="filter-group search-group">
          <input 
            v-model="filter.search" 
            @input="debouncedSearch"
            type="text" 
            placeholder="Search articles..."
            class="filter-input"
          />
        </div>

        <div class="bulk-actions">
          <button 
            @click="downloadAllArticles" 
            :disabled="loading"
            class="btn btn-secondary"
          >
            📥 Download All (Markdown)
          </button>
          <button 
            @click="showUploadModal = true" 
            class="btn btn-secondary"
          >
            📤 Upload Articles
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading">Loading...</div>

      <!-- Error Message -->
      <div v-if="error" class="error-banner">{{ error }}</div>

      <!-- Success Message -->
      <div v-if="successMessage" class="success-banner">{{ successMessage }}</div>

      <!-- Articles Table -->
      <div v-if="currentTab === 'articles' && !loading" class="articles-table">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Series</th>
              <th>Tags</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="article in articles" :key="article.id">
              <td>
                <NuxtLink 
                  :to="getArticleUrl(article)" 
                  class="article-title"
                  target="_blank"
                >
                  {{ article.title }}
                </NuxtLink>
              </td>
              <td>
                <span :class="['status-badge', article.published ? 'published' : 'draft']">
                  {{ article.published ? 'Published' : 'Draft' }}
                </span>
              </td>
              <td>{{ article.series ? article.series.name : '-' }}</td>
              <td>
                <span class="tags-list">
                  {{ article.tags.map(t => t.name).join(', ') || '-' }}
                </span>
              </td>
              <td>{{ formatDate(article.updatedAt) }}</td>
              <td>
                <div class="action-buttons">
                  <button 
                    @click="editArticle(article)" 
                    class="btn-icon" 
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button 
                    @click="duplicateArticle(article)" 
                    class="btn-icon" 
                    title="Duplicate"
                  >
                    📋
                  </button>
                  <button 
                    @click="togglePublishStatus(article)" 
                    class="btn-icon" 
                    :title="article.published ? 'Move to Draft' : 'Publish'"
                  >
                    {{ article.published ? '📝' : '✅' }}
                  </button>
                  <button 
                    @click="showSeriesModalFunc(article)" 
                    class="btn-icon" 
                    title="Change Series"
                  >
                    📚
                  </button>
                  <button 
                    @click="moveToRecycleBin(article)" 
                    class="btn-icon" 
                    title="Move to Recycle Bin"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="articles.length === 0">
              <td colspan="6" class="no-data">No articles found</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Recycle Bin Table -->
      <div v-if="currentTab === 'recycle' && !loading" class="recycle-bin-section">
        <div class="recycle-info">
          <p>⚠️ Articles in the recycle bin will be automatically deleted after 30 days.</p>
          <button 
            v-if="deletedArticles.length > 0"
            @click="cleanupOldArticles" 
            class="btn btn-secondary"
          >
            🧹 Clean Up Old Items (30+ days)
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Deleted At</th>
              <th>Days Until Auto-Delete</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="article in deletedArticles" :key="article.id">
              <td>{{ article.title }}</td>
              <td>{{ formatDate(article.deletedAt) }}</td>
              <td>
                <span :class="['days-remaining', getDaysRemaining(article.deletedAt) <= 5 ? 'urgent' : '']">
                  {{ getDaysRemaining(article.deletedAt) }} days
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button 
                    @click="restoreArticle(article)" 
                    class="btn-icon" 
                    title="Restore"
                  >
                    ↩️
                  </button>
                  <button 
                    @click="permanentlyDeleteArticle(article)" 
                    class="btn-icon" 
                    title="Delete Permanently"
                  >
                    ❌
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="deletedArticles.length === 0">
              <td colspan="4" class="no-data">Recycle bin is empty</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Series Selection Modal -->
      <div v-if="showSeriesModalFlag" class="modal-overlay" @click="showSeriesModalFlag = false">
        <div class="modal-content" @click.stop>
          <h2>Change Series</h2>
          <p class="modal-subtitle">Article: {{ selectedArticle?.title }}</p>
          <form @submit.prevent="updateArticleSeries">
            <div class="form-group">
              <label>Series:</label>
              <select v-model="selectedSeriesId" class="form-input">
                <option value="">No Series</option>
                <option v-for="series in allSeries" :key="series.id" :value="series.id">
                  {{ series.name }}
                </option>
              </select>
            </div>
            <div class="modal-actions">
              <button type="submit" class="btn btn-primary">Update</button>
              <button type="button" @click="showSeriesModalFlag = false" class="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Upload Modal -->
      <div v-if="showUploadModal" class="modal-overlay" @click="showUploadModal = false">
        <div class="modal-content" @click.stop>
          <h2>Upload Articles</h2>
          <p class="modal-subtitle">Upload articles from exported JSON file</p>
          <div class="upload-info">
            <p><strong>How to use:</strong></p>
            <ul>
              <li>Download articles using the "Download All" button</li>
              <li>Edit the JSON file if needed</li>
              <li>Upload the JSON file here to import articles</li>
            </ul>
            <p><strong>Format example:</strong></p>
            <pre>[
  {
    "filename": "article.md",
    "content": "---\ntitle: My Article\npublished: true\ntags: [js]\n---\n\nContent here"
  }
]</pre>
          </div>
          <div class="form-group">
            <input 
              type="file" 
              ref="fileInput"
              @change="handleFileSelect"
              accept=".json"
              class="file-input"
            />
          </div>
          <div v-if="uploadStatus" class="upload-status">
            {{ uploadStatus }}
          </div>
          <div class="modal-actions">
            <button 
              @click="uploadArticles" 
              :disabled="!selectedFiles || selectedFiles.length === 0 || uploading"
              class="btn btn-primary"
            >
              {{ uploading ? 'Uploading...' : 'Upload' }}
            </button>
            <button 
              type="button" 
              @click="showUploadModal = false; selectedFiles = null; uploadStatus = ''"
              class="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const isAuthenticated = ref(false)
const loading = ref(false)
const error = ref('')
const successMessage = ref('')
const currentTab = ref('articles')

const articles = ref<any[]>([])
const deletedArticles = ref<any[]>([])
const allSeries = ref<any[]>([])

const filter = ref({
  status: 'all',
  series: '',
  search: ''
})

let searchTimeout: NodeJS.Timeout | null = null
const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    loadArticles()
  }, 500)
}

// Series modal
const showSeriesModalFlag = ref(false)
const selectedArticle = ref<any>(null)
const selectedSeriesId = ref('')

// Upload modal
const showUploadModal = ref(false)
const selectedFiles = ref<FileList | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const uploadStatus = ref('')
const uploading = ref(false)

const checkAuth = async () => {
  try {
    await $fetch('/api/auth/me')
    isAuthenticated.value = true
    loadArticles()
    loadSeries()
  } catch {
    isAuthenticated.value = false
    navigateTo('/editor')
  }
}

const loadSeries = async () => {
  try {
    const response = await $fetch('/api/series')
    allSeries.value = response.series
  } catch (err) {
    console.error('Error loading series:', err)
  }
}

const loadArticles = async () => {
  loading.value = true
  error.value = ''
  
  try {
    if (currentTab.value === 'articles') {
      const response = await $fetch('/api/admin/articles', {
        params: {
          status: filter.value.status,
          seriesId: filter.value.series || undefined,
          search: filter.value.search || undefined
        }
      })
      articles.value = response.articles
    } else {
      const response = await $fetch('/api/admin/recycle-bin')
      deletedArticles.value = response.articles
    }
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Failed to load articles'
  } finally {
    loading.value = false
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getDaysRemaining = (deletedAt: string) => {
  const deleted = new Date(deletedAt)
  const now = new Date()
  const diff = 30 - Math.floor((now.getTime() - deleted.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

const getArticleUrl = (article: any) => {
  if (article.series) {
    const seriesSlug = article.series.customUrl || article.series.name.toLowerCase().replace(/\s+/g, '-')
    const articleSlug = article.customUrl || article.id
    return `/articles/${seriesSlug}/${articleSlug}`
  }
  return `/articles/${article.customUrl || article.id}`
}

const editArticle = (article: any) => {
  // Navigate to editor with article ID in query
  navigateTo(`/editor?id=${article.id}`)
}

const duplicateArticle = async (article: any) => {
  if (!confirm(`Duplicate article "${article.title}"?`)) return
  
  loading.value = true
  error.value = ''
  successMessage.value = ''
  
  try {
    await $fetch('/api/admin/articles/duplicate', {
      method: 'POST',
      body: { articleId: article.id }
    })
    successMessage.value = `Article "${article.title}" duplicated successfully`
    await loadArticles()
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Failed to duplicate article'
  } finally {
    loading.value = false
  }
}

const togglePublishStatus = async (article: any) => {
  const newStatus = !article.published
  const action = newStatus ? 'publish' : 'unpublish'
  
  if (!confirm(`${action} article "${article.title}"?`)) return
  
  // Optimistic update
  article.published = newStatus
  error.value = ''
  successMessage.value = ''
  
  try {
    await $fetch(`/api/articles/${article.id}`, {
      method: 'PUT',
      body: { published: newStatus }
    })
    successMessage.value = `Article ${action}ed successfully`
  } catch (err: any) {
    // Revert on error
    article.published = !newStatus
    error.value = err.data?.statusMessage || `Failed to ${action} article`
  }
}

const showSeriesModalFunc = (article: any) => {
  selectedArticle.value = article
  selectedSeriesId.value = article.seriesId || ''
  showSeriesModalFlag.value = true
}

const updateArticleSeries = async () => {
  if (!selectedArticle.value) return
  
  error.value = ''
  successMessage.value = ''
  
  try {
    await $fetch(`/api/articles/${selectedArticle.value.id}`, {
      method: 'PUT',
      body: { seriesId: selectedSeriesId.value || null }
    })
    
    // Update local state
    selectedArticle.value.seriesId = selectedSeriesId.value || null
    if (selectedSeriesId.value) {
      selectedArticle.value.series = allSeries.value.find(s => s.id === selectedSeriesId.value)
    } else {
      selectedArticle.value.series = null
    }
    
    showSeriesModalFlag.value = false
    successMessage.value = 'Article series updated successfully'
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Failed to update article series'
  }
}

const moveToRecycleBin = async (article: any) => {
  if (!confirm(`Move article "${article.title}" to recycle bin?`)) return
  
  error.value = ''
  successMessage.value = ''
  
  try {
    await $fetch('/api/admin/articles/soft-delete', {
      method: 'POST',
      body: { articleId: article.id }
    })
    
    // Remove from articles list
    articles.value = articles.value.filter(a => a.id !== article.id)
    successMessage.value = `Article "${article.title}" moved to recycle bin`
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Failed to move article to recycle bin'
  }
}

const restoreArticle = async (article: any) => {
  if (!confirm(`Restore article "${article.title}"?`)) return
  
  error.value = ''
  successMessage.value = ''
  
  try {
    await $fetch('/api/admin/articles/restore', {
      method: 'POST',
      body: { articleId: article.id }
    })
    
    // Remove from deleted list
    deletedArticles.value = deletedArticles.value.filter(a => a.id !== article.id)
    successMessage.value = `Article "${article.title}" restored successfully`
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Failed to restore article'
  }
}

const permanentlyDeleteArticle = async (article: any) => {
  if (!confirm(`PERMANENTLY delete article "${article.title}"? This cannot be undone!`)) return
  
  error.value = ''
  successMessage.value = ''
  
  try {
    await $fetch(`/api/articles/${article.id}`, {
      method: 'DELETE'
    })
    
    // Remove from deleted list
    deletedArticles.value = deletedArticles.value.filter(a => a.id !== article.id)
    successMessage.value = `Article "${article.title}" permanently deleted`
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Failed to delete article'
  }
}

const cleanupOldArticles = async () => {
  if (!confirm('Delete all articles that have been in recycle bin for 30+ days?')) return
  
  loading.value = true
  error.value = ''
  successMessage.value = ''
  
  try {
    const response = await $fetch('/api/admin/articles/cleanup', {
      method: 'POST'
    })
    successMessage.value = `Cleaned up ${response.deletedCount} old article(s)`
    await loadArticles()
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Failed to cleanup old articles'
  } finally {
    loading.value = false
  }
}

const downloadAllArticles = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const response = await $fetch('/api/admin/articles/download', {
      method: 'POST',
      body: {
        status: filter.value.status,
        seriesId: filter.value.series || undefined,
        search: filter.value.search || undefined
      }
    })
    
    // Create and download JSON file with all articles
    const dataStr = JSON.stringify(response.articles, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = response.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    successMessage.value = `Downloaded ${response.count} article(s) successfully`
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Failed to download articles'
  } finally {
    loading.value = false
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  selectedFiles.value = target.files
  uploadStatus.value = selectedFiles.value ? `${selectedFiles.value.length} file(s) selected` : ''
}

const uploadArticles = async () => {
  if (!selectedFiles.value || selectedFiles.value.length === 0) return
  
  uploading.value = true
  uploadStatus.value = 'Uploading...'
  error.value = ''
  
  try {
    // Read and parse JSON file(s)
    const file = selectedFiles.value[0]
    const text = await file.text()
    const articles = JSON.parse(text)
    
    // Parse markdown files with frontmatter
    const parsedArticles = articles.map((item: any) => {
      const lines = item.content.split('\n')
      let inFrontmatter = false
      let frontmatterLines: string[] = []
      let contentLines: string[] = []
      
      for (const line of lines) {
        if (line.trim() === '---') {
          if (!inFrontmatter) {
            inFrontmatter = true
          } else {
            inFrontmatter = false
          }
        } else if (inFrontmatter) {
          frontmatterLines.push(line)
        } else {
          contentLines.push(line)
        }
      }
      
      // Parse frontmatter
      const metadata: any = {}
      frontmatterLines.forEach(line => {
        // More robust key-value parsing that handles quotes and special chars
        const colonIndex = line.indexOf(':')
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim()
          let value = line.substring(colonIndex + 1).trim()
          
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1)
          }
          
          if (key === 'tags') {
            // Parse tags array - handle both quoted and unquoted values
            if (value.startsWith('[') && value.endsWith(']')) {
              const tagStr = value.slice(1, -1)
              value = tagStr.split(',')
                .map((t: string) => {
                  t = t.trim()
                  // Remove quotes if present
                  if ((t.startsWith('"') && t.endsWith('"')) || 
                      (t.startsWith("'") && t.endsWith("'"))) {
                    t = t.slice(1, -1)
                  }
                  return t
                })
                .filter((t: string) => t)
            } else {
              value = []
            }
          } else if (key === 'published') {
            value = value === 'true' || value === true
          }
          
          metadata[key] = value
        }
      })
      
      return {
        title: metadata.title || 'Untitled',
        content: contentLines.join('\n').trim(),
        published: metadata.published || false,
        customUrl: metadata.customUrl || '',
        tags: metadata.tags || [],
        seriesId: metadata.seriesId || null
      }
    })
    
    const response = await $fetch('/api/admin/articles/upload', {
      method: 'POST',
      body: { articles: parsedArticles }
    })
    
    uploadStatus.value = `Successfully uploaded ${response.count} article(s)`
    if (response.errors && response.errors.length > 0) {
      uploadStatus.value += `. Errors: ${response.errors.join(', ')}`
    }
    successMessage.value = `Uploaded ${response.count} article(s)`
    
    setTimeout(() => {
      showUploadModal.value = false
      selectedFiles.value = null
      uploadStatus.value = ''
      loadArticles()
    }, 2000)
  } catch (err: any) {
    uploadStatus.value = ''
    error.value = err.data?.statusMessage || err.message || 'Failed to upload articles'
  } finally {
    uploading.value = false
  }
}

const handleLogout = async () => {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    navigateTo('/editor')
  } catch (err: any) {
    error.value = err.data?.statusMessage || 'Logout failed'
  }
}

// Watch tab changes
watch(currentTab, () => {
  loadArticles()
  // Clear messages
  error.value = ''
  successMessage.value = ''
})

// Auto-clear messages
watch([error, successMessage], () => {
  setTimeout(() => {
    error.value = ''
    successMessage.value = ''
  }, 5000)
})

onMounted(() => {
  checkAuth()
})
</script>

<style scoped>
.admin-page {
  max-width: 1400px;
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

.nav-link.active {
  background-color: #007bff;
  color: white;
}

.auth-required {
  text-align: center;
  padding: 60px 20px;
}

.auth-required a {
  color: #007bff;
  text-decoration: none;
}

.admin-section {
  background: white;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

h1 {
  font-size: 2rem;
  margin-bottom: 30px;
  color: #333;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  border-bottom: 2px solid #e0e0e0;
}

.tab {
  padding: 12px 24px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  color: #666;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s;
}

.tab:hover {
  color: #007bff;
}

.tab.active {
  color: #007bff;
  border-bottom-color: #007bff;
}

.filters-section {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-group label {
  font-weight: 500;
  font-size: 0.9rem;
  color: #555;
}

.filter-select,
.filter-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
  outline: none;
}

.filter-select:focus,
.filter-input:focus {
  border-color: #007bff;
}

.search-group {
  flex: 1;
  min-width: 200px;
}

.bulk-actions {
  display: flex;
  gap: 10px;
  margin-left: auto;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 1.1rem;
}

.error-banner {
  color: #721c24;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 15px 20px;
  margin-bottom: 20px;
}

.success-banner {
  color: #155724;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  padding: 15px 20px;
  margin-bottom: 20px;
}

.articles-table,
.recycle-bin-section {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  text-align: left;
  padding: 12px;
  background-color: #f8f9fa;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #dee2e6;
}

td {
  padding: 12px;
  border-bottom: 1px solid #e9ecef;
}

tr:hover {
  background-color: #f8f9fa;
}

.article-title {
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
}

.article-title:hover {
  text-decoration: underline;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.published {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.draft {
  background-color: #fff3cd;
  color: #856404;
}

.tags-list {
  font-size: 0.9rem;
  color: #666;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.btn-icon:hover {
  background-color: #e9ecef;
}

.no-data {
  text-align: center;
  color: #999;
  padding: 40px !important;
}

.recycle-info {
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recycle-info p {
  margin: 0;
  color: #856404;
}

.days-remaining {
  font-weight: 500;
}

.days-remaining.urgent {
  color: #dc3545;
  font-weight: 600;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #545b62;
}

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
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-subtitle {
  color: #666;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  outline: none;
}

.form-input:focus {
  border-color: #007bff;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.upload-info {
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
  font-size: 0.9rem;
}

.upload-info ul {
  margin: 10px 0;
  padding-left: 20px;
}

.upload-info pre {
  background-color: #e9ecef;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.85rem;
  margin: 10px 0;
}

.file-input {
  width: 100%;
  padding: 10px;
  border: 2px dashed #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.upload-status {
  margin-top: 10px;
  padding: 10px;
  background-color: #e7f3ff;
  border-radius: 4px;
  color: #004085;
}
</style>
