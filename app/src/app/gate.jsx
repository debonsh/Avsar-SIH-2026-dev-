// Gate wrapper: when role=ayush, redirects / → /ayush and /tech → home.
// Import in app shell before other routes.
import { Navigate } from "react-router";
import { useC2C } from "../app/store.jsx";

export function AyushGate({ children }) {
  const { role } = useC2C();
  if (role === "ayush") return <Navigate to="/ayush" replace />;
  return children;
}

export function TechGate({ children }) {
  const { role } = useC2C();
  if (role !== "ayush") return <Navigate to="/" replace />;
  return children;
}