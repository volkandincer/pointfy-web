export interface QuickAction {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string; // emoji or icon name
  onClick?: () => void | Promise<void>; // Optional click handler
}


