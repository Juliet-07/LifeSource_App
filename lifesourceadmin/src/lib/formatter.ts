export const timeAgo = (dateString: string) => {
  if (!dateString) return "";

  const now = new Date().getTime();
  const past = new Date(dateString).getTime();

  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24)
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
};

export const formatRequestId = (id: string, index: number) => {
  const year = new Date().getFullYear();
  const number = String(index + 1).padStart(3, "0");

  return `REQ-${year}-${number}`;
};

export const formatUrgency = (value?: string) => {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export const urgencyVariantMap: Record<
  string,
  "destructive" | "secondary" | "default" | "outline"
> = {
  critical: "destructive",
  high: "secondary",
  medium: "default",
  low: "outline",
};
