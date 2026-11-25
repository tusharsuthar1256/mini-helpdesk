import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RiAddLine, RiCheckboxCircleFill, RiInboxFill, RiLoader4Fill, RiTicket2Fill } from "@remixicon/react";
import { StatCards } from "@/components/application/dashboard/stat-cards";
import { Button } from "@/components/base/buttons/button";
import { LinkButton } from "@/components/base/buttons/link-button";
import { ProgressBar } from "@/components/base/progress/progress";
import { Chip } from "@/components/base/badges/chip";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@/components/base/table/table";
import { toast } from "@/components/base/toast/toast";
import TicketForm from "@/components/TicketForm";
import { useAuth } from "@/context/AuthContext";
import api, { getError } from "@/api/api";
import { priorityLabels, statusColors, statusLabels, timeAgo } from "@/utils/helpers";
import type { Ticket } from "@/types";

const DashboardPage = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [formOpen, setFormOpen] = useState(false);

  const getData = async () => {
    try {
      const statsRes = await api.get("/tickets/stats");
      setStats(statsRes.data.data);

      const ticketsRes = await api.get("/tickets", { params: { limit: 5, sortBy: "updatedAt" } });
      setTickets(ticketsRes.data.data);

      if (isAdmin) {
        const activityRes = await api.get("/activity", { params: { limit: 8 } });
        setActivity(activityRes.data.data);
      }
    } catch (error) {
      toast.error(getError(error));
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const getPercent = (count: number) => {
    if (stats.total === 0) return 0;
    return Math.round((count / stats.total) * 100);
  };

  if (!stats) {
    return <p className="p-8 text-body-regular text-text-secondary">Loading...</p>;
  }

  const resolved = stats.byStatus.resolved + stats.byStatus.closed;

  const cards: any[] = [
    {
      icon: RiTicket2Fill,
      label: "Total tickets",
      value: String(stats.total),
      delta: "+" + stats.createdLastWeek,
      deltaColor: "lime",
      tone: "blue",
      caption: "New in the last 7 days",
    },
    {
      icon: RiInboxFill,
      label: "Open",
      value: String(stats.byStatus.open),
      delta: getPercent(stats.byStatus.open) + "%",
      deltaColor: "neutral",
      tone: "orange",
      caption: isAdmin ? stats.unassigned + " unassigned" : "Waiting for support",
    },
    {
      icon: RiLoader4Fill,
      label: "In progress",
      value: String(stats.byStatus.in_progress),
      delta: getPercent(stats.byStatus.in_progress) + "%",
      deltaColor: "neutral",
      tone: "purple",
      caption: "Being worked on",
    },
    {
      icon: RiCheckboxCircleFill,
      label: "Resolved",
      value: String(resolved),
      delta: getPercent(resolved) + "%",
      deltaColor: "lime",
      tone: "emerald",
      caption: "Resolved or closed",
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-1-semibold text-text-primary">Hello, {user.name}</h1>
          <p className="text-body-regular text-text-secondary">Here is an overview of the support tickets.</p>
        </div>
        {!isAdmin && (
          <Button leadingIcon={RiAddLine} onClick={() => setFormOpen(true)}>
            New ticket
          </Button>
        )}
      </div>

      <StatCards variant="footer" stats={cards} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-4 rounded-3xl border border-border-button-default p-5 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-headline-semibold text-text-primary">Recently updated</h2>
            <LinkButton onClick={() => navigate("/tickets")}>View all</LinkButton>
          </div>
          {tickets.length === 0 ? (
            <p className="text-body-regular text-text-tertiary">No tickets yet.</p>
          ) : (
            <Table aria-label="Recent tickets" size="sm" onRowAction={(id) => navigate("/tickets/" + id)}>
              <TableHeader>
                <TableColumn isRowHeader>Ticket</TableColumn>
                <TableColumn>Status</TableColumn>
                <TableColumn>Updated</TableColumn>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id} id={ticket.id} className="cursor-pointer">
                    <TableCell>
                      <div className="text-body-medium text-text-primary">{ticket.title}</div>
                      <div className="text-body-2-regular text-text-tertiary">{ticket.reference}</div>
                    </TableCell>
                    <TableCell>
                      <Chip variant="subtle" color={statusColors[ticket.status]}>
                        {statusLabels[ticket.status]}
                      </Chip>
                    </TableCell>
                    <TableCell>{timeAgo(ticket.updatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex flex-col gap-4 rounded-3xl border border-border-button-default p-5">
          <h2 className="text-headline-semibold text-text-primary">By priority</h2>
          {["urgent", "high", "medium", "low"].map((priority) => (
            <ProgressBar
              key={priority}
              label={priorityLabels[priority]}
              value={getPercent(stats.byPriority[priority])}
              description={stats.byPriority[priority] + " tickets"}
              showValueLabel
            />
          ))}
        </div>
      </div>

      {isAdmin && (
        <div className="flex flex-col gap-3 rounded-3xl border border-border-button-default p-5">
          <h2 className="text-headline-semibold text-text-primary">Recent activity</h2>
          {activity.map((item) => (
            <div key={item.id}>
              <p className="text-body-regular text-text-primary">
                {item.metadata?.reference} - {item.message}
              </p>
              <p className="text-body-2-regular text-text-tertiary">{timeAgo(item.createdAt)}</p>
            </div>
          ))}
        </div>
      )}

      <TicketForm isOpen={formOpen} setIsOpen={setFormOpen} onSaved={(ticket: Ticket) => navigate("/tickets/" + ticket.id)} />
    </div>
  );
};

export default DashboardPage;
