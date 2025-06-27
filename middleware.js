import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Route to module mapping
const routeModuleMap = {
  '/admin/employees-management': 'employees_management',
  '/admin/lists': 'data_management',
  '/admin/account-logins': 'account_logins',
  '/admin/attendance-logs': 'attendance_logs',
  '/admin/role-permissions': 'role_permissions'
};

// Default permissions for fallback (when database is unavailable)
const defaultPermissions = {
  superadmin: ['employees_management', 'data_management', 'account_logins', 'attendance_logs', 'role_permissions'],
  admin: ['employees_management', 'data_management', 'account_logins', 'attendance_logs'],
  security: ['attendance_logs'],
  hr: ['attendance_logs', 'employees_management']
};

// Function to check if user has permission for a route
function hasRouteAccess(pathname, role) {
  // Always allow access to main dashboard
  if (pathname === "/admin" || pathname === "/admin/") {
    return true;
  }

  // Find the module for this route
  const matchedRoute = Object.keys(routeModuleMap).find(route => 
    pathname.startsWith(route)
  );

  if (!matchedRoute) {
    // If route not in our module map, allow access (for other admin routes)
    return true;
  }

  const moduleName = routeModuleMap[matchedRoute];
  
  // Use default permissions as fallback
  const rolePermissions = defaultPermissions[role] || [];
  return rolePermissions.includes(moduleName);
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Allow access to /admin/login without authentication
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Redirect unauthenticated users
  if (!token) {
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    return NextResponse.next();
  }

  const role = token.role;

  // SUPERADMIN has access to everything
  if (role === "superadmin") {
    return NextResponse.next();
  }

  // Check permissions based on role and route
  if (hasRouteAccess(pathname, role)) {
    return NextResponse.next();
  } else {
    // Redirect to dashboard if no access
    return NextResponse.redirect(new URL("/admin", req.url));
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};