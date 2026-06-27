import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Tên tối thiểu 2 ký tự").max(50, "Tên tối đa 50 ký tự"),
    email: z.email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự").max(72, "Mật khẩu tối đa 72 ký tự"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Mật khẩu nhập lại không khớp",
    path: ["confirmPassword"],
  });

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Tối thiểu 1").max(10, "Tối đa 10"),
  comment: z.string().max(2000, "Bình luận tối đa 2000 ký tự").optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
