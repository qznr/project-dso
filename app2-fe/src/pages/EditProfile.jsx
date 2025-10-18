import * as React from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import AuthLayout from "./AuthLayout"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Field, FieldContent } from "@/components/ui/field"
import { Form, FormField, FormMessage } from "@/components/ui/form"
import { UserIcon, MailIcon, Image as ImageIcon } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

// Skema validasi untuk form edit profile menggunakan Zod.
const EditProfileSchema = z.object({
  name: z.string().min(1, "Name is required."),
  email: z.string().email("Invalid email address."),
  bio: z.string().optional(),
  // photoUrl tidak perlu divalidasi di sini karena dihandle terpisah sebagai Data URL string
  // dan disimpan langsung ke localStorage, bukan dari input form field biasa.
})

function EditProfile() {
  const navigate = useNavigate()

  // State lokal untuk menyimpan URL foto yang di-upload sementara (untuk preview).
  // Ini akan diinisialisasi dari localStorage.userProfile.photoUrl
  const [currentPhotoUrl, setCurrentPhotoUrl] = React.useState("")

  // Inisialisasi React Hook Form untuk mengelola form.
  const form = useForm({
    resolver: zodResolver(EditProfileSchema),
    defaultValues: {
      name: "",
      email: "",
      bio: "",
      // photoUrl: "", // Hapus photoUrl dari defaultValues karena dihandle secara terpisah.
    },
  })

  // Efek samping ini akan berjalan sekali saat komponen dimuat.
  // Fungsinya untuk mengambil data profil yang sudah ada dari localStorage
  // dan mengisi form dengan data tersebut.
  React.useEffect(() => {
    const storedProfile = JSON.parse(localStorage.getItem("userProfile"))
    if (storedProfile) {
      setCurrentPhotoUrl(storedProfile.photoUrl || "") // Set preview foto jika ada
      form.reset({
        name: storedProfile.name,
        email: storedProfile.email,
        bio: storedProfile.bio,
      })
    } else {
      // Jika tidak ada profil (misal, setelah logout dan login baru sebelum edit)
      // inisialisasi form dengan nilai kosong atau default.
      form.reset({
        name: "",
        email: "",
        bio: "",
      });
      setCurrentPhotoUrl(""); // Pastikan preview foto juga kosong
    }
  }, []) // Array kosong berarti efek ini hanya berjalan sekali setelah render pertama

  // Handler untuk saat pengguna memilih file gambar.
  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0] // Ambil file pertama yang dipilih
    if (file) {
      const reader = new FileReader() // Buat FileReader untuk membaca file
      reader.onloadend = () => {
        setCurrentPhotoUrl(reader.result) // Simpan Data URL file untuk preview
        // Tidak perlu form.setValue("photoUrl", reader.result) lagi karena kita akan
        // menggabungkannya secara manual di onSubmit.
      }
      reader.readAsDataURL(file) // Baca file sebagai Data URL
    } else {
      setCurrentPhotoUrl("") // Kosongkan preview jika tidak ada file
    }
  }

  // Handler saat form disubmit.
  const onSubmit = (values) => {
    // Ambil data profil yang sudah ada dari localStorage.
    // Ini penting untuk mendapatkan profil yang "aktif" saat ini.
    const existingProfile = JSON.parse(localStorage.getItem("userProfile")) || {};

    // Gabungkan nilai baru dari form dengan data profil yang sudah ada.
    // photoUrl akan diambil dari `currentPhotoUrl` (hasil upload/preview terbaru)
    // dan menimpa photoUrl lama yang ada di existingProfile.
    const updatedProfile = {
      ...existingProfile, // Pertahankan data lama (misal: ID user jika ada)
      ...values, // Timpa dengan nilai dari form (name, email, bio)
      photoUrl: currentPhotoUrl, // Selalu gunakan photoUrl dari state preview terbaru
    };

    localStorage.setItem("userProfile", JSON.stringify(updatedProfile)) // Simpan profil yang diperbarui ke localStorage
    navigate("/profile") // Arahkan kembali ke halaman profil
  }

  // Fungsi helper untuk mendapatkan inisial nama.
  const getInitials = (name) => {
    if (!name) return "U"
    const parts = name.trim().split(" ")
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (
      parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase()
    )
  }

  return (
    <AuthLayout title="Edit Profile" onClose={() => navigate("/profile")}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

          {/* Bagian Unggah Foto */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <Avatar className="size-24 border-2 border-primary">
              {currentPhotoUrl ? (
                // Tampilkan foto jika ada URL
                <AvatarImage src={currentPhotoUrl} alt="Profile Photo" />
              ) : (
                // Tampilkan inisial jika tidak ada foto
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
                {/* Tidak ada validasi Zod langsung untuk input type="file",
                    jadi FormMessage untuk photoUrl mungkin tidak diperlukan di sini */}
              </FieldContent>
            </Field>
          </div>

          {/* Field untuk Nama Lengkap */}
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

          {/* Field untuk Email */}
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

          {/* Field untuk Bio Singkat */}
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <Field orientation="vertical">
                <FieldContent>
                  <InputGroup>
                    <InputGroupInput
                      placeholder="Short bio"
                      aria-label="Short bio"
                      {...field}
                    />
                  </InputGroup>
                </FieldContent>
              </Field>
            )}
          />

          {/* Container untuk Tombol Save Changes dan Cancel */}
          <div className="flex gap-2 mt-4">
            <Button type="submit" className="flex-1">
              Save Changes
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => navigate("/profile")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </AuthLayout>
  )
}

export default EditProfile