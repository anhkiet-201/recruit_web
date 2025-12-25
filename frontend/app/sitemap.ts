import { MetadataRoute } from 'next';
import { JobService } from '@/services/jobService';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://recruitweb.com';

  // Static routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/jobs`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/employers`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  try {
    // Fetch recent jobs for sitemap
    // Assuming JobService.getAllJobs returns paginated result, we might need a way to fetch all or a large number.
    // For now, let's fetch the first 1000 items or similar if API supports it.
    // If not, we take what we can get.
    // NOTE: JobService.getAllJobs signature: (query?: { page?: number; limit?: number; ... })

    const { items: jobs } = await JobService.getAllJobs({ limit: 100 });

    const jobRoutes: MetadataRoute.Sitemap = jobs.map((job) => ({
      url: `${baseUrl}/jobs/${job.id}`,
      lastModified: new Date(job.updatedAt || job.createdAt),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    return [...routes, ...jobRoutes];
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return routes;
  }
}
