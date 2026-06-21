import { useAuthStore } from "@/hooks/useAuthStore";
import { router, useSegments } from "expo-router";
import { useEffect, useRef } from "react";

const ProfileCompletionCheck = () => {
  const { user } = useAuthStore();
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousSegmentsRef = useRef<string[]>([]);
  
  // Always call hooks - can't be conditional  
  const segments = useSegments();

  useEffect(() => {
    // Clear any pending navigation
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }

    // Only proceed if we have valid segments (navigation context available)
    if (!segments || segments.length === 0) {
      return;
    }

    // Routes that don't require profile completion
    const exemptRoutes = [
      "auth",
      "complete-profile",
      "(tabs)",
    ];

    const currentRoute = segments[0];
    const previousRoute = previousSegmentsRef.current[0];

    // Update previous segments
    previousSegmentsRef.current = [...segments];

    // Skip if we're within (tabs) route group - this prevents errors during tab switching
    // Tab switching is just changing within the same route group, not a navigation event
    if (currentRoute === "(tabs)" || previousRoute === "(tabs)") {
      return;
    }

    // Check if user is logged in, profile is incomplete, and not on an exempt route
    if (
      user &&
      !user.isProfileComplete &&
      !exemptRoutes.includes(currentRoute || "") &&
      currentRoute !== "auth"
    ) {
      // Delay navigation to ensure navigation context is ready
      // This prevents errors during rapid state changes (like tab switching)
      navigationTimeoutRef.current = setTimeout(() => {
        try {
          if (router && typeof router.replace === 'function') {
            router.replace("/complete-profile");
          }
        } catch (error) {
          console.error("Navigation error in ProfileCompletionCheck:", error);
        }
      }, 300);
    }

    // Cleanup on unmount
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }
    };
  }, [user, segments]);

  return null; // This component doesn't render anything
};

export default ProfileCompletionCheck;

