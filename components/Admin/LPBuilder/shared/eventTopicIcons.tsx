import {
  HelpCircle,
  Calendar,
  CreditCard,
  MapPin,
  FileText,
  Users,
  Cpu,
  Brain,
  Leaf,
  Globe,
  Microscope,
  BookOpen,
  Lightbulb,
  Network,
  Shield,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { EventTopicIcon } from '../../../../types';

export const EVENT_TOPIC_ICON_OPTIONS: EventTopicIcon[] = [
  'help',
  'calendar',
  'credit-card',
  'map-pin',
  'file-text',
  'users',
  'cpu',
  'brain',
  'leaf',
  'globe',
  'microscope',
  'book-open',
  'lightbulb',
  'network',
  'shield',
  'zap',
];

export const EventTopicIconMap: Record<EventTopicIcon, LucideIcon> = {
  help: HelpCircle,
  calendar: Calendar,
  'credit-card': CreditCard,
  'map-pin': MapPin,
  'file-text': FileText,
  users: Users,
  cpu: Cpu,
  brain: Brain,
  leaf: Leaf,
  globe: Globe,
  microscope: Microscope,
  'book-open': BookOpen,
  lightbulb: Lightbulb,
  network: Network,
  shield: Shield,
  zap: Zap,
};

export function resolveEventTopicIcon(icon?: EventTopicIcon): LucideIcon {
  if (icon && icon in EventTopicIconMap) {
    return EventTopicIconMap[icon];
  }
  return HelpCircle;
}
