import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RiAddLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { SearchField } from "@/components/base/search-field/search-field";
import { Select, SelectItem } from "@/components/base/select/select";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@/components/base/table/table";
import { Chip } from "@/components/base/badges/chip";
import { Pagination } from "@/components/base/pagination/pagination";
import { toast } from "@/components/base/toast/toast";
import TicketForm from "@/components/TicketForm";
import { useAuth } from "@/context/AuthContext";
import api, { getError } from "@/api/api";
import {
  categoryLabels,
  formatDate,
  priorityColors,
  priorityLabels,
  statusColors,
  statusLabels,
} from "@/utils/helpers";
import type { Ticket } from "@/types";

const sortLabels: any = {
  "createdAt-desc": "Newest first",
  "createdAt-asc": "Oldest first",
  "updatedAt-desc": "Recently updated",
  "priority-desc": "Highest priority",
  "priority-asc": "Lowest priority",
  "title-asc": "Title A-Z",
};

const TicketsPage = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("createdAt-desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const getTickets = async () => {
    try {
      const params: any = { page: page, limit: 10 };
      params.sortBy = sort.split("-")[0];
      params.order = sort.split("-")[1];
      if (search) params.search = search;
      if (status !== "all") params.status = status;
      if (priority !== "all") params.priority = priority;
      if (category !== "all") params.category = category;

      const res = await api.get("/tickets", { params });
      setTickets(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } catch (error) {
      toast.error(getError(error));
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(getTickets, 300);
    return () => clearTimeout(timer);
  }, [page, search, status, priority, category, sort]);

  const changeFilter = (setValue: any, value: any) => {
    setValue(value);
    setPage(1);
  };

  const filterSelect = (label: string, value: string, setValue: any, options: any) => (
    <Select
      aria-label={label}
      selectedKey={value}
      onSelectionChange={(key) => changeFilter(setValue, key)}
      className="min-w-36"
      triggerClassName="w-full"
    >
      {Object.keys(options).map((key) => (
        <SelectItem key={key} id={key} textValue={options[key]}>
          {options[key]}
        </SelectItem>
      ))}
    </Select>
  );

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-title-1-semibold text-text-primary">{isAdmin ? "All tickets" : "My tickets"}</h1>
        {!isAdmin && (
          <Button leadingIcon={RiAddLine} onClick={() => setFormOpen(true)}>
            New ticket
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchField
          aria-label="Search tickets"
          placeholder="Search title, description or TCK-1001"
          value={search}
          onChange={(value) => changeFilter(setSearch, value)}
          className="w-full sm:w-80"
        />
        {filterSelect("Status", status, setStatus, { all: "All statuses", ...statusLabels })}
        {filterSelect("Priority", priority, setPriority, { all: "All priorities", ...priorityLabels })}
        {filterSelect("Category", category, setCategory, { all: "All categories", ...categoryLabels })}
        {filterSelect("Sort by", sort, setSort, sortLabels)}
      </div>

      {loading && <p className="text-body-regular text-text-secondary">Loading...</p>}

      {!loading && tickets.length === 0 && (
        <p className="text-body-regular text-text-secondary">No tickets found.</p>
      )}

      {tickets.length > 0 && (
        <div className="overflow-hidden rounded-3xl border border-border-button-default">
          <Table aria-label="Tickets" onRowAction={(id) => navigate("/tickets/" + id)}>
            <TableHeader>
              <TableColumn isRowHeader>Ticket</TableColumn>
              <TableColumn>Status</TableColumn>
              <TableColumn>Priority</TableColumn>
              <TableColumn>Category</TableColumn>
              <TableColumn>{isAdmin ? "Requester" : "Assignee"}</TableColumn>
              <TableColumn>Created</TableColumn>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id} id={ticket.id} className="cursor-pointer">
                  <TableCell>
                    <div className="text-body-medium text-text-primary">{ticket.title}</div>
                    <div className="text-body-2-regular text-text-tertiary">
                      {ticket.reference} · {ticket.commentCount} comments
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip variant="subtle" color={statusColors[ticket.status]}>
                      {statusLabels[ticket.status]}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip variant="subtle" color={priorityColors[ticket.priority]}>
                      {priorityLabels[ticket.priority]}
                    </Chip>
                  </TableCell>
                  <TableCell>{categoryLabels[ticket.category]}</TableCell>
                  <TableCell>
                    {isAdmin ? ticket.createdBy.name : ticket.assignedTo ? ticket.assignedTo.name : "Unassigned"}
                  </TableCell>
                  <TableCell>{formatDate(ticket.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}

      <TicketForm isOpen={formOpen} setIsOpen={setFormOpen} onSaved={(ticket: Ticket) => navigate("/tickets/" + ticket.id)} />
    </div>
  );
};

export default TicketsPage;
