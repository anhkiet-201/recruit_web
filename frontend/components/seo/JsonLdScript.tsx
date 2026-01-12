import {
  generateWebSiteSchema,
} from "@/utils/schemaGenerator";
import { getCompanyInfo } from "@/constants/CompanyConstants";

interface Props {
  locale: string;
}

export default function JsonLdScript({ locale }: Props) {
  const websiteSchema = generateWebSiteSchema(locale);
  // We can use Organization schema as base for EmploymentAgency or keep it separate.
  // For now let's keep EmploymentAgency here but cleaner, or duplicate Organization logic?
  // Actually the EmploymentAgency schema in original file had more specific fields like openingHours.
  // I should add generateEmploymentAgencySchema to generator.

  const companyInfo = getCompanyInfo(locale);
  const employmentAgencySchema = {
    "@context": "https://schema.org",
    "@type": "EmploymentAgency",
    "@id": `${companyInfo.baseUrl}/#employmentagency`,
    inLanguage: locale,
    name: companyInfo.name,
    legalName: companyInfo.legalName,
    alternateName: companyInfo.alternateNames,
    description: companyInfo.description,
    slogan: companyInfo.slogan,
    url: companyInfo.baseUrl,
    logo: companyInfo.logo,
    image: companyInfo.logo,
    sameAs: [companyInfo.mainDomain, ...companyInfo.socialLinks],
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
    hasMap: companyInfo.hasMap,
    telephone: companyInfo.contact.phone,
    email: companyInfo.contact.email,
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: companyInfo.openingHours.days,
      opens: companyInfo.openingHours.opens,
      closes: companyInfo.openingHours.closes,
    },
    areaServed: companyInfo.areaServed.map((area) => ({
      "@type": "City",
      name: area,
    })),
    knowsAbout: ["Cung ứng nhân lực", "Tuyển dụng", "Lao động phổ thông"],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(employmentAgencySchema),
        }}
      />
    </>
  );
}
