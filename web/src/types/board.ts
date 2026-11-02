export const BOARD_BACKGROUND_OPTIONS = [
  'blue',
  'orange',
  'green',
  'red',
  'purple',
  'pink',
  'lime',
  'sky',
] as const;

export type BoardBackground = (typeof BOARD_BACKGROUND_OPTIONS)[number];

export type BoardRole = 'owner' | 'member';

export interface Board {
  id: string;
  name: string;
  background: BoardBackground;
  archived: boolean;
  isStarred: boolean;
  role: BoardRole;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BoardMember {
  userId: string;
  name: string;
  email: string;
  role: BoardRole;
}

export const BOARD_BACKGROUND_COLORS: Record<
  BoardBackground,
  { label: string; hex: string }
> = {
  blue: { label: 'Xanh dương', hex: '#2563eb' },
  orange: { label: 'Cam', hex: '#ea580c' },
  green: { label: 'Xanh lá', hex: '#059669' },
  red: { label: 'Đỏ', hex: '#e11d48' },
  purple: { label: 'Tím', hex: '#9333ea' },
  pink: { label: 'Hồng', hex: '#db2777' },
  lime: { label: 'Chanh', hex: '#65a30d' },
  sky: { label: 'Da trời', hex: '#0284c7' },
};
