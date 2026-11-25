export const statusLabels: any = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

export const priorityLabels: any = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const categoryLabels: any = {
  technical: "Technical",
  billing: "Billing",
  account: "Account",
  feature_request: "Feature request",
  general: "General",
};

export const statusColors: any = {
  open: "blue",
  in_progress: "yellow",
  resolved: "lime",
  closed: "gray",
};

export const priorityColors: any = {
  low: "soft",
  medium: "cyan",
  high: "orange",
  urgent: "rose",
};

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString();
};

export const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString();
};

export const timeAgo = (date: string) => {
  const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "just now";
  if (minutes < 60) return minutes + " min ago";
  if (hours < 24) return hours + " hours ago";
  if (days < 30) return days + " days ago";
  return formatDate(date);
};

export const getInitials = (name: string) => {
  const words = name.trim().split(" ");
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};
