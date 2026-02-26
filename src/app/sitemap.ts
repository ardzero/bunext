import type { MetadataRoute } from 'next'
import { baseURL } from '@/lib/utils/metadata'
// for more info:
// https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: baseURL,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 1,
        },
    ]
}
