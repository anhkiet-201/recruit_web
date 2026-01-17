"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Ghost, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";
import JobCard from "@/components/JobCard";
import { JobService } from "@/services/jobService";
import { Job } from "@/models/Job";
import "../app/globals.css";

export default function NotFoundContent() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const trendingJobs = await JobService.getTrendingJobs(6);
        setJobs(trendingJobs);
      } catch (error) {
        console.error("Failed to fetch jobs for 404 page:", error);
        // Fallback: try hot jobs
        try {
          const hotJobs = await JobService.getHotJobs(6);
          setJobs(hotJobs);
        } catch {
          // Silent fail - 404 page should still work
          setJobs([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center py-16">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex mb-8 items-center justify-center"
      >
        <div className="relative">
          <motion.div
            animate={{
              y: [0, -10, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="text-blue-600 dark:text-blue-500"
          >
            <Ghost size={120} strokeWidth={1} />
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="absolute -right-2 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-lg font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400"
          >
            ?
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h1 className="mb-2 text-8xl font-black tracking-tighter text-gray-900 dark:text-white">
          404
        </h1>
        <h2 className="mb-6 text-2xl font-bold text-gray-800 dark:text-gray-100">
          Page Not Found
        </h2>
        <p className="mx-auto mb-8 max-w-md text-gray-600 dark:text-gray-400">
          Oops! The page you are looking for seems to have vanished into thin
          air. It might have been moved, deleted, or never existed.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button
            variant="outline"
            size="lg"
            icon={ArrowLeft}
            onClick={() => router.back()}
          >
            Go Back
          </Button>

          <Link href="/">
            <Button variant="primary" size="lg" icon={Home}>
              Back to Home
            </Button>
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="mt-12 text-sm text-gray-400 dark:text-gray-600"
      >
        Error Code: 404
      </motion.div>

      {/* Jobs Listing Section */}
      {!loading && jobs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="w-full max-w-7xl mt-20"
        >
          <div className="flex items-center justify-center gap-3 mb-8">
            <Sparkles className="text-blue-600" size={24} />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Explore Trending Jobs
            </h3>
            <Sparkles className="text-blue-600" size={24} />
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
            While you&apos;re here, check out these hot opportunities!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 + index * 0.1, duration: 0.5 }}
              >
                <JobCard job={job} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="w-full max-w-7xl mt-20"
        >
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-64 mx-auto mb-10 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-96 bg-gray-200 dark:bg-gray-700 rounded-3xl animate-pulse"
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
