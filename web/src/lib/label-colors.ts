import type { components } from '@/types/api';

type LabelColor = components['schemas']['LabelColor'];

export const LABEL_COLOR_CONFIG: Record<LabelColor, { bg: string; text: string; name: string }> = {
  green: { bg: 'bg-emerald-500', text: 'text-white', name: 'Xanh lá' },
  yellow: { bg: 'bg-amber-400', text: 'text-black', name: 'Vàng' },
  orange: { bg: 'bg-orange-500', text: 'text-white', name: 'Cam' },
  red: { bg: 'bg-rose-500', text: 'text-white', name: 'Đỏ' },
  purple: { bg: 'bg-purple-500', text: 'text-white', name: 'Tím' },
  blue: { bg: 'bg-blue-500', text: 'text-white', name: 'Xanh dương' },
  sky: { bg: 'bg-sky-400', text: 'text-black', name: 'Xanh da trời' },
  lime: { bg: 'bg-lime-500', text: 'text-black', name: 'Xanh chanh' },
  pink: { bg: 'bg-pink-500', text: 'text-white', name: 'Hồng' },
  black: { bg: 'bg-neutral-800', text: 'text-white', name: 'Đen' },
};
