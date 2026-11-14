import {
  Calendar,
  Globe,
  Mail,
  MapPin,
  Megaphone,
  Mic,
  Phone,
  Star,
  Users,
  type LucideIcon,
} from 'lucide-react';

export type PosterIconOption = {
  id: string;
  label: string;
  Icon: LucideIcon;
};

export const POSTER_ICON_OPTIONS: PosterIconOption[] = [
  { id: 'calendar', label: 'Calendar', Icon: Calendar },
  { id: 'globe', label: 'Globe', Icon: Globe },
  { id: 'mail', label: 'Mail', Icon: Mail },
  { id: 'map-pin', label: 'Location', Icon: MapPin },
  { id: 'megaphone', label: 'Megaphone', Icon: Megaphone },
  { id: 'mic', label: 'Microphone', Icon: Mic },
  { id: 'phone', label: 'Phone', Icon: Phone },
  { id: 'star', label: 'Star', Icon: Star },
  { id: 'users', label: 'Users', Icon: Users },
];

export function getPosterIcon(id: string) {
  return POSTER_ICON_OPTIONS.find((option) => option.id === id) ?? POSTER_ICON_OPTIONS[0];
}
