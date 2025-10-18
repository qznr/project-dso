// src/pages/Profile.jsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import AuthLayout from "./AuthLayout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Field, FieldContent } from "@/components/ui/field";
import { Form, FormField, FormMessage } from "@/components/ui/form";
import { UserIcon, MailIcon, Image as ImageIcon } from "lucide-react";

/**
 * Profile page with inline edit:
 * - GET /profile  -> load profile
 * - PUT /profile  -> save profile (FormData, field 'profile_picture' for file)
 *
 * Notes:
 * - Uses fetch (as project does)
 * - Auth token from localStorage.authToken -> Authorization: Bearer <token>
 * - Production uses /api prefix; local uses /profile directly.
 */

const getApiPrefix = () => {
  // Production prefix uses /api per project note; local uses empty prefix.
  return import.meta.env.MODE === "production" ? "/api" : "";
};

const PROFILE_ENDPOINT = `${getApiPrefix()}/profile`;

function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [serverError, setServerError] = React.useState(null);
  const [editing, setEditing] = React.useState(false);
  const [userProfile, setUserProfile] = React.useState({
    name: "Guest",
    email: "guest@example.com",
    bio: "No bio available.",
    photoUrl: "",
  });

  // For previewing newly selected file before uploading
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [previewUrl, setPreviewUrl] = React.useState("");

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      bio: "",
    },
  });

  // Helper: return full URL for image (if backend returns relative path)
  const resolveImageUrl = (url) => {
    if (!url) return "";
    // If already absolute (http/https), return as-is
    if (/^https?:\/\//i.test(url)) return url;
    // Otherwise prefix with api base if running production/backend serves static files under the same origin.
    // If backend serves uploads on same host, this should work; adjust if your backend serves files from another domain.
    const prefix = ""; // Usually empty because static files served from same origin.
    return `${prefix}${url}`;
  };

  // Load profile from API
  React.useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      // not authenticated -> redirect to login
      navigate("/");
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
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to fetch profile: ${res.status} ${text}`);
        }
        const data = await res.json();
        // Expecting data to contain { name, email, bio, photoUrl } or similar
        const profile = {
          name: data.name || data.fullname || "Unnamed",
          email: data.email || "no-email@example.com",
          bio: data.bio || data.profile?.bio || "",
          // try several likely keys; adapt if your backend uses another property
          photoUrl: data.photoUrl || data.profile_picture || data.profile?.photoUrl || "",
        };
        setUserProfile(profile);
        form.reset({
          name: profile.name,
          email: profile.email,
          bio: profile.bio,
        });
        // preview uses server image if exists
        setPreviewUrl(profile.photoUrl ? resolveImageUrl(profile.photoUrl) : "");
      } catch (err) {
        console.error(err);
        setServerError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // Compute initials for AvatarFallback
  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0).toUpperCase() +
      parts[parts.length - 1].charAt(0).toUpperCase()
    );
  };

  // Handle file selection (preview)
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      // if user removed file, revert preview to server image
      setPreviewUrl(userProfile.photoUrl ? resolveImageUrl(userProfile.photoUrl) : "");
      return;
    }
    // preview local file
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
    setSelectedFile(file);
  };

  // Submit handler -> PUT /profile
  const onSubmit = async (values) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("Authentication token missing. Please login again.");
      navigate("/");
      return;
    }

    try {
      setLoading(true);
      setServerError(null);

      // Build FormData because we may include a file
      const fd = new FormData();
      fd.append("name", values.name);
      fd.append("email", values.email);
      fd.append("bio", values.bio || "");
      if (selectedFile) {
        fd.append("profile_picture", selectedFile); // field name per upload.js
      }

      const res = await fetch(PROFILE_ENDPOINT, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          // NOTE: don't set Content-Type for FormData; browser sets it automatically
          Accept: "application/json",
        },
        body: fd,
      });

      if (!res.ok) {
        const bodyText = await res.text();
        throw new Error(`Failed to update profile: ${res.status} ${bodyText}`);
      }

      const updated = await res.json();

      // Update UI using response; try to read return fields
      const newProfile = {
        name: updated.name || values.name,
        email: updated.email || values.email,
        bio: updated.bio || values.bio || "",
        // backend may return path in updated.photoUrl or updated.profile_picture
        photoUrl: updated.photoUrl || updated.profile_picture || userProfile.photoUrl || "",
      };

      setUserProfile(newProfile);
      form.reset({
        name: newProfile.name,
        email: newProfile.email,
        bio: newProfile.bio,
      });

      // Reset selected file (we already updated preview to server path if returned)
      setSelectedFile(null);
      setPreviewUrl(newProfile.photoUrl ? resolveImageUrl(newProfile.photoUrl) : "");

      // Close edit mode
      setEditing(false);

      // Optionally inform user
      alert("Profile updated successfully.");
    } catch (err) {
      console.error(err);
      setServerError(err.message || "Update failed");
      alert("Failed to update profile: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if (confirmLogout) {
      localStorage.removeItem("authToken");
      // Do NOT delete server-side profile: just remove token; subsequent login will fetch profile from server
      navigate("/");
    }
  };

  // Render
  return (
    <AuthLayout title="My Profile">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <Avatar className="mx-auto size-24 mb-4">
            {previewUrl ? (
              <AvatarImage src={previewUrl} alt={userProfile.name} />
            ) : (
              <AvatarFallback>{getInitials(userProfile.name)}</AvatarFallback>
            )}
          </Avatar>
          <CardTitle className="text-2xl font-bold">{userProfile.name}</CardTitle>
          <p className="text-muted-foreground">{userProfile.email}</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Read mode */}
          {!editing && (
            <>
              <div>
                <h3 className="font-semibold text-lg">Bio</h3>
                <p className="text-sm text-muted-foreground">
                  {userProfile.bio || "No bio available."}
                </p>
              </div>

              <div className="flex flex-col gap-2 mt-4">
                <Button className="w-full" onClick={() => setEditing(true)}>
                  Edit Profile
                </Button>

                <Button className="w-full" variant="destructive" onClick={handleLogout}>
                  Log Out
                </Button>
              </div>
            </>
          )}

          {/* Edit mode */}
          {editing && (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
                encType="multipart/form-data"
              >
                {/* Photo upload */}
                <div className="flex flex-col items-center gap-4 mb-6">
                  <Avatar className="size-24 border-2 border-primary">
                    {previewUrl ? (
                      <AvatarImage src={previewUrl} alt="Profile Photo" />
                    ) : (
                      <AvatarFallback>{getInitials(form.watch("name") || "Guest")}</AvatarFallback>
                    )}
                  </Avatar>
                  <Field orientation="vertical" className="w-full">
                    <FieldContent>
                      <InputGroup>
                        <InputGroupAddon>
                          <ImageIcon />
                        </InputGroupAddon>
                        <InputGroupInput
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="cursor-pointer"
                        />
                      </InputGroup>
                    </FieldContent>
                  </Field>
                </div>

                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <Field orientation="vertical">
                      <FieldContent>
                        <InputGroup>
                          <InputGroupAddon>
                            <UserIcon />
                          </InputGroupAddon>
                          <InputGroupInput
                            placeholder="Full name"
                            aria-label="Full name"
                            aria-invalid={fieldState.invalid}
                            {...field}
                          />
                        </InputGroup>
                        <FormMessage />
                      </FieldContent>
                    </Field>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <Field orientation="vertical">
                      <FieldContent>
                        <InputGroup>
                          <InputGroupAddon>
                            <MailIcon />
                          </InputGroupAddon>
                          <InputGroupInput
                            type="email"
                            placeholder="Email"
                            aria-label="Email"
                            aria-invalid={fieldState.invalid}
                            {...field}
                          />
                        </InputGroup>
                        <FormMessage />
                      </FieldContent>
                    </Field>
                  )}
                />

                {/* Bio */}
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <Field orientation="vertical">
                      <FieldContent>
                        <InputGroup>
                          <InputGroupInput placeholder="Short bio" aria-label="Short bio" {...field} />
                        </InputGroup>
                      </FieldContent>
                    </Field>
                  )}
                />

                {/* Buttons */}
                <div className="flex gap-2 mt-4">
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      // revert changes: reset form to last saved profile
                      form.reset({
                        name: userProfile.name,
                        email: userProfile.email,
                        bio: userProfile.bio,
                      });
                      setSelectedFile(null);
                      setPreviewUrl(userProfile.photoUrl ? resolveImageUrl(userProfile.photoUrl) : "");
                      setEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {serverError && (
            <p className="text-sm text-destructive mt-2">Error: {serverError}</p>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

export default Profile;
