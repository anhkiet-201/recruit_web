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
}

export class SeoHelper {
  static generateSeoMetadata(dto: SeoDto, locale: string = "vi"): Metadata {
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
