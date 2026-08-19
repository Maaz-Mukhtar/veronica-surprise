import type { AccentTheme, GalleryItem, TimelineItem } from "@/content";

/**
 * Kept as a small compatibility type for the reusable experience component.
 * This project intentionally ships as one private page for Veronica.
 */
export type RecipientProfile = {
  token: string;
  to: string;
  from: string;
  themeAccent?: AccentTheme;
  letterTitle?: string;
  customNote?: string[];
  letterSignOff?: string;
  voiceNoteSrc?: string;
  voiceNoteTitle?: string;
  voiceNoteMessage?: string;
  showVoiceNote?: boolean;
  gallery?: GalleryItem[];
  timeline?: TimelineItem[];
  showReasons?: boolean;
  showTimeline?: boolean;
  showMemories?: boolean;
};
