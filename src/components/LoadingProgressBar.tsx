import { memo } from 'react'

interface LoadingProgressBarProps {
  isLoading: boolean
  progressText: string
  progress: number
}

export const LoadingProgressBar = memo(({ isLoading, progressText, progress }: LoadingProgressBarProps) => {
  if (!isLoading) return null
  return (
    <div className="mt-6">
      <div className="flex justify-between text-sm text-text-primary mb-2">
        <span>{progressText}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
        <div
          className="bg-blue-600 dark:bg-blue-500 h-3 rounded-full transition-all duration-300 relative overflow-hidden"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
        </div>
      </div>
    </div>
  )
})
