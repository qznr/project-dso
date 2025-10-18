// src/pages/Profile.jsx
import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import AuthLayout from "./AuthLayout"

function Profile() {
  const navigate = useNavigate()

  const [userProfile, setUserProfile] = React.useState({
    name: "Guest",
    email: "guest@example.com",
    bio: "No bio available.",
    photoUrl: "",
  })

  React.useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      navigate("/");
      return;
    }

    const storedProfile = JSON.parse(localStorage.getItem("userProfile"));
    if (storedProfile) {
      setUserProfile(storedProfile);
    } else {
      // Jika tidak ada profil di localStorage (misal setelah logout dari akun lain dan login),
      // inisialisasi dengan profil kosong/default. Ini akan diisi oleh handleLoginSuccess di App.jsx
      // jika login baru terjadi atau diedit nanti.
      setUserProfile({
        name: "Welcome User",
        email: "user@example.com",
        bio: "This is your default bio.",
        photoUrl: "",
      });
    }
  }, [navigate]);

  const getInitials = (name) => {
    if (!name) return "U"
    const parts = name.trim().split(" ")
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (
      parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase()
    )
  }

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?")
    if (confirmLogout) {
      localStorage.removeItem("authToken")
      localStorage.removeItem("userProfile") // <--- PASTIkan BARIS INI ADA!
      navigate("/")
    }
  }

  return (
    <AuthLayout title="My Profile">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <Avatar className="mx-auto size-24 mb-4">
            {userProfile.photoUrl ? (
              <AvatarImage src={userProfile.photoUrl} alt={userProfile.name} />
            ) : (
              <AvatarFallback>{getInitials(userProfile.name)}</AvatarFallback>
            )}
          </Avatar>
          <CardTitle className="text-2xl font-bold">{userProfile.name}</CardTitle>
          <p className="text-muted-foreground">{userProfile.email}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">Bio</h3>
            <p className="text-sm text-muted-foreground">
              {userProfile.bio || "No bio available."}
            </p>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <Button
              className="w-full"
              onClick={() => navigate("/edit-profile")}
            >
              Edit Profile
            </Button>

            <Button
              className="w-full"
              variant="destructive"
              onClick={handleLogout}
            >
              Log Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}

export default Profile;