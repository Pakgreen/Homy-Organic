/**
 * Role-Based Access Control (RBAC)
 * Defines which permissions each role has
 */

type UserRole = "admin" | "moderator" | "manager" | "support" | "user";
export type Permission =
  | "manage_products"
  | "manage_orders"
  | "manage_categories"
  | "manage_users"
  | "manage_settings"
  | "manage_sliders"
  | "manage_banners"
  | "manage_faq"
  | "manage_footer"
  | "view_analytics"
  | "manage_moderators";

export const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    "manage_products",
    "manage_orders",
    "manage_categories",
    "manage_users",
    "manage_settings",
    "manage_sliders",
    "manage_banners",
    "manage_faq",
    "manage_footer",
    "view_analytics",
    "manage_moderators",
  ],
  moderator: [
    "manage_products",
    "manage_orders",
    "manage_categories",
    "view_analytics",
  ],
  manager: ["manage_products", "manage_orders", "manage_categories", "view_analytics"],
  support: ["manage_orders", "view_analytics"],
  user: [],
};

export const roleDescriptions: Record<UserRole, string> = {
  admin: "Full access to all admin features",
  moderator: "Can manage products, orders, and categories",
  manager: "Can manage products, orders, and categories (read-only admin)",
  support: "Can view and manage orders",
  user: "Regular user with no admin access",
};

export function hasPermission(
  role: string | undefined,
  permission: string | undefined,
): boolean {
  if (!role || !permission) return false;
  return rolePermissions[role as UserRole]?.includes(permission as Permission) ?? false;
}

export function hasAnyPermission(
  role: string | undefined,
  permissions: Permission[],
): boolean {
  if (!role) return false;
  return permissions.some((p) => hasPermission(role, p));
}

export function canAccessAdminPanel(role: string | undefined): boolean {
  return role === "admin" || role === "moderator" || role === "manager" || role === "support";
}
