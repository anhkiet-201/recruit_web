import { Job } from "@/models/Job";
import { generateItemListSchema } from "@/utils/schemaGenerator";

interface Props {
  jobs: Job[];
  locale: string;
  title?: string;
  url?: string;
}

/**
 * ItemList Schema for Job Lists (Search Results, Category Pages)
 * @see https://schema.org/ItemList
 */
export default function ItemListSchema({ jobs, locale, title, url }: Props) {
  const schema = generateItemListSchema(jobs, locale, title, url);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
