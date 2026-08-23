"use client";

import confetti from "canvas-confetti";
import { motion, type PanInfo } from "framer-motion";
import Image from "next/image";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import type { GiftCard } from "@/content";
import { content, formatDisplayDate } from "@/content";
import type { RecipientProfile } from "@/lib/recipients";

type Answer = "yes" | null;
type Position = { x: number; y: number };
type NoTrail = Position & { id: number; symbol: string };

const DODGE_COOLDOWN_MS = 250;

type VeronicaExperienceProps = {
  recipient?: RecipientProfile | null;
  allowQueryOverrides?: boolean;
};

type ScratchCardProps = {
  instruction: string;
  message: string;
};

function ScratchCard({ instruction, message }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<Position | null>(null);
  const scratchMoveCountRef = useRef(0);
  const [isRevealed, setIsRevealed] = useState(false);

  const paintCover = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;

    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));

    const context = canvas.getContext("2d");
    if (!context) return;

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const gradient = context.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, "#e5d5f3");
    gradient.addColorStop(0.52, "#f6bfd2");
    gradient.addColorStop(1, "#cbe8df");
    context.fillStyle = gradient;
    context.fillRect(0, 0, rect.width, rect.height);

    context.fillStyle = "rgba(92, 63, 111, 0.26)";
    for (let x = 16; x < rect.width; x += 28) {
      for (let y = 16; y < rect.height; y += 28) {
        context.beginPath();
        context.arc(x, y, 1.4, 0, Math.PI * 2);
        context.fill();
      }
    }

    context.fillStyle = "#654d73";
    context.font = `800 ${Math.max(14, Math.min(21, rect.width * 0.045))}px sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("SCRATCH HERE ✦", rect.width / 2, rect.height / 2);
  }, [isRevealed]);

  useEffect(() => {
    paintCover();
    window.addEventListener("resize", paintCover);
    return () => window.removeEventListener("resize", paintCover);
  }, [paintCover]);

  const pointFromEvent = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }, []);

  const scratchTo = useCallback((point: Position) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const previous = lastPointRef.current ?? point;
    context.save();
    context.globalCompositeOperation = "destination-out";
    context.lineWidth = 48;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(previous.x, previous.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    context.restore();
    lastPointRef.current = point;

    scratchMoveCountRef.current += 1;
    if (scratchMoveCountRef.current % 6 !== 0) return;

    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let samples = 0;
    let transparentSamples = 0;
    for (let index = 3; index < pixels.length; index += 4 * 24) {
      samples += 1;
      if (pixels[index] < 40) transparentSamples += 1;
    }

    if (samples > 0 && transparentSamples / samples > 0.34) {
      setIsRevealed(true);
      isDrawingRef.current = false;
    }
  }, []);

  const startScratching = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      isDrawingRef.current = true;
      const point = pointFromEvent(event);
      lastPointRef.current = point;
      scratchTo(point);
    },
    [pointFromEvent, scratchTo],
  );

  const continueScratching = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return;
      event.preventDefault();
      scratchTo(pointFromEvent(event));
    },
    [pointFromEvent, scratchTo],
  );

  const stopScratching = useCallback(() => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }, []);

  return (
    <div className={`scratch-card ${isRevealed ? "is-revealed" : ""}`}>
      <div className="scratch-hidden-message" aria-live="polite">
        <span aria-hidden="true">♡</span>
        <p>{message}</p>
      </div>
      {!isRevealed && (
        <canvas
          ref={canvasRef}
          onPointerDown={startScratching}
          onPointerMove={continueScratching}
          onPointerUp={stopScratching}
          onPointerCancel={stopScratching}
          onPointerLeave={stopScratching}
          aria-label={instruction}
        />
      )}
      <button
        type="button"
        className="scratch-reveal-button"
        onClick={() => setIsRevealed(true)}
      >
        {isRevealed ? "Secret revealed ✨" : "Reveal without scratching"}
      </button>
    </div>
  );
}

export default function VeronicaExperience({
  recipient = null,
  allowQueryOverrides = true,
}: VeronicaExperienceProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const hasStarted = isUnlocked;
  const [isMuted, setIsMuted] = useState(false);
  const [answer, setAnswer] = useState<Answer>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [noMoveCount, setNoMoveCount] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false);
  const [showChocolatePicker, setShowChocolatePicker] = useState(false);
  const [showVoiceNoteModal, setShowVoiceNoteModal] = useState(false);
  const [showBouquetModal, setShowBouquetModal] = useState(false);
  const [activeGift, setActiveGift] = useState<GiftCard | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [flippedPhotoIndex, setFlippedPhotoIndex] = useState<number | null>(null);
  const [noPosition, setNoPosition] = useState<Position>({ x: 0, y: 0 });
  const [noTrails, setNoTrails] = useState<NoTrail[]>([]);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [names, setNames] = useState({
    to: recipient?.to ?? content.names.to,
    from: recipient?.from ?? content.names.from,
  });
  const [reasonIndex, setReasonIndex] = useState(0);
  const [timelineIndex, setTimelineIndex] = useState(0);
  const [bloomedFlowers, setBloomedFlowers] = useState<Set<number>>(new Set());
  const [activeBloomMessage, setActiveBloomMessage] = useState("");
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const [isHoldingHeart, setIsHoldingHeart] = useState(false);
  const [heartbeatRevealed, setHeartbeatRevealed] = useState(false);
  const [foundHiddenNotes, setFoundHiddenNotes] = useState<Set<number>>(new Set());
  const [activeHiddenNote, setActiveHiddenNote] = useState<number | null>(null);
  const [collectedWords, setCollectedWords] = useState<Set<number>>(new Set());
  const [openedPromises, setOpenedPromises] = useState<Set<number>>(new Set());

  const questionRef = useRef<HTMLElement | null>(null);
  const revealRef = useRef<HTMLElement | null>(null);
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const yesButtonRef = useRef<HTMLButtonElement | null>(null);
  const noButtonRef = useRef<HTMLButtonElement | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastDodgeRef = useRef(0);
  const noTrailIdRef = useRef(0);
  const heartHoldTimerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  const reducedMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const canShowPrompts = hasStarted && noMoveCount >= 1 && !answer;
  const isShrinkMode =
    hasStarted && elapsedMs >= content.timing.shrinkNoAfterMs && !answer;
  const themeClass = `theme-${recipient?.themeAccent ?? content.theme.accent}`;
  const letterTitle = recipient?.letterTitle ?? content.letter.title;
  const letterParagraphs = recipient?.customNote ?? content.letter.paragraphs;
  const letterSignOff = recipient?.letterSignOff ?? content.letter.signOff;
  const recipientGallery = recipient?.gallery?.length ? recipient.gallery : content.gallery;
  const recipientTimeline = recipient?.timeline?.length ? recipient.timeline : content.timeline;
  const voiceNoteSrc = recipient?.voiceNoteSrc ?? content.gifts.voiceNote.src;
  const voiceNoteTitle = recipient?.voiceNoteTitle ?? content.gifts.voiceNote.title;
  const voiceNoteMessage = recipient?.voiceNoteMessage ?? content.gifts.voiceNote.message;
  const canShowVoiceNote = recipient?.showVoiceNote ?? true;
  const showReasons = recipient?.showReasons ?? content.defaultSections.showReasons;
  const showTimeline = recipient?.showTimeline ?? content.defaultSections.showTimeline;
  const showMemories = recipient?.showMemories ?? content.defaultSections.showMemories;
  const currentTimelineIndex = recipientTimeline.length
    ? Math.min(timelineIndex, recipientTimeline.length - 1)
    : 0;
  const activeTimelineItem = recipientTimeline.length
    ? recipientTimeline[currentTimelineIndex]
    : null;
  const allFlowersBloomed =
    bloomedFlowers.size === content.interactive.bouquet.flowers.length;
  const messageIsComplete =
    collectedWords.size === content.interactive.messageBuilder.words.length;

  const promptText = canShowPrompts
    ? content.prompts.funnyAfter5s[(noMoveCount - 1) % content.prompts.funnyAfter5s.length]
    : "";
  const dodgeImageIndex = content.dodgeImages.length
    ? Math.max(0, noMoveCount - 1) % content.dodgeImages.length
    : -1;
  const dodgeImage = noMoveCount > 0 && dodgeImageIndex >= 0
    ? content.dodgeImages[dodgeImageIndex]
    : null;
  const resolveText = useCallback(
    (input: string) => {
      const toValue = names.to.trim();
      const fromValue = names.from.trim();
      let output = input;

      if (!toValue) {
        output = output
          .replaceAll(" for {to}", " for you")
          .replaceAll(", {to}", "")
          .replaceAll(" {to}", "");
      }
      if (!fromValue) {
        output = output.replaceAll(" {from}", "");
      }

      return output
        .replaceAll("{to}", toValue)
        .replaceAll("{from}", fromValue)
        .replace(/,\s*([?.!])/g, "$1")
        .replace(/\s+([,?.!])/g, "$1")
        .replace(/\s{2,}/g, " ")
        .trim();
    },
    [names.from, names.to],
  );

  const ensureAudioReady = useCallback(async () => {
    if (!audioContextRef.current) {
      const context = new window.AudioContext();
      const gain = context.createGain();
      gain.gain.value = 0.18;
      gain.connect(context.destination);
      audioContextRef.current = context;
      masterGainRef.current = gain;
    }
    if (audioContextRef.current.state === "suspended") {
      try {
        await audioContextRef.current.resume();
      } catch {
        return null;
      }
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback(
    async (
      startFreq: number,
      endFreq: number,
      durationMs: number,
      volume: number,
      type: OscillatorType,
      delayMs = 0,
    ) => {
      const context = await ensureAudioReady();
      const gainRoot = masterGainRef.current;
      if (!context || !gainRoot || isMuted) {
        return;
      }

      const now = context.currentTime + delayMs / 1000;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(startFreq, now);
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(80, endFreq),
        now + durationMs / 1000,
      );
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
      oscillator.connect(gain);
      gain.connect(gainRoot);
      oscillator.start(now);
      oscillator.stop(now + durationMs / 1000 + 0.03);
    },
    [ensureAudioReady, isMuted],
  );

  const playDodgeSound = useCallback(() => {
    const starts = [680, 760, 840];
    const index = Math.floor(Math.random() * starts.length);
    const jitter = Math.random() * 26;
    void playTone(starts[index] + jitter, starts[index] + 80 + jitter, 120, 0.11, "triangle");
  }, [playTone]);

  const playYesStack = useCallback(() => {
    void playTone(780, 1120, 120, 0.12, "triangle");
    void playTone(980, 1360, 160, 0.11, "sine", 120);
    void playTone(260, 540, 420, 0.1, "sawtooth", 170);
  }, [playTone]);

  const unlockExperience = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (passwordInput.trim() === content.access.password) {
      window.sessionStorage.setItem("veronica-site-unlocked", "true");
      setPasswordError(false);
      setPasswordInput("");
      setIsUnlocked(true);
      return;
    }

    setPasswordError(true);
  }, [passwordInput]);

  const placeNoNearDefault = useCallback(() => {
    const arena = arenaRef.current;
    const yesButton = yesButtonRef.current;
    const noButton = noButtonRef.current;
    if (!arena || !yesButton || !noButton) {
      return;
    }

    const arenaRect = arena.getBoundingClientRect();
    const yesRect = yesButton.getBoundingClientRect();
    const noRect = noButton.getBoundingClientRect();

    const x = yesRect.right - arenaRect.left + 14;
    const y = yesRect.top - arenaRect.top + (yesRect.height - noRect.height) / 2;

    const maxX = Math.max(0, arenaRect.width - noRect.width);
    const maxY = Math.max(0, arenaRect.height - noRect.height);

    setNoPosition({
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY)),
    });
  }, []);

  const dodgeNoButton = useCallback(() => {
    if (!hasStarted || answer || elapsedMs < content.timing.noDodgeStartMs) {
      return;
    }

    const now = Date.now();
    if (now - lastDodgeRef.current < DODGE_COOLDOWN_MS) {
      return;
    }
    lastDodgeRef.current = now;

    const arena = arenaRef.current;
    const yesButton = yesButtonRef.current;
    const noButton = noButtonRef.current;
    if (!arena || !yesButton || !noButton) {
      return;
    }

    const arenaRect = arena.getBoundingClientRect();
    const yesRect = yesButton.getBoundingClientRect();
    const noRect = noButton.getBoundingClientRect();

    const padding = 14;
    const minX = padding;
    const minY = padding;
    const maxX = Math.max(minX, arenaRect.width - noRect.width - padding);
    const maxY = Math.max(minY, arenaRect.height - noRect.height - padding);

    const yesBounds = {
      x1: yesRect.left - arenaRect.left - 24,
      y1: yesRect.top - arenaRect.top - 18,
      x2: yesRect.right - arenaRect.left + 24,
      y2: yesRect.bottom - arenaRect.top + 18,
    };

    let attempts = 0;
    let candidate = { x: noPosition.x, y: noPosition.y };

    while (attempts < 18) {
      const x = minX + Math.random() * (maxX - minX);
      const y = minY + Math.random() * (maxY - minY);
      const overlapX = x < yesBounds.x2 && x + noRect.width > yesBounds.x1;
      const overlapY = y < yesBounds.y2 && y + noRect.height > yesBounds.y1;
      if (!(overlapX && overlapY)) {
        candidate = { x, y };
        break;
      }
      attempts += 1;
    }

    noTrailIdRef.current += 1;
    const trailSymbol =
      content.interactive.runner.trailSymbols[
        noMoveCount % content.interactive.runner.trailSymbols.length
      ];
    setNoTrails((current) => [
      ...current.slice(-5),
      {
        id: noTrailIdRef.current,
        x: noPosition.x + noRect.width / 2,
        y: noPosition.y + noRect.height / 2,
        symbol: trailSymbol,
      },
    ]);
    setNoPosition(candidate);
    setNoMoveCount((current) => current + 1);
    playDodgeSound();
  }, [answer, elapsedMs, hasStarted, noMoveCount, noPosition.x, noPosition.y, playDodgeSound]);

  const onYes = useCallback(() => {
    setAnswer("yes");
    setIsEnvelopeOpen(false);
    setShowCelebration(true);
    playYesStack();

    confetti({
      particleCount: reducedMotion ? 60 : 140,
      spread: 85,
      origin: { y: 0.62 },
      scalar: reducedMotion ? 0.8 : 1,
    });

    window.setTimeout(() => {
      revealRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, reducedMotion ? 450 : 1100);

    window.setTimeout(() => {
      setShowCelebration(false);
    }, 3800);
  }, [playYesStack, reducedMotion]);

  const toggleMute = useCallback(() => {
    setIsMuted((current) => {
      const next = !current;
      window.localStorage.setItem("veronica-surprise-muted", String(next));
      return next;
    });
  }, []);

  const openGift = useCallback((gift: GiftCard) => {
    setShowChocolatePicker(false);
    setShowVoiceNoteModal(false);
    setShowBouquetModal(false);
    setActiveGift(gift);
  }, []);

  const bloomFlower = useCallback((index: number) => {
    setBloomedFlowers((current) => {
      const next = new Set(current);
      next.add(index);
      return next;
    });
    setActiveBloomMessage(content.interactive.bouquet.flowers[index].message);
    void playTone(620 + index * 55, 880 + index * 70, 220, 0.08, "sine");
  }, [playTone]);

  const beginHeartHold = useCallback(() => {
    if (heartbeatRevealed || heartHoldTimerRef.current !== null) return;
    setIsHoldingHeart(true);
    void playTone(180, 210, 260, 0.08, "sine");
    heartHoldTimerRef.current = window.setTimeout(() => {
      setHeartbeatRevealed(true);
      setIsHoldingHeart(false);
      heartHoldTimerRef.current = null;
      void playTone(330, 620, 520, 0.1, "sine");
    }, 1800);
  }, [heartbeatRevealed, playTone]);

  const stopHeartHold = useCallback(() => {
    if (heartHoldTimerRef.current !== null) {
      window.clearTimeout(heartHoldTimerRef.current);
      heartHoldTimerRef.current = null;
    }
    if (!heartbeatRevealed) setIsHoldingHeart(false);
  }, [heartbeatRevealed]);

  const onHeartKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (event.key !== " " && event.key !== "Enter") return;
      event.preventDefault();
      beginHeartHold();
    },
    [beginHeartHold],
  );

  const onHeartKeyUp = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (event.key !== " " && event.key !== "Enter") return;
      event.preventDefault();
      stopHeartHold();
    },
    [stopHeartHold],
  );

  const findHiddenNote = useCallback((index: number) => {
    setFoundHiddenNotes((current) => {
      const next = new Set(current);
      next.add(index);
      return next;
    });
    setActiveHiddenNote(index);
  }, []);

  const collectWord = useCallback((index: number) => {
    if (collectedWords.has(index)) return;
    const next = new Set(collectedWords);
    next.add(index);
    setCollectedWords(next);

    if (next.size === content.interactive.messageBuilder.words.length) {
      confetti({
        particleCount: reducedMotion ? 35 : 80,
        spread: 70,
        origin: { y: 0.72 },
        scalar: 0.75,
      });
      void playTone(540, 980, 420, 0.1, "triangle");
    }
  }, [collectedWords, playTone, reducedMotion]);

  const togglePromise = useCallback((index: number) => {
    setOpenedPromises((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const copyPersonalizedLink = useCallback(async () => {
    try {
      const url = recipient
        ? `${window.location.origin}/r/${recipient.token}`
        : (() => {
            const params = new URLSearchParams(window.location.search);
            params.set("to", names.to);
            params.set("from", names.from);
            return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
          })();
      await navigator.clipboard.writeText(url);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("error");
    }
  }, [names.from, names.to, recipient]);

  const nextReason = useCallback(() => {
    setReasonIndex((current) => (current + 1) % content.reasons.length);
  }, []);

  const prevReason = useCallback(() => {
    setReasonIndex((current) =>
      current === 0 ? content.reasons.length - 1 : current - 1,
    );
  }, []);

  const shuffleReason = useCallback(() => {
    setReasonIndex(Math.floor(Math.random() * content.reasons.length));
  }, []);

  const onReasonDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.x < -60) {
        nextReason();
        return;
      }
      if (info.offset.x > 60) {
        prevReason();
      }
    },
    [nextReason, prevReason],
  );

  useEffect(() => {
    if (window.sessionStorage.getItem("veronica-site-unlocked") === "true") {
      setIsUnlocked(true);
    }
  }, []);

  useEffect(() => {
    if (!allowQueryOverrides || recipient) {
      setNames({
        to: recipient?.to ?? content.names.to,
        from: recipient?.from ?? content.names.from,
      });
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const to = params.get("to")?.trim();
    const from = params.get("from")?.trim();
    setNames({
      to: to || content.names.to,
      from: from || content.names.from,
    });
  }, [allowQueryOverrides, recipient]);

  useEffect(() => {
    if (!hasStarted || answer) {
      return;
    }

    if (startTimeRef.current === null) {
      startTimeRef.current = performance.now();
    }

    const interval = window.setInterval(() => {
      setElapsedMs(Math.floor(performance.now() - (startTimeRef.current ?? performance.now())));
    }, 100);

    return () => {
      window.clearInterval(interval);
    };
  }, [answer, hasStarted]);

  useLayoutEffect(() => {
    placeNoNearDefault();
  }, [placeNoNearDefault]);

  useEffect(() => {
    const stored = window.localStorage.getItem("veronica-surprise-muted");
    if (stored === "true") {
      setIsMuted(true);
    }
  }, []);

  useEffect(() => {
    if (activeHiddenNote === null) return;
    const timeout = window.setTimeout(() => setActiveHiddenNote(null), 4800);
    return () => window.clearTimeout(timeout);
  }, [activeHiddenNote]);

  useEffect(() => {
    return () => {
      if (heartHoldTimerRef.current !== null) {
        window.clearTimeout(heartHoldTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isMuted && masterGainRef.current && audioContextRef.current) {
      const now = audioContextRef.current.currentTime;
      masterGainRef.current.gain.cancelScheduledValues(now);
      masterGainRef.current.gain.setValueAtTime(0.0001, now);
      return;
    }
    if (!isMuted && masterGainRef.current && audioContextRef.current) {
      const now = audioContextRef.current.currentTime;
      masterGainRef.current.gain.cancelScheduledValues(now);
      masterGainRef.current.gain.setValueAtTime(0.18, now);
    }
  }, [isMuted]);

  useEffect(() => {
    if (!hasStarted || answer) {
      return;
    }

    const handleResize = () => placeNoNearDefault();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [answer, hasStarted, placeNoNearDefault]);

  if (!isUnlocked) {
    return (
      <main className="access-gate">
        <div className="pastel-sky" aria-hidden="true">
          <span className="pastel-orb orb-one" />
          <span className="pastel-orb orb-two" />
          <span className="pastel-orb orb-three" />
          <span className="floating-doodle access-doodle-one">✿</span>
          <span className="floating-doodle access-doodle-two">✦</span>
          <span className="floating-doodle access-doodle-three">♡</span>
        </div>
        <motion.section
          className={`access-card ${passwordError ? "access-card-error" : ""}`}
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          aria-labelledby="access-title"
        >
          <div className="access-lock" aria-hidden="true">
            <span>✿</span>
          </div>
          <p className="eyebrow">{content.access.eyebrow}</p>
          <h1 id="access-title">{resolveText(content.access.title)}</h1>
          <p className="access-message">{content.access.message}</p>
          <p className="access-prompt">{content.access.prompt}</p>

          <form className="access-form" onSubmit={unlockExperience}>
            <label htmlFor="secret-word">Secret word</label>
            <input
              id="secret-word"
              type="password"
              value={passwordInput}
              onChange={(event) => {
                setPasswordInput(event.target.value);
                if (passwordError) setPasswordError(false);
              }}
              placeholder={content.access.placeholder}
              autoComplete="current-password"
              autoFocus
              aria-invalid={passwordError}
              aria-describedby={passwordError ? "access-error" : undefined}
            />
            <button type="submit">{content.access.buttonText}</button>
          </form>

          <p
            id="access-error"
            className="access-error"
            role="alert"
            aria-live="polite"
          >
            {passwordError ? content.access.errorText : "\u00a0"}
          </p>
          <p className="access-footer">{resolveText(content.access.footer)}</p>
        </motion.section>
      </main>
    );
  }

  return (
    <div className={`page-shell ${themeClass}`}>
      <div className="pastel-sky" aria-hidden="true">
        <span className="pastel-orb orb-one" />
        <span className="pastel-orb orb-two" />
        <span className="pastel-orb orb-three" />
        <span className="floating-doodle doodle-one">✿</span>
        <span className="floating-doodle doodle-two">✦</span>
        <span className="floating-doodle doodle-three">♡</span>
        <span className="floating-doodle doodle-four">✧</span>
      </div>
      <div className="hidden-note-layer" aria-label="Hidden love notes">
        {content.interactive.hiddenNotes.map((note, index) => (
          <button
            key={`${note.symbol}-${index}`}
            type="button"
            className={`hidden-note hidden-note-${index + 1} ${
              foundHiddenNotes.has(index) ? "is-found" : ""
            }`}
            onClick={() => findHiddenNote(index)}
            aria-label={`Find hidden love note ${index + 1}`}
          >
            {note.symbol}
          </button>
        ))}
      </div>
      {activeHiddenNote !== null && (
        <motion.div
          className="hidden-note-toast"
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          role="status"
        >
          <p>{content.interactive.hiddenNotes[activeHiddenNote].message}</p>
          <span>
            {foundHiddenNotes.size}/{content.interactive.hiddenNotes.length} secret notes found
          </span>
        </motion.div>
      )}
      <button
        type="button"
        className="mute-toggle"
        onClick={toggleMute}
        aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
      >
        {isMuted ? "🔇 Sound Off" : "🔊 Sound On"}
      </button>
      {showCelebration && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="celebration-overlay"
        >
          <div className="ring-box-scene" aria-hidden="true">
            <span className="ring-box-lid" />
            <span className="ring-box-ring">
              <span className="ring-gem" />
            </span>
            <span className="ring-box-base" />
          </div>
          <h2>{content.interactive.ringBox.title}</h2>
          <p>{content.interactive.ringBox.message}</p>
          {!reducedMotion && (
            <div className="heart-cloud" aria-hidden="true">
              {Array.from({ length: 12 }).map((_, index) => (
                <span
                  key={index}
                  style={{
                    left: `${6 + index * 7.2}%`,
                    animationDelay: `${index * 0.15}s`,
                  }}
                >
                  {index % 3 === 0 ? "✿" : index % 3 === 1 ? "✦" : "♡"}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}

      <main className="page-main">
        <section className="hero-section">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="hero-card"
          >
            <p className="eyebrow">{content.hero.eyebrow}</p>
            <h1>{resolveText(content.hero.title)}</h1>
            <p>{resolveText(content.hero.subtitle)}</p>
            <div className="hero-badges" aria-hidden="true">
              <span>made for Veronica</span>
              <span>from Mahal</span>
            </div>
          </motion.div>
        </section>

        <section className="question-section" ref={questionRef}>
          <div className="question-card">
            <p className="eyebrow">{content.question.eyebrow}</p>
            <h2>{resolveText(content.question.text)}</h2>
            <p className="question-tease">{content.question.tease}</p>
            <p className="prompt-line" aria-live="polite">
              {promptText}
            </p>
            {dodgeImage && (
              <div className="dodge-image-frame" aria-live="polite">
                <Image
                  src={dodgeImage.src}
                  alt={dodgeImage.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 540px"
                />
              </div>
            )}

            <div className="button-arena" ref={arenaRef}>
              {noTrails.map((trail) => (
                <motion.span
                  key={trail.id}
                  className="no-trail"
                  style={{ left: trail.x, top: trail.y }}
                  initial={{ opacity: 0.8, scale: 0.7, y: 0 }}
                  animate={{ opacity: 0, scale: 1.2, y: -28 }}
                  transition={{ duration: 1.4 }}
                  aria-hidden="true"
                >
                  {trail.symbol}
                </motion.span>
              ))}
              <button
                type="button"
                ref={yesButtonRef}
                className={`yes-button ${isShrinkMode ? "yes-grow" : ""}`}
                onClick={onYes}
                disabled={!hasStarted || answer === "yes"}
              >
                {content.question.yesText}
              </button>

              <motion.button
                type="button"
                ref={noButtonRef}
                className={`no-button ${isShrinkMode ? "no-shrink" : ""}`}
                style={{ left: noPosition.x, top: noPosition.y }}
                animate={{ left: noPosition.x, top: noPosition.y }}
                transition={{ type: "spring", stiffness: 220, damping: 19, mass: 0.4 }}
                onMouseEnter={dodgeNoButton}
                onTouchStart={dodgeNoButton}
                onFocus={dodgeNoButton}
                onClick={dodgeNoButton}
                disabled={!hasStarted || answer === "yes"}
                aria-label={content.question.noText}
              >
                {content.question.noText}
              </motion.button>
            </div>
          </div>
        </section>

        {answer === "yes" && (
          <section className="reveal-section" ref={revealRef}>
            <article className="letter-card">
              {!isEnvelopeOpen ? (
                <motion.button
                  type="button"
                  className="envelope-card"
                  onClick={() => setIsEnvelopeOpen(true)}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span className="envelope-top" />
                  <span className="envelope-paper" />
                  <span className="envelope-heart">✿</span>
                  <span className="envelope-text">Tap to open your little note</span>
                </motion.button>
              ) : (
                <>
                  <p className="eyebrow">A note from Mahal</p>
                  <h3>{letterTitle}</h3>
                  {letterParagraphs.map((paragraph) => (
                    <p key={paragraph}>{resolveText(paragraph)}</p>
                  ))}
                  <p className="signoff">{resolveText(letterSignOff)}</p>
                </>
              )}

              <div className="gift-shelf">
                <div className="gift-shelf-heading">
                  <p className="eyebrow">Little gifts for Veronica</p>
                  <h3>Pick something to open</h3>
                </div>
                <div className="gift-actions">
                  <button
                    type="button"
                    className="gift-choice flowers"
                    onClick={() => {
                      setActiveGift(null);
                      setShowChocolatePicker(false);
                      setShowVoiceNoteModal(false);
                      setShowBouquetModal(true);
                    }}
                  >
                    <span className="gift-choice-thumb">
                      <Image src={content.gifts.bouquet.imageSrc} alt="" fill sizes="64px" />
                    </span>
                    <span>
                      <strong>{content.gifts.bouquet.buttonText}</strong>
                      <small>Open your bouquet</small>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="gift-choice sunshine"
                    onClick={() =>
                      openGift({
                        title: resolveText(content.gifts.sunflowers.title),
                        message: content.gifts.sunflowers.message,
                        imageSrc: content.gifts.sunflowers.imageSrc,
                        imageAlt: content.gifts.sunflowers.imageAlt,
                      })
                    }
                  >
                    <span className="gift-choice-thumb">
                      <Image src={content.gifts.sunflowers.imageSrc} alt="" fill sizes="64px" />
                    </span>
                    <span>
                      <strong>{content.gifts.sunflowers.buttonText}</strong>
                      <small>Open some sunshine</small>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="gift-choice chocolate"
                    onClick={() => {
                      setShowBouquetModal(false);
                      setShowVoiceNoteModal(false);
                      setShowChocolatePicker(true);
                    }}
                  >
                    <span className="gift-choice-thumb">
                      <Image
                        src={content.gifts.chocolates.options[0].imageSrc}
                        alt=""
                        fill
                        sizes="64px"
                      />
                    </span>
                    <span>
                      <strong>{content.gifts.chocolates.buttonText}</strong>
                      <small>Choose your favorite</small>
                    </span>
                  </button>
                  {canShowVoiceNote && (
                    <button
                      type="button"
                      className="gift-choice voice"
                      onClick={() => {
                        setActiveGift(null);
                        setShowChocolatePicker(false);
                        setShowBouquetModal(false);
                        setIsVoicePlaying(false);
                        setShowVoiceNoteModal(true);
                      }}
                    >
                      <span className="gift-choice-icon" aria-hidden="true">♫</span>
                      <span>
                        <strong>{content.gifts.voiceNote.buttonText}</strong>
                        <small>Listen to Mahal</small>
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </article>

            <article className="interactive-card scratch-section">
              <p className="eyebrow">{content.interactive.scratchCard.eyebrow}</p>
              <h3>{content.interactive.scratchCard.title}</h3>
              <p className="interactive-instruction">
                {content.interactive.scratchCard.instruction}
              </p>
              <ScratchCard
                instruction={content.interactive.scratchCard.instruction}
                message={content.interactive.scratchCard.hiddenMessage}
              />
            </article>

            <article className="interactive-card heartbeat-card">
              <p className="eyebrow">{content.interactive.heartbeat.eyebrow}</p>
              <h3>{content.interactive.heartbeat.title}</h3>
              <p className="interactive-instruction">
                {content.interactive.heartbeat.instruction}
              </p>
              <button
                type="button"
                className={`heart-hold-button ${isHoldingHeart ? "is-holding" : ""} ${
                  heartbeatRevealed ? "is-complete" : ""
                }`}
                onPointerDown={beginHeartHold}
                onPointerUp={stopHeartHold}
                onPointerLeave={stopHeartHold}
                onPointerCancel={stopHeartHold}
                onKeyDown={onHeartKeyDown}
                onKeyUp={onHeartKeyUp}
                aria-pressed={heartbeatRevealed}
              >
                <span className="heart-hold-icon" aria-hidden="true">♥</span>
                <span>{heartbeatRevealed ? "Heart unlocked" : "Press and hold"}</span>
              </button>
              <motion.p
                className="heartbeat-message"
                initial={false}
                animate={{ opacity: heartbeatRevealed ? 1 : 0.35 }}
                aria-live="polite"
              >
                {heartbeatRevealed
                  ? content.interactive.heartbeat.revealedMessage
                  : "The message is waiting inside the heart..."}
              </motion.p>
            </article>

            <article className="interactive-card message-builder-card">
              <p className="eyebrow">{content.interactive.messageBuilder.eyebrow}</p>
              <h3>{content.interactive.messageBuilder.title}</h3>
              <p className="interactive-instruction">
                {content.interactive.messageBuilder.instruction}
              </p>
              <div className="word-cloud">
                {content.interactive.messageBuilder.words.map((word, index) => (
                  <button
                    key={`${word}-${index}`}
                    type="button"
                    className={collectedWords.has(index) ? "is-collected" : ""}
                    style={{ "--word-index": index } as CSSProperties}
                    onClick={() => collectWord(index)}
                    disabled={collectedWords.has(index)}
                  >
                    {collectedWords.has(index) ? "♡" : word}
                  </button>
                ))}
              </div>
              <div className={`assembled-message ${messageIsComplete ? "is-complete" : ""}`}>
                {messageIsComplete ? (
                  <p>{content.interactive.messageBuilder.completeMessage}</p>
                ) : (
                  <p aria-live="polite">
                    {content.interactive.messageBuilder.words.map((word, index) => (
                      <span key={`${word}-slot`}>
                        {collectedWords.has(index) ? word : "•••"}
                      </span>
                    ))}
                  </p>
                )}
              </div>
            </article>

            <article className="interactive-card promises-card">
              <p className="eyebrow">{content.interactive.promises.eyebrow}</p>
              <h3>{content.interactive.promises.title}</h3>
              <p className="interactive-instruction">
                {content.interactive.promises.instruction}
              </p>
              <div className="promise-grid">
                {content.interactive.promises.items.map((promise, index) => (
                  <button
                    key={promise.label}
                    type="button"
                    className={`promise-envelope ${openedPromises.has(index) ? "is-open" : ""}`}
                    onClick={() => togglePromise(index)}
                    aria-expanded={openedPromises.has(index)}
                  >
                    <span className="promise-flap" aria-hidden="true" />
                    <strong>{promise.label}</strong>
                    <span className="promise-message">{promise.message}</span>
                  </button>
                ))}
              </div>
            </article>

            {showReasons && (
              <article className="reasons-card">
                <p className="eyebrow">The Veronica collection</p>
                <h3 className="section-title">Little things I adore about you</h3>
                <motion.div
                  key={reasonIndex}
                  className="reason-slide"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={onReasonDragEnd}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <h3>{content.reasons[reasonIndex].title}</h3>
                  <p>{content.reasons[reasonIndex].body}</p>
                </motion.div>
                <div className="reason-actions">
                  <button type="button" onClick={prevReason}>Prev</button>
                  <button type="button" onClick={shuffleReason}>Shuffle</button>
                  <button type="button" onClick={nextReason}>Next</button>
                </div>
              </article>
            )}

            {showTimeline && (
              <article className="timeline-card">
                <p className="eyebrow">Our little timeline</p>
                <h3>How we became us</h3>
                <p className="interactive-instruction">
                  {content.interactive.storybook.instruction}
                </p>
                <div className="timeline-book">
                  {activeTimelineItem && (
                    <motion.div
                      key={`${activeTimelineItem.date}-${activeTimelineItem.title}`}
                      className="timeline-page"
                      initial={{ opacity: 0, rotateY: 9, x: 22 }}
                      animate={{ opacity: 1, rotateY: 0, x: 0 }}
                      transition={{ duration: 0.38 }}
                    >
                      <div className="timeline-page-image">
                        <Image
                          src={activeTimelineItem.imageSrc}
                          alt={activeTimelineItem.title}
                          fill
                          sizes="(max-width: 720px) 100vw, 360px"
                        />
                      </div>
                      <div className="timeline-page-copy">
                        <p className="timeline-date">
                          {formatDisplayDate(activeTimelineItem.date)}
                        </p>
                        <p className="timeline-title">{activeTimelineItem.title}</p>
                        <p className="timeline-note">{activeTimelineItem.note}</p>
                      </div>
                    </motion.div>
                  )}
                  <div className="timeline-controls">
                    <button
                      type="button"
                      onClick={() => setTimelineIndex(Math.max(0, currentTimelineIndex - 1))}
                      disabled={currentTimelineIndex === 0}
                    >
                      ← Previous page
                    </button>
                    <span>
                      {Math.min(currentTimelineIndex + 1, recipientTimeline.length)} / {recipientTimeline.length}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setTimelineIndex(
                          Math.min(recipientTimeline.length - 1, currentTimelineIndex + 1),
                        )
                      }
                      disabled={currentTimelineIndex >= recipientTimeline.length - 1}
                    >
                      Next page →
                    </button>
                  </div>
                </div>
              </article>
            )}

            {showMemories && (
              <article className="gallery-card">
                <p className="eyebrow">Our memory shelf</p>
                <h3>Little moments, forever favorites</h3>
                <div className="gallery-grid">
                  {recipientGallery.map((item, index) => (
                    <button
                      key={item.src}
                      type="button"
                      className={`photo-tile ${
                        flippedPhotoIndex === index ? "is-flipped" : ""
                      }`}
                      onClick={() => {
                        if (flippedPhotoIndex === index) {
                          setLightboxIndex(index);
                          return;
                        }
                        setFlippedPhotoIndex(index);
                      }}
                      aria-label={
                        flippedPhotoIndex === index
                          ? `Open ${item.caption ?? `photo ${index + 1}`}`
                          : `Flip ${item.caption ?? `photo ${index + 1}`}`
                      }
                    >
                      <div className="photo-card-inner">
                        <div className="photo-card-face photo-card-front">
                          <Image
                            src={item.src}
                            alt={item.caption ?? `Photo ${index + 1}`}
                            fill
                            sizes="(max-width: 768px) 100vw, 30vw"
                          />
                          <div className="photo-caption">
                            {item.caption && <p>{item.caption}</p>}
                            {item.date && <span>{formatDisplayDate(item.date)}</span>}
                            <small>Tap to flip</small>
                          </div>
                        </div>
                        <div className="photo-card-face photo-card-back">
                          <span aria-hidden="true">♡</span>
                          <p>{item.caption ?? "One of our favorite memories"}</p>
                          <small>{item.date ? formatDisplayDate(item.date) : "You + me"}</small>
                          <strong>Tap again to open the photo</strong>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </article>
            )}
          </section>
        )}

        <section className="footer-section">
          <p>Made with all my love for {names.to} — {names.from}</p>
          <button type="button" className="share-button" onClick={copyPersonalizedLink}>
            {copyState === "copied" ? content.sharing.copiedText : content.sharing.buttonText}
          </button>
          {copyState === "error" && (
            <p className="share-error">Could not copy link on this browser.</p>
          )}
        </section>
      </main>

      {lightboxIndex !== null && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            className="close-lightbox"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close photo"
          >
            Close
          </button>
          <div className="lightbox-content" onClick={(event) => event.stopPropagation()}>
            <Image
              src={recipientGallery[lightboxIndex].src}
              alt={recipientGallery[lightboxIndex].caption ?? `Photo ${lightboxIndex + 1}`}
              width={1200}
              height={900}
              className="lightbox-image"
            />
            <div className="lightbox-meta">
              {recipientGallery[lightboxIndex].caption && (
                <p>{recipientGallery[lightboxIndex].caption}</p>
              )}
              {recipientGallery[lightboxIndex].date && (
                <span>{formatDisplayDate(recipientGallery[lightboxIndex].date)}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {showBouquetModal && (
        <div
          className="gift-modal"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowBouquetModal(false)}
        >
          <button
            type="button"
            className="close-lightbox"
            onClick={() => setShowBouquetModal(false)}
            aria-label="Close interactive bouquet"
          >
            Close
          </button>
          <div className="bouquet-card" onClick={(event) => event.stopPropagation()}>
            <p className="eyebrow">A bouquet for you</p>
            <h3>{content.interactive.bouquet.title}</h3>
            <p>{content.interactive.bouquet.instruction}</p>
            <div className={`bouquet-stage ${allFlowersBloomed ? "is-complete" : ""}`}>
              {content.interactive.bouquet.flowers.map((flower, index) => (
                <button
                  key={flower.label}
                  type="button"
                  className={`bloom-button bloom-${index + 1} ${
                    bloomedFlowers.has(index) ? "is-bloomed" : ""
                  }`}
                  style={{ "--flower-index": index } as CSSProperties}
                  onClick={() => bloomFlower(index)}
                  aria-label={`${flower.label}: ${flower.message}`}
                  aria-pressed={bloomedFlowers.has(index)}
                >
                  <span className="flower-stem" />
                  <span className="flower-leaf flower-leaf-left" />
                  <span className="flower-leaf flower-leaf-right" />
                  <span className="flower-head" aria-hidden="true">
                    {Array.from({ length: 6 }).map((_, petalIndex) => (
                      <span key={petalIndex} className={`flower-petal petal-${petalIndex + 1}`} />
                    ))}
                    <span className="flower-center" />
                  </span>
                </button>
              ))}
              {allFlowersBloomed && (
                <motion.div
                  className="bouquet-reward"
                  initial={{ opacity: 0, scale: 0.75 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Image
                    src={content.gifts.bouquet.imageSrc}
                    alt={content.gifts.bouquet.imageAlt}
                    fill
                    sizes="280px"
                  />
                </motion.div>
              )}
            </div>
            <p className="bloom-message" aria-live="polite">
              {allFlowersBloomed
                ? content.interactive.bouquet.completeMessage
                : activeBloomMessage || "Each flower is hiding a little reason."}
            </p>
          </div>
        </div>
      )}

      {showChocolatePicker && (
        <div
          className="gift-modal"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowChocolatePicker(false)}
        >
          <button
            type="button"
            className="close-lightbox"
            onClick={() => setShowChocolatePicker(false)}
            aria-label="Close chocolate picker"
          >
            Close
          </button>
          <div className="picker-card" onClick={(event) => event.stopPropagation()}>
            <h3>{content.gifts.chocolates.pickerTitle}</h3>
            <p>{content.gifts.chocolates.pickerMessage}</p>
            <div className="picker-options">
              {content.gifts.chocolates.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="picker-option"
                  onClick={() =>
                    openGift({
                      title: `${content.gifts.chocolates.title}: ${option.label}`,
                      message: content.gifts.chocolates.message,
                      imageSrc: option.imageSrc,
                      imageAlt: option.imageAlt,
                    })
                  }
                >
                  <span className="picker-option-thumb" aria-hidden="true">
                    <Image
                      src={option.imageSrc}
                      alt=""
                      fill
                      sizes="80px"
                    />
                  </span>
                  <span className="picker-option-label">{option.label}</span>
                  <span className="picker-option-cta" aria-hidden="true">
                    Select
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeGift && (
        <div
          className="gift-modal"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveGift(null)}
        >
          <button
            type="button"
            className="close-lightbox"
            onClick={() => setActiveGift(null)}
            aria-label="Close gift"
          >
            Close
          </button>
          <div className="gift-card" onClick={(event) => event.stopPropagation()}>
            <h3>{activeGift.title}</h3>
            <p>{activeGift.message}</p>
            <div className="gift-image-wrap">
              <Image
                src={activeGift.imageSrc}
                alt={activeGift.imageAlt}
                fill
                sizes="(max-width: 768px) 100vw, 420px"
              />
            </div>
          </div>
        </div>
      )}

      {canShowVoiceNote && showVoiceNoteModal && (
        <div
          className="gift-modal"
          role="dialog"
          aria-modal="true"
          onClick={() => {
            setShowVoiceNoteModal(false);
            setIsVoicePlaying(false);
          }}
        >
          <button
            type="button"
            className="close-lightbox"
            onClick={() => {
              setShowVoiceNoteModal(false);
              setIsVoicePlaying(false);
            }}
            aria-label="Close voice note"
          >
            Close
          </button>
          <div className="gift-card" onClick={(event) => event.stopPropagation()}>
            <h3>{resolveText(voiceNoteTitle)}</h3>
            <p>{resolveText(voiceNoteMessage)}</p>
            <div className={`cassette-player ${isVoicePlaying ? "is-playing" : ""}`}>
              <div className="cassette-label">
                <span>For {names.to}</span>
                <strong>A little note from {names.from}</strong>
              </div>
              <div className="cassette-window" aria-hidden="true">
                <span className="cassette-reel reel-left" />
                <span className="cassette-tape" />
                <span className="cassette-reel reel-right" />
              </div>
              <div className="cassette-lines" aria-hidden="true">
                {Array.from({ length: 12 }).map((_, index) => (
                  <span key={index} style={{ "--line-index": index } as CSSProperties} />
                ))}
              </div>
              <audio
                controls
                preload="none"
                className="voice-note-player"
                onPlay={() => setIsVoicePlaying(true)}
                onPause={() => setIsVoicePlaying(false)}
                onEnded={() => setIsVoicePlaying(false)}
              >
                <source src={voiceNoteSrc} />
              </audio>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
