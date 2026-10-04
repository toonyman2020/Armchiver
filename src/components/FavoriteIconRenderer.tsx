import React from 'react';
import { 
  Heart, 
  Star, 
  Sparkles, 
  Flame, 
  Crown, 
  Gem, 
  Smile, 
  Truck, 
  Shield, 
  Zap, 
  Award, 
  Bookmark, 
  ThumbsUp, 
  Moon, 
  Sun, 
  Flag, 
  Trophy, 
  Coffee, 
  Gamepad2, 
  Music, 
  Check, 
  LucideIcon 
} from 'lucide-react';

export interface FavoriteIconOption {
  id: string;
  name: string;
  category: 'shapes' | 'emojis' | 'characters' | 'objects' | 'custom';
  type: 'lucide' | 'emoji' | 'image';
  icon?: LucideIcon;
  emoji?: string;
  imageSrc?: string;
  defaultColor?: string;
}

export const FAVORITE_ICON_OPTIONS: FavoriteIconOption[] = [
  // Default and Classic Hearts
  { id: 'heart', name: 'Default Red Heart', category: 'shapes', type: 'lucide', icon: Heart, defaultColor: '#ef4444' },
  { id: 'heart-pink', name: 'Pink Heart', category: 'shapes', type: 'lucide', icon: Heart, defaultColor: '#ec4899' },
  { id: 'heart-rose', name: 'Rose Heart', category: 'shapes', type: 'lucide', icon: Heart, defaultColor: '#f43f5e' },
  { id: 'heart-purple', name: 'Purple Heart', category: 'shapes', type: 'lucide', icon: Heart, defaultColor: '#a855f7' },
  { id: 'heart-cyan', name: 'Cyan Heart', category: 'shapes', type: 'lucide', icon: Heart, defaultColor: '#06b6d4' },
  { id: 'heart-emerald', name: 'Emerald Heart', category: 'shapes', type: 'lucide', icon: Heart, defaultColor: '#10b981' },
  { id: 'heart-amber', name: 'Gold Heart', category: 'shapes', type: 'lucide', icon: Heart, defaultColor: '#f59e0b' },
  
  // Lucide Vector Badges
  { id: 'star', name: 'Golden Star', category: 'shapes', type: 'lucide', icon: Star, defaultColor: '#eab308' },
  { id: 'sparkles', name: 'Magic Sparkles', category: 'shapes', type: 'lucide', icon: Sparkles, defaultColor: '#06b6d4' },
  { id: 'flame', name: 'Fire / Flame', category: 'shapes', type: 'lucide', icon: Flame, defaultColor: '#f97316' },
  { id: 'crown', name: 'Royal Crown', category: 'objects', type: 'lucide', icon: Crown, defaultColor: '#fbbf24' },
  { id: 'gem', name: 'Diamond Gem', category: 'objects', type: 'lucide', icon: Gem, defaultColor: '#38bdf8' },
  { id: 'trophy', name: 'Trophy Award', category: 'objects', type: 'lucide', icon: Trophy, defaultColor: '#f59e0b' },
  { id: 'award', name: 'Ribbon Medal', category: 'objects', type: 'lucide', icon: Award, defaultColor: '#8b5cf6' },
  { id: 'zap', name: 'Lightning Zap', category: 'shapes', type: 'lucide', icon: Zap, defaultColor: '#eab308' },
  { id: 'shield', name: 'Hero Shield', category: 'objects', type: 'lucide', icon: Shield, defaultColor: '#3b82f6' },
  { id: 'truck', name: 'Truck / Vehicle', category: 'objects', type: 'lucide', icon: Truck, defaultColor: '#0ea5e9' },
  { id: 'gamepad', name: 'Arcade Controller', category: 'objects', type: 'lucide', icon: Gamepad2, defaultColor: '#ec4899' },
  { id: 'music', name: 'Music Note', category: 'objects', type: 'lucide', icon: Music, defaultColor: '#14b8a6' },
  { id: 'bookmark', name: 'Bookmark', category: 'shapes', type: 'lucide', icon: Bookmark, defaultColor: '#f43f5e' },
  { id: 'thumbsup', name: 'Thumbs Up', category: 'shapes', type: 'lucide', icon: ThumbsUp, defaultColor: '#22c55e' },

  // Emojis requested specifically
  { id: 'emoji-heart', name: 'Red Heart Emoji', category: 'emojis', type: 'emoji', emoji: '❤️' },
  { id: 'emoji-two-hearts', name: 'Pink Two Hearts', category: 'emojis', type: 'emoji', emoji: '💕' },
  { id: 'emoji-sparkling-heart', name: 'Sparkling Heart', category: 'emojis', type: 'emoji', emoji: '💖' },
  { id: 'emoji-heart-eyes', name: 'Heart Eyes Face', category: 'emojis', type: 'emoji', emoji: '😍' },
  { id: 'emoji-smirk', name: 'Smirk Face', category: 'emojis', type: 'emoji', emoji: '😏' },
  { id: 'emoji-sleepy', name: 'Sleepy Face', category: 'emojis', type: 'emoji', emoji: '😴' },
  { id: 'emoji-smile', name: 'Happy Smile', category: 'emojis', type: 'emoji', emoji: '😄' },
  { id: 'emoji-peace', name: 'Peace / Victory', category: 'emojis', type: 'emoji', emoji: '✌️' },
  { id: 'emoji-thumbs-up', name: 'Thumbs Up', category: 'emojis', type: 'emoji', emoji: '👍' },
  { id: 'emoji-fire', name: 'Fire / Lit', category: 'emojis', type: 'emoji', emoji: '🔥' },
  { id: 'emoji-star', name: 'Star Glow', category: 'emojis', type: 'emoji', emoji: '⭐' },
  { id: 'emoji-sparkles', name: 'Sparkles', category: 'emojis', type: 'emoji', emoji: '✨' },
  { id: 'emoji-crown', name: 'Crown', category: 'emojis', type: 'emoji', emoji: '👑' },
  { id: 'emoji-gem', name: 'Gem Stone', category: 'emojis', type: 'emoji', emoji: '💎' },
  { id: 'emoji-truck', name: 'Truck', category: 'emojis', type: 'emoji', emoji: '🚚' },
  { id: 'emoji-car', name: 'Sports Car', category: 'emojis', type: 'emoji', emoji: '🏎️' },
  { id: 'emoji-robot', name: 'Robot Face', category: 'emojis', type: 'emoji', emoji: '🤖' },
  { id: 'emoji-alien', name: 'Alien / Sci-Fi', category: 'emojis', type: 'emoji', emoji: '👽' },
  { id: 'emoji-ninja', name: 'Ninja Fighter', category: 'emojis', type: 'emoji', emoji: '🥷' },
  { id: 'emoji-superhero', name: 'Superhero', category: 'emojis', type: 'emoji', emoji: '🦸' },
  { id: 'emoji-wizard', name: 'Mage / Wizard', category: 'emojis', type: 'emoji', emoji: '🧙' },
  { id: 'emoji-dragon', name: 'Dragon', category: 'emojis', type: 'emoji', emoji: '🐉' },
  { id: 'emoji-cat', name: 'Cat', category: 'emojis', type: 'emoji', emoji: '🐱' },
  { id: 'emoji-dog', name: 'Dog', category: 'emojis', type: 'emoji', emoji: '🐶' },
  { id: 'emoji-skull', name: 'Skull Danger', category: 'emojis', type: 'emoji', emoji: '💀' },
  { id: 'emoji-100', name: '100 Score', category: 'emojis', type: 'emoji', emoji: '💯' },
];

export const PRESET_FAVORITE_COLORS = [
  '#ef4444', // Red (Default)
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#a855f7', // Purple
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#22c55e', // Green
  '#eab308', // Yellow / Gold
  '#f97316', // Orange
  '#ffffff', // White
];

interface RenderFavoriteIconProps {
  iconId?: string;
  customColor?: string;
  isFavorite?: boolean;
  className?: string;
  inactiveClassName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function RenderFavoriteIcon({
  iconId,
  customColor,
  isFavorite = true,
  className = '',
  inactiveClassName = 'text-muted-foreground hover:text-foreground',
  size = 'md'
}: RenderFavoriteIconProps) {
  // If not favorite, return inactive outlined heart by default
  if (!isFavorite) {
    const sizeClasses = {
      xs: 'w-3 h-3',
      sm: 'w-3.5 h-3.5',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
      xl: 'w-6 h-6'
    };
    return <Heart className={`${sizeClasses[size]} ${inactiveClassName} ${className}`} />;
  }

  // If iconId is a custom image URL (e.g. data: or http/https)
  if (iconId && (iconId.startsWith('http') || iconId.startsWith('data:') || iconId.startsWith('blob:'))) {
    const imgSizes = {
      xs: 'w-3.5 h-3.5',
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
      xl: 'w-7 h-7'
    };
    return (
      <img 
        src={iconId} 
        alt="Favorite icon" 
        className={`${imgSizes[size]} rounded-full object-cover shadow-xs inline-block shrink-0 ${className}`} 
      />
    );
  }

  // If iconId is an emoji directly (or starts with emoji-)
  const matchedOption = FAVORITE_ICON_OPTIONS.find(opt => opt.id === iconId);

  if (matchedOption) {
    if (matchedOption.type === 'emoji' && matchedOption.emoji) {
      const emojiSizes = {
        xs: 'text-xs leading-none',
        sm: 'text-sm leading-none',
        md: 'text-base leading-none',
        lg: 'text-lg leading-none',
        xl: 'text-xl leading-none'
      };
      return (
        <span className={`${emojiSizes[size]} inline-flex items-center justify-center select-none ${className}`}>
          {matchedOption.emoji}
        </span>
      );
    }

    if (matchedOption.type === 'lucide' && matchedOption.icon) {
      const IconComponent = matchedOption.icon;
      const sizeClasses = {
        xs: 'w-3 h-3',
        sm: 'w-3.5 h-3.5',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
        xl: 'w-6 h-6'
      };
      const color = customColor || matchedOption.defaultColor || '#ef4444';
      return (
        <IconComponent 
          className={`${sizeClasses[size]} shrink-0 ${className}`} 
          style={{ color: color, fill: color }} 
        />
      );
    }
  }

  // If iconId is a raw single/multi-char emoji string (e.g. "😴", "😏", "😍", "✌", "❤", "👍", "💕")
  if (iconId && /[\p{Emoji}\u200d]+/u.test(iconId)) {
    const emojiSizes = {
      xs: 'text-xs leading-none',
      sm: 'text-sm leading-none',
      md: 'text-base leading-none',
      lg: 'text-lg leading-none',
      xl: 'text-xl leading-none'
    };
    return (
      <span className={`${emojiSizes[size]} inline-flex items-center justify-center select-none ${className}`}>
        {iconId}
      </span>
    );
  }

  // Fallback to classic heart with custom color
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6'
  };
  const color = customColor || '#ef4444';

  return (
    <Heart 
      className={`${sizeClasses[size]} shrink-0 ${className}`} 
      style={{ color: color, fill: color }} 
    />
  );
}
