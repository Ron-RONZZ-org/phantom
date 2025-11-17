<template>
  <div class="articles-page">
    <header class="header">
      <h1>All Articles</h1>
      <nav>
        <NuxtLink to="/" class="nav-link">Home</NuxtLink>
        <NuxtLink to="/articles" class="nav-link">Articles</NuxtLink>
        <NuxtLink v-if="isAuthenticated" to="/editor" class="nav-link">Editor</NuxtLink>
      </nav>
    </header>

    <main class="main-content">
      <div class="filter-section">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search articles..." 
          class="search-input"
          @input="handleSearch"
        />
        <div class="tag-filter-container">
          <input 
            v-model="tagFilter" 
            type="text" 
            placeholder="Filter by tag..." 
            class="search-input"
            @input="handleSearch"
            @focus="filterTags()"
          />
          <div v-if="showTagSuggestions" class="tag-suggestions">
            <div 
              v-for="tag in filteredTags" 
              :key="tag" 
              class="tag-suggestion"
              @click="selectSuggestedTag(tag)"
            >
              {{ tag }}
            </div>
          </div>
        </div>
      </div>

      <div class="articles-list" v-if="articles.length > 0">
        <article v-for="article in articles" :key="article.id" class="article-item">
          <h2>
            <NuxtLink :to="`/articles/${article.customUrl || article.id}`">
              {{ article.title }}
            </NuxtLink>
          </h2>
          <div class="article-meta">
            <span class="author">By {{ article.author.username }}</span>
            <span class="date">{{ formatDate(article.createdAt) }}</span>
          </div>
          <div class="article-preview">
            {{ getPreview(article.content) }}
          </div>
          <div class="tags" v-if="article.tags.length > 0">
            <span v-for="tag in article.tags" :key="tag.id" class="tag" @click="filterByTag(tag.name)">
              #{{ tag.name }}
            </span>
          </div>
        </article>
      </div>

      <div v-else class="no-articles">
        <p>No articles found.</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const searchQuery = ref('')
const tagFilter = ref('')
const articles = ref<any[]>([])
const isAuthenticated = ref(false)
const allTags = ref<string[]>([])
const filteredTags = ref<string[]>([])
const showTagSuggestions = ref(false)

const checkAuth = async () => {
  try {
    await $fetch('/api/auth/me')
    isAuthenticated.value = true
  } catch {
    isAuthenticated.value = false
  }
}

const fetchTags = async () => {
  try {
    const response = await $fetch('/api/tags')
    allTags.value = response.tags.map((tag: any) => tag.name)
  } catch (error) {
    console.error('Error fetching tags:', error)
  }
}

const filterTags = () => {
  if (tagFilter.value.trim()) {
    filteredTags.value = allTags.value.filter(tag => 
      tag.toLowerCase().includes(tagFilter.value.toLowerCase())
    )
    showTagSuggestions.value = filteredTags.value.length > 0
  } else {
    showTagSuggestions.value = false
  }
}

const fetchArticles = async () => {
  try {
    const response = await $fetch('/api/articles', {
      query: {
        search: searchQuery.value || undefined,
        tag: tagFilter.value || undefined
      }
    })
    articles.value = response.articles
  } catch (error) {
    console.error('Error fetching articles:', error)
  }
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null
const handleSearch = () => {
  filterTags()
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    fetchArticles()
  }, 300)
}

const filterByTag = (tagName: string) => {
  tagFilter.value = tagName
  showTagSuggestions.value = false
  fetchArticles()
}

const selectSuggestedTag = (tag: string) => {
  tagFilter.value = tag
  showTagSuggestions.value = false
  fetchArticles()
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getPreview = (content: string) => {
  return content.length > 200 ? content.substring(0, 200) + '...' : content
}

onMounted(() => {
  checkAuth()
  fetchTags()
  fetchArticles()
})
</script>

<style scoped>
.articles-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.header h1 {
  font-size: 2.5rem;
  margin-bottom: 20px;
  color: #333;
}

nav {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.nav-link {
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.nav-link:hover {
  background-color: #f0f0f0;
}

.filter-section {
  margin-bottom: 30px;
  display: flex;
  gap: 15px;
}

.tag-filter-container {
  flex: 1;
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
  border-radius: 0 0 8px 8px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
}

.tag-suggestion {
  padding: 10px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.tag-suggestion:hover {
  background-color: #f0f0f0;
}

.search-input {
  flex: 1;
  padding: 12px 20px;
  font-size: 1rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #007bff;
}

.articles-list {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.article-item {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 25px;
  transition: box-shadow 0.2s;
}

.article-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.article-item h2 {
  margin: 0 0 10px 0;
  font-size: 1.8rem;
}

.article-item h2 a {
  color: #333;
  text-decoration: none;
}

.article-item h2 a:hover {
  color: #007bff;
}

.article-meta {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  font-size: 0.9rem;
  color: #666;
}

.article-preview {
  margin: 15px 0;
  color: #555;
  line-height: 1.6;
}

.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  background-color: #e9ecef;
  color: #495057;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.tag:hover {
  background-color: #dee2e6;
}

.no-articles {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 1.2rem;
}
</style>
