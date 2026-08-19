export type GalleryItem = {
  src: string;
  caption?: string;
  date?: string;
};

export type AccentTheme = "pink" | "yellow" | "blue" | "pastel";

export type DodgeImageItem = {
  src: string;
  alt: string;
};

export type GiftCard = {
  title: string;
  message: string;
  imageSrc: string;
  imageAlt: string;
};

export type ReasonItem = {
  title: string;
  body: string;
};

export type TimelineItem = {
  date: string;
  title: string;
  note: string;
  imageSrc: string;
};

export const content = {
  access: {
    password: "kneel",
    eyebrow: "A private little corner",
    title: "For {to}, with love ✿",
    message: "A tiny surprise is waiting on the other side.",
    prompt: "Say the secret word to step inside.",
    placeholder: "Secret word",
    buttonText: "Open my surprise ✦",
    errorText: "That is not our secret word—try again ✿",
    footer: "Made especially for you by {from}",
  },
  names: {
    to: "My Princess",
    from: "Your Man",
  },
  hero: {
    eyebrow: "A little something just-because you are that special to me. Surprise!",
    title: "Hi {to} ✿",
    subtitle:
      "No special occasion. I just made you a tiny pastel corner of the internet to remind you how special you are to me.",
  },
  question: {
    eyebrow: "One important question",
    text: "Will you continue being the best part of my days?",
    tease: "I dare you to try to click no -.- better not",
    yesText: "Always ✨",
    noText: "No 🙈",
  },
  prompts: {
    funnyAfter5s: [
      "Nice try, Babe 😌",
      "That button is only here for decoration.",
      "Mahal programmed the correct answer already.",
      "Nope, it has somewhere else to be!",
      "The Always button looks much friendlier.",
      "Okay, this is getting suspicious...",
      "Just press Always, baby 😭",
    ],
    yesCelebrationTitle: "Correct answer! ✨",
    yesCelebrationMsg: "You will always be my favorite person.",
  },
  dodgeImages: [
    { src: "/photos/pic1.jpg", alt: "A cute pastel reaction" },
    { src: "/photos/pic2.avif", alt: "A playful pastel reaction" },
    { src: "/photos/pic3.avif", alt: "A sweet pastel reaction" },
  ] satisfies DodgeImageItem[],
  timing: {
    noDodgeStartMs: 0,
    showPromptsAfterMs: 5000,
    shrinkNoAfterMs: 15000,
  },
  gallery: [
    {
      src: "/photos/01.svg",
      caption: "One of our favorite little moments",
      date: "A memory to keep",
    },
    {
      src: "/photos/02.svg",
      caption: "You make ordinary days feel special",
      date: "You + me",
    },
    {
      src: "/photos/03.svg",
      caption: "More memories belong right here",
      date: "Still being written",
    },
  ] satisfies GalleryItem[],
  letter: {
    title: "To my beloved Mahal,",
    paragraphs: [
      "There is no holiday or special date behind this. I simply wanted to make something that reminds you how much happiness you bring into my life.",
      "You have a way of making ordinary days brighter, conversations warmer, and every little moment feel worth remembering.",
      "Thank you for being the best part of my days. I hope this tiny place makes you smile whenever you need it.",
    ],
    signOff: "With all my love, {from}",
  },
  reasons: [
    { title: "Your smile", body: "It can turn the most ordinary moment into my favorite one." },
    { title: "Your kindness", body: "The warmth you give me is one of the loveliest things about you." },
    { title: "Your laugh", body: "It is the kind of sound I could happily hear every single day." },
    { title: "Your strength", body: "I admire the way you keep going, you are so strong and so brave I admire you so much." },
    { title: "Your heart", body: "You care so deeply, make me feel so loved, and I feel lucky to be loved by you." },
    { title: "Our silliness", body: "Even our smallest, strangest moments make life better." },
    { title: "Your mind", body: "I love the way you see things how you think how you overcome the impossible, my little improviser" },
    { title: "Simply you", body: "You are literally the most special person for me. Words cannot express how much I love you. Thank you for being mine" },
  ] satisfies ReasonItem[],
  timeline: [
    {
      date: "Chapter one",
      title: "How we became us",
      note: "One of my facourite memories is when I first laid eyes on my lost little girl. I instantly fell in love with you. I know its a cliche to say but for me it was literally love at first sight. You are the most beautiful girl I ever laid eyes on. I fell in love with how you look instantly and over the next few hours I fell deeper and deeper for you, especialy on our walk back to your appartment. I am so glad I went to drop you off. I cherish that day so much mahal. After droppung you off I had already decided I do not want to be on that app anymore and that if its not you then its no one for me. I love you so much Mahal.",
      imageSrc: "/photos/pic1.jpg",
    },
    {
      date: "Chapter two",
      title: "The famous BEACH DAY",
      note: "Oh where to ven begin. Maybe one of the most impactful and best day of our lives. I still remember bright as day me siting on the griund floor of tour building watching you con down the escalator. I remember how fast my heart was beating in excitement. I remember how you turned around on the escalator and made that 'I am watching you gesture' with your hand. Kilig. I was so happy that I get to see ayou again after our first date. And once again I was awe struck and lost in your beauty watching you come closer and closer to me. After you made this introvert meet your friend we made our way down towards the beach. Sun shinning bright making us sweat, but little did I know at that time, that this was just the first of many many sweaty days. If I am ever to describe a perfect date I would think of our beach date. You do not know how special that day was and is for me. I loved walking beside you on the beach sharing stories and getting to know this girl that I fell in love with more and more. The more I got to know you the more I fell in love.",
      imageSrc: "/photos/pic2.avif",
    },
    {
      date: "Today & onward",
      title: "Still my favorite",
      note: "More days, more laughter, and so many memories still to make.",
      imageSrc: "/photos/pic3.avif",
    },
  ] satisfies TimelineItem[],
  defaultSections: {
    showReasons: true,
    showTimeline: true,
    showMemories: true,
  },
  gifts: {
    bouquet: {
      buttonText: "Pastel flowers ✿",
      title: "A little bouquet for {to}",
      message: "Flowers for you, because an ordinary day is reason enough.",
      imageSrc: "/gifts/bouquet.svg",
      imageAlt: "A bouquet of flowers",
    } satisfies GiftCard & { buttonText: string },
    sunflowers: {
      buttonText: "Pocket sunshine ☀",
      title: "A little sunshine for {to}",
      message: "For every day that could use a little extra brightness.",
      imageSrc: "/gifts/sunflowers.svg",
      imageAlt: "A bunch of sunflowers",
    } satisfies GiftCard & { buttonText: string },
    chocolates: {
      buttonText: "Pick a treat 🍫",
      pickerTitle: "Choose a tiny treat",
      pickerMessage: "There is no wrong answer here. Unlike the other question.",
      title: "A sweet treat for you",
      message: "A tiny online treat for my favorite person.",
      options: [
        {
          id: "milk",
          label: "Milk Chocolate",
          imageSrc: "/gifts/choco-milk.svg",
          imageAlt: "Milk chocolate gift box",
        },
        {
          id: "dark",
          label: "Dark Chocolate",
          imageSrc: "/gifts/choco-dark.svg",
          imageAlt: "Dark chocolate gift box",
        },
        {
          id: "white",
          label: "White Chocolate",
          imageSrc: "/gifts/choco-white.svg",
          imageAlt: "White chocolate gift box",
        },
      ],
    },
    voiceNote: {
      buttonText: "A note from Mahal ♫",
      title: "A voice note for {to}",
      message: "Press play whenever you want to hear a little message from Mahal.",
      src: "/veronica-voice-note.m4a",
    },
  },
  sharing: {
    buttonText: "Copy Veronica's link",
    copiedText: "Link copied ✿",
  },
  audio: {
    enabled: false,
    src: "/music.mp3",
  },
  theme: {
    accent: "pastel" as AccentTheme,
  },
};

export function resolveTemplate(input: string) {
  return input
    .replaceAll("{to}", content.names.to)
    .replaceAll("{from}", content.names.from);
}

export function formatDisplayDate(input: string) {
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return input;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}
