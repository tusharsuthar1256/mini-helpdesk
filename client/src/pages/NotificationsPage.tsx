import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { NotificationCenter } from "@/components/application/notification-center/notification-center";
import { toast } from "@/components/base/toast/toast";
import api, { getError } from "@/api/api";
import { timeAgo } from "@/utils/helpers";
import type { Notification } from "@/types";

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { getUnread } = useOutletContext<any>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadCount, setReloadCount] = useState(0);

  const getNotifications = async () => {
    try {
      const res = await api.get("/notifications", { params: { limit: 50 } });
      setNotifications(res.data.data);
      setReloadCount((count) => count + 1);
    } catch (error) {
      toast.error(getError(error));
    }
    setLoading(false);
  };

  useEffect(() => {
    getNotifications();
  }, []);

  const handleAction = async (id: string, action: string) => {
    const notification = notifications.find((n) => n.id === id);
    if (!notification) return;

    try {
      if (!notification.read) {
        await api.patch("/notifications/" + id + "/read");
      }
      if (action === "open") {
        navigate("/tickets/" + notification.ticket);
      } else {
        getNotifications();
        getUnread();
      }
    } catch (error) {
      toast.error(getError(error));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      getNotifications();
      getUnread();
    } catch (error) {
      toast.error(getError(error));
    }
  };

  const items: any[] = notifications.map((n) => {
    const actions = [{ id: "open", label: "Open ticket", variant: "secondary" }];
    if (!n.read) {
      actions.push({ id: "read", label: "Mark read", variant: "ghost" });
    }

    return {
      id: n.id,
      category: n.event === "comment.added" ? "mentions" : "system",
      group: n.read ? "Read" : "New",
      title: n.title,
      description: n.message,
      timestamp: timeAgo(n.createdAt),
      unread: !n.read,
      actions: actions,
    };
  });

  if (loading) {
    return <p className="p-8 text-body-regular text-text-secondary">Loading...</p>;
  }

  return (
    <div className="flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <NotificationCenter
        key={reloadCount}
        notifications={items}
        onAction={handleAction}
        onMarkAllRead={handleMarkAllRead}
        tabLabels={{ mentions: "Replies", system: "Ticket updates" }}
        className="max-w-2xl shadow-none"
      />
    </div>
  );
};

export default NotificationsPage;
