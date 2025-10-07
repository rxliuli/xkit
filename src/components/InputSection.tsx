import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface InputSectionProps {
  isLoading: boolean
  onSubmit: (username: string) => void
  classNames?: {
    input?: string
    button?: string
  }
}

export const InputSection = ({ isLoading, onSubmit, classNames }: InputSectionProps) => {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      if (!inputRef.current?.value) return
      onSubmit(inputRef.current?.value || '')
    }
  }
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
      <div className="flex-1 min-w-0">
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
          {t('familyTree.usernameLabel')}
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-base">
            @
          </span>
          <input
            id="username"
            type="text"
            ref={inputRef}
            onKeyPress={handleKeyPress}
            placeholder={t('familyTree.usernamePlaceholder')}
            className={cn(
              'w-full pl-8 pr-4 py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent',
              classNames?.input,
            )}
            disabled={isLoading}
          />
        </div>
      </div>
      <button
        onClick={() => onSubmit(inputRef.current?.value || '')}
        disabled={isLoading}
        className={cn(
          'w-full sm:w-auto px-6 sm:px-8 py-3 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-medium',
          classNames?.button,
        )}
      >
        {isLoading ? t('familyTree.analysingButton') : t('familyTree.generateButton')}
      </button>
    </div>
  )
}
