import type { TSiteData, TtwitterMetaData, TMetadataIcons } from "@/types";

// edit the webmanifest file in /public to change the name, short_name, and icons in android
// in webmanifest, theme_color is the color of the app icon's background and
export const siteData: TSiteData = {
    name: 'BUNEXT - Next.js 16 Bun Starter',
    shortName: 'BUNEXT',
    publisher: 'bunext.ardzero.com',
    baseUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://bunext.ardzero.com",
    description:
        'BUNEXT is a opinionated Next.js 16 Starter Template setup with tailwindV4, shadcn, bun, next-themes, nuqs, react motion, feature flags, metadata generator, custom image components with lazy loading and auto generated placeholder, qr code generator, unique code generator etc.',
    ogImage: { src: "/ogImage.jpg", alt: "BUNEXT", width: 1200, height: 630 },
    metadata_color: {
        light: "#FFEECD",
        dark: "#FFEECD",
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

//All icons can be auto generated from favicon.svg by running `bun run generate:icons` 
export const icons: TMetadataIcons = {
    icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/favicons/favicon.ico", sizes: "any" },
        { url: "/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicons/favicon-48x48.png", sizes: "48x48", type: "image/png" },
    ],
    shortcut: "/favicons/favicon.ico",
    apple: [{ url: "/favicons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
};

// these are defaults may get overwrited in specific routes
export const twitterMetaData: TtwitterMetaData = {
    card: "summary_large_image",
    title: siteData.name,
    description: siteData.description,
    image: siteData.ogImage.src,
    creator: "@ardastroid", //twitter username of author
};

// // By default, it uses the favicon mentioned at the top
// export const icons: TMetadataIcons = {
//     icon: siteData.favicon, // "/favicon.svg",
//     shortcut: siteData.favicon, // "/favicon-16x16.png",
//     apple: siteData.favicon, // "/apple-touch-icon.png",
// };
