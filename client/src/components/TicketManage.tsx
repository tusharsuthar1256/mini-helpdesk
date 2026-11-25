import { useEffect, useState } from "react";
import { Select, SelectItem } from "@/components/base/select/select";
import { toast } from "@/components/base/toast/toast";
import api, { getError } from "@/api/api";
import { priorityLabels, statusLabels } from "@/utils/helpers";
import type { User } from "@/types";

const TicketManage = ({ ticket, onUpdated }: any) => {
  const [admins, setAdmins] = useState<User[]>([]);

  const getAdmins = async () => {
    try {
      const res = await api.get("/users/admins");
      setAdmins(res.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getAdmins();
  }, []);

  const updateTicket = async (data: any) => {
    try {
      await api.patch("/tickets/" + ticket.id + "/manage", data);
      toast.success("Ticket updated");
      onUpdated();
    } catch (error) {
      toast.error(getError(error));
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-border-button-default p-5">
      <h2 className="text-headline-semibold text-text-primary">Manage ticket</h2>

      <Select
        label="Status"
        selectedKey={ticket.status}
        onSelectionChange={(key) => key !== ticket.status && updateTicket({ status: key })}
        className="w-full"
        triggerClassName="w-full"
      >
        {Object.keys(statusLabels).map((key) => (
          <SelectItem key={key} id={key} textValue={statusLabels[key]}>
            {statusLabels[key]}
          </SelectItem>
        ))}
      </Select>

      <Select
        label="Priority"
        selectedKey={ticket.priority}
        onSelectionChange={(key) => key !== ticket.priority && updateTicket({ priority: key })}
        className="w-full"
        triggerClassName="w-full"
      >
        {Object.keys(priorityLabels).map((key) => (
          <SelectItem key={key} id={key} textValue={priorityLabels[key]}>
            {priorityLabels[key]}
          </SelectItem>
        ))}
      </Select>

      <Select
        label="Assignee"
        selectedKey={ticket.assignedTo ? ticket.assignedTo.id : "none"}
        onSelectionChange={(key) => updateTicket({ assignedTo: key === "none" ? null : key })}
        className="w-full"
        triggerClassName="w-full"
      >
        {[{ id: "none", name: "Unassigned" }, ...admins].map((admin) => (
          <SelectItem key={admin.id} id={admin.id} textValue={admin.name}>
            {admin.name}
          </SelectItem>
        ))}
      </Select>
    </div>
  );
};

export default TicketManage;
