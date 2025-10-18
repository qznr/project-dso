import * as React from "react"
import { EyeIcon, EyeOffIcon, MailIcon, LockIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import AuthLayout from "./AuthLayout"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormField,
  FormItem, // Tidak digunakan, bisa dihapus jika tidak ada FormLabel atau FormControl
  FormMessage,
} from "@/components/ui/form"
import { Field, FieldContent } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupButton } from "@/components/ui/input-group"

// --- Skema Validasi Login (menggunakan Zod) ---
// Mendefinisikan aturan dan tipe data untuk input email dan password.
const LoginSchema = z.object({
  email: z.string().email("Invalid email address."), // Email harus format email yang valid
  password: z.string().min(1, "Password is required."), // Password harus diisi
})

// --- Komponen Login ---
// Fungsi: Menampilkan form login dan menangani proses autentikasi.
// Props:
// - onRegisterClick: Fungsi untuk beralih ke tampilan registrasi.
// - onLoginSuccess: Fungsi callback yang dipanggil setelah login berhasil,
//                   digunakan oleh App.jsx untuk menyimpan data profil.
function Login({ onRegisterClick, onLoginSuccess }) {
  const [showPassword, setShowPassword] = React.useState(false) // State untuk menampilkan/menyembunyikan password
  const [isLoading, setIsLoading] = React.useState(false)       // State untuk indikator loading saat submit

  // Inisialisasi React Hook Form untuk mengelola state form, validasi, dan submit.
  const form = useForm({
    resolver: zodResolver(LoginSchema), // Menggunakan Zod untuk validasi skema
    defaultValues: {
      email: "",
      password: "",
    },
  })
  const navigate = useNavigate();
  const location = useLocation();

  // --- useEffect untuk Menampilkan Notifikasi Registrasi Berhasil ---
  // Berjalan saat komponen dimuat atau saat 'location.state' berubah.
  // Akan menampilkan toast jika ada pesan 'registrationSuccess' dari halaman Register.
  React.useEffect(() => {
    if (location.state?.registrationSuccess) {
      toast.success("Registration successful! Please log in with your new account.")
      // Menghapus state dari URL agar toast tidak muncul lagi saat refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.registrationSuccess, navigate, location.pathname]) // Dependencies useEffect

  // Mengambil URL API dari variabel lingkungan. Pastikan .env Anda sudah benar (VITE_API_URL).
  const apiUrl = import.meta.env.VITE_API_URL

  // --- onSubmit ---
  // Handler untuk saat form login disubmit.
  // Mengirim data login ke API dan menangani respons.
  async function onSubmit(values) {
    setIsLoading(true) // Set loading ke true saat proses dimulai
    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values), // Mengirim email dan password dari form
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Login failed. Check your credentials.")
      }

      const data = await response.json()
      const token = data.token
      const user = data.user // Objek user dari respons API, berisi nama dan email

      localStorage.setItem("authToken", token) // Simpan token ke localStorage

      console.log("Login successful", data)
      // Panggil onLoginSuccess yang diterima dari App.jsx.
      // Kirim objek 'user' dari respons API agar App.jsx bisa menyimpan nama dan email.
      onLoginSuccess?.(user) // <--- PERUBAHAN PENTING DI SINI

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
    <AuthLayout title="Account Log In">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

          {/* Menampilkan pesan error dari server (jika ada) */}
          {form.formState.errors.root?.serverError && (
            <p className="text-destructive text-sm" role="alert">
              {form.formState.errors.root.serverError.message}
            </p>
          )}

          {/* Tombol Log In */}
          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? "Logging In..." : "Log In"} {/* Teks tombol berubah saat loading */}
          </Button>
        </form>
      </Form>

      {/* Tautan untuk beralih ke halaman Register */}
      <div className="mt-4 text-center text-sm">
        Don&apos;t have an account?{" "}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault() // Mencegah refresh halaman
            onRegisterClick()  // Panggil fungsi untuk beralih ke Register
          }}
          className="text-primary hover:underline underline-offset-4"
        >
          Register
        </a>
      </div>
    </AuthLayout>
  )
}

export default Login