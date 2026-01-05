import { Metadata } from "next";
import { getSeoConstants } from "../constants/SeoConstants";

export interface SeoDto {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  keywords?: string[];
  noIndex?: boolean;
  openGraph?: Metadata["openGraph"];
  includeQueryParams?: boolean; // Flag để bao gồm query string trong canonical
}

export class SeoHelper {
  static generateSeoMetadata(
    dto: SeoDto,
    locale: string = "vi",
    fullUrl?: string // URL đầy đủ từ request (bao gồm query)
  ): Metadata {
    const constants = getSeoConstants(locale);

    const title = dto.title
      ? `${dto.title}${constants.SEPARATOR}${constants.DEFAULT_TITLE}`
      : constants.DEFAULT_TITLE;

    const description = dto.description || constants.DEFAULT_DESCRIPTION;

    const images = dto.ogImage
      ? [{ url: dto.ogImage }]
      : [{ url: constants.DEFAULT_OG_IMAGE }];

    const metadata: Metadata = {
      title,
      description,
      openGraph: {
        title,
        description,
        siteName: constants.SITE_NAME,
        images: images,
        type: "website",
        ...dto.openGraph, // Merge override
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: images,
        creator: constants.TWITTER_HANDLE,
      },
    };

    // Xử lý canonical URL với query params nếu cần
    let canonicalUrl = dto.canonicalUrl;

    if (dto.includeQueryParams && fullUrl) {
      try {
        const url = new URL(fullUrl);
        if (url.search) {
          // Có query params → self-referencing canonical
          canonicalUrl = fullUrl;
        }
      } catch {
        // Nếu fullUrl không hợp lệ, giữ nguyên canonicalUrl
      }
    }

    if (canonicalUrl) {
      metadata.alternates = {
        canonical: canonicalUrl,
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
