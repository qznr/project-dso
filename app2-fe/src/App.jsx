// src/App.jsx
import * as React from "react"
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  Navigate, 
} from "react-router-dom"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Profile from "./pages/Profile" // Protected content
import HomePage from "./pages/Home"
import Thread from "./pages/Thread" // Impor komponen Thread
import CreateThread from "./pages/CreateThread" // <-- 1. Impor komponen CreateThread
import { Button } from "./components/ui/button"

// --- Auth Utilities ---

// Wrapper untuk injeksi props navigasi dan handler sukses
const useAuth = () => {
  const navigate = useNavigate()

  const handleLoginSuccess = (data) => {
    console.log("User logged in successfully:", data)
    navigate("/profile") // Redirect ke Profile setelah login
  }

  const handleRegisterSuccess = () => {
    navigate("/login", { 
      state: { registrationSuccess: true } 
    })
  }

  return {
    onLoginSuccess: handleLoginSuccess,
    onRegisterSuccess: handleRegisterSuccess,
    onLoginClick: () => navigate("/login"),
    onRegisterClick: () => navigate("/register"),
  }
}

function AuthRouteWrapper({ element }) {
  const authProps = useAuth()
  return React.cloneElement(element, authProps)
}

// Komponen pelindung untuk route yang memerlukan token
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
  return (
    <Router>
      <div className="min-h-svh bg-background">
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<AuthRouteWrapper element={<Login />} />} />
          <Route path="/register" element={<AuthRouteWrapper element={<Register />} />} />
          <Route
            path="/thread/:id"
            element={
              <ProtectedRoute>
                <Thread />
              </ProtectedRoute>
            }
          />
          
          {/* Protected Route */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          {/* --- 2. Tambahkan Route untuk Create Thread --- */}
          <Route 
            path="/create-thread" 
            element={
              <ProtectedRoute>
                <CreateThread />
              </ProtectedRoute>
            } 
          />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  )
}

function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center">
      <h1 className="text-3xl font-bold">404 - Not Found</h1>
      <p className="mt-2">The page you are looking for does not exist.</p>
      <Button className="mt-4" onClick={() => window.location.href = "/"}>
        Go Home
      </Button>
    </div>
  )
}

export default App
