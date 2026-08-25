export type GalleryItem = {
  src: string;
  caption?: string;
  date?: string;
};

export type AccentTheme = "pink" | "yellow" | "blue" | "pastel";

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
    password: "haircut",
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
    eyebrow: "A little something, just because you are that special to me. Surprise!",
    title: "Hi {to} ✿",
    subtitle:
      "No special occasion. I just made you a tiny pastel corner of the internet to remind you how special you are to me.",
  },
  question: {
    eyebrow: "One important question",
    text: "WILL YOU MARRY ME?",
    tease: "I dare you to try to click No -.- You better not.",
    yesText: "YES",
    noText: "No 🙈",
  },
  prompts: {
    funnyAfter5s: [
      "Nice try, Babe 😌",
      "That button is only here for decoration.",
      "Mahal programmed the correct answer already.",
      "Nope, it has somewhere else to be!",
      "The Yes button looks much friendlier.",
      "Okay, this is getting suspicious...",
      "Just press Yes, baby 😭",
    ],
    yesCelebrationTitle: "Correct answer! ✨",
    yesCelebrationMsg: "You will always be my favorite person.",
  },
  timing: {
    noDodgeStartMs: 0,
    showPromptsAfterMs: 5000,
    shrinkNoAfterMs: 15000,
  },
  gallery: [
    {
      src: "/photos/memory-birds.png",
      caption: "Staring at birds and being silly with my Mahal. Perfect days.",
      date: "A memory to keep",
    },
    {
      src: "/photos/memory-matcha.png",
      caption: "You make ordinary days feel special",
      date: "2026-07-16",
    },
    {
      src: "/photos/memory-engaged.png",
      caption: "The day we got engaged",
      date: "2026-08-22",
    },
  ] satisfies GalleryItem[],
  letter: {
    status: "IN PROGRESS",
    title: "",
    paragraphs: [],
    signOff: "",
  },
  reasons: [
    { title: "Your smile", body: "It can turn the most ordinary moment into my favorite one." },
    { title: "Your kindness", body: "The warmth you give me is one of the loveliest things about you." },
    { title: "Your laugh", body: "It is the kind of sound I could happily hear every single day." },
    { title: "Your strength", body: "I admire the way you keep going. You are so strong and brave, and I admire you so much." },
    { title: "Your heart", body: "You care so deeply and make me feel so loved. I feel lucky to be loved by you." },
    { title: "Our silliness", body: "Even our smallest, strangest moments make life better." },
    { title: "Your mind", body: "I love the way you see things, how you think, and how you overcome the impossible, my little improviser." },
    { title: "Simply you", body: "You are literally the most special person to me. Words cannot express how much I love you. Thank you for being mine." },
  ] satisfies ReasonItem[],
  timeline: [
    {
      date: "Chapter one",
      title: "How we became us",
      note: "One of my favorite memories is when I first laid eyes on my lost little girl. I instantly fell in love with you. I know it's a cliché to say, but for me, it was literally love at first sight. You are the most beautiful girl I have ever laid eyes on. I fell in love with how you looked instantly, and over the next few hours, I fell deeper and deeper for you, especially on our walk back to your apartment. I am so glad I went to drop you off. I cherish that day so much, Mahal. After dropping you off, I had already decided that I did not want to be on that app anymore and that, if it was not you, then it was no one for me. I love you so much, Mahal.",
      imageSrc: "/photos/chapter-one.png",
    },
    {
      date: "Chapter two",
      title: "The famous BEACH DAY",
      note: "Oh, where to even begin? Maybe it was one of the most impactful and best days of our lives. I still remember, as clearly as day, sitting on the ground floor of your building and watching you come down the escalator. I remember how fast my heart was beating with excitement. I remember how you turned around on the escalator and made that ‘I am watching you’ gesture with your hand. Kilig. I was so happy that I got to see you again after our first date. Once again, I was awestruck and lost in your beauty as I watched you come closer and closer to me. After you made this introvert meet your friend, we made our way down to the beach. The sun was shining brightly and making us sweat, but little did I know at the time that this was just the first of many, many sweaty days. If I were ever to describe a perfect date, I would think of our beach date. You do not know how special that day was, and still is, to me. I loved walking beside you on the beach, sharing stories, and getting to know this girl I was falling in love with more and more. The more I got to know you, the more I fell in love. I loved walking with you, riding the scooter with you, having an iced Americano with you at Tim Hortons, and then just lying next to you on the beach, listening to the waves crash on the sand. In that moment, I thought, ‘I never want this day to end.’ In a way, that day never ended we have been together ever since.",
      imageSrc: "/photos/chapter-two-beach-day.png",
    },
    {
      date: "Chapter three",
      title: "Our Forever and Always",
      note: "And from there, our forever after began. Our own little world. Obsessed with each other. Addicted to each other. Bound to each other. Not a day has gone by since then since our first date, actually when we haven't seen each other, held each other, and hugged each other. Every day with you is the best day of my life, and I could never, even in my dreams, have hoped for or asked for anyone better. Every day with you is a beautiful journey. From furniture shopping at Dalma Mall to spending my lunch breaks with you, the whole journey has been amazing. I love you so much, and I always will. Let's always stay this inseparable from each other. I want every day of my life to have a piece of you, as I can now truly say that I am incomplete without you.",
      imageSrc: "/photos/chapter-three.png",
    },
  ] satisfies TimelineItem[],
  interactive: {
    ringBox: {
      title: "You said yes! ✨",
      message: "Then it is you and me—today, tomorrow, and for all our days after that.",
    },
    scratchCard: {
      eyebrow: "A secret under the sparkles",
      title: "Scratch to reveal",
      instruction: "Use your finger or mouse to scratch the card.",
      hiddenMessage: "My favorite future is every future that has you in it. ♡",
    },
    heartbeat: {
      eyebrow: "One message from my heart",
      title: "Hold my heart",
      instruction: "Press and hold until the heartbeat finishes.",
      revealedMessage: "No matter where life takes us, my heart will keep finding its way back to you.",
    },
    storybook: {
      instruction: "Turn the pages of our story.",
    },
    hiddenNotes: [
      { symbol: "♡", message: "Secret note: I still get excited every time I see you." },
      { symbol: "✿", message: "Secret note: Your hugs are my favorite place." },
      { symbol: "✦", message: "Secret note: You make ordinary moments feel magical." },
      { symbol: "♡", message: "Secret note: I would choose you in every lifetime." },
      { symbol: "✿", message: "You found them all! My favorite discovery will always be you." },
    ],
    runner: {
      trailSymbols: ["♡", "✦", "nope", "too slow", "✿"],
    },
    messageBuilder: {
      eyebrow: "A tiny love game",
      title: "Collect the floating words",
      instruction: "Catch every word to build my message for you.",
      words: ["Across", "every", "lifetime,", "my", "heart", "will", "always", "find", "you."],
      wordOrder: [4, 1, 7, 2, 5, 0, 8, 6, 3],
      completeMessage: "Across every lifetime, my heart will always find you. ♡",
    },
    promises: {
      eyebrow: "A pocket full of promises",
      title: "Open whenever you need one",
      instruction: "Each little envelope is yours to keep.",
      status: "IN PROGRESS",
      items: [
        {
          label: "Open when you miss me",
          message: "",
        },
        {
          label: "Open when you feel sad",
          message: "",
        },
        {
          label: "Open when you need reassurance",
          message: "",
        },
        {
          label: "Open when you cannot sleep",
          message: "",
        },
      ],
    },
  },
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
