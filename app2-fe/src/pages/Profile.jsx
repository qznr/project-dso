import * as React from "react"
import { useNavigate } from "react-router-dom"
import { LogOutIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = React.useState(null)

  React.useEffect(() => {
    const token = localStorage.getItem("authToken")
    const userProfileString = localStorage.getItem("userProfile")

    if (!token || !userProfileString) {
      handleLogout()
      return
    }

    try {
      const storedUser = JSON.parse(userProfileString)
      setUser(storedUser)
    } catch (e) {
      console.error("Failed to parse user profile from localStorage", e)
      handleLogout()
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("userProfile")
    navigate("/login")
  }

  if (!user) {
    return <div className="flex min-h-svh items-center justify-center"></div>;
  }
  
  // Karena data profile yang lengkap (bio, picture path)
  // kita hanya menampilkan data yang dijamin ada dari response login.
  const username = user.username;
  const email = user.email;

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-lg p-0">
        <CardHeader className="flex-row items-center justify-between gap-4 border-b px-6 py-4">
          <div className="flex flex-col gap-1">
            <CardTitle>User Profile (Placeholder)</CardTitle>
            <CardDescription>Data diambil dari sesi login.</CardDescription>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOutIcon className="mr-2 size-4" /> Logout
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 p-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              {/* Avatar Image tidak bisa diisi, karena path profile picture tidak ada di respons login */}
              <AvatarFallback className="text-xl">{username?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-2xl font-semibold">{username || 'Guest'}</p>
              <p className="text-muted-foreground text-sm">{email || 'No email data'}</p>
            </div>
          </div>
          
          <div className="grid gap-2">
            <h3 className="font-medium text-lg border-b pb-1">Bio (Pending)</h3>
            <p className="text-muted-foreground italic min-h-6">
              Bio belum tersedia.
            </p>
          </div>

          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">User ID</span>
            <span className="font-medium">{user.user_id}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Profile