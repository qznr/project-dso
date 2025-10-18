import * as React from "react"
import { EyeIcon, EyeOffIcon, UserIcon, MailIcon, LockIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom" // Import useNavigate untuk redirect dengan state

import AuthLayout from "./AuthLayout" // Pastikan jalur ke AuthLayout.jsx sudah benar
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl, // Tidak digunakan, bisa dihapus jika tidak ada FormLabel atau FormDescription
  FormField,
  FormItem,    // Tidak digunakan, bisa dihapus jika tidak ada FormLabel atau FormDescription
  FormLabel,   // Tidak digunakan, bisa dihapus jika tidak ada FormControl
  FormMessage,
} from "@/components/ui/form"
import { Field, FieldContent } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupButton } from "@/components/ui/input-group"

// --- Skema Validasi Register (menggunakan Zod) ---
// Mendefinisikan aturan dan tipe data untuk input registrasi.
const RegisterSchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters."), // Username minimal 3 karakter
    email: z.string().email("Invalid email address."), // Email harus format email yang valid
    password: z.string().min(6, "Password must be at least 6 characters."), // Password minimal 6 karakter
    passwordConfirmation: z.string(), // Konfirmasi password
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords do not match.", // Pesan error jika password tidak cocok
    path: ["passwordConfirmation"], // Menunjukkan error pada field konfirmasi password
  })

// --- Komponen Register ---
// Fungsi: Menampilkan form registrasi dan menangani proses pendaftaran akun baru.
// Props:
// - onLoginClick: Fungsi untuk beralih kembali ke tampilan login.
// - onRegisterSuccess: Fungsi callback yang dipanggil setelah registrasi berhasil,
//                      digunakan oleh App.jsx untuk menyimpan data profil awal.
function Register({ onLoginClick, onRegisterSuccess }) {
  const [showPassword, setShowPassword] = React.useState(false) // State untuk menampilkan/menyembunyikan password
  const [isLoading, setIsLoading] = React.useState(false)       // State untuk indikator loading saat submit
  const navigate = useNavigate(); // Hook untuk navigasi

  // Inisialisasi React Hook Form untuk mengelola state form, validasi, dan submit.
  const form = useForm({
    resolver: zodResolver(RegisterSchema), // Menggunakan Zod untuk validasi skema
    defaultValues: {
      username: "",
      email: "",
      password: "",
      passwordConfirmation: "",
    },
  })

  // Mengambil URL API dari variabel lingkungan. Pastikan .env Anda sudah benar (VITE_API_URL).
  const apiUrl = import.meta.env.VITE_API_URL

  // --- onSubmit ---
  // Handler untuk saat form registrasi disubmit.
  // Mengirim data registrasi ke API dan menangani respons.
  async function onSubmit(values) {
    setIsLoading(true) // Set loading ke true saat proses dimulai
    try {
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values), // Mengirim username, email, password, passwordConfirmation dari form
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Registration failed.")
      }

      const data = await response.json() // Respons dari API setelah registrasi (mungkin berisi user ID, dll.)

      console.log("Registration successful", values)
      // Panggil onRegisterSuccess yang diterima dari App.jsx.
      // Kirim data username dan email dari 'values' agar App.jsx bisa menyimpan data profil awal.
      onRegisterSuccess?.({
        name: values.username, // Gunakan username sebagai nama awal
        email: values.email,   // Gunakan email
      }) // <--- PERUBAHAN PENTING DI SINI

      // Redirect ke halaman login setelah registrasi berhasil dengan state untuk notifikasi
      navigate("/", { state: { registrationSuccess: true } });

    } catch (error) {
      console.error("API Error:", error.message)
      // Menampilkan pesan error dari API ke form
      form.setError("root.serverError", {
        type: "400",
        message: error.message,
      })
    } finally {
      setIsLoading(false) // Set loading ke false setelah proses selesai (berhasil/gagal)
    }
  }

  return (
    <AuthLayout title="Register">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Field untuk Username */}
          <FormField
            control={form.control}
            name="username"
            render={({ field, fieldState }) => (
              <Field orientation="vertical">
                <FieldContent>
                  <InputGroup>
                    <InputGroupAddon>
                      <UserIcon /> {/* Ikon user */}
                    </InputGroupAddon>
                    <InputGroupInput
                      placeholder="Username"
                      aria-label="Username"
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                  </InputGroup>
                  <FormMessage /> {/* Menampilkan pesan error validasi username */}
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
                      <MailIcon /> {/* Ikon email */}
                    </InputGroupAddon>
                    <InputGroupInput
                      type="email"
                      placeholder="Email"
                      aria-label="Email"
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                  </InputGroup>
                  <FormMessage /> {/* Menampilkan pesan error validasi email */}
                </FieldContent>
              </Field>
            )}
          />

          {/* Field untuk Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <Field orientation="vertical">
                <FieldContent>
                  <InputGroup>
                    <InputGroupAddon>
                      <LockIcon /> {/* Ikon kunci */}
                    </InputGroupAddon>
                    <InputGroupInput
                      type={showPassword ? "text" : "password"} // Mengubah tipe input berdasarkan state showPassword
                      placeholder="Password"
                      aria-label="Password"
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    <InputGroupAddon align="inline-end">
                      {/* Tombol untuk menampilkan/menyembunyikan password */}
                      <InputGroupButton
                        onClick={() => setShowPassword((prev) => !prev)}
                        size="icon-xs"
                        variant="ghost"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />} {/* Ikon mata */}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  <FormMessage /> {/* Menampilkan pesan error validasi password */}
                </FieldContent>
              </Field>
            )}
          />

          {/* Field untuk Konfirmasi Password */}
          <FormField
            control={form.control}
            name="passwordConfirmation"
            render={({ field, fieldState }) => (
              <Field orientation="vertical">
                <FieldContent>
                  <InputGroup>
                    <InputGroupAddon>
                      <LockIcon /> {/* Ikon kunci */}
                    </InputGroupAddon>
                    <InputGroupInput
                      type={showPassword ? "text" : "password"} // Mengubah tipe input berdasarkan state showPassword
                      placeholder="Password confirmation"
                      aria-label="Password confirmation"
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    <InputGroupAddon align="inline-end">
                      {/* Tombol untuk menampilkan/menyembunyikan password */}
                      <InputGroupButton
                        onClick={() => setShowPassword((prev) => !prev)}
                        size="icon-xs"
                        variant="ghost"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />} {/* Ikon mata */}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  <FormMessage /> {/* Menampilkan pesan error validasi konfirmasi password */}
                </FieldContent>
              </Field>
            )}
          />

          {/* Menampilkan pesan error dari server (jika ada) */}
          {form.formState.errors.root?.serverError && (
            <p className="text-destructive text-sm" role="alert">
              {form.formState.errors.root.serverError.message}
            </p>
          )}

          {/* Tombol Register */}
          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? "Registering..." : "Register"} {/* Teks tombol berubah saat loading */}
          </Button>
        </form>
      </Form>

      {/* Tautan untuk beralih ke halaman Login */}
      <div className="mt-4 text-center text-sm">
        Already have an account?{" "}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault() // Mencegah refresh halaman
            onLoginClick()     // Panggil fungsi untuk beralih ke Login
          }}
          className="text-primary hover:underline underline-offset-4"
        >
          Log In
        </a>
      </div>
    </AuthLayout>
  )
}

export default Register