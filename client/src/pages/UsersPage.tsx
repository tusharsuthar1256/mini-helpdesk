import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@/components/base/table/table";
import { Select, SelectItem } from "@/components/base/select/select";
import { Pagination } from "@/components/base/pagination/pagination";
import { toast } from "@/components/base/toast/toast";
import { useAuth } from "@/context/AuthContext";
import api, { getError } from "@/api/api";
import { formatDate } from "@/utils/helpers";
import type { User } from "@/types";

const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const getUsers = async () => {
    try {
      const res = await api.get("/users", { params: { page: page, limit: 10 } });
      setUsers(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } catch (error) {
      toast.error(getError(error));
    }
  };

  useEffect(() => {
    getUsers();
  }, [page]);

  const changeRole = async (user: User, role: string) => {
    if (user.role === role) return;

    try {
      await api.patch("/users/" + user.id + "/role", { role });
      toast.success("Role updated");
      getUsers();
    } catch (error) {
      toast.error(getError(error));
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-title-1-semibold text-text-primary">Users</h1>
        <p className="text-body-regular text-text-secondary">Manage who can access the admin tools.</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border-button-default">
        <Table aria-label="Users">
          <TableHeader>
            <TableColumn isRowHeader>Name</TableColumn>
            <TableColumn>Email</TableColumn>
            <TableColumn>Joined</TableColumn>
            <TableColumn>Role</TableColumn>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} id={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{formatDate(user.createdAt)}</TableCell>
                <TableCell>
                  <Select
                    aria-label={"Role for " + user.name}
                    selectedKey={user.role}
                    onSelectionChange={(key: any) => changeRole(user, key)}
                    isDisabled={user.id === currentUser.id}
                    size="sm"
                    className="w-28"
                    triggerClassName="w-full"
                  >
                    <SelectItem id="user" textValue="User">
                      User
                    </SelectItem>
                    <SelectItem id="admin" textValue="Admin">
                      Admin
                    </SelectItem>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
    </div>
  );
};

export default UsersPage;
