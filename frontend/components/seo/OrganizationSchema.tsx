import { getCompanyInfo } from "@/constants/CompanyConstants";

interface Props {
  locale: string;
}

/**
 * Organization Schema component
 * Renders standalone Organization structured data
 * @see https://schema.org/Organization
 */
export default function OrganizationSchema({ locale }: Props) {
  const companyInfo = getCompanyInfo(locale);

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${companyInfo.baseUrl}/#organization`,
    name: companyInfo.name,
    legalName: companyInfo.legalName,
    url: companyInfo.baseUrl,
    logo: companyInfo.logo,
    foundingDate: companyInfo.foundingDate,
    numberOfEmployees: companyInfo.numberOfEmployees
      ? {
          "@type": "QuantitativeValue",
          minValue: companyInfo.numberOfEmployees.minValue,
          maxValue: companyInfo.numberOfEmployees.maxValue,
        }
      : undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: companyInfo.address.street,
      addressLocality: companyInfo.address.locality,
      addressRegion: companyInfo.address.region,
      postalCode: companyInfo.address.postalCode,
      addressCountry: companyInfo.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: companyInfo.geo.latitude,
      longitude: companyInfo.geo.longitude,
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: companyInfo.contact.phone,
      email: companyInfo.contact.email,
      contactType: "Customer Service",
      availableLanguage: companyInfo.contact.availableLanguage,
    },
    sameAs: [companyInfo.mainDomain, ...companyInfo.socialLinks],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
    />
  );
}
