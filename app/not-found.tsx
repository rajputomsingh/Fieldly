"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

      <motion.div
        className="absolute left-1/4 top-1/3 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
        animate={{
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
        }}
      />

      <div className="relative z-10 grid w-full max-w-7xl gap-16 lg:grid-cols-2">
        {/* Left */}
        <div className="flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mb-8 inline-flex w-fit rounded-xl bg-foreground px-6 py-4"
          >
            <span className="text-5xl font-bold text-background">404</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mb-5 text-5xl font-bold tracking-tight"
          >
            Parcel Not Found
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="max-w-md text-lg leading-relaxed text-muted-foreground"
          >
            We searched our registry, active leases and field records.
            <br />
            <br />
            The requested parcel could not be located.
          </motion.p>

          <motion.div className="mt-10" whileHover={{ x: 6 }}>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium"
            >
              <ArrowLeft size={16} />
              Return to Fieldly
            </Link>
          </motion.div>
        </div>

        {/* Right */}
        <div className="flex items-center justify-center">
          <LostParcelIllustration />
        </div>
      </div>
    </main>
  );
}

function LostParcelIllustration() {
  return (
    <motion.div
      animate={{
        y: [0, -12, 0],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className="relative"
    >
      <svg width="420" height="420" viewBox="0 0 420 420" fill="none">
        {/* Field */}
        <rect
          x="70"
          y="220"
          width="280"
          height="130"
          rx="20"
          stroke="currentColor"
          strokeWidth="4"
        />

        {/* Grid */}
        <path
          d="M130 220V350"
          stroke="currentColor"
          strokeWidth="2"
          opacity=".25"
        />
        <path
          d="M210 220V350"
          stroke="currentColor"
          strokeWidth="2"
          opacity=".25"
        />
        <path
          d="M290 220V350"
          stroke="currentColor"
          strokeWidth="2"
          opacity=".25"
        />

        {/* Map Pin */}
        <motion.g
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
          }}
        >
          <path
            d="M210 70C175 70 150 95 150 130C150 180 210 240 210 240C210 240 270 180 270 130C270 95 245 70 210 70Z"
            stroke="currentColor"
            strokeWidth="5"
          />

          <circle
            cx="210"
            cy="130"
            r="35"
            stroke="currentColor"
            strokeWidth="4"
          />

          {/* Eyes */}
          <motion.circle
            cx="198"
            cy="125"
            r="3"
            fill="currentColor"
            animate={{
              scaleY: [1, 0.15, 1],
            }}
            transition={{
              duration: 0.2,
              repeat: Infinity,
              repeatDelay: 4,
            }}
          />

          <motion.circle
            cx="222"
            cy="125"
            r="3"
            fill="currentColor"
            animate={{
              scaleY: [1, 0.15, 1],
            }}
            transition={{
              duration: 0.2,
              repeat: Infinity,
              repeatDelay: 4,
              delay: 0.05,
            }}
          />

          {/* Mouth */}
          <motion.path
            d="M198 145C204 150 216 150 222 145"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            animate={{
              d: [
                "M198 145C204 150 216 150 222 145",
                "M198 148C204 144 216 144 222 148",
                "M198 145C204 150 216 150 222 145",
              ],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
            }}
          />
        </motion.g>

        {/* Floating Question Mark */}
        <motion.text
          x="315"
          y="90"
          fontSize="42"
          fontWeight="700"
          fill="currentColor"
          animate={{
            rotate: [-5, 5, -5],
            y: [0, -6, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
          }}
        >
          ?
        </motion.text>
      </svg>
    </motion.div>
  );
}
