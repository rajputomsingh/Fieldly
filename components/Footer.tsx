// components/Footer.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Mail,
  Phone,
  Linkedin,
  Twitter,
  Github,
  ChevronRight,
} from "lucide-react";
import { motion, Variants } from "framer-motion";
import { ReleaseBadge } from "@/components/ReleaseBadge";

/* ================= ANIMATION ================= */

const container: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.23, 0.1, 0.25, 0.96],
    },
  },
};

export default function Footer() {
  const platformRoutes = [
    {
      name: "Land Leasing",
      path: "/platform/land-leasing",
      description: "Find & lease farmland",
    },
    {
      name: "Soil Monitoring",
      path: "/platform/soil-monitoring",
      description: "Real-time soil health",
    },
    {
      name: "Verification System",
      path: "/platform/verification",
      description: "Trust & transparency",
    },
    {
      name: "Pricing",
      path: "/pricing",
      description: "Simple, fair pricing",
    },
  ];

  const companyRoutes = [
    { name: "About Fieldly", path: "/about" },
    { name: "Documentation", path: "/docs" },
    { name: "Careers", path: "/careers" },
    { name: "Contact", path: "/contact" },
  ];

  const legalRoutes = [
    { name: "Privacy Policy", path: "/privacy-policy" },
    { name: "Terms of Service", path: "/terms" },
    { name: "Compliance", path: "/compliance" },
  ];

  const resourcesRoutes = [
    { name: "Blog", path: "/blog" },
    { name: "Farmers Guide", path: "/guides" },
    { name: "Support Center", path: "/support" },
    { name: "Status", path: "/status" },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden">
      {/* ================= BACKGROUND ================= */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/footeri.jpg"
          alt="Fieldly farmland background"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent" />
      </div>

      {/* ================= CONTENT ================= */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="relative mx-auto max-w-[1440px] px-6 py-20"
      >
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 lg:gap-16">
          {/* ================= BRAND ================= */}
          <motion.div variants={fadeUp} className="md:col-span-4 lg:col-span-5">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl">
                <Image src="/hicon.png" alt="logo" width={34} height={34} />
              </div>
              <span className="text-3xl font-semibold text-black">Fieldly</span>
            </Link>

            <p className="mt-6 max-w-md text-[16px] leading-7 text-black/75">
              Transparent, broker-free agricultural land leasing platform
              empowering farmers and optimizing land usage.
            </p>

            {/* CONTACT */}
            <div className="mt-8 space-y-3">
              <FooterContact
                icon={<Mail size={18} />}
                text="support@fieldly.io"
                href="mailto:support@fieldly.io"
              />
              <FooterContact
                icon={<Phone size={18} />}
                text="+91 XXXXX XXXXX"
                href="tel:+919XXXXXXXXX"
              />
            </div>

            {/* SOCIAL */}
            <div className="mt-8 flex items-center gap-3">
              <SocialIcon href="https://www.linkedin.com/in/rajputomsingh" icon={<Linkedin size={18} />} />
              <SocialIcon href="#" icon={<Twitter size={18} />} />
              <SocialIcon href="https://github.com/rajputomsingh/Fieldly/" icon={<Github size={18} />} />
            </div>
          </motion.div>

          {/* ================= LINKS ================= */}
          <motion.div variants={fadeUp} className="md:col-span-8 lg:col-span-7">
            <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
              <FooterColumn
                title="Platform"
                links={platformRoutes}
                isEnhanced
              />
              <FooterColumn title="Company" links={companyRoutes} />
              <FooterColumn title="Resources" links={resourcesRoutes} />
              <FooterColumn title="Legal" links={legalRoutes} />
            </div>
          </motion.div>
        </div>

        {/* ================= BOTTOM BAR ================= */}
        <motion.div
          variants={fadeUp}
          className="mt-16 pt-8 border-t border-black/10"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-sm text-black/60">
              © {currentYear} Fieldly. All rights reserved.
            </p>

            {/* Premium Release Badge - Imported */}
            <ReleaseBadge />
          </div>
        </motion.div>
      </motion.div>
    </footer>
  );
}

/* ================= COLUMN ================= */

interface FooterLink {
  name: string;
  path: string;
  description?: string;
}

function FooterColumn({
  title,
  links,
  isEnhanced = false,
}: {
  title: string;
  links: FooterLink[];
  isEnhanced?: boolean;
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold tracking-wide text-black/60">
        {title}
      </h4>
      <ul className="mt-5 space-y-3.5">
        {links.map((link, index) => (
          <motion.li
            key={link.path}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <Link
              href={link.path}
              className="group flex items-center gap-1 text-[15px] font-medium text-black/75 transition hover:text-black hover:translate-x-1.5"
            >
              <span>{link.name}</span>
              <ChevronRight
                size={14}
                className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition"
              />
              {isEnhanced && link.description && (
                <span className="ml-1 hidden text-[12px] text-black/40 lg:inline">
                  {link.description}
                </span>
              )}
            </Link>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

/* ================= CONTACT ================= */

function FooterContact({
  icon,
  text,
  href,
}: {
  icon: React.ReactNode;
  text: string;
  href?: string;
}) {
  return (
    <motion.div whileHover={{ x: 3 }}>
      {href ? (
        <Link href={href} className="flex items-center gap-3 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-black/70 group-hover:bg-black/10">
            {icon}
          </span>
          <span className="text-[15px] text-black/75 group-hover:text-black">
            {text}
          </span>
        </Link>
      ) : (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-black/70">
            {icon}
          </span>
          <span className="text-[15px] text-black/75">{text}</span>
        </div>
      )}
    </motion.div>
  );
}

/* ================= SOCIAL ================= */

function SocialIcon({ href, icon }: { href: string; icon: React.ReactNode }) {
  return (
    <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.95 }}>
      <Link
        href={href}
        target="_blank"
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white/70 backdrop-blur-md text-black transition hover:bg-white hover:shadow-md"
      >
        {icon}
      </Link>
    </motion.div>
  );
}