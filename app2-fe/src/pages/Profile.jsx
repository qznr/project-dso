// src/pages/Profile.jsx

import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input"; 
import { Textarea } from "@/components/ui/textarea"; 
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupButton } from "@/components/ui/input-group";
import { Form, FormMessage } from "@/components/ui/form";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { User, LogOut, ArrowLeft, EyeIcon, EyeOffIcon } from "lucide-react";

// --- Konstanta dan Validasi ---
const apiUrl = import.meta.env.VITE_API_URL;
const PROFILE_ENDPOINT = `${apiUrl}/users/profile`;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

const EditProfileSchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters.").optional().or(z.literal("")),
    bio: z.string().optional(),
    newPassword: z.string().optional(),
  })
  .refine(
    (data) => !data.newPassword || data.newPassword.length >= 6,
    {
      message: "New password must be at least 6 characters.",
      path: ["newPassword"],
    }
  )

// --- Helper Functions ---
function isLoggedIn() {
    return !!localStorage.getItem("authToken");
}

function getCurrentUser() {
    const userProfileString = localStorage.getItem("userProfile");
    if (userProfileString) {
        try {
            return JSON.parse(userProfileString);
        } catch (e) {
            return null;
        }
    }
    return null;
}

function getInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase());
}

function resolveImageUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${apiUrl}/${path}`; 
}

// --- Komponen Header Global (Reusable Logic) ---
function GlobalHeaderContent({ navigate, currentUser, profilePictureUrl, forceLogout }) {
    const initials = currentUser?.username ? currentUser.username[0].toUpperCase() : 'U';

    return (
        <>
            <div className="flex-1 max-w-lg relative">
                <Input 
                    className="border bg-gray-50 rounded-full px-4 py-2 w-full pl-10" 
                    placeholder="Search" 
                    readOnly // Tampilan saja
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">🔍</span>
            </div>
            
            <div className="flex items-center gap-3">
                {isLoggedIn() ? (
                    <>
                        {/* TOMBOL POST (Constraint 1 & 2) */}
                        <Button 
                            onClick={() => navigate('/create-thread')} 
                            className="rounded-full"
                            size="sm"
                        >
                            Post
                        </Button>
                        
                        {/* AVATAR DENGAN DROPDOWN MENU */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Avatar className="cursor-pointer size-10 shrink-0">
                                    <AvatarImage src={profilePictureUrl} alt={currentUser.username} />
                                    <AvatarFallback>{initials}</AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem onClick={() => navigate('/profile')}>
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => forceLogout("Anda berhasil log out.")} className="text-red-600 focus:text-red-600">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log Out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </>
                ) : (
                    <Button onClick={() => navigate('/login')} className="rounded-full">
                        Login
                    </Button>
                )}
            </div>
        </>
    );
}


// --- Komponen Utama Profile ---
function Profile({ forceLogout }) {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [serverError, setServerError] = React.useState(null);
  const [editing, setEditing] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  
  const [userProfile, setUserProfile] = React.useState({
    user_id: null,
    username: "Guest",
    email: "guest@example.com",
    bio: "No bio available.",
    photoPath: "",
  });

  const [selectedFile, setSelectedFile] = React.useState(null);
  const [previewUrl, setPreviewUrl] = React.useState("");
  const fileInputRef = React.useRef(null); 
  const currentUser = getCurrentUser(); // Ambil user saat ini di sini

  const form = useForm({
    resolver: zodResolver(EditProfileSchema),
    defaultValues: {
      username: "",
      bio: "",
      newPassword: ""
    },
  });

  // Load profile from API
  React.useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    async function fetchProfile() {
      setLoading(true);
      setServerError(null);
      try {
        const res = await fetch(PROFILE_ENDPOINT, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        
        if (res.status === 401 || res.status === 403) {
            forceLogout("Token kedaluwarsa. Silakan login kembali.");
            return; 
        }

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || `Failed to fetch profile: ${res.status}`);
        }
        
        const json = await res.json();
        const fetchedData = json.data;

        const profile = {
          user_id: fetchedData.user_id,
          username: fetchedData.username || "Unnamed",
          email: fetchedData.email || "no-email@example.com",
          bio: fetchedData.bio || "No bio available.",
          photoPath: fetchedData.profile_picture_path || "",
        };

        setUserProfile(profile);
        
        form.reset({
          username: profile.username,
          bio: profile.bio,
          newPassword: ""
        });

        setPreviewUrl(profile.photoPath ? resolveImageUrl(profile.photoPath) : "");

      } catch (err) {
        console.error(err);
        toast.error("Gagal memuat profil.", { description: err.message || "Unknown error" });
        setServerError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, forceLogout]); 

  // Validasi Ukuran File dan Handle Preview
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(userProfile.photoPath ? resolveImageUrl(userProfile.photoPath) : "");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
        toast.error("File terlalu besar.", { description: `Ukuran maksimal adalah ${MAX_FILE_SIZE / 1024 / 1024}MB.` });
        e.target.value = null; 
        setSelectedFile(null);
        setPreviewUrl(userProfile.photoPath ? resolveImageUrl(userProfile.photoPath) : "");
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
    setSelectedFile(file);
  };

  // Submit handler -> PUT /users/profile
  const onSubmit = async (values) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("Autentikasi hilang.", { description: "Silahkan login kembali." });
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setServerError(null);

      const fd = new FormData();
      
      if (values.username && values.username !== userProfile.username) fd.append("username", values.username);
      if (values.bio && values.bio !== userProfile.bio) fd.append("bio", values.bio || "");
      if (values.newPassword) fd.append("password", values.newPassword); 
      
      if (selectedFile) {
        fd.append("profile_picture", selectedFile); 
      }
      
      if (fd.keys().next().done && !selectedFile && !values.newPassword) {
        toast.info("Tidak ada perubahan untuk disimpan.");
        setEditing(false);
        setLoading(false);
        return;
      }

      const res = await fetch(PROFILE_ENDPOINT, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: fd,
      });

      if (res.status === 401 || res.status === 403) {
        forceLogout("Token kedaluwarsa saat memperbarui profil. Silakan login kembali.");
        return; 
      }
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to update profile: ${res.status}`);
      }

      const updated = await res.json();
      const updatedUser = updated.user;
      
      const newProfile = {
        user_id: userProfile.user_id,
        username: updatedUser.username || values.username || userProfile.username,
        email: updatedUser.email || userProfile.email,
        bio: updatedUser.bio || values.bio || userProfile.bio,
        photoPath: updatedUser.profile_picture_path || userProfile.photoPath || "",
      };

      setUserProfile(newProfile);
      
      localStorage.setItem(
          "userProfile", 
          JSON.stringify({
            user_id: newProfile.user_id,
            username: newProfile.username,
            email: newProfile.email
          })
      );

      form.reset({
        username: newProfile.username,
        bio: newProfile.bio,
        newPassword: ""
      });

      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = null; 
      setPreviewUrl(newProfile.photoPath ? resolveImageUrl(newProfile.photoPath) : "");
      setEditing(false);

      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      setServerError(err.message || "Update failed");
      toast.error("Failed to update profile.", { description: err.message || "" });
      
      if (fileInputRef.current) fileInputRef.current.value = null;
      setSelectedFile(null);
    } finally {
      setLoading(false);
    }
  };

  const currentUserInitials = getInitials(userProfile.username);

  if (loading) {
    return (
      <div className="min-h-svh bg-gray-100">
        <header className="bg-white border-b sticky top-0 z-10">
            <div className="container mx-auto flex items-center justify-between p-4 gap-4 max-w-4xl">
                <div className="text-2xl font-bold text-gray-800 cursor-pointer" onClick={() => navigate('/')}>
                    Profile Page
                </div>
                {/* Header content while loading */}
                <GlobalHeaderContent navigate={navigate} currentUser={currentUser} profilePictureUrl={previewUrl} forceLogout={forceLogout} />
            </div>
        </header>
        <main className="container max-w-2xl mx-auto py-6">
          <p className="text-center text-gray-500">Loading profile data...</p>
        </main>
      </div>
    );
  }

  // --- RENDER UTAMA ---
  return (
    <div className="min-h-svh bg-gray-100">
      <header className="bg-white border-b sticky top-0 z-10">
            <div className="container mx-auto flex items-center justify-between p-4 gap-4 max-w-4xl">
                <div className="text-2xl font-bold text-gray-800 cursor-pointer" onClick={() => navigate('/')}>
                    Profile Page
                </div>
                <GlobalHeaderContent navigate={navigate} currentUser={currentUser} profilePictureUrl={previewUrl} forceLogout={forceLogout} />
            </div>
        </header>
      
      <main className="container max-w-4xl mx-auto py-6">
        {/* Konten Utama (Single Column) */}
        <div className="max-w-2xl mx-auto"> 
          <Card className="p-6">
            {/* Navigasi dan Title */}
            <div className="flex items-center gap-2 mb-4 text-xl font-semibold border-b pb-4">
              <button 
                onClick={() => setEditing(false)} 
                className={!editing ? 'hidden' : "hover:bg-gray-100 rounded-full p-1 transition-colors"}>
                <ArrowLeft className="size-5" />
              </button>
              <h1>{editing ? 'Edit Profile' : 'Profile'}</h1>
            </div>

            {/* Content Profile Card */}
            {editing ? (
              // --- EDIT MODE (GAMBAR KEDUA FIGMA) ---
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                  encType="multipart/form-data"
                >
                  {/* Avatar dan Change Avatar Button */}
                  <div className="flex flex-col items-center gap-2 mb-6">
                    <Avatar className="size-24 border-2 border-primary">
                      <AvatarImage src={previewUrl} alt="Profile Photo" />
                      <AvatarFallback className="text-2xl">{getInitials(form.watch("username") || "Guest")}</AvatarFallback>
                    </Avatar>
                    
                    <label 
                      htmlFor="profile-picture-upload"
                      className="text-primary hover:underline cursor-pointer text-sm font-medium"
                    >
                      Change Avatar
                    </label>
                    
                    <input 
                      id="profile-picture-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="sr-only"
                      ref={fileInputRef}
                    />

                    {selectedFile && (
                        <p className="text-sm text-green-600 mt-2">
                           File: {selectedFile.name} (Max 2MB) siap diunggah.
                        </p>
                    )}
                    
                  </div>

                  {/* 1. Username */}
                  <div className="space-y-2">
                    <label className="font-semibold text-gray-700">Username</label>
                    <InputGroup>
                      <InputGroupInput
                        placeholder="Username"
                        aria-label="Username"
                        {...form.register("username")}
                      />
                    </InputGroup>
                    <FormMessage>{form.formState.errors.username?.message}</FormMessage>
                  </div>

                  {/* 2. Bio (Menggunakan Textarea sesuai visual Figma) */}
                  <div className="space-y-2">
                    <label className="font-semibold text-gray-700">Bio</label>
                    <Textarea
                      placeholder="Bio"
                      aria-label="Bio"
                      rows={4}
                      {...form.register("bio")}
                    />
                    <FormMessage>{form.formState.errors.bio?.message}</FormMessage>
                  </div>
                  
                  {/* 3. Email (Disabled) */}
                  <div className="space-y-2">
                    <label className="font-semibold text-gray-700">Email</label>
                    <InputGroup>
                      <InputGroupInput
                        type="email"
                        placeholder="Email"
                        aria-label="Email"
                        value={userProfile.email}
                        disabled 
                      />
                    </InputGroup>
                    <p className="text-xs text-muted-foreground">Email tidak dapat diubah.</p>
                  </div>
                  
                  {/* 4. Password (New Password) */}
                  <div className="space-y-2">
                    <label className="font-semibold text-gray-700">New Password</label>
                    <InputGroup>
                      <InputGroupInput
                        type={showPassword ? "text" : "password"}
                        placeholder="Leave blank to keep current password"
                        {...form.register("newPassword")}
                      />
                       <InputGroupAddon align="inline-end">
                          <InputGroupButton
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            size="icon-xs"
                            variant="ghost"
                          >
                            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                          </InputGroupButton>
                        </InputGroupAddon>
                    </InputGroup>
                    <FormMessage>{form.formState.errors.newPassword?.message}</FormMessage>
                  </div>

                  {/* Tombol Save (Sesuai Figma) */}
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="submit" disabled={loading}>
                      {loading ? "Saving..." : "Save"}
                    </Button>
                  </div>
                  
                  {serverError && (
                      <p className="text-sm text-destructive mt-4 text-center">Error: {serverError}</p>
                  )}
                </form>
              </Form>
            ) : (
              // --- READ MODE (GAMBAR PERTAMA FIGMA) ---
              <div className="flex flex-col gap-6 pt-2">
                
                <div className="flex items-start gap-6">
                    <Avatar className="size-28 border-2 border-primary shrink-0">
                      <AvatarImage src={previewUrl} alt={userProfile.username} />
                      <AvatarFallback className="text-2xl">{currentUserInitials}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex flex-col gap-1">
                        <h2 className="text-2xl font-bold">{userProfile.username}</h2>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                            {userProfile.bio}
                        </p>
                    </div>
                </div>

                {/* Tombol Edit Profile (Geser ke Kanan) */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button onClick={() => setEditing(true)}>
                        Edit Profile
                    </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}

export default Profile;