import { Navigate } from "react-router-dom";
import { getOwnerSession } from "../../lib/ownerAuth";

export default function RequireOwner({ children }) {
  const session = getOwnerSession();
  if (!session?.token) {
    return <Navigate to="/owner/login" replace />;
  }
  // Basic expiry check (JWT exp is seconds since epoch)
  try {
    const payload = JSON.parse(atob(session.token.split(".")[1]));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return <Navigate to="/owner/login" replace />;
    }
  } catch {
    return <Navigate to="/owner/login" replace />;
  }
  return children;
}
