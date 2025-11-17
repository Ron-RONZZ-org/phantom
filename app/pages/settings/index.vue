<template>
  <div class="settings-page">
    <nav class="top-nav">
      <NuxtLink to="/" class="nav-link">Home</NuxtLink>
      <NuxtLink to="/articles" class="nav-link">Articles</NuxtLink>
      <NuxtLink to="/editor" class="nav-link">Editor</NuxtLink>
      <span v-if="isAuthenticated" class="nav-link" @click="handleLogout">Logout</span>
    </nav>

    <div v-if="!isAuthenticated" class="auth-required">
      <h1>Settings</h1>
      <p>You must be logged in to access settings.</p>
      <NuxtLink to="/editor" class="btn btn-primary">Go to Login</NuxtLink>
    </div>

    <div v-else class="settings-section">
      <h1>Settings</h1>

      <!-- Password Change Section -->
      <section class="settings-card">
        <h2>Change Password</h2>
        <form @submit.prevent="handlePasswordChange" class="settings-form">
          <div class="form-group">
            <label for="currentPassword">Current Password</label>
            <input 
              id="currentPassword"
              v-model="passwordForm.currentPassword" 
              type="password" 
              required
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label for="newPassword">New Password</label>
            <input 
              id="newPassword"
              v-model="passwordForm.newPassword" 
              type="password" 
              required
              minlength="8"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label for="confirmPassword">Confirm New Password</label>
            <input 
              id="confirmPassword"
              v-model="passwordForm.confirmPassword" 
              type="password" 
              required
              class="form-input"
            />
          </div>
          <button type="submit" class="btn btn-primary">Change Password</button>
          <p v-if="passwordMessage" class="success-message">{{ passwordMessage }}</p>
          <p v-if="passwordError" class="error-message">{{ passwordError }}</p>
        </form>
      </section>

      <!-- TOTP Configuration Section -->
      <section class="settings-card">
        <h2>Two-Factor Authentication (TOTP)</h2>
        <div v-if="user?.totpEnabled" class="totp-status">
          <p class="success-message">✓ TOTP is currently enabled</p>
          <button @click="disableTotp" class="btn btn-secondary">Disable TOTP</button>
        </div>
        <div v-else>
          <p class="info-message">Enable two-factor authentication for enhanced security</p>
          <button v-if="!showTotpSetup" @click="setupTotp" class="btn btn-primary">
            Setup TOTP
          </button>
          <div v-if="showTotpSetup" class="totp-setup">
            <p>Scan this QR code with your authenticator app:</p>
            <img v-if="totpQrCode" :src="totpQrCode" alt="TOTP QR Code" class="qr-code" />
            <p>Or enter this secret manually: <code>{{ totpSecret }}</code></p>
            <div class="form-group">
              <label for="totpVerify">Enter verification code:</label>
              <input 
                id="totpVerify"
                v-model="totpVerifyToken" 
                type="text" 
                placeholder="6-digit code"
                class="form-input"
                maxlength="6"
              />
            </div>
            <button @click="enableTotp" class="btn btn-primary">Enable TOTP</button>
            <button @click="cancelTotpSetup" class="btn btn-secondary">Cancel</button>
          </div>
        </div>
        <p v-if="totpMessage" class="success-message">{{ totpMessage }}</p>
        <p v-if="totpError" class="error-message">{{ totpError }}</p>
      </section>

      <!-- Custom Theme Section -->
      <section class="settings-card">
        <h2>Custom Theme (CSS)</h2>
        <p class="info-message">Customize the appearance of your blog by uploading a custom CSS file</p>
        
        <div class="theme-actions">
          <button @click="downloadTheme" class="btn btn-secondary">
            Download Current Theme
          </button>
          
          <div class="upload-section">
            <input 
              type="file" 
              ref="fileInput" 
              @change="handleFileSelect" 
              accept=".css"
              style="display: none;"
            />
            <button @click="triggerFileUpload" class="btn btn-primary">
              Upload Custom Theme
            </button>
            <span v-if="selectedFile" class="file-name">{{ selectedFile.name }}</span>
          </div>
          
          <button 
            v-if="selectedFile" 
            @click="uploadTheme" 
            class="btn btn-primary"
          >
            Apply Theme
          </button>
        </div>
        
        <p v-if="themeMessage" class="success-message">{{ themeMessage }}</p>
        <p v-if="themeError" class="error-message">{{ themeError }}</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const isAuthenticated = ref(false)
const user = ref<any>(null)

// Password form
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordMessage = ref('')
const passwordError = ref('')

// TOTP form
const showTotpSetup = ref(false)
const totpQrCode = ref('')
const totpSecret = ref('')
const totpVerifyToken = ref('')
const totpMessage = ref('')
const totpError = ref('')

// Theme form
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const themeMessage = ref('')
const themeError = ref('')

const checkAuth = async () => {
  try {
    const response = await $fetch('/api/auth/me')
    isAuthenticated.value = true
    user.value = response.user
  } catch {
    isAuthenticated.value = false
    navigateTo('/editor')
  }
}

const handleLogout = async () => {
  try {
    await $fetch('/api/auth/logout', {
      method: 'POST'
    })
    navigateTo('/editor')
  } catch (err: any) {
    console.error('Logout failed:', err)
  }
}

const handlePasswordChange = async () => {
  passwordMessage.value = ''
  passwordError.value = ''

  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = 'New passwords do not match'
    return
  }

  if (passwordForm.value.newPassword.length < 8) {
    passwordError.value = 'Password must be at least 8 characters'
    return
  }

  try {
    await $fetch('/api/auth/change-password', {
      method: 'POST',
      body: {
        currentPassword: passwordForm.value.currentPassword,
        newPassword: passwordForm.value.newPassword
      }
    })
    passwordMessage.value = 'Password changed successfully!'
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  } catch (err: any) {
    passwordError.value = err.data?.statusMessage || 'Failed to change password'
  }
}

const setupTotp = async () => {
  totpError.value = ''
  totpMessage.value = ''
  
  try {
    const response = await $fetch('/api/auth/totp/setup', {
      method: 'POST'
    })
    totpQrCode.value = response.qrCode
    totpSecret.value = response.secret
    showTotpSetup.value = true
  } catch (err: any) {
    totpError.value = err.data?.statusMessage || 'Failed to setup TOTP'
  }
}

const enableTotp = async () => {
  totpError.value = ''
  totpMessage.value = ''
  
  try {
    await $fetch('/api/auth/totp/enable', {
      method: 'POST',
      body: {
        token: totpVerifyToken.value
      }
    })
    totpMessage.value = 'TOTP enabled successfully!'
    showTotpSetup.value = false
    totpVerifyToken.value = ''
    // Refresh user data
    await checkAuth()
  } catch (err: any) {
    totpError.value = err.data?.statusMessage || 'Failed to enable TOTP'
  }
}

const disableTotp = async () => {
  totpError.value = ''
  totpMessage.value = ''
  
  try {
    await $fetch('/api/auth/totp/disable', {
      method: 'POST'
    })
    totpMessage.value = 'TOTP disabled successfully!'
    // Refresh user data
    await checkAuth()
  } catch (err: any) {
    totpError.value = err.data?.statusMessage || 'Failed to disable TOTP'
  }
}

const cancelTotpSetup = () => {
  showTotpSetup.value = false
  totpQrCode.value = ''
  totpSecret.value = ''
  totpVerifyToken.value = ''
  totpError.value = ''
}

const downloadTheme = async () => {
  themeError.value = ''
  themeMessage.value = ''
  
  try {
    const response = await $fetch('/api/settings/theme', {
      method: 'GET'
    })
    
    // Create a blob and download it
    const blob = new Blob([response.css], { type: 'text/css' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'theme.css'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    themeMessage.value = 'Theme downloaded successfully!'
  } catch (err: any) {
    themeError.value = err.data?.statusMessage || 'Failed to download theme'
  }
}

const triggerFileUpload = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0]
    themeError.value = ''
  }
}

const uploadTheme = async () => {
  themeError.value = ''
  themeMessage.value = ''
  
  if (!selectedFile.value) {
    themeError.value = 'Please select a CSS file'
    return
  }

  try {
    const cssContent = await selectedFile.value.text()
    
    await $fetch('/api/settings/theme', {
      method: 'POST',
      body: {
        css: cssContent
      }
    })
    
    themeMessage.value = 'Theme uploaded successfully! Refresh the page to see changes.'
    selectedFile.value = null
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  } catch (err: any) {
    themeError.value = err.data?.statusMessage || 'Failed to upload theme'
  }
}

onMounted(() => {
  checkAuth()
})
</script>

<style scoped>
.settings-page {
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

.auth-required {
  background: white;
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.settings-section {
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
  margin-bottom: 20px;
  color: #333;
}

.settings-card {
  margin-bottom: 40px;
  padding-bottom: 40px;
  border-bottom: 1px solid #e0e0e0;
}

.settings-card:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.settings-form {
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

.form-input {
  width: 100%;
  padding: 10px 15px;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: #007bff;
}

.btn {
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 500;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 10px;
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
  display: block;
}

.success-message {
  color: #28a745;
  margin-top: 15px;
  display: block;
}

.info-message {
  color: #666;
  margin-bottom: 15px;
}

.totp-status {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.totp-setup {
  margin-top: 20px;
}

.qr-code {
  margin: 20px 0;
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 4px;
  max-width: 300px;
}

code {
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.theme-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
}

.upload-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-name {
  font-size: 0.9rem;
  color: #666;
}
</style>
