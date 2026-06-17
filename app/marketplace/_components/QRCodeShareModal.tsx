"use client";

import { useCallback, useRef } from "react";
import { motion, Variants } from "framer-motion";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

// ============= TYPES =============
interface QRCodeShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingUrl: string;
  listingId: string;
  listingTitle: string;
}

// ============= ANIMATION VARIANTS =============
const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 25 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2 },
  },
};

// ============= COMPONENT =============
export function QRCodeShareModal({
  isOpen,
  onClose,
  listingUrl,
  listingId,
  listingTitle,
}: QRCodeShareModalProps) {
  const { toast } = useToast();
  const qrContainerRef = useRef<HTMLDivElement>(null);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(listingUrl);
      toast({
        title: "Link copied!",
        description: "Listing URL copied to clipboard",
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  }, [listingUrl, toast]);

  const handleDownloadQR = useCallback(async () => {
    try {
      const svg = document.getElementById("listing-qr-code");
      if (!svg) {
        toast({
          title: "QR code not found",
          description: "Please try again",
          variant: "destructive",
        });
        return;
      }

      // Get the icon image for the download
      const iconResponse = await fetch("/hicon.png");
      const iconBlob = await iconResponse.blob();
      const iconUrl = URL.createObjectURL(iconBlob);
      const iconImg = new window.Image();
      
      iconImg.onload = () => {
        // Convert SVG to canvas
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new window.Image();

        const svgBlob = new Blob([svgData], {
          type: "image/svg+xml;charset=utf-8",
        });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
          // Add padding and make it look like a poster
          const padding = 40;
          canvas.width = img.width + padding * 2;
          canvas.height = img.height + padding * 2 + 80;

          if (ctx) {
            // White background
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw QR code
            ctx.drawImage(img, padding, padding, img.width, img.height);

            // Draw icon in center of QR code
            const iconSize = img.width * 0.18;
            const centerX = padding + img.width / 2;
            const centerY = padding + img.height / 2;
            const x = centerX - iconSize / 2;
            const y = centerY - iconSize / 2;
            const radius = iconSize / 2 + 10;

            // White circular background
            ctx.fillStyle = "#FFFFFF";
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();

            // Subtle border
            ctx.strokeStyle = "#e5e7eb";
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw the icon
            ctx.imageSmoothingEnabled = true;
            ctx.drawImage(iconImg, x, y, iconSize, iconSize);

            // Add title text
            ctx.fillStyle = "#000000";
            ctx.font = "bold 16px system-ui, -apple-system, sans-serif";
            ctx.textAlign = "center";

            // Truncate long titles
            const maxWidth = canvas.width - padding * 2;
            let title = listingTitle;
            if (ctx.measureText(title).width > maxWidth) {
              while (
                ctx.measureText(title + "...").width > maxWidth &&
                title.length > 0
              ) {
                title = title.slice(0, -1);
              }
              title += "...";
            }

            ctx.fillText(title, canvas.width / 2, img.height + padding + 30);

            // Add subtitle
            ctx.fillStyle = "#666666";
            ctx.font = "14px system-ui, -apple-system, sans-serif";
            ctx.fillText(
              "Scan to view this listing in Fieldly",
              canvas.width / 2,
              img.height + padding + 55,
            );
          }

          // Download as PNG
          canvas.toBlob((blob) => {
            if (blob) {
              const downloadUrl = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = downloadUrl;
              a.download = `fieldly-listing-${listingId}-qr.png`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(downloadUrl);

              toast({
                title: "QR code downloaded!",
                description: "QR code has been saved as PNG",
              });
            }
          }, "image/png");

          URL.revokeObjectURL(url);
          URL.revokeObjectURL(iconUrl);
        };

        img.src = url;
      };
      
      iconImg.src = iconUrl;
    } catch (error) {
      console.error("Failed to download QR:", error);
      toast({
        title: "Download failed",
        description: "Could not generate QR code image",
        variant: "destructive",
      });
    }
  }, [listingId, listingTitle, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mt-12">
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold">
              Share Listing
            </DialogTitle>
            <DialogDescription className="text-center">
              Scan QR code to view this listing in Fieldly
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-6 py-6">
            {/* QR Code with Icon */}
            <motion.div
              ref={qrContainerRef}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.1,
              }}
              className="relative p-6 bg-white rounded-2xl shadow-lg border border-gray-100"
            >
              <div className="relative inline-block">
                <QRCode
                  id="listing-qr-code"
                  value={listingUrl}
                  size={220}
                  level="M"
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
                {/* Icon overlay - perfectly centered */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white rounded-full p-2 shadow-md border border-gray-200">
                    <div className="relative w-10 h-10">
                      <Image
                        src="/hicon.png"
                        alt="Fieldly"
                        fill
                        className="object-contain"
                        priority
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Listing Title */}
            <p className="text-sm font-medium text-gray-700 text-center max-w-[250px] truncate">
              {listingTitle}
            </p>

            {/* Actions */}
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                className="flex-1 gap-2 rounded-full border-gray-200 hover:bg-gray-50 transition-all duration-200"
                onClick={handleCopyLink}
              >
                <Copy className="h-4 w-4" />
                <span>Copy Link</span>
              </Button>
              <Button
                variant="default"
                className="flex-1 gap-2 rounded-full bg-[#A3C47D] hover:bg-[#8DB36C] text-black transition-all duration-200"
                onClick={handleDownloadQR}
              >
                <Download className="h-4 w-4" />
                <span>Download QR</span>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Scan to view this listing in Fieldly
            </p>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}