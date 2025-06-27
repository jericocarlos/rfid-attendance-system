import { executeQuery } from "@/lib/db";

// Cache for permissions to avoid repeated database calls
const permissionsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getUserPermissions(role) {
  // Check cache first
  const cacheKey = `permissions_${role}`;
  const cached = permissionsCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const permissions = await executeQuery({
      query: `
        SELECT module, permission 
        FROM role_permissions 
        WHERE role = ?
      `,
      values: [role]
    });

    // Convert to object for easier access
    const permissionsObj = {};
    permissions.forEach(perm => {
      permissionsObj[perm.module] = JSON.parse(perm.permission);
    });

    // Cache the result
    permissionsCache.set(cacheKey, {
      data: permissionsObj,
      timestamp: Date.now()
    });

    return permissionsObj;
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return {};
  }
}

export function hasPermission(permissions, module, action) {
  if (!permissions || !permissions[module]) return false;
  return permissions[module][action] === true;
}

export function canAccess(permissions, module) {
  return hasPermission(permissions, module, 'read');
}

export function canEdit(permissions, module) {
  return hasPermission(permissions, module, 'write');
}

export function canDelete(permissions, module) {
  return hasPermission(permissions, module, 'delete');
}

export function canExport(permissions, module) {
  return hasPermission(permissions, module, 'export');
}

// Route to module mapping
export const routeModuleMap = {
  '/admin/employees-management': 'employees_management',
  '/admin/lists': 'data_management',
  '/admin/account-logins': 'account_logins',
  '/admin/attendance-logs': 'attendance_logs',
  '/admin/role-permissions': 'role_permissions'
};

export function getModuleFromRoute(pathname) {
  const matchedRoute = Object.keys(routeModuleMap).find(route => 
    pathname.startsWith(route)
  );
  return matchedRoute ? routeModuleMap[matchedRoute] : null;
}

export async function checkRouteAccess(role, pathname) {
  // Superadmin has access to everything
  if (role === 'superadmin') return true;

  // Always allow access to main dashboard
  if (pathname === "/admin" || pathname === "/admin/") return true;

  const moduleName = getModuleFromRoute(pathname);
  if (!moduleName) return true; // Allow access to routes not in our module map

  const permissions = await getUserPermissions(role);
  return canAccess(permissions, moduleName);
}

// Clear cache function (useful for when permissions are updated)
export function clearPermissionsCache(role = null) {
  if (role) {
    permissionsCache.delete(`permissions_${role}`);
  } else {
    permissionsCache.clear();
  }
}
