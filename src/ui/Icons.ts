import { createElement, Sprout, House, Trees, TreePine, Volume2, VolumeX, Settings, BookOpen, MessageCircle, Sparkles, Hand, Headphones, FlaskConical, X, ChevronRight, Check, Sun, CloudRain, Compass, Backpack } from 'lucide';

const icons = { sprout: Sprout, home: House, park: Trees, forest: TreePine, sound: Volume2, mute: VolumeX, settings: Settings, book: BookOpen, ask: MessageCircle, sparkle: Sparkles, hand: Hand, listen: Headphones, experiment: FlaskConical, close: X, next: ChevronRight, check: Check, sun: Sun, rain: CloudRain, compass: Compass, backpack: Backpack };
export type IconName = keyof typeof icons;
export function icon(name: IconName) {
  return createElement(icons[name], { width: 22, height: 22, 'stroke-width': 1.8, 'aria-hidden': 'true' }).outerHTML;
}
