import { navItems } from '../components/layout/Navbar/navItems';

export type NavigationId = 'home' | (typeof navItems)[number]['id'];

export function getNavigationTarget(hash: string): NavigationId | null {
  const hashId = hash.replace(/^#/, '').split('/')[0];
  if (hashId === 'experience' || hashId === 'skills') return 'about';
  if (hashId === 'ai-lab') return 'projects';
  if (hashId === 'home') return 'home';
  const item = navItems.find(({ id }) => id === hashId);
  if (item) return item.id;
  return null;
}
