import { Roboto, Geist_Mono } from 'next/font/google'
import localFont from 'next/font/local'

const RobotoSans = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-sans',
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
const fontList = [RobotoSans, geistMono, ClashDisplay]
// add font variable names to tailwind.config.ts aswell

// Export class names for root layout
export const fonts = fontList.map((font) => font.variable).join(' ')
