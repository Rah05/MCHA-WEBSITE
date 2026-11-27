function RoleGuard({ userRole, allowedRoles, children }) {
// Check whether the user's role is allowed
const hasAccess = allowedRoles.includes(userRole);

// Hide the content if the role is not allowed
if (!hasAccess) {
return null;
}

// Display the content if the role is allowed
return <>{children}</>;
}

export default RoleGuard;
