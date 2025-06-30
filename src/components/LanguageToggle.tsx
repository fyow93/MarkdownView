"use client"

import * as React from "react"
import { Languages } from "lucide-react"
import { useRouter, usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'

import { Button } from "@/components/ui/button"

export function LanguageToggle() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('Language')

  const toggleLanguage = () => {
    const newLocale = locale === 'zh' ? 'en' : 'zh'
    // Remove the current locale from pathname if it exists
    const pathnameWithoutLocale = pathname.startsWith(`/${locale}`) 
      ? pathname.slice(locale.length + 1) 
      : pathname
    
    // Navigate to the new locale
    router.push(`/${newLocale}${pathnameWithoutLocale}`)
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleLanguage}
      title={t('toggleLanguage')}
    >
      <Languages className="h-[1.2rem] w-[1.2rem]" />
      <span className="sr-only">{t('toggleLanguage')}</span>
    </Button>
  )
} 