<template>
  <div class="article-view">
    <nav class="top-nav">
      <NuxtLink to="/" class="nav-link">Home</NuxtLink>
      <NuxtLink to="/articles" class="nav-link">Articles</NuxtLink>
      <NuxtLink to="/editor" class="nav-link">Editor</NuxtLink>
    </nav>

    <div v-if="loading" class="loading">Loading...</div>
    
    <article v-else-if="article" class="article">
      <header class="article-header">
        <h1>{{ article.title }}</h1>
        <div class="article-meta">
          <span class="author">By {{ article.author.username }}</span>
          <span class="date">{{ formatDate(article.createdAt) }}</span>
          <span v-if="article.updatedAt !== article.createdAt" class="date">
            (Updated: {{ formatDate(article.updatedAt) }})
          </span>
        </div>
        <div class="tags" v-if="article.tags.length > 0">
          <span v-for="tag in article.tags" :key="tag.id" class="tag">
            #{{ tag.name }}
          </span>
        </div>
      </header>
      
      <div class="article-content" v-html="renderedContent"></div>
    </article>

    <div v-else class="error">
      <h2>Article not found</h2>
      <NuxtLink to="/articles">← Back to articles</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'

const route = useRoute()
const article = ref<any>(null)
const loading = ref(true)
const renderedContent = ref('')

const fetchArticle = async () => {
  try {
    loading.value = true
    const response = await $fetch(`/api/articles/${route.params.id}`)
    article.value = response.article
    
    // Render markdown
    renderedContent.value = marked(article.value.content)
  } catch (error) {
    console.error('Error fetching article:', error)
    article.value = null
  } finally {
    loading.value = false
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

onMounted(() => {
  fetchArticle()
})
</script>

<style scoped>
.article-view {
  max-width: 800px;
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
}

.nav-link:hover {
  background-color: #f0f0f0;
}

.loading,
.error {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 1.2rem;
}

.article {
  background: white;
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.article-header {
  margin-bottom: 40px;
  padding-bottom: 30px;
  border-bottom: 2px solid #e0e0e0;
}

.article-header h1 {
  font-size: 2.5rem;
  margin: 0 0 20px 0;
  color: #222;
  line-height: 1.2;
}

.article-meta {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  font-size: 0.95rem;
  color: #666;
}

.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  background-color: #e9ecef;
  color: #495057;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.85rem;
}

.article-content {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #333;
}

.article-content :deep(h1) {
  font-size: 2rem;
  margin-top: 40px;
  margin-bottom: 20px;
  color: #222;
}

.article-content :deep(h2) {
  font-size: 1.6rem;
  margin-top: 35px;
  margin-bottom: 15px;
  color: #222;
}

.article-content :deep(h3) {
  font-size: 1.3rem;
  margin-top: 30px;
  margin-bottom: 12px;
  color: #222;
}

.article-content :deep(p) {
  margin-bottom: 20px;
}

.article-content :deep(code) {
  background-color: #f4f4f4;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.article-content :deep(pre) {
  background-color: #f4f4f4;
  padding: 15px;
  border-radius: 5px;
  overflow-x: auto;
  margin-bottom: 20px;
}

.article-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

.article-content :deep(blockquote) {
  border-left: 4px solid #007bff;
  padding-left: 20px;
  margin: 20px 0;
  color: #666;
  font-style: italic;
}

.article-content :deep(ul),
.article-content :deep(ol) {
  margin-bottom: 20px;
  padding-left: 30px;
}

.article-content :deep(li) {
  margin-bottom: 8px;
}

.article-content :deep(a) {
  color: #007bff;
  text-decoration: none;
}

.article-content :deep(a:hover) {
  text-decoration: underline;
}
</style>
