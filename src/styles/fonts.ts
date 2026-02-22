import { Roboto as FontSans } from 'next/font/google'
import localFont from 'next/font/local'

const fontSans = FontSans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-sans',
})

const ClashDisplay = localFont({
  src: [
    {
      path: './fonts/ClashDisplay-Variable.woff2',
      weight: '200 700',
      style: 'normal',
    },
  ],
  variable: '--font-clash',
  display: 'swap',
})

// array of fonts
export const fontList = [fontSans, ClashDisplay]
// add font variable names to tailwind.config.ts aswell

// Export class names for root layout
export const fonts = fontList.map((font) => font.variable).join(' ')
