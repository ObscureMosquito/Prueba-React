import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../common/LoadingSpinner"; // ✅ Import spinner

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  console.log("Checking authentication in PrivateRoute:", { user, loading });

  if (loading) {
    console.log("User is still loading, showing spinner...");
    return <LoadingSpinner />; // ✅ Show spinner while loading
  }

  if (!user) {
    console.log("User not found, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
