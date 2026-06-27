# Ghi chú kỹ thuật — Next.js 16 (dành cho lập trình)

> Tài liệu nội bộ cho lập trình viên. Tóm tắt các thay đổi phá vỡ (breaking changes) của Next.js 16 so với 13/14/15, trích từ docs đi kèm trong `node_modules/next/dist/docs/`. Đọc trước khi viết code để tránh dùng API cũ.

## A. `params` và `searchParams` là Promise (phải `await`)

```tsx
// app/phim/[slug]/page.tsx
export default async function Page(props: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { slug } = await props.params
  const sp = await props.searchParams
}
```
Client component: dùng `use()` của React để unwrap promise.

## B. `middleware.ts` đổi tên thành `proxy.ts`
- Đặt ở gốc project (cạnh `app/`), runtime **nodejs** (không hỗ trợ edge).
- `export function proxy(request: NextRequest) { ... }`, `export const config = { matcher: [...] }`.
- Cờ `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`.
- Proxy chỉ làm "optimistic check"; xác thực thật vẫn ở tầng data/page.

## C. Server Actions
- `'use server'` ở đầu file (mọi export là action) hoặc inline trong server component.
- Form: `<form action={createMovie}>`.
- Pending state: `useActionState(action, initial)` (từ `react`), `useFormStatus` (từ `react-dom`).
- `revalidatePath('/...')`, `redirect('/...')`.
- **`revalidateTag` cần 2 tham số**: `revalidateTag('movies', 'max')`. Có thêm `updateTag('movies')` (chỉ trong Server Actions, hết hạn ngay).

## D. Route Handlers (`app/api/.../route.ts`)
```ts
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return Response.json({ slug })
}
```
- **Không cache mặc định**. Muốn cache: `export const dynamic = 'force-static'`.

## E. Mô hình cache mới (Cache Components)
- Bật trong config: `cacheComponents: true`.
- Mặc định `fetch()` và route handler **KHÔNG cache**.
- Muốn cache: directive `'use cache'` + `cacheLife('hours')` + `cacheTag('movies')`.
- Dữ liệu động (DB theo request, `cookies()`, `headers()`) phải bọc trong `<Suspense>`.
- Các API `unstable_*` đã ổn định, bỏ tiền tố (vd `import { cacheLife } from 'next/cache'`).

## F. `next.config.ts`
- **Turbopack là mặc định** — bỏ cờ `--turbopack`; webpack config tùy biến sẽ làm build lỗi (dùng `next build --webpack` nếu buộc phải).
- Ảnh remote: dùng `images.remotePatterns` (bỏ `images.domains`). Cho TMDB:
```ts
images: {
  remotePatterns: [{ protocol: 'https', hostname: 'image.tmdb.org', pathname: '/t/p/**' }],
}
```
- Mặc định ảnh đổi: `minimumCacheTTL` = 4h, `qualities` = [75], `maximumRedirects` = 3.

## G. `generateMetadata` — async params
```tsx
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  return { title: ... }
}
```

## H. `cookies()`, `headers()`, `draftMode()` đều async → phải `await`.

## I. React 19: `useActionState` (react), `useFormStatus` (react-dom). Không dùng `useFormState` cũ.

## J. Footgun khác
- Parallel routes cần `default.tsx` nếu không build lỗi.
- `next lint` đã bị bỏ → dùng ESLint CLI trực tiếp.
- Scroll smooth: thêm `data-scroll-behavior="smooth"` vào `<html>` nếu cần.
