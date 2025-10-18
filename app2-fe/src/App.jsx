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
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("authToken")
  
  if (!token) {
    // Jika tidak ada token, arahkan ke halaman login
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// --- App Component ---

function App() {
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
