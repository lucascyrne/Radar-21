import { useAuth } from "@/resources/auth/auth-hook";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requireEmailConfirmation: boolean = true
) {
  return function WithAuthComponent(props: P) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading) {
        if (!user) {
          router.push("/auth");
        } else if (requireEmailConfirmation && !user.email_confirmed_at) {
          router.push("/auth/verify-email");
        }
      }
    }, [user, isLoading]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!user || (requireEmailConfirmation && !user.email_confirmed_at)) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
