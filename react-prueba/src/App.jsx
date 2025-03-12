import { Routes, Route } from "react-router-dom";
import Login from "./components/login/Login";
import Register from "./components/login/Register";
import Verify from "./components/login/Verify";
import Home from "./components/home/Home";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/login/PrivateRoute";

const App = () => {
  return (
    <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="*" element={<Login />} />
        </Routes>
    </AuthProvider>
  );
};

if (process.env.NODE_ENV === "production") {
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject = () => {};
  }
}

export default App;
