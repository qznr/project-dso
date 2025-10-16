import * as React from "react"
import { useNavigate } from "react-router-dom"
import { LogInIcon, UserPlusIcon, LogOutIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

function HomePage() {
  const navigate = useNavigate()
  const token = localStorage.getItem("authToken")
  const userProfile = localStorage.getItem("userProfile")

  let username = null;
  if (userProfile) {
      try {
          username = JSON.parse(userProfile).username;
      } catch (e) {
      }
  }

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("userProfile")
    navigate("/")
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-4">
      <Card className="w-full max-w-xl text-center">
        <CardHeader>
          <CardTitle className="text-4xl font-extrabold">Hello Homepage</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <p className="text-lg text-muted-foreground">
            Selamat datang di Aplikasi Forum Game! Anda dapat menjelajahi forum ini sebagai tamu.
          </p>
          <Separator />
          
          {token ? (
            <div className="flex flex-col items-center gap-4">
                <p className="text-xl font-medium text-primary">
                    Welcome back, {username || 'User'}!
                </p>
                <div className="flex gap-4">
                    <Button onClick={() => navigate("/profile")}>
                        View Profile
                    </Button>
                    <Button onClick={handleLogout} variant="destructive">
                        <LogOutIcon className="mr-2 size-4" /> Logout
                    </Button>
                </div>
            </div>
          ) : (
            <div className="flex justify-center gap-4">
              <Button onClick={() => navigate("/login")}>
                <LogInIcon className="mr-2 size-4" /> Log In
              </Button>
              <Button variant="outline" onClick={() => navigate("/register")}>
                <UserPlusIcon className="mr-2 size-4" /> Register
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default HomePage