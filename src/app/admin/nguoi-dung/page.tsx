import { listUsersAdmin } from "@/lib/admin-queries";
import { getCurrentUser } from "@/lib/session";
import { UserRowActions } from "@/components/admin/user-row-actions";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const [users, me] = await Promise.all([listUsersAdmin(), getCurrentUser()]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Quản lý người dùng ({users.length})</h1>

      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-card)] text-left text-[var(--color-muted-foreground)]">
            <tr>
              <th className="p-3">Tên</th>
              <th className="p-3">Email</th>
              <th className="p-3">Đánh giá</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3">Quyền & thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-[var(--color-border)]">
                <td className="p-3 font-medium">
                  {u.name ?? "—"}
                  {me?.id === u.id && (
                    <span className="ml-2 text-xs text-[var(--color-primary)]">
                      (bạn)
                    </span>
                  )}
                </td>
                <td className="p-3 text-[var(--color-muted-foreground)]">
                  {u.email}
                </td>
                <td className="p-3 text-[var(--color-muted-foreground)]">
                  {u._count.reviews}
                </td>
                <td className="p-3">
                  <Badge
                    className={
                      u.status === "BANNED"
                        ? "border-red-500/40 text-red-400"
                        : ""
                    }
                  >
                    {u.status === "BANNED" ? "Bị khóa" : "Hoạt động"}
                  </Badge>
                </td>
                <td className="p-3">
                  <UserRowActions
                    id={u.id}
                    role={u.role}
                    status={u.status}
                    disabled={me?.id === u.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
