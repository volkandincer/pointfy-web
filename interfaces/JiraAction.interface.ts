export interface JiraAction {
  id: string;
  title: string;
  description: string;
  href?: string;
  icon: string; // emoji or icon name
  onClick?: () => void | Promise<void>; // Optional click handler
  requiresConnection?: boolean; // Jira bağlantısı gerekip gerekmediği
}

