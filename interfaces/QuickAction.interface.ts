export interface QuickAction {
  id: string;
  title: string;
  description: string;
  href?: string; // Optional - if onClick is provided, href is not needed
  icon?: string; // Optional - icon is mapped by QuickActions component
  onClick?: () => void | Promise<void>; // Optional click handler
}


