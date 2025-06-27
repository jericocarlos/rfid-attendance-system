import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Users, 
  Database, 
  UserCog, 
  Calendar, 
  Shield 
} from 'lucide-react';

export function useDynamicNavigation() {
  const { data: session } = useSession();
  const [navItems, setNavItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNavItems = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/role-permissions');
        if (res.ok) {
          const data = await res.json();
          const userPermissions = data.permissions.filter(
            p => p.role === session.user.role && p.permission.read === true
          );
          
          // Convert permissions to nav items
          const dynamicNavItems = userPermissions.map(perm => {
            return getNavItemForModule(perm.module);
          }).filter(Boolean); // Remove any null values
          
          setNavItems(dynamicNavItems);
        }
      } catch (error) {
        console.error('Error fetching navigation items:', error);
        // Fallback to static nav items if API fails
        const { NAV_ITEMS } = require('@/constants/navItems');
        const role = session.user.role || 'admin';
        setNavItems(NAV_ITEMS[role] || NAV_ITEMS['admin']);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role) {
      fetchNavItems();
    }
  }, [session]);

  const refetchNavItems = async () => {
    if (session?.user?.role) {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/role-permissions');
        if (res.ok) {
          const data = await res.json();
          const userPermissions = data.permissions.filter(
            p => p.role === session.user.role && p.permission.read === true
          );
          
          // Convert permissions to nav items
          const dynamicNavItems = userPermissions.map(perm => {
            return getNavItemForModule(perm.module);
          }).filter(Boolean); // Remove any null values
          
          setNavItems(dynamicNavItems);
        }
      } catch (error) {
        console.error('Error fetching navigation items:', error);
        // Fallback to static nav items if API fails
        const { NAV_ITEMS } = require('@/constants/navItems');
        const role = session.user.role || 'admin';
        setNavItems(NAV_ITEMS[role] || NAV_ITEMS['admin']);
      } finally {
        setLoading(false);
      }
    }
  };

  const getNavItemForModule = (moduleName) => {
    const moduleMap = {
      'employees_management': {
        name: 'Employees Management',
        href: '/admin/employees-management',
        icon: <Users className="h-[18px] w-[18px]" />
      },
      'data_management': {
        name: 'Data Management',
        href: '/admin/lists',
        icon: <Database className="h-[18px] w-[18px]" />
      },
      'account_logins': {
        name: 'Account Logins',
        href: '/admin/account-logins',
        icon: <UserCog className="h-[18px] w-[18px]" />
      },
      'attendance_logs': {
        name: 'Attendance Logs',
        href: '/admin/attendance-logs',
        icon: <Calendar className="h-[18px] w-[18px]" />
      },
      'role_permissions': {
        name: 'Role Permissions',
        href: '/admin/role-permissions',
        icon: <Shield className="h-[18px] w-[18px]" />
      }
    };

    return moduleMap[moduleName] || null;
  };

  return { navItems, loading, refetch: refetchNavItems };
}
