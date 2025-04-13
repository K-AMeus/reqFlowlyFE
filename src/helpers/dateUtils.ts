export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMonths > 1) {
    return `${date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  } else if (diffDays > 0) {
    return diffDays === 1 ? "yesterday" : `${diffDays} days ago`;
  } else if (diffHours > 0) {
    return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  } else if (diffMins > 0) {
    return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
  } else {
    return "just now";
  }
};

export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "N/A";

  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "short",
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
