import { Metadata } from "next";
import { SEO_CONSTANTS } from "../constants/SeoConstants";

export interface SeoDto {
    title?: string;
    description?: string;
    canonicalUrl?: string;
    ogImage?: string;
    keywords?: string[];
    noIndex?: boolean;
}

export class SeoHelper {
    static generateSeoMetadata(dto: SeoDto): Metadata {
        const title = dto.title
            ? `${dto.title}${SEO_CONSTANTS.SEPARATOR}${SEO_CONSTANTS.DEFAULT_TITLE}`
            : SEO_CONSTANTS.DEFAULT_TITLE;

        const description = dto.description || SEO_CONSTANTS.DEFAULT_DESCRIPTION;

        const images = dto.ogImage
            ? [{ url: dto.ogImage }]
            : [{ url: SEO_CONSTANTS.DEFAULT_OG_IMAGE }];

        const metadata: Metadata = {
            title,
            description,
            openGraph: {
                title,
                description,
                siteName: SEO_CONSTANTS.SITE_NAME,
                images: images,
                type: "website",
            },
            twitter: {
                card: "summary_large_image",
                title,
                description,
                images: images,
                creator: SEO_CONSTANTS.TWITTER_HANDLE,
            },
        };

        if (dto.canonicalUrl) {
            metadata.alternates = {
                canonical: dto.canonicalUrl,
            };
        }

        if (dto.keywords && dto.keywords.length > 0) {
            metadata.keywords = dto.keywords;
        }

        if (dto.noIndex) {
            metadata.robots = {
                index: false,
                follow: false,
            };
        }

        return metadata;
    }
}
