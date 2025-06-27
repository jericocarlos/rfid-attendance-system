import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { checkRouteAccess } from '@/lib/permissions';

export function withPermission(WrappedComponent, requiredModule, requiredPermission = 'read') {
  return function PermissionWrapper(props) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [hasAccess, setHasAccess] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const checkAccess = async () => {
        if (status === 'loading') return;

        if (!session) {
          router.push('/admin/login');
          return;
        }

        const role = session.user.role;

        // Superadmin has access to everything
        if (role === 'superadmin') {
          setHasAccess(true);
          setLoading(false);
          return;
        }

        try {
          const routeAccess = await checkRouteAccess(role, window.location.pathname);
          setHasAccess(routeAccess);
        } catch (error) {
          console.error('Error checking permissions:', error);
          setHasAccess(false);
        } finally {
          setLoading(false);
        }
      };

      checkAccess();
    }, [session, status, router]);

    if (loading || status === 'loading') {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    if (!hasAccess) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-6xl">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800">Access Denied</h2>
          <p className="text-gray-600 text-center max-w-md">
            You don't have permission to access this page. Please contact your administrator if you need access.
          </p>
          <button 
            onClick={() => router.push('/admin')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}

// Usage example:
// export default withPermission(MyComponent, 'employees_management', 'read');
