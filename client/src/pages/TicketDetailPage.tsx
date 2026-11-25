import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RiDeleteBinLine, RiEditLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { LinkButton } from "@/components/base/buttons/link-button";
import { Chip } from "@/components/base/badges/chip";
import { Tabs, TabList, Tab, TabPanel } from "@/components/base/tabs/tabs";
import { Textarea } from "@/components/base/textarea/textarea";
import { AlertDialog } from "@/components/base/modal/modal";
import { toast } from "@/components/base/toast/toast";
import TicketForm from "@/components/TicketForm";
import TicketManage from "@/components/TicketManage";
import { useAuth } from "@/context/AuthContext";
import api, { getError } from "@/api/api";
import {
  categoryLabels,
  formatDateTime,
  priorityColors,
  priorityLabels,
  statusColors,
  statusLabels,
  timeAgo,
} from "@/utils/helpers";
import type { Comment, Ticket } from "@/types";

const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const getTicket = async () => {
    try {
      const ticketRes = await api.get("/tickets/" + id);
      setTicket(ticketRes.data.data);

      const commentsRes = await api.get("/tickets/" + id + "/comments");
      setComments(commentsRes.data.data);

      const activityRes = await api.get("/tickets/" + id + "/activity");
      setActivity(activityRes.data.data);
    } catch (error) {
      toast.error(getError(error));
      navigate("/tickets");
    }
  };

  useEffect(() => {
    getTicket();
  }, [id]);

  const handleComment = async (e: any) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    try {
      await api.post("/tickets/" + id + "/comments", { body: message });
      setMessage("");
      getTicket();
    } catch (error) {
      toast.error(getError(error));
    }
    setSending(false);
  };

  const handleDelete = async () => {
    try {
      await api.delete("/tickets/" + id);
      toast.success("Ticket deleted");
      navigate("/tickets");
    } catch (error) {
      toast.error(getError(error));
    }
  };

  if (!ticket) {
    return <p className="p-8 text-body-regular text-text-secondary">Loading...</p>;
  }

  const canEdit = isAdmin || ticket.status === "open";

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div>
        <LinkButton onClick={() => navigate("/tickets")}>Back to tickets</LinkButton>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-title-1-semibold break-words text-text-primary">{ticket.title}</h1>
          <div className="flex flex-wrap gap-2">
            <Chip variant="subtle" color={statusColors[ticket.status]}>
              {statusLabels[ticket.status]}
            </Chip>
            <Chip variant="subtle" color={priorityColors[ticket.priority]}>
              {priorityLabels[ticket.priority]} priority
            </Chip>
            <Chip variant="subtle" color="soft">
              {categoryLabels[ticket.category]}
            </Chip>
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="secondary" leadingIcon={RiEditLine} onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button variant="danger" leadingIcon={RiDeleteBinLine} onClick={() => setDeleteOpen(true)}>
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="rounded-3xl border border-border-button-default p-5">
            <p className="whitespace-pre-wrap break-words text-body-regular text-text-secondary">
              {ticket.description}
            </p>
          </div>

          <Tabs defaultSelectedKey="comments">
            <TabList aria-label="Ticket details">
              <Tab id="comments">Comments ({comments.length})</Tab>
              <Tab id="activity">Activity ({activity.length})</Tab>
            </TabList>

            <TabPanel id="comments" className="flex flex-col gap-4 pt-4">
              {comments.length === 0 && <p className="text-body-regular text-text-tertiary">No comments yet.</p>}

              {comments.map((comment) => (
                <div key={comment.id} className="rounded-3xl border border-border-button-default p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-body-medium text-text-primary">{comment.author.name}</span>
                    {comment.author.role === "admin" && (
                      <Chip variant="caption" color="purple">
                        Support
                      </Chip>
                    )}
                    <span className="text-body-2-regular text-text-tertiary">{timeAgo(comment.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-body-regular text-text-secondary">
                    {comment.body}
                  </p>
                </div>
              ))}

              {ticket.status === "closed" ? (
                <p className="text-body-regular text-text-tertiary">This ticket is closed, comments are disabled.</p>
              ) : (
                <form onSubmit={handleComment} className="flex flex-col gap-3">
                  <Textarea
                    aria-label="Write a comment"
                    placeholder="Write a comment..."
                    value={message}
                    onChange={setMessage}
                    rows={3}
                    maxLength={2000}
                  />
                  <Button type="submit" disabled={sending || !message.trim()} className="self-end">
                    {sending ? "Sending..." : "Comment"}
                  </Button>
                </form>
              )}
            </TabPanel>

            <TabPanel id="activity" className="flex flex-col gap-3 pt-4">
              {activity.map((item) => (
                <div key={item.id}>
                  <p className="text-body-regular text-text-primary">{item.message}</p>
                  <p className="text-body-2-regular text-text-tertiary">{formatDateTime(item.createdAt)}</p>
                </div>
              ))}
            </TabPanel>
          </Tabs>
        </div>

        <div className="flex flex-col gap-6">
          {isAdmin && <TicketManage ticket={ticket} onUpdated={getTicket} />}

          <div className="flex flex-col gap-3 rounded-3xl border border-border-button-default p-5 text-body-regular text-text-secondary">
            <h2 className="text-headline-semibold text-text-primary">Details</h2>
            <p>Reference: {ticket.reference}</p>
            <p>Requester: {ticket.createdBy.name}</p>
            <p>Assignee: {ticket.assignedTo ? ticket.assignedTo.name : "Unassigned"}</p>
            <p>Created: {formatDateTime(ticket.createdAt)}</p>
            <p>Last update: {timeAgo(ticket.updatedAt)}</p>
            {ticket.resolvedAt && <p>Resolved: {formatDateTime(ticket.resolvedAt)}</p>}
            {!canEdit && <p>Support is working on this ticket, so it can not be edited or deleted.</p>}
          </div>
        </div>
      </div>

      <TicketForm isOpen={editOpen} setIsOpen={setEditOpen} ticket={ticket} onSaved={getTicket} />

      <AlertDialog
        isOpen={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this ticket?"
        description="The ticket and all of its comments will be removed."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default TicketDetailPage;
