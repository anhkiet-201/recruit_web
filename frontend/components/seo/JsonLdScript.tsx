import { getCompanyInfo } from '../../constants/CompanyConstants';

interface Props {
  locale: string;
}

export default function JsonLdScript({ locale }: Props) {
  const companyInfo = getCompanyInfo(locale);

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${companyInfo.baseUrl}/#website`,
    "url": companyInfo.baseUrl,
    "inLanguage": locale,
    "name": companyInfo.name,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${companyInfo.baseUrl}/jobs?title={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  const employmentAgencySchema = {
    "@context": "https://schema.org",
    "@type": "EmploymentAgency",
    "@id": `${companyInfo.baseUrl}/#employmentagency`,
    "inLanguage": locale,
    "name": companyInfo.name,
    "legalName": companyInfo.legalName,
    "alternateName": companyInfo.alternateNames,
    "description": companyInfo.description,
    "slogan": companyInfo.slogan,
    "url": companyInfo.baseUrl,
    "logo": companyInfo.logo,
    "image": companyInfo.logo,
    "sameAs": [
      companyInfo.mainDomain,
      ...companyInfo.socialLinks
    ],
    "address": {
      "@type": "PostalAddress",
      "streetAddress": companyInfo.address.street,
      "addressLocality": companyInfo.address.locality,
      "addressRegion": companyInfo.address.region,
      "postalCode": companyInfo.address.postalCode,
      "addressCountry": companyInfo.address.country
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": companyInfo.geo.latitude,
      "longitude": companyInfo.geo.longitude
    },
    "hasMap": companyInfo.hasMap,
    "telephone": companyInfo.contact.phone,
    "email": companyInfo.contact.email,
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": companyInfo.openingHours.days,
      "opens": companyInfo.openingHours.opens,
      "closes": companyInfo.openingHours.closes
    },
    "areaServed": companyInfo.areaServed.map(area => ({
        "@type": "City",
        "name": area
    })),
    "knowsAbout": [
      "Cung ứng nhân lực",
      "Tuyển dụng",
      "Lao động phổ thông"
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(employmentAgencySchema) }}
      />
    </>
  );
}
