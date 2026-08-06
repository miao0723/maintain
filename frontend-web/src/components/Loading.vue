<template>
  <div v-if="visible" class="loading-container" :class="`loading-${size}`">
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
</template>

<script setup>
define props({
  visible: {
    type: Boolean,
    default: true
  },
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['small', 'default', 'large'].includes(value)
  },
  text: {
    type: String,
    default: ''
  }
})
</script>

<style lang="scss" scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;

  &.loading-small {
    padding: 10px;

    .spinner {
      width: 24px;
      height: 24px;
    }
  }

  &.loading-large {
    padding: 40px;

    .spinner {
      width: 48px;
      height: 48px;
    }
  }

  &.loading-default {
    .spinner {
      width: 32px;
      height: 32px;
    }
  }
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409eff;
}

.spinner {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  margin-top: 12px;
  font-size: 14px;
  color: #606266;
}
</style>
