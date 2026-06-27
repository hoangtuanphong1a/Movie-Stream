import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Lấy người dùng hiện tại từ phiên (null nếu chưa đăng nhập). */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** Bắt buộc đã đăng nhập, nếu chưa thì chuyển tới trang đăng nhập. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/dang-nhap");
  return user;
}

/** Bắt buộc là quản trị viên. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/dang-nhap");
  if (user.role !== "ADMIN") redirect("/");
  return user;
}
