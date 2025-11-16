<template>
  <div class="articles-page">
    <header class="header">
      <h1>All Articles</h1>
      <nav>
        <NuxtLink to="/" class="nav-link">Home</NuxtLink>
        <NuxtLink to="/articles" class="nav-link">Articles</NuxtLink>
        <NuxtLink to="/editor" class="nav-link">Editor</NuxtLink>
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
        <input 
          v-model="tagFilter" 
          type="text" 
          placeholder="Filter by tag..." 
          class="search-input"
          @input="handleSearch"
        />
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

const handleSearch = useDebounceFn(() => {
  fetchArticles()
}, 300)

const filterByTag = (tagName: string) => {
  tagFilter.value = tagName
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
