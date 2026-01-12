import { Job } from "@/models/Job";
import { generateJobPostingSchema } from "@/utils/schemaGenerator";

interface Props {
  job: Job;
  locale: string;
}

export default function JobPostingSchema({ job, locale }: Props) {
  const schema = generateJobPostingSchema(job, locale);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
