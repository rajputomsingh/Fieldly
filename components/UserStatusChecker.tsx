"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UserStatusChecker() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && user?.id) {
      const checkAndRedirect = async () => {
        try {
          const response = await fetch(`/api/user/status?userId=${user.id}`, {
            cache: "no-store", // Ensure we get the latest status from the server
          });

          if (response.ok) {
            const result = await response.json();
            const data = result.data;

            if (data?.user) {
              if (!data.user.role) {
                router.replace("/onboarding/role");
              } else if (!data.user.isOnboarded) {
                const onboardingPath =
                  data.user.role === "FARMER"
                    ? "/onboarding/farmer"
                    : "/onboarding/landowner";

                router.replace(onboardingPath);
              } else {
                const dashboardPath =
                  data.user.role === "FARMER"
                    ? "/farmer/dashboard"
                    : "/landowner/dashboard";

                router.replace(dashboardPath);
              }
            }
          }
        } catch (error) {
          console.error("Error checking user status:", error);
        }
      };

      checkAndRedirect();
    }
  }, [isLoaded, user, router]);

  return null;
}
