import { formatDistanceToNowStrict } from "date-fns";

export const formatTimeAgo = (timestamp: string): string => {
  const date = new Date(timestamp);

  return formatDistanceToNowStrict(date, { addSuffix: true });
};

export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "N/A";

  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatShortDate = (dateString: string | undefined): string => {
  if (!dateString) return "N/A";

  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
