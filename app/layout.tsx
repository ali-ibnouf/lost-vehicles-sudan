import type { Metadata } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'

const cairo = Cairo({ 
  subsets: ['arabic'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ابحث عن عربيتك - السودان',
  description: 'نظام البحث عن العربات المفقودة في السودان - مجاني 100%',
  keywords: ['السودان', 'عربات مفقودة', 'سيارات', 'بحث', 'الخرطوم'],
  authors: [{ name: 'Lost Vehicles Sudan' }],
  manifest: '/manifest.json',
  themeColor: '#2196F3',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  openGraph: {
    title: 'ابحث عن عربيتك - السودان',
    description: 'نظام البحث عن العربات المفقودة في السودان',
    type: 'website',
    locale: 'ar_SD',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={cairo.className}>
        {children}
      </body>
    </html>
  )
}
