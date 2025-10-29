export interface NavigationItem {
  label: string;
  href: string;
  external?: boolean;
}

export interface NavigationProps {
  items: NavigationItem[];
}
