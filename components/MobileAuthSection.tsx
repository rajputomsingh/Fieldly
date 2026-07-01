// components/MobileAuthSection.tsx
"use client";

import Link from "next/link";
import { SignedOut, SignedIn, UserButton } from "@clerk/nextjs";
import { ArrowUpRight } from "lucide-react";
import { DashboardButton } from "./DashboardButton";

interface MobileAuthSectionProps {
  onClose: () => void;
}

export function MobileAuthSection({ onClose } : MobileAuthSectionProps) {
  return (
    <div className="mt-6">
      <SignedOut>
        <Link
          href="/sign-in"
          prefetch={false}
          onClick={onClose}
          className="
            flex w-full items-center justify-center gap-2
            rounded-full
            bg-[#b7cf8a]
            py-3
            text-sm font-medium text-black
            hover:bg-[#a8c07a]
            transition-colors
          "
        >
          Sign In
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </SignedOut>

      <SignedIn>
        <div className="flex items-center gap-4">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-10 w-10",
                userButtonAvatarBox: "h-10 w-10",
              },
            }}
          />
          <DashboardButton variant="mobile" onClose={onClose} />
        </div>
      </SignedIn>
    </div>
  );
}