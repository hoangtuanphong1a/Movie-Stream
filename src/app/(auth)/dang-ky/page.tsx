import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Đăng ký" };

export default function RegisterPage() {
  return (
    <>
      <h1 className="mb-4 text-center font-serif text-2xl font-bold tracking-tight">
        Tạo tài khoản
      </h1>
      <RegisterForm />
    </>
  );
}
