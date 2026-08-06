<template>
  <teleport to="body">
    <transition name="loading-fade">
      <div v-if="visible" class="global-loading">
        <div class="loading-backdrop">
          <div class="loading-content">
            <div class="loading-spinner">
              <svg viewBox="0 0 50 50" class="spinner">
                <circle
                  cx="25"
                  cy="25"
                  r="20.5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="4"
                  stroke-linecap="round"
                >
                  <animate
                    attributeName="stroke-dasharray"
                    dur="1.5s"
                    values="0,64;64,0;0,64"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="stroke-dashoffset"
                    dur="1.5s"
                    values="0;0;64"
                    repeatCount="indefinite"
                  />
                </circle>
              </svg>
            </div>
            <p v-if="text" class="loading-text">{{ text }}</p>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
define props({
  visible: {
    type: Boolean,
    default: true
  },
  text: {
    type: String,
    default: '加载中...'
  }
})
</script>

<style lang="scss" scoped>
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  pointer-events: auto;
}

.loading-backdrop {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(2px);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409eff;
  margin-bottom: 12px;
}

.spinner {
  width: 48px;
  height: 48px;
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 16px;
  color: #606266;
  font-weight: 500;
}

.loading-fade-enter-active,
.loading-fade-leave-active {
  transition: opacity 0.3s;
}

.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
}
</style>
