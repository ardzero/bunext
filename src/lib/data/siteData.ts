import type { TSiteData, TtwitterMetaData, TMetadataIcons } from "@/types";

// edit the webmanifest file in /public to change the name, short_name, and icons in android
// in webmanifest, theme_color is the color of the app icon's background and
export const siteData: TSiteData = {
    favicon: '/favicon.svg', // .svg / .ico / .png
    name: 'BUNEXT - Next.js 16 Bun Starter',
    shortName: 'BUNEXT',
    publisher: 'bunext.ardastroid.com',
    baseUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://bunext.ardastroid.com",
    description:
        'BUNEXT is a opinionated Next.js 16 Starter Template setup with tailwindV4, shadcn, bun, next-themes, nuqs, react motion, feature flags, metadata generator, custom image components with lazy loading and auto generated placeholder, qr code generator, unique code generator etc.',
    ogImage: { src: "/ogImage.jpg", alt: "BUNEXT", width: 1200, height: 630 },
    metadata_color: {
        light: "#3A86FF",
        dark: "#3A86FF",
    },
    author: {
        name: "Ard Astroid",
        url: "https://github.com/ardzero/",
    },
    keywords: [
        'Next.js',
        'React',
        'Tailwind CSS',
        'Bun',
        'Shadcn UI',
        'TypeScript',
        'Template',
        'Starter',
        'Opinionated',
        'Bunext',
        'Next.js 16',
        'TailwindV4',
    ],

    robotsDefault: { index: true, follow: true }
};

// these are defaults may get overwrited in specific routes
export const twitterMetaData: TtwitterMetaData = {
    card: "summary_large_image",
    title: siteData.name,
    description: siteData.description,
    image: siteData.ogImage.src,
    creator: "@ardastroid", //twitter username of author
};

// By default, it uses the favicon mentioned at the top
export const icons: TMetadataIcons = {
    icon: siteData.favicon, // "/favicon.svg",
    shortcut: siteData.favicon, // "/favicon-16x16.png",
    apple: siteData.favicon, // "/apple-touch-icon.png",
};
