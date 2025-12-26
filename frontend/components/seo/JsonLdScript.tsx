import { COMPANY_INFO } from '../../constants/CompanyConstants';

export default function JsonLdScript() {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${COMPANY_INFO.baseUrl}/#website`,
    "url": COMPANY_INFO.baseUrl,
    "name": COMPANY_INFO.name,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${COMPANY_INFO.baseUrl}/jobs?title={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  const employmentAgencySchema = {
    "@context": "https://schema.org",
    "@type": "EmploymentAgency",
    "@id": `${COMPANY_INFO.baseUrl}/#employmentagency`,
    "name": COMPANY_INFO.name,
    "legalName": COMPANY_INFO.legalName,
    "alternateName": COMPANY_INFO.alternateNames,
    "description": COMPANY_INFO.description,
    "slogan": COMPANY_INFO.slogan,
    "url": COMPANY_INFO.baseUrl,
    "logo": COMPANY_INFO.logo,
    "image": COMPANY_INFO.logo,
    "sameAs": [
      COMPANY_INFO.mainDomain,
      ...COMPANY_INFO.socialLinks
    ],
    "address": {
      "@type": "PostalAddress",
      "streetAddress": COMPANY_INFO.address.street,
      "addressLocality": COMPANY_INFO.address.locality,
      "addressRegion": COMPANY_INFO.address.region,
      "postalCode": COMPANY_INFO.address.postalCode,
      "addressCountry": COMPANY_INFO.address.country
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": COMPANY_INFO.geo.latitude,
      "longitude": COMPANY_INFO.geo.longitude
    },
    "hasMap": COMPANY_INFO.hasMap,
    "telephone": COMPANY_INFO.contact.phone,
    "email": COMPANY_INFO.contact.email,
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": COMPANY_INFO.openingHours.days,
      "opens": COMPANY_INFO.openingHours.opens,
      "closes": COMPANY_INFO.openingHours.closes
    },
    "areaServed": COMPANY_INFO.areaServed.map(area => ({
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
