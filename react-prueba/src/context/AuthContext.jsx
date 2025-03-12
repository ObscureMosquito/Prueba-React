/*import { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const API_BASE_URL = "/api/auth";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Invalid token");

      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error("Error fetching user:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Login Function
  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        if (response.status === 403) {
          console.warn("User not verified, redirecting to /verify");
          navigate("/verify", { state: { email } });
          return;
        }
        throw new Error(result.detail || "Login failed");
      }
  
      const { id_token } = result;
      localStorage.setItem("token", id_token);
      await fetchUser(id_token);
      navigate("/home");
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message);
    }
  };  

  const register = async (email, password, name) => {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
  
      const result = await response.json();
  
      if (!response.ok) throw new Error(result.detail || "Registration failed");
  
      navigate("/verify", { replace: true, state: { email, password } });
  
    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message);
    }
  };  

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    setLoading(false);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
*/

import { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (token) => {
    try {
      const response = await fetch("http://localhost:8000/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Invalid token");

      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error("Error fetching user:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        if (response.status === 403) {
          console.warn("User not verified, redirecting to /verify");
          navigate("/verify", { state: { email } });
          return;
        }
        throw new Error(result.detail || "Login failed");
      }
  
      // ✅ If login is successful, store token and fetch user info
      const { id_token } = result;
      localStorage.setItem("token", id_token);
      await fetchUser(id_token);
      navigate("/home");
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message);
    }
  };  

  const register = async (email, password, name) => {
    try {
      const response = await fetch("http://localhost:8000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
  
      const result = await response.json();
  
      if (!response.ok) throw new Error(result.detail || "Registration failed");

      navigate("/verify", { replace: true, state: { email, password } });
  
    } catch (error) {
      console.error("Registration error:", error);
    }
  };  

  // Logout Function
  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    setLoading(false);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
