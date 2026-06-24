// components/ReleaseBadge.tsx
"use client";

import { ExternalLink, GitBranch } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRelease } from "@/hooks/useRelease";

export function ReleaseBadge() {
  const { release, isLoading, version, releaseUrl } = useRelease();

  // Loading skeleton
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md shadow-lg shadow-black/5 border border-black/5"
      >
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: "#b7cf8a" }}
        />
        <div className="h-4 w-24 bg-black/5 rounded-full animate-pulse" />
        <div className="h-4 w-16 bg-black/5 rounded-full animate-pulse" />
      </motion.div>
    );
  }

  // No release data
  if (!release) return null;

  // Extract release name
  const releaseName = release.name.split("—").pop()?.trim() || release.name;

  return (
    <AnimatePresence mode="wait">
      <motion.a
        key={version}
        href={releaseUrl || release.html_url}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, y: 12, filter: "blur(4px)", scale: 0.9 }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
        exit={{ opacity: 0, y: -12, filter: "blur(4px)", scale: 0.9 }}
        transition={{
          duration: 0.5,
          ease: [0.23, 0.1, 0.25, 0.96],
        }}
        whileHover={{
          scale: 1.02,
          y: -2,
          transition: { duration: 0.2, ease: "easeOut" },
        }}
        whileTap={{ scale: 0.98 }}
        className="group relative inline-flex items-center gap-3 px-4 py-2.5 rounded-full bg-white/90 backdrop-blur-xl border border-black/[0.08] shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)] transition-shadow duration-300 cursor-pointer"
      >
        {/* Gradient overlay on hover */}
        <motion.div
          initial={false}
          animate={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 rounded-full"
          style={{
            background: "linear-gradient(to right, rgba(183,207,138,0.05), transparent, rgba(183,207,138,0.05))"
          }}
        />

        {/* Live indicator with glow - Using #b7cf8a */}
        <div className="relative flex items-center justify-center">
          <motion.span
            animate={{
              scale: [1, 2, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0,
            }}
            className="absolute inline-flex h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: "rgba(183,207,138,0.4)" }}
          />
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
            className="relative inline-flex h-2.5 w-2.5 rounded-full"
            style={{
              backgroundColor: "#b7cf8a",
              boxShadow: "0 0 8px rgba(183,207,138,0.6)",
            }}
          />
        </div>

        {/* Release name */}
        <motion.span
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="text-sm font-semibold text-black/75 tracking-tight group-hover:text-black/90 transition-colors"
        >
          {releaseName}
        </motion.span>

        {/* Divider */}
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="w-px h-4 bg-black/[0.08]"
        />

        {/* Version badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="flex items-center gap-1.5"
        >
          <motion.span
            initial={{ rotate: -90 }}
            animate={{ rotate: 0 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            <GitBranch
              className="h-3 w-3 transition-colors"
              style={{ color: "#b7cf8a" }}
            />
          </motion.span>
          
          <motion.span
            whileHover={{ backgroundColor: "rgba(183,207,138,0.1)" }}
            className="px-2.5 py-0.5 rounded-full bg-black/[0.04] border border-black/[0.06] group-hover:bg-black/[0.06] transition-colors"
          >
            <span className="text-xs font-mono font-medium text-black/50 group-hover:text-black/70 transition-colors tracking-tight">
              {version}
            </span>
          </motion.span>
        </motion.div>

        {/* External link icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: "spring" }}
          whileHover={{ rotate: 15, scale: 1.1 }}
          className="text-black/30 group-hover:text-black/60 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </motion.div>

        {/* Hover glow effect */}
        <motion.div
          initial={false}
          animate={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 rounded-full pointer-events-none"
        >
          <div
            className="absolute inset-0 rounded-full blur-xl"
            style={{
              background: "linear-gradient(to right, rgba(183,207,138,0.08), transparent, rgba(183,207,138,0.08))"
            }}
          />
        </motion.div>
      </motion.a>
    </AnimatePresence>
  );
}