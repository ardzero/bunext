import type { Metadata, Viewport } from 'next'
import type { StaticImageData } from 'next/image'
import type { Graph, ImageObject, Organization, WebSite } from 'schema-dts'

import { icons, siteData, twitterMetaData as twData } from '@/lib/data/siteData'
import { getBaseUrl } from '@/lib/utils'
import type { Author, MetadataColor, TMetadataIcons } from '@/types'

// gets the full remote url
export const remoteUrl = getBaseUrl()


export const viewportData: Viewport = {
    themeColor: [
        {
            media: '(prefers-color-scheme: light)',
            color: siteData.metadata_color.light,
        },
        {
            media: '(prefers-color-scheme: dark)',
            color: siteData.metadata_color.dark,
        },
    ],
}
// Metadata

export const siteMetaData: Metadata = {
    // title: {
    // 	default: siteData.name,
    // 	template: `%s / ${siteData.name}`,
    // },
    title: siteData.name,
    description: siteData.description,
    robots: siteData.robotsDefault, //  { index: false, follow: false }
    publisher: siteData.publisher,
    metadataBase: new URL(remoteUrl),
    keywords: siteData.keywords,
    authors: [
        {
            name: siteData.author.name,
            url: siteData.author.url,
        },
    ],
    creator: siteData.author.name,
    // og metadata
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: remoteUrl,
        siteName: siteData.baseUrl,
        title: siteData.name,
        description: siteData.description,
        images: [
            {
                url: siteData.ogImage.src,
                width: siteData.ogImage.width,
                height: siteData.ogImage.height,
                alt: siteData.ogImage.alt,
            },
        ],
    },
    // twitter metadata
    twitter: {
        card: twData.card,
        title: twData.title,
        description: twData.description,
        site: `@${siteData.publisher}`,
        images: [twData.image],
        creator: twData.creator,
    },
    alternates: {
        canonical: remoteUrl,
    },

    icons: icons,
    manifest: `${remoteUrl}/site.webmanifest`,
}


type OgImageInput =
    | string
    | StaticImageData
    | { src: string; alt?: string; width?: number; height?: number }

type CustomMetadataProps = {
    title: string
    description?: string
    publisher?: string
    url?: string | URL
    keywords?: string[]
    authors?: Author[]
    creator?: string
    twCreator?: string
    titleSuffix?: boolean
    shortSuffix?: boolean
    ogTitle?: string
    ogTitleSuffix?: boolean
    longogTitleSuffix?: boolean
    ogImage?: OgImageInput
    robots?: 'index, follow' | 'noindex, nofollow' | { index: boolean; follow: boolean }
    metadataColor?: MetadataColor
    metadataIcons?: TMetadataIcons
}

/**
 * Normalizes a URL to a string (handles `URL` instances).
 * @param url - URL as string, URL object, or undefined
 * @returns String URL or undefined
 */
const resolveUrl = (url: string | URL | undefined): string | undefined =>
    url == null ? undefined : typeof url === 'string' ? url : url.toString()

/**
 * Resolves OG image input to a single object with url, width, height, alt.
 * Uses site defaults for missing dimensions/alt when not provided.
 * @param ogImage - String URL, StaticImageData, or object with src and optional alt/width/height
 * @returns Normalized image object for Open Graph
 */
const resolveOgImage = (
    ogImage: OgImageInput | undefined
): { url: string; width: number; height: number; alt: string } => {
    const fallback = siteData.ogImage
    if (ogImage == null) {
        return { url: fallback.src, width: fallback.width ?? 1200, height: fallback.height ?? 630, alt: fallback.alt }
    }
    if (typeof ogImage === 'string') {
        return { url: ogImage, width: fallback.width ?? 1200, height: fallback.height ?? 630, alt: fallback.alt }
    }
    const src = 'src' in ogImage ? ogImage.src : (ogImage as StaticImageData).src
    const width = ('width' in ogImage ? ogImage.width : (ogImage as StaticImageData).width) ?? fallback.width ?? 1200
    const height = ('height' in ogImage ? ogImage.height : (ogImage as StaticImageData).height) ?? fallback.height ?? 630
    const alt = ('alt' in ogImage ? ogImage.alt : undefined) ?? fallback.alt
    return { url: src, width, height, alt }
}

/**
 * Builds Next.js `Metadata` for a page with site defaults and optional overrides.
 * Use by exporting `metadata = getCustomMetaData({ title: 'Page Title', ... })` from a page or layout.
 *
 * @param options - Custom metadata options (all optional except `title`)
 * @param options.title - Page title (required)
 * @param options.description - Meta description; falls back to site description
 * @param options.url - Canonical URL for the page (string or URL); used for metadataBase, openGraph.url, alternates.canonical
 * @param options.ogTitle - Override for Open Graph and Twitter title; if omitted, derived from title + suffix
 * @param options.ogImage - OG image: URL string, StaticImageData, or `{ src, alt?, width?, height? }`
 * @param options.robots - Robots directive; defaults to `'index, follow'`
 * @param options.metadataIcons - Per-page icons; falls back to site icons
 * @param options.titleSuffix - Whether to append site name/shortName to title (default true)
 * @param options.ogTitleSuffix - Whether to append suffix to OG title (default true)
 * @param options.shortSuffix - Use short site name for title suffix when true
 * @param options.longogTitleSuffix - Use full site name for OG title suffix when true
 * @param options.authors - Page authors; falls back to site author
 * @param options.keywords - Page keywords; falls back to site keywords
 * @param options.publisher - Publisher; falls back to site publisher
 * @param options.creator - Creator; falls back to site author name
 * @param options.twCreator - Twitter creator handle; falls back to site default
 * @param options.metadataColor - Not applied to Metadata; use `getCustomViewport(metadataColor)` and export as `viewport` for theme-color
 * @returns Next.js Metadata object for the page
 */
export const getCustomMetaData = ({
    title,
    description,
    publisher,
    url,
    keywords,
    authors,
    creator,
    twCreator,
    titleSuffix = true,
    shortSuffix,
    ogTitle: ogTitleOverride,
    ogTitleSuffix = true,
    longogTitleSuffix,
    ogImage,
    robots = 'index, follow',
    metadataIcons: metadataIconsOverride,
}: CustomMetadataProps): Metadata => {
    const suffix = shortSuffix ? siteData.shortName : siteData.name
    const customTitle = titleSuffix ? `${title} / ${suffix}` : title

    const ogSuffix = longogTitleSuffix ? siteData.name : siteData.shortName
    const derivedOgTitle = ogTitleSuffix ? `${title} / ${ogSuffix}` : title
    const ogTitle = ogTitleOverride ?? derivedOgTitle

    const pageDescription = description || siteData.description
    const canonicalUrl = resolveUrl(url) || remoteUrl
    const resolvedOgImage = resolveOgImage(ogImage)
    const pageIcons = metadataIconsOverride ?? icons

    const md: Metadata = {
        title: customTitle,
        description: pageDescription,

        robots: robots || siteData.robotsDefault, //  { index: false, follow: false }
        publisher: publisher || siteData.publisher,
        metadataBase: new URL(canonicalUrl),
        keywords: keywords || siteData.keywords,
        authors: authors || [
            {
                name: siteData.author.name,
                url: siteData.author.url,
            },
        ],
        creator: creator || siteData.author.name,
        // og metadata
        openGraph: {
            type: 'website',
            locale: 'en_US',
            url: canonicalUrl,
            siteName: siteData.baseUrl,
            title: ogTitle,
            description: pageDescription,
            images: [
                {
                    url: resolvedOgImage.url,
                    width: resolvedOgImage.width,
                    height: resolvedOgImage.height,
                    alt: resolvedOgImage.alt,
                },
            ],
        },
        twitter: {
            card: twData.card,
            title: ogTitle,
            description: pageDescription,
            site: `@${publisher || siteData.publisher}`,
            images: [resolvedOgImage.url],
            creator: twCreator || twData.creator,
        },
        alternates: {
            canonical: canonicalUrl,
        },
        icons: pageIcons,
        manifest: `${remoteUrl}/site.webmanifest`,
    }
    return md
}

/**
 * Returns a Next.js `Viewport` with optional custom theme colors.
 * Use when a page needs a different theme-color than the root; export as `viewport` in that page.
 *
 * @param metadataColor - Optional `{ light, dark }` hex colors for theme-color media queries
 * @returns Viewport object; if `metadataColor` is omitted, returns the default site viewport
 */
export const getCustomViewport = (metadataColor?: MetadataColor): Viewport =>
    metadataColor
        ? {
            themeColor: [
                { media: '(prefers-color-scheme: light)', color: metadataColor.light },
                { media: '(prefers-color-scheme: dark)', color: metadataColor.dark },
            ],
        }
        : viewportData





const websiteId = `${remoteUrl}/#website`
const organizationId = `${remoteUrl}/#organization`

/**
 * Builds site-wide JSON-LD graph (WebSite + Organization) for the root layout.
 * Renders as a single `<script type="application/ld+json">` in the document head.
 *
 * @returns Schema.org Graph with WebSite and Organization nodes
 * @see https://nextjs.org/docs/app/guides/json-ld
 */
export function getSiteJsonLd(): Graph {
    const webSite: WebSite = {
        '@type': 'WebSite',
        '@id': websiteId,
        url: remoteUrl,
        name: siteData.name,
        description: siteData.description,
        publisher: { '@id': organizationId },
        inLanguage: 'en-US',
    }
    const logo: ImageObject = {
        '@type': 'ImageObject',
        url: new URL(siteData.ogImage.src, remoteUrl).toString(),
    }
    const organization: Organization = {
        '@type': 'Organization',
        '@id': organizationId,
        name: siteData.name,
        url: remoteUrl,
        logo,
    }
    return {
        '@context': 'https://schema.org',
        '@graph': [webSite, organization],
    }
}
