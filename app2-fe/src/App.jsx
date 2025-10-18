// src/App.jsx
import * as React from "react"
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Profile from "./pages/Profile"
import EditProfile from "./pages/EditProfile"

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("authToken")
  if (!token) {
    return <Navigate to="/" replace />
  }
  return children
}

function SessionManager({ children }) {
  const navigate = useNavigate();

  React.useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userProfile = localStorage.getItem("userProfile");

    // Jika ada token TAPI userProfile belum ada, atau userProfile kosong,
    // inisialisasi dengan profil default.
    // Ini penting jika userProfile dihapus saat logout, lalu user baru login.
    if (token && (!userProfile || Object.keys(JSON.parse(userProfile)).length === 0)) {
        const defaultProfile = {
            name: "Welcome User",
            email: "user@example.com",
            bio: "This is your default bio.",
            photoUrl: "",
        };
        localStorage.setItem("userProfile", JSON.stringify(defaultProfile));
    }

    if (!token && (window.location.pathname === "/profile" || window.location.pathname === "/edit-profile")) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  return children;
}


function App() {
  const [showLogin, setShowLogin] = React.useState(true)

  const handleLoginSuccess = (userData) => {
    // Saat login berhasil, kita HAPUS DULU userProfile LAMA (jika ada)
    // lalu inisialisasi dengan data yang BENAR-BENAR BARU dari hasil login.
    localStorage.removeItem("userProfile"); // <--- HAPUS userProfile LAMA SEBELUM MENYIMPAN YANG BARU

    const newProfile = {
      name: userData.name || "Welcome User",
      email: userData.email || "user@example.com",
      bio: "This is your default bio.", // Bio default untuk login pertama
      photoUrl: userData.photoUrl || "", // Ambil photoUrl dari API login jika ada, jika tidak kosong.
    };
    localStorage.setItem("userProfile", JSON.stringify(newProfile));
    window.location.href = "/profile"
  }

  const handleRegisterSuccess = (userData) => {
    // Sama seperti login, hapus dulu userProfile lama
    localStorage.removeItem("userProfile"); // <--- HAPUS userProfile LAMA SEBELUM MENYIMPAN YANG BARU

    const newProfile = {
      name: userData.name || "New User",
      email: userData.email || "new@example.com",
      bio: "This is your default bio.",
      photoUrl: "",
    };
    localStorage.setItem("userProfile", JSON.stringify(newProfile));
    window.location.href = "/"
  }

  return (
    <Router>
      <SessionManager>
        <Routes>
          <Route
            path="/"
            element={
              showLogin ? (
                <Login
                  onRegisterClick={() => setShowLogin(false)}
                  onLoginSuccess={handleLoginSuccess}
                />
              ) : (
                <Register
                  onLoginClick={() => setShowLogin(true)}
                  onRegisterSuccess={handleRegisterSuccess}
                />
              )
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/edit-profile"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </SessionManager>
    </Router>
  )
}

export default App;