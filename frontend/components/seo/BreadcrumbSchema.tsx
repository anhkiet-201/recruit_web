import { generateBreadcrumbSchema } from "@/utils/schemaGenerator";

interface Props {
  items: { name: string; item: string }[];
}

export default function BreadcrumbSchema({ items }: Props) {
  const schema = generateBreadcrumbSchema(items);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
