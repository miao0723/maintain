import { ref, onUnmounted } from 'vue'

export interface SpeechRecognitionOptions {
  lang?: string
  continuous?: boolean
  interimResults?: boolean
  maxAlternatives?: number
}

export function useSpeechRecognition(options: SpeechRecognitionOptions = {}) {
  const isListening = ref(false)
  const transcript = ref('')
  const interimTranscript = ref('')
  const error = ref<string | null>(null)
  const isSupported = ref(false)

  let recognition: any = null

  const defaultOptions: SpeechRecognitionOptions = {
    lang: 'zh-CN',
    continuous: false,
    interimResults: true,
    maxAlternatives: 1,
    ...options
  }

  const init = () => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        isSupported.value = true
        recognition = new SpeechRecognition()
        recognition.lang = defaultOptions.lang
        recognition.continuous = defaultOptions.continuous
        recognition.interimResults = defaultOptions.interimResults
        recognition.maxAlternatives = defaultOptions.maxAlternatives

        recognition.onresult = (event: any) => {
          let finalTranscript = ''
          let interimTrans = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            if (result.isFinal) {
              finalTranscript += result[0].transcript
            } else {
              interimTrans += result[0].transcript
            }
          }

          if (finalTranscript) {
            transcript.value += finalTranscript
          }
          interimTranscript.value = interimTrans
        }

        recognition.onerror = (event: any) => {
          error.value = `语音识别错误: ${event.error}`
          isListening.value = false

          const errors: Record<string, string> = {
            'no-speech': '未检测到语音输入',
            'audio-capture': '无法访问麦克风',
            'not-allowed': '麦克风权限被拒绝',
            'network': '网络连接失败',
            'aborted': '语音识别被中断',
            'timeout': '语音识别超时'
          }

          const errorMessage = errors[event.error] || event.error
          error.value = errorMessage
        }

        recognition.onend = () => {
          isListening.value = false
        }

        recognition.onstart = () => {
          isListening.value = true
          error.value = null
        }
      }
    }
  }

  const start = () => {
    if (!isSupported.value) {
      error.value = '您的浏览器不支持语音识别功能'
      return false
    }

    if (isListening.value) {
      return false
    }

    try {
      transcript.value = ''
      interimTranscript.value = ''
      error.value = null
      recognition.start()
      return true
    } catch (e) {
      error.value = '启动语音识别失败'
      return false
    }
  }

  const stop = () => {
    if (recognition && isListening.value) {
      recognition.stop()
    }
  }

  const reset = () => {
    transcript.value = ''
    interimTranscript.value = ''
    error.value = null
  }

  init()

  onUnmounted(() => {
    if (recognition && isListening.value) {
      recognition.stop()
    }
  })

  return {
    is: {
      listening: isListening,
      supported: isSupported
    },
    get: {
      transcript,
      interimTranscript,
      error
    },
    start,
    stop,
    reset
  }
}
