import { generateOrganizationSchema } from "@/utils/schemaGenerator";

interface Props {
  locale: string;
}

export default function OrganizationSchema({ locale }: Props) {
  const schema = generateOrganizationSchema(locale);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
