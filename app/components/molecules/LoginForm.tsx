import { zodResolver } from "@hookform/resolvers/zod"
import type React from "react"
import { useForm } from "react-hook-form"
import type { z } from "zod"
import { loginFormSchema } from "~/lib/loginFormSchema"
import { Button } from "../atoms/button"
import { Input } from "../atoms/input"

export interface loginForm {
  Email: string
  Password: string
}

type FormData = z.infer<typeof loginFormSchema>

interface FormProps {
  login: (data: { Email: string; Password: string }) => void
  errorMessage?: string
}

export const LoginForm: React.FC<FormProps> = ({ login, errorMessage }) => {
  const {
    register,
    watch,
    trigger,
    reset,
    control,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(loginFormSchema), // Conectar Zod con React Hook Form
    mode: "onChange",
  })

  const sendLogin = () => {
    trigger()
    if (isValid) login(watch())
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm space-y-6">
          <form className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-gray-800">Welcome back</h2>
            <div className="items-center">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                {...register("Email")}
                placeholder="Email"
                className="mt-1 block w-full px-4 py-2 border rounded-lg shadow-sm focus:ring focus:ring-blue-200 focus:outline-none"
              />

              {errors.Email && <p className="text-red-500">{errors.Email.message}</p>}
            </div>
            <div className="items-center">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                type="password"
                {...register("Password")}
                placeholder="••••••••"
                className="mt-1 block w-full px-4 py-2 border rounded-lg shadow-sm focus:ring focus:ring-blue-200 focus:outline-none"
              />
              {errors.Password && <p className="text-red-500">{errors.Password.message}</p>}
            </div>
            {errorMessage && <div style={{ color: "red", marginTop: "10px" }}>{errorMessage}</div>}
          </form>
          <Button onClick={sendLogin} className="w-full font-semibold py-2 rounded-lg transition">
            Login
          </Button>
        </div>
      </div>
    </>
  )
}
