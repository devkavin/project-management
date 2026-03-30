"use client";

import api from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email(),
  password: z.string().min(8),
  mode: z.enum(["login", "register"]),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { register, handleSubmit, control } = useForm<FormData>({
    defaultValues: { mode: "login" },
    resolver: zodResolver(schema),
  });

  const mode = useWatch({ control, name: "mode" });

  const mutation = useMutation({
    mutationFn: async (payload: FormData) => {
      if (payload.mode === "register") {
        const response = await api.post("/auth/register", {
          ...payload,
          password_confirmation: payload.password,
        });

        return response.data;
      }

      const response = await api.post("/auth/login", payload);
      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      router.push("/dashboard");
    },
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1b1d22] p-6 text-[#e9ecf1]">
      <form
        className="w-full max-w-md space-y-4 rounded-xl border border-[#2b2f36] bg-[#191c22] p-6"
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
      >
        <h1 className="text-xl font-semibold">Sign in</h1>
        <select className="w-full rounded bg-[#21252d] p-2" {...register("mode")}>
          <option value="login">Login</option>
          <option value="register">Register</option>
        </select>
        {mode === "register" && <input className="w-full rounded bg-[#21252d] p-2" placeholder="Full name" {...register("name")} />}
        <input className="w-full rounded bg-[#21252d] p-2" placeholder="Email" {...register("email")} />
        <input className="w-full rounded bg-[#21252d] p-2" type="password" placeholder="Password" {...register("password")} />
        <button className="w-full rounded bg-[#7557ff] py-2 font-medium" type="submit">
          {mode === "login" ? "Login" : "Create account"}
        </button>
      </form>
    </main>
  );
}
