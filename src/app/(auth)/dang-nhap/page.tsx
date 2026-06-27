import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Đăng nhập" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const callbackUrl = typeof sp.callbackUrl === "string" ? sp.callbackUrl : "/";
  const registered = sp.registered === "1";

  return (
    <>
      <h1 className="mb-4 text-center font-serif text-2xl font-bold tracking-tight">
        Đăng nhập
      </h1>
      <LoginForm callbackUrl={callbackUrl} registered={registered} />
    </>
  );
}
