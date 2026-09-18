import { ref, watch, onBeforeUnmount } from 'vue'

/**
 * 数字滚动动画（CountUp 效果，零依赖）
 * 用法：const display = useCountUp(sourceRef, { duration: 1200, decimals: 1 })
 * sourceRef 变化时从当前显示值缓动到新值。
 */
export function useCountUp(source, options = {}) {
  const { duration = 1200, decimals = 0 } = options
  const display = ref(0)
  let rafId = null
  let from = 0

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

  const animateTo = (target) => {
    if (rafId) cancelAnimationFrame(rafId)
    const start = performance.now()
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1)
      const val = from + (target - from) * easeOutCubic(p)
      const factor = Math.pow(10, decimals)
      display.value = Math.round(val * factor) / factor
      if (p < 1) {
        rafId = requestAnimationFrame(step)
      } else {
        from = target
      }
    }
    rafId = requestAnimationFrame(step)
  }

  watch(
    () => source.value,
    (v) => animateTo(Number(v || 0)),
    { immediate: true }
  )

  onBeforeUnmount(() => {
    if (rafId) cancelAnimationFrame(rafId)
  })

  return display
}
