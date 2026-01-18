"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Ghost, } from "lucide-react";
import Button from "@/components/ui/Button";

export default function NotFoundContent() {
  const router = useRouter();

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
          Không tìm thấy trang
        </h2>
        <p className="mx-auto mb-8 max-w-md text-gray-600 dark:text-gray-400">
          Rất tiếc! Trang bạn đang tìm kiếm dường như không tồn tại. Có thể
          trang đã bị di chuyển, xóa hoặc đường dẫn không chính xác.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button
            variant="outline"
            size="lg"
            icon={ArrowLeft}
            onClick={() => router.back()}
          >
            Quay lại
          </Button>

          <Link href="/">
            <Button variant="primary" size="lg" icon={Home}>
              Về trang chủ
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
        Mã lỗi: 404
      </motion.div>
    </div>
  );
}
