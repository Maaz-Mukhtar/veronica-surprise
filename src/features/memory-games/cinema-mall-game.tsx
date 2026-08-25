"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGameProgress } from "./game-progress";
import styles from "./cinema-game.module.css";

type Rect = { x: number; y: number; w: number; h: number };
type FloorNo = 1 | 2 | 3 | 4;
type Shop = Rect & { id: string; name: string; color: string; accent: string; category: string };
type Npc = { x: number; y: number; color: string; name?: string; special?: "mahal" };
type Escalator = Rect & { direction: "UP" | "DOWN"; target: FloorNo; spawn: { x: number; y: number } };
type FloorMap = {
  name: string;
  code: string;
  zone: string;
  accent: string;
  shops: Shop[];
  obstacles: Rect[];
  npcs: Npc[];
  escalators: Escalator[];
};

const WORLD = { width: 3400, height: 2200 };
const VIEW = { width: 960, height: 600 };
const PLAYER_RADIUS = 18;
const MAHAL = { x: 3010, y: 410 };

const FLOORS: Record<FloorNo, FloorMap> = {
  1: {
    name: "GROUND FLOOR",
    code: "G",
    zone: "GRAND ATRIUM",
    accent: "#d8ff4f",
    shops: [
      { id: "oasis", name: "OASIS MARKET", category: "HYPERMARKET", x: 55, y: 55, w: 430, h: 265, color: "#22332d", accent: "#75e6a4" },
      { id: "dates", name: "DATE HOUSE", category: "SWEETS & GIFTS", x: 585, y: 50, w: 455, h: 250, color: "#3a2b25", accent: "#f1bd72" },
      { id: "pearl", name: "PEARL EXCHANGE", category: "JEWELLERY", x: 1145, y: 50, w: 440, h: 250, color: "#26323a", accent: "#8ed9ff" },
      { id: "linen", name: "LINEN & LOOM", category: "HOME", x: 1685, y: 55, w: 455, h: 265, color: "#343028", accent: "#f3cf8c" },
      { id: "pharmacy", name: "PALM PHARMACY", category: "HEALTH", x: 55, y: 990, w: 430, h: 270, color: "#1f3533", accent: "#66e2cf" },
      { id: "coffee", name: "NOMAD COFFEE", category: "CAFÉ", x: 585, y: 1035, w: 445, h: 225, color: "#392b2a", accent: "#ff9d7b" },
      { id: "optics", name: "CLEAR VIEW", category: "OPTICAL", x: 1130, y: 1005, w: 445, h: 255, color: "#282d42", accent: "#9ba8ff" },
      { id: "travel", name: "CITY TRAVEL", category: "SERVICES", x: 1675, y: 985, w: 465, h: 275, color: "#242e3a", accent: "#69a9ff" },
      { id: "copper", name: "COPPER LANTERN", category: "LIGHTING", x: 2280, y: 55, w: 430, h: 300, color: "#3d2f27", accent: "#e7a867" },
      { id: "bloom", name: "DESERT BLOOM", category: "FLORIST", x: 2870, y: 55, w: 475, h: 310, color: "#28372f", accent: "#91e7a8" },
      { id: "souq", name: "SOUQ MARKET", category: "GIFTS", x: 2350, y: 520, w: 430, h: 300, color: "#392d27", accent: "#f0c27d" },
      { id: "harbor", name: "HARBOR HOUSE", category: "HOME", x: 2910, y: 500, w: 435, h: 330, color: "#27343d", accent: "#84cffa" },
      { id: "station", name: "PEARL STATION", category: "JEWELLERY", x: 2320, y: 1040, w: 480, h: 320, color: "#282f38", accent: "#a9def5" },
      { id: "cedar", name: "CEDAR CAFE", category: "CAFÉ", x: 2940, y: 1010, w: 405, h: 340, color: "#382b27", accent: "#f2a57c" },
      { id: "services", name: "CITY DESK", category: "SERVICES", x: 75, y: 1500, w: 460, h: 300, color: "#25313d", accent: "#6fb5ff" },
      { id: "northgate", name: "NORTH GATE", category: "TRAVEL", x: 690, y: 1570, w: 430, h: 320, color: "#2c3139", accent: "#a9b5ce" },
      { id: "palmyard", name: "PALM COURTYARD", category: "DINING", x: 1280, y: 1500, w: 470, h: 300, color: "#29372d", accent: "#8bd59a" },
      { id: "dunehome", name: "DUNE FURNISHINGS", category: "HOME", x: 1900, y: 1530, w: 470, h: 330, color: "#373126", accent: "#e9c47e" },
      { id: "terrace", name: "TERRACE KITCHEN", category: "DINING", x: 2520, y: 1640, w: 430, h: 340, color: "#35292a", accent: "#ff9a80" },
      { id: "eastbank", name: "EAST BANK", category: "SERVICES", x: 3010, y: 1650, w: 335, h: 380, color: "#24313a", accent: "#73d3f2" },
    ],
    obstacles: [
      { x: 460, y: 520, w: 190, h: 88 },
      { x: 805, y: 445, w: 300, h: 125 },
      { x: 1010, y: 735, w: 250, h: 92 },
      { x: 1430, y: 520, w: 180, h: 90 },
      { x: 1680, y: 735, w: 200, h: 84 },
      { x: 2160, y: 410, w: 110, h: 360 },
      { x: 2810, y: 860, w: 80, h: 390 },
      { x: 1190, y: 1325, w: 380, h: 90 },
      { x: 1770, y: 1885, w: 620, h: 92 },
    ],
    npcs: [
      { x: 355, y: 760, color: "#ff9d7b" },
      { x: 780, y: 690, color: "#75e6a4" },
      { x: 1320, y: 390, color: "#9ba8ff" },
      { x: 1940, y: 900, color: "#f1bd72" },
    ],
    escalators: [
      { x: 560, y: 1320, w: 190, h: 245, direction: "UP", target: 2, spawn: { x: 3070, y: 420 } },
      { x: 1870, y: 410, w: 190, h: 245, direction: "UP", target: 2, spawn: { x: 300, y: 1380 } },
      { x: 2780, y: 1365, w: 190, h: 245, direction: "UP", target: 2, spawn: { x: 1660, y: 390 } },
    ],
  },
  2: {
    name: "LEVEL ONE",
    code: "L1",
    zone: "FASHION GALLERIA",
    accent: "#8f6dff",
    shops: [
      { id: "atelier", name: "ATELIER 24", category: "FASHION", x: 55, y: 55, w: 430, h: 265, color: "#322744", accent: "#bd96ff" },
      { id: "abayas", name: "MOON THREAD", category: "MODEST WEAR", x: 585, y: 50, w: 455, h: 250, color: "#302638", accent: "#e3a9e8" },
      { id: "sneaker", name: "SOLE DISTRICT", category: "SNEAKERS", x: 1145, y: 50, w: 440, h: 250, color: "#243243", accent: "#68aaff" },
      { id: "tailor", name: "THE TAILOR ROOM", category: "MENSWEAR", x: 1685, y: 55, w: 455, h: 265, color: "#2e3138", accent: "#d0d4dc" },
      { id: "beauty", name: "GLOW MAJLIS", category: "BEAUTY", x: 55, y: 990, w: 430, h: 270, color: "#422735", accent: "#ff91c8" },
      { id: "leather", name: "SAND & LEATHER", category: "ACCESSORIES", x: 585, y: 1035, w: 445, h: 225, color: "#3d2e26", accent: "#d99c6b" },
      { id: "watches", name: "SECOND HAND", category: "WATCHES", x: 1130, y: 1005, w: 445, h: 255, color: "#273238", accent: "#7bd8d0" },
      { id: "kids", name: "LITTLE DUNES", category: "KIDS", x: 1675, y: 985, w: 465, h: 275, color: "#313429", accent: "#d8ff4f" },
      { id: "ruby", name: "RUBY ATELIER", category: "FASHION", x: 2280, y: 55, w: 430, h: 300, color: "#412936", accent: "#ff789d" },
      { id: "silk", name: "SILK ROUTE", category: "FASHION", x: 2870, y: 55, w: 475, h: 310, color: "#332943", accent: "#c99cff" },
      { id: "ember", name: "EMBER SHOES", category: "FOOTWEAR", x: 2350, y: 520, w: 430, h: 300, color: "#3c2c29", accent: "#fa9377" },
      { id: "prism", name: "PRISM BEAUTY", category: "BEAUTY", x: 2910, y: 500, w: 435, h: 330, color: "#392940", accent: "#f09dff" },
      { id: "blacklabel", name: "BLACK LABEL", category: "MENSWEAR", x: 2320, y: 1040, w: 480, h: 320, color: "#292c32", accent: "#ced4dd" },
      { id: "nomadbags", name: "NOMAD BAGS", category: "ACCESSORIES", x: 2940, y: 1010, w: 405, h: 340, color: "#3b2d28", accent: "#d69e77" },
      { id: "loomstudio", name: "LOOM STUDIO", category: "FASHION", x: 75, y: 1500, w: 460, h: 300, color: "#312b3c", accent: "#bd9cef" },
      { id: "sandkids", name: "SANDSTONE KIDS", category: "KIDS", x: 690, y: 1570, w: 430, h: 320, color: "#32372b", accent: "#d8ff4f" },
      { id: "velvet", name: "VELVET ROOM", category: "FASHION", x: 1280, y: 1500, w: 470, h: 300, color: "#3b2838", accent: "#ed8fd1" },
      { id: "crescentwatch", name: "CRESCENT WATCHES", category: "WATCHES", x: 1900, y: 1530, w: 470, h: 330, color: "#263338", accent: "#76d7d0" },
      { id: "mirrorhall", name: "MIRROR HALL", category: "BEAUTY", x: 2520, y: 1640, w: 430, h: 340, color: "#372a3d", accent: "#d9a9ff" },
      { id: "easttailor", name: "EAST TAILOR", category: "TAILORING", x: 3010, y: 1650, w: 335, h: 380, color: "#2d3037", accent: "#c7cfda" },
    ],
    obstacles: [
      { x: 620, y: 470, w: 190, h: 92 },
      { x: 945, y: 610, w: 320, h: 135 },
      { x: 1370, y: 430, w: 185, h: 90 },
      { x: 1450, y: 765, w: 250, h: 90 },
      { x: 460, y: 790, w: 180, h: 84 },
      { x: 2155, y: 400, w: 120, h: 380 },
      { x: 2810, y: 875, w: 80, h: 360 },
      { x: 1160, y: 1340, w: 370, h: 84 },
      { x: 1765, y: 1880, w: 630, h: 90 },
    ],
    npcs: [
      { x: 470, y: 390, color: "#ff91c8" },
      { x: 885, y: 880, color: "#68aaff" },
      { x: 1310, y: 820, color: "#d99c6b" },
      { x: 1770, y: 710, color: "#bd96ff" },
    ],
    escalators: [
      { x: 120, y: 620, w: 190, h: 245, direction: "DOWN", target: 1, spawn: { x: 560, y: 1280 } },
      { x: 1640, y: 390, w: 190, h: 245, direction: "DOWN", target: 1, spawn: { x: 1800, y: 535 } },
      { x: 2800, y: 1370, w: 190, h: 245, direction: "DOWN", target: 1, spawn: { x: 2850, y: 1320 } },
      { x: 1880, y: 370, w: 190, h: 245, direction: "UP", target: 3, spawn: { x: 3040, y: 1410 } },
      { x: 2360, y: 1380, w: 190, h: 245, direction: "UP", target: 3, spawn: { x: 300, y: 1380 } },
    ],
  },
  3: {
    name: "LEVEL TWO",
    code: "L2",
    zone: "DINING & PLAY",
    accent: "#ffb85f",
    shops: [
      { id: "saffron", name: "SAFFRON TABLE", category: "DINING", x: 55, y: 55, w: 430, h: 265, color: "#3a2c25", accent: "#ffb56b" },
      { id: "mezze", name: "MEZZE MOON", category: "DINING", x: 585, y: 50, w: 455, h: 250, color: "#332d25", accent: "#efcd75" },
      { id: "ramen", name: "NIGHT NOODLE", category: "DINING", x: 1145, y: 50, w: 440, h: 250, color: "#3e2729", accent: "#ff7770" },
      { id: "dessert", name: "SUGAR CLOUD", category: "DESSERTS", x: 1685, y: 55, w: 455, h: 265, color: "#3b2a3e", accent: "#efa4ff" },
      { id: "arcade", name: "PIXEL PLANET", category: "ARCADE", x: 55, y: 990, w: 430, h: 270, color: "#292342", accent: "#9b78ff" },
      { id: "climb", name: "UP & OVER", category: "ADVENTURE", x: 585, y: 1035, w: 445, h: 225, color: "#283528", accent: "#81df82" },
      { id: "books", name: "CRESCENT BOOKS", category: "BOOKS", x: 1130, y: 1005, w: 445, h: 255, color: "#343329", accent: "#d8ff4f" },
      { id: "fitness", name: "MOTION CLUB", category: "FITNESS", x: 1675, y: 985, w: 465, h: 275, color: "#25323a", accent: "#6cdcec" },
      { id: "lanterngrill", name: "LANTERN GRILL", category: "DINING", x: 2280, y: 55, w: 430, h: 300, color: "#3e2d25", accent: "#ffaf6e" },
      { id: "mango", name: "MANGO TERRACE", category: "DINING", x: 2870, y: 55, w: 475, h: 310, color: "#3b3225", accent: "#f1cf69" },
      { id: "orbit", name: "ORBIT ARCADE", category: "ARCADE", x: 2350, y: 520, w: 430, h: 300, color: "#282447", accent: "#9e7cff" },
      { id: "moonbakery", name: "MOON BAKERY", category: "BAKERY", x: 2910, y: 500, w: 435, h: 330, color: "#392d2d", accent: "#f6a99c" },
      { id: "cedarkitchen", name: "CEDAR KITCHEN", category: "DINING", x: 2320, y: 1040, w: 480, h: 320, color: "#303428", accent: "#bddb76" },
      { id: "astronauts", name: "LITTLE ASTRONAUTS", category: "PLAY", x: 2940, y: 1010, w: 405, h: 340, color: "#263342", accent: "#79c6ff" },
      { id: "noiselab", name: "NOISE LAB", category: "MUSIC", x: 75, y: 1500, w: 460, h: 300, color: "#302845", accent: "#bb8dff" },
      { id: "papermoon", name: "PAPER MOON", category: "BOOKS", x: 690, y: 1570, w: 430, h: 320, color: "#37352b", accent: "#e5d889" },
      { id: "arena", name: "ARENA SPORTS", category: "SPORTS", x: 1280, y: 1500, w: 470, h: 300, color: "#27363a", accent: "#6ee2de" },
      { id: "rooftoptea", name: "ROOFTOP TEA", category: "CAFÉ", x: 1900, y: 1530, w: 470, h: 330, color: "#30372b", accent: "#9bdd81" },
      { id: "rocket", name: "ROCKET SLIDES", category: "PLAY", x: 2520, y: 1640, w: 430, h: 340, color: "#2c2c42", accent: "#8da8ff" },
      { id: "eastdiner", name: "EAST DINER", category: "DINING", x: 3010, y: 1650, w: 335, h: 380, color: "#3b2927", accent: "#ff8e75" },
    ],
    obstacles: [
      { x: 390, y: 455, w: 220, h: 92 },
      { x: 780, y: 650, w: 180, h: 88 },
      { x: 1070, y: 435, w: 290, h: 125 },
      { x: 1280, y: 760, w: 300, h: 94 },
      { x: 1690, y: 535, w: 170, h: 88 },
      { x: 2165, y: 400, w: 110, h: 390 },
      { x: 2810, y: 860, w: 80, h: 390 },
      { x: 1150, y: 1335, w: 390, h: 88 },
      { x: 1770, y: 1880, w: 625, h: 92 },
    ],
    npcs: [
      { x: 335, y: 830, color: "#efa4ff" },
      { x: 735, y: 410, color: "#81df82" },
      { x: 1500, y: 650, color: "#6cdcec" },
      { x: 1990, y: 870, color: "#ff7770" },
    ],
    escalators: [
      { x: 120, y: 620, w: 190, h: 245, direction: "DOWN", target: 2, spawn: { x: 200, y: 700 } },
      { x: 1830, y: 680, w: 190, h: 245, direction: "DOWN", target: 2, spawn: { x: 1800, y: 500 } },
      { x: 3080, y: 1370, w: 190, h: 245, direction: "DOWN", target: 2, spawn: { x: 2860, y: 1390 } },
      { x: 120, y: 360, w: 190, h: 245, direction: "UP", target: 4, spawn: { x: 3000, y: 1410 } },
      { x: 750, y: 380, w: 190, h: 245, direction: "UP", target: 4, spawn: { x: 1920, y: 820 } },
      { x: 2780, y: 1370, w: 190, h: 245, direction: "UP", target: 4, spawn: { x: 300, y: 1380 } },
    ],
  },
  4: {
    name: "LEVEL THREE",
    code: "L3",
    zone: "SKY PROMENADE",
    accent: "#ff6c64",
    shops: [
      { id: "cinema", name: "EVIL DEAD RISE", category: "NOW PLAYING", x: 2620, y: 45, w: 730, h: 300, color: "#281b2b", accent: "#ff6c64" },
      { id: "records", name: "AFTERGLOW", category: "MUSIC", x: 930, y: 50, w: 480, h: 250, color: "#302445", accent: "#b58cff" },
      { id: "games", name: "CHECKPOINT", category: "GAMES", x: 1510, y: 55, w: 630, h: 265, color: "#202f3d", accent: "#5fc4ff" },
      { id: "popcorn", name: "KERNEL CLUB", category: "SNACKS", x: 55, y: 990, w: 430, h: 270, color: "#3b2925", accent: "#ffad69" },
      { id: "gallery", name: "FRAMEWORK", category: "ART", x: 585, y: 1035, w: 445, h: 225, color: "#2d3035", accent: "#e6e2d5" },
      { id: "studio", name: "STUDIO FOUR", category: "CREATIVE", x: 1130, y: 1005, w: 445, h: 255, color: "#28352d", accent: "#84df9a" },
      { id: "lounge", name: "ROOFTOP LOUNGE", category: "DINING", x: 1675, y: 985, w: 465, h: 275, color: "#363026", accent: "#f0c774" },
      { id: "nightgallery", name: "NIGHT GALLERY", category: "ART", x: 55, y: 55, w: 700, h: 285, color: "#2c2d34", accent: "#dfddd5" },
      { id: "redcarpet", name: "RED CARPET", category: "EVENTS", x: 2260, y: 55, w: 300, h: 300, color: "#3b242a", accent: "#ff6c64" },
      { id: "screensnacks", name: "SCREEN SNACKS", category: "DINING", x: 2280, y: 500, w: 430, h: 330, color: "#3d2e25", accent: "#ffb16d" },
      { id: "observatory", name: "OBSERVATORY", category: "EXPERIENCE", x: 2870, y: 570, w: 475, h: 300, color: "#242c40", accent: "#7faaff" },
      { id: "studionine", name: "STUDIO NINE", category: "CREATIVE", x: 2300, y: 1000, w: 460, h: 340, color: "#29372f", accent: "#83dea0" },
      { id: "neonrecords", name: "NEON RECORDS", category: "MUSIC", x: 2920, y: 1030, w: 425, h: 320, color: "#312745", accent: "#b68cff" },
      { id: "skybooks", name: "SKY BOOKS", category: "BOOKS", x: 75, y: 1500, w: 460, h: 300, color: "#36352b", accent: "#dfd485" },
      { id: "balcony", name: "BALCONY LOUNGE", category: "DINING", x: 690, y: 1570, w: 430, h: 320, color: "#353025", accent: "#f2c372" },
      { id: "gameroom", name: "GAME ROOM", category: "GAMES", x: 1280, y: 1500, w: 470, h: 300, color: "#242f42", accent: "#64b7ff" },
      { id: "afterhours", name: "AFTER HOURS", category: "MUSIC", x: 1900, y: 1530, w: 470, h: 330, color: "#332640", accent: "#d28cff" },
      { id: "moonbar", name: "MOON BAR", category: "DINING", x: 2520, y: 1640, w: 430, h: 340, color: "#332c27", accent: "#f2bb75" },
      { id: "skylab", name: "SKY LAB", category: "EXPERIENCE", x: 3010, y: 1650, w: 335, h: 380, color: "#252e3d", accent: "#76bcff" },
    ],
    obstacles: [
      { x: 650, y: 520, w: 185, h: 92 },
      { x: 930, y: 735, w: 310, h: 100 },
      { x: 1230, y: 430, w: 250, h: 110 },
      { x: 1510, y: 690, w: 200, h: 90 },
      { x: 2160, y: 410, w: 105, h: 410 },
      { x: 2765, y: 900, w: 125, h: 360 },
      { x: 1170, y: 1335, w: 390, h: 86 },
      { x: 1770, y: 1885, w: 625, h: 90 },
    ],
    npcs: [
      { x: MAHAL.x, y: MAHAL.y, color: "#ff6c64", name: "MAHAL", special: "mahal" },
      { x: 870, y: 430, color: "#b58cff" },
      { x: 1220, y: 880, color: "#84df9a" },
      { x: 1730, y: 470, color: "#5fc4ff" },
    ],
    escalators: [
      { x: 1850, y: 450, w: 190, h: 245, direction: "DOWN", target: 3, spawn: { x: 1880, y: 800 } },
      { x: 550, y: 1320, w: 190, h: 245, direction: "DOWN", target: 3, spawn: { x: 450, y: 1410 } },
      { x: 2440, y: 1370, w: 190, h: 245, direction: "DOWN", target: 3, spawn: { x: 2850, y: 1320 } },
    ],
  },
};

const TOTAL_SHOPS = Object.values(FLOORS).reduce((total, floor) => total + floor.shops.length, 0);

type StoryBeat =
  | { speaker: "Mahal" | "Princess"; text: string }
  | { stage: string };

const ENDING_STORY: StoryBeat[] = [
  { speaker: "Mahal", text: "Hi." },
  { speaker: "Princess", text: "Do I look like a lost little girl?" },
  { stage: "Princess stretches out her arm." },
  { stage: "They shake hands." },
  { stage: "Mahal is lost in her beauty, his heart beating fast. Never could he have imagined that he would be here, standing in front of the most beautiful girl in the world." },
  { stage: "Mahal instantly fell in love." },
];

type GameStatus = "intro" | "playing" | "won";
type Game = {
  floor: FloorNo;
  x: number;
  y: number;
  status: GameStatus;
  startAt: number;
  finalTime: number;
  transition: null | { to: FloorNo; spawn: { x: number; y: number }; direction: "UP" | "DOWN"; startedAt: number; changed: boolean };
  discovered: Set<string>;
  phoneMessageSeen: boolean;
};

function initialGame(): Game {
  return { floor: 1, x: 1680, y: 2150, status: "intro", startAt: 0, finalTime: 0, transition: null, discovered: new Set(), phoneMessageSeen: false };
}

function distance(ax: number, ay: number, bx: number, by: number) {
  return Math.hypot(ax - bx, ay - by);
}

function circleHitsRect(x: number, y: number, radius: number, rect: Rect) {
  const nearestX = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  return distance(x, y, nearestX, nearestY) < radius;
}

function roundedRect(ctx: CanvasRenderingContext2D, rect: Rect, radius: number) {
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.w, rect.h, radius);
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function drawShop(ctx: CanvasRenderingContext2D, shop: Shop) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.38)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 15;
  roundedRect(ctx, shop, 19);
  ctx.fillStyle = shop.color;
  ctx.fill();
  ctx.restore();
  roundedRect(ctx, shop, 19);
  ctx.strokeStyle = "rgba(255,255,255,0.09)";
  ctx.lineWidth = 2;
  ctx.stroke();

  const frontY = shop.y + shop.h - 58;
  ctx.fillStyle = "rgba(5,5,10,0.48)";
  ctx.fillRect(shop.x + 10, frontY, shop.w - 20, 48);
  ctx.fillStyle = shop.accent;
  ctx.fillRect(shop.x + 10, frontY, shop.w - 20, 3);
  const windows = Math.max(2, Math.floor(shop.w / 145));
  const windowW = (shop.w - 42 - (windows - 1) * 11) / windows;
  for (let index = 0; index < windows; index += 1) {
    ctx.fillStyle = "rgba(255,255,255,0.055)";
    ctx.fillRect(shop.x + 20 + index * (windowW + 11), shop.y + 24, windowW, Math.max(55, shop.h - 122));
  }
  ctx.textAlign = "left";
  ctx.fillStyle = shop.accent;
  ctx.font = "700 11px monospace";
  ctx.fillText(shop.category, shop.x + 22, frontY + 20);
  ctx.fillStyle = "#f6f3e8";
  ctx.font = shop.id === "cinema" ? "800 30px sans-serif" : "800 17px sans-serif";
  ctx.fillText(shop.name, shop.x + 22, frontY + 43);

  if (shop.id === "cinema") {
    ctx.fillStyle = "rgba(255,108,100,0.15)";
    ctx.fillRect(shop.x + 35, shop.y + 35, shop.w - 70, 84);
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.58)";
    ctx.font = "700 11px monospace";
    ctx.fillText("NOW PLAYING", shop.x + shop.w / 2, shop.y + 62);
    ctx.fillStyle = "#ff827b";
    ctx.font = "900 34px sans-serif";
    ctx.fillText("EVIL DEAD RISE", shop.x + shop.w / 2, shop.y + 99);
    ctx.fillStyle = "rgba(255,255,255,0.58)";
    ctx.font = "700 10px monospace";
    ctx.fillText("TONIGHT  •  CINEMA", shop.x + shop.w / 2, shop.y + 116);
    const doorX = shop.x + shop.w / 2 - 56;
    ctx.fillStyle = "#08080d";
    ctx.fillRect(doorX, shop.y + shop.h - 66, 112, 56);
    ctx.strokeStyle = "#ff6c64";
    ctx.strokeRect(doorX, shop.y + shop.h - 66, 112, 56);
  }
}

function drawPerson(ctx: CanvasRenderingContext2D, npc: Npc, now: number, index: number) {
  const bob = Math.sin(now / 520 + index) * 2;
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(npc.x, npc.y + 19, 17, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = npc.color;
  ctx.beginPath();
  ctx.roundRect(npc.x - 13, npc.y - 10 + bob, 26, 34, 10);
  ctx.fill();
  ctx.fillStyle = "#d7aa84";
  ctx.beginPath();
  ctx.arc(npc.x, npc.y - 18 + bob, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#211b25";
  ctx.beginPath();
  ctx.arc(npc.x, npc.y - 22 + bob, 9, Math.PI, Math.PI * 2);
  ctx.fill();

  if (npc.special === "mahal") {
    ctx.fillStyle = "rgba(10,10,17,0.9)";
    roundedRect(ctx, { x: npc.x - 39, y: npc.y - 72, w: 78, h: 29 }, 9);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,108,100,0.55)";
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = "#ff817a";
    ctx.font = "800 11px monospace";
    ctx.fillText(npc.name ?? "MAHAL", npc.x, npc.y - 53);
  }
}

function drawEscalator(ctx: CanvasRenderingContext2D, escalator: Escalator, now: number) {
  ctx.save();
  ctx.shadowColor = "rgba(143,109,255,0.32)";
  ctx.shadowBlur = 28;
  roundedRect(ctx, escalator, 18);
  ctx.fillStyle = "#11111a";
  ctx.fill();
  ctx.restore();
  roundedRect(ctx, escalator, 18);
  ctx.strokeStyle = escalator.direction === "UP" ? "#8f6dff" : "#5aa7ff";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.save();
  roundedRect(ctx, { x: escalator.x + 25, y: escalator.y + 30, w: escalator.w - 50, h: escalator.h - 60 }, 8);
  ctx.clip();
  const travel = (now / 18) % 24;
  for (let y = escalator.y - 30; y < escalator.y + escalator.h + 30; y += 24) {
    const offset = escalator.direction === "UP" ? travel : -travel;
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.fillRect(escalator.x + 31, y + offset, escalator.w - 62, 10);
  }
  ctx.restore();
  ctx.textAlign = "center";
  ctx.fillStyle = "#d2c8ff";
  ctx.font = "800 11px monospace";
  ctx.fillText(`${escalator.direction}  •  ${FLOORS[escalator.target].code}`, escalator.x + escalator.w / 2, escalator.y + escalator.h - 14);
}

function drawFloor(ctx: CanvasRenderingContext2D, floor: FloorNo, camera: { x: number; y: number }, player: { x: number; y: number }, now: number) {
  const map = FLOORS[floor];
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  const background = ctx.createLinearGradient(0, 0, WORLD.width, WORLD.height);
  background.addColorStop(0, floor % 2 ? "#1a1a27" : "#201a29");
  background.addColorStop(1, floor < 3 ? "#101923" : "#171521");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  for (let x = 0; x <= WORLD.width; x += 52) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, WORLD.height);
    ctx.stroke();
  }
  for (let y = 0; y <= WORLD.height; y += 52) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WORLD.width, y);
    ctx.stroke();
  }
  ctx.strokeStyle = `${map.accent}24`;
  ctx.lineWidth = 3;
  [
    { x: 850, y: 700, rx: 430, ry: 245 },
    { x: 2510, y: 850, rx: 490, ry: 275 },
    { x: 1710, y: 1690, rx: 390, ry: 215 },
  ].forEach((atrium) => {
    ctx.beginPath();
    ctx.ellipse(atrium.x, atrium.y, atrium.rx, atrium.ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(atrium.x, atrium.y, atrium.rx - 65, atrium.ry - 45, 0, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.fillStyle = "rgba(255,255,255,0.13)";
  ctx.font = "700 12px monospace";
  ctx.textAlign = "center";
  ctx.fillText(`${map.zone}  •  ${map.name}`, WORLD.width / 2, 365);
  map.shops.forEach((shop) => drawShop(ctx, shop));
  map.obstacles.forEach((rect, index) => {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
    roundedRect(ctx, rect, 17);
    ctx.fillStyle = index % 2 === 0 ? "#24352d" : "#292735";
    ctx.fill();
    ctx.restore();
    roundedRect(ctx, rect, 17);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.stroke();
    if (index % 2 === 0) {
      ctx.fillStyle = "#4c805c";
      for (let x = rect.x + 24; x < rect.x + rect.w - 10; x += 42) {
        ctx.beginPath();
        ctx.arc(x, rect.y + 23 + (x % 3) * 6, 16, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = `${map.accent}cc`;
      ctx.font = "800 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("DIRECTORY", rect.x + rect.w / 2, rect.y + rect.h / 2 + 3);
    }
  });
  map.escalators.forEach((escalator) => drawEscalator(ctx, escalator, now));
  map.npcs.forEach((npc, index) => drawPerson(ctx, npc, now, index));

  // Princess has long dark hair, a red shirt, black pants, and a lime shoulder bag.
  ctx.fillStyle = "rgba(0,0,0,0.38)";
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 19, 21, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2b2030";
  ctx.beginPath();
  ctx.ellipse(player.x + 12, player.y - 12, 10, 21, -0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e54845";
  ctx.beginPath();
  ctx.roundRect(player.x - 14, player.y - 13, 28, 31, 11);
  ctx.fill();
  ctx.fillStyle = "#111118";
  ctx.fillRect(player.x - 13, player.y + 12, 26, 10);
  ctx.fillRect(player.x - 13, player.y + 18, 10, 22);
  ctx.fillRect(player.x + 3, player.y + 18, 10, 22);
  ctx.strokeStyle = "#34343e";
  ctx.lineWidth = 2;
  ctx.strokeRect(player.x - 13, player.y + 18, 10, 22);
  ctx.strokeRect(player.x + 3, player.y + 18, 10, 22);
  ctx.fillStyle = "#d7a981";
  ctx.beginPath();
  ctx.arc(player.x, player.y - 22, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2b2030";
  ctx.beginPath();
  ctx.arc(player.x, player.y - 26, 11, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d8ff4f";
  ctx.fillRect(player.x + 12, player.y - 6, 7, 18);
  ctx.restore();
}

function cx(...classNames: string[]) {
  return classNames.flatMap((value) => value.split(" ")).map((name) => styles[name]).filter(Boolean).join(" ");
}

export function CinemaMallGame() {
  const { update, completeGame } = useGameProgress();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game>(initialGame());
  const pressedRef = useRef<Set<string>>(new Set());
  const interactRef = useRef<() => void>(() => undefined);
  const audioRef = useRef<AudioContext | null>(null);
  const [started, setStarted] = useState(false);
  const [won, setWon] = useState(false);
  const [floor, setFloor] = useState<FloorNo>(1);
  const [elapsed, setElapsed] = useState(0);
  const [discovered, setDiscovered] = useState(0);
  const [dialogueStep, setDialogueStep] = useState(0);
  const [phoneVisible, setPhoneVisible] = useState(false);

  const beep = useCallback((frequency: number, duration = 0.12) => {
    try {
      const AudioContextClass = window.AudioContext;
      const audio = audioRef.current ?? new AudioContextClass();
      audioRef.current = audio;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.frequency.value = frequency;
      oscillator.type = "sine";
      gain.gain.setValueAtTime(0.045, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + duration);
    } catch {
      // Sound is optional; the game remains fully playable without it.
    }
  }, []);

  const begin = useCallback(() => {
    const game = gameRef.current;
    game.status = "playing";
    game.startAt = performance.now();
    setStarted(true);
    setWon(false);
    update((current) => ({
      ...current,
      lostLittleGirl: {
        ...current.lostLittleGirl,
        moves: Math.max(1, current.lostLittleGirl.moves),
      },
    }));
    beep(520, 0.1);
  }, [beep, update]);

  const reset = useCallback(() => {
    gameRef.current = initialGame();
    pressedRef.current.clear();
    setStarted(false);
    setWon(false);
    setFloor(1);
    setElapsed(0);
    setDiscovered(0);
    setDialogueStep(0);
    setPhoneVisible(false);
  }, []);

  const advanceDialogue = useCallback(() => {
    setDialogueStep((step) => Math.min(step + 1, ENDING_STORY.length));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let animationFrame = 0;
    let previous = performance.now();
    let lastUiUpdate = 0;
    let notificationTimer: number | null = null;

    const canMoveTo = (x: number, y: number, activeFloor: FloorNo) => {
      if (x < PLAYER_RADIUS + 12 || y < PLAYER_RADIUS + 12 || x > WORLD.width - PLAYER_RADIUS - 12 || y > WORLD.height - PLAYER_RADIUS - 12) return false;
      const map = FLOORS[activeFloor];
      return ![...map.shops, ...map.obstacles].some((rect) => circleHitsRect(x, y, PLAYER_RADIUS, rect));
    };

    interactRef.current = () => {
      const game = gameRef.current;
      if (game.status !== "playing" || game.transition) return;
      const escalator = FLOORS[game.floor].escalators.find((item) => distance(game.x, game.y, item.x + item.w / 2, item.y + item.h / 2) < 150);
      if (escalator) {
        game.transition = { to: escalator.target, spawn: escalator.spawn, direction: escalator.direction, startedAt: performance.now(), changed: false };
        beep(escalator.direction === "UP" ? 620 : 410, 0.24);
        return;
      }
      if (game.floor === 4 && distance(game.x, game.y, MAHAL.x, MAHAL.y) < 135) {
        game.status = "won";
        game.finalTime = (performance.now() - game.startAt) / 1000;
        setElapsed(game.finalTime);
        setDialogueStep(0);
        setWon(true);
        completeGame("lost-little-girl");
        beep(880, 0.5);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) event.preventDefault();
      if (key === "enter" && gameRef.current.status === "intro") {
        begin();
        return;
      }
      if (gameRef.current.status === "won" && (key === "enter" || key === "e" || key === " ")) {
        if (!event.repeat) setDialogueStep((step) => Math.min(step + 1, ENDING_STORY.length));
        return;
      }
      if (key === "e" || key === " ") interactRef.current();
      pressedRef.current.add(key);
    };
    const onKeyUp = (event: KeyboardEvent) => pressedRef.current.delete(event.key.toLowerCase());
    const onBlur = () => pressedRef.current.clear();
    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    const frame = (now: number) => {
      const game = gameRef.current;
      const delta = Math.min((now - previous) / 1000, 0.035);
      previous = now;
      if (game.status === "playing" && !game.transition) {
        const pressed = pressedRef.current;
        let dx = 0;
        let dy = 0;
        if (pressed.has("w") || pressed.has("arrowup")) dy -= 1;
        if (pressed.has("s") || pressed.has("arrowdown")) dy += 1;
        if (pressed.has("a") || pressed.has("arrowleft")) dx -= 1;
        if (pressed.has("d") || pressed.has("arrowright")) dx += 1;
        if (dx || dy) {
          const length = Math.hypot(dx, dy);
          const speed = 250;
          const nextX = game.x + (dx / length) * speed * delta;
          const nextY = game.y + (dy / length) * speed * delta;
          if (canMoveTo(nextX, game.y, game.floor)) game.x = nextX;
          if (canMoveTo(game.x, nextY, game.floor)) game.y = nextY;
        }
        for (const shop of FLOORS[game.floor].shops) {
          const key = `${game.floor}-${shop.id}`;
          const nearestX = Math.max(shop.x, Math.min(game.x, shop.x + shop.w));
          const nearestY = Math.max(shop.y, Math.min(game.y, shop.y + shop.h));
          if (distance(game.x, game.y, nearestX, nearestY) < 95 && !game.discovered.has(key)) {
            game.discovered.add(key);
            setDiscovered(game.discovered.size);
          }
        }
      }
      if (game.transition) {
        const progress = now - game.transition.startedAt;
        if (progress > 620 && !game.transition.changed) {
          game.floor = game.transition.to;
          game.x = game.transition.spawn.x;
          game.y = game.transition.spawn.y;
          game.transition.changed = true;
          setFloor(game.floor);
          if (game.floor === 3 && !game.phoneMessageSeen) {
            game.phoneMessageSeen = true;
            setPhoneVisible(true);
            beep(740, 0.18);
            notificationTimer = window.setTimeout(() => setPhoneVisible(false), 6500);
          }
        }
        if (progress > 1250) game.transition = null;
      }
      const narrow = canvas.width / canvas.height < 1.3;
      const visibleWidth = narrow ? 760 : VIEW.width;
      const visibleHeight = narrow ? 950 : VIEW.height;
      const camera = {
        x: Math.max(0, Math.min(game.x - visibleWidth / 2, WORLD.width - visibleWidth)),
        y: Math.max(0, Math.min(game.y - visibleHeight / 2, WORLD.height - visibleHeight)),
      };
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.save();
      context.scale(canvas.width / visibleWidth, canvas.height / visibleHeight);
      drawFloor(context, game.floor, camera, game, now);
      if (game.transition) {
        const progress = Math.min(1, (now - game.transition.startedAt) / 1250);
        const alpha = Math.sin(progress * Math.PI) * 0.94;
        context.fillStyle = `rgba(8,8,14,${alpha})`;
        context.fillRect(0, 0, visibleWidth, visibleHeight);
        context.textAlign = "center";
        context.fillStyle = `rgba(216,255,79,${Math.min(1, alpha * 1.3)})`;
        context.font = "800 13px monospace";
        context.fillText(game.transition.direction === "UP" ? `GOING UP  •  ${FLOORS[game.transition.to].name}` : `GOING DOWN  •  ${FLOORS[game.transition.to].name}`, visibleWidth / 2, visibleHeight / 2);
      }
      context.restore();
      if (now - lastUiUpdate > 180 && game.status === "playing") {
        setElapsed((now - game.startAt) / 1000);
        lastUiUpdate = now;
      }
      animationFrame = requestAnimationFrame(frame);
    };

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    };
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(canvas);
    resizeCanvas();
    animationFrame = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(animationFrame);
      if (notificationTimer !== null) window.clearTimeout(notificationTimer);
      observer.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [beep, begin, completeGame]);

  const setTouchKey = useCallback((key: string, active: boolean) => {
    if (active) pressedRef.current.add(key);
    else pressedRef.current.delete(key);
  }, []);

  const currentBeat = ENDING_STORY[dialogueStep];

  return (
    <main className={cx("cinema-root", "game-shell")}>
      <header className={cx("game-header")}>
        <div className={cx("brand")}>
          <div className={cx("brand-mark")} aria-hidden="true">M/8</div>
          <div className={cx("brand-copy")}><strong>Mall After Dark</strong><span>A lost-in-the-mall adventure</span></div>
        </div>
        <div className={cx("header-actions")}>
          <Link href="/games" className={cx("back-link")}>← Back to games</Link>
          <div className={cx("header-status")}><span className={cx("live-dot")} aria-hidden="true" />4 FLOORS • {TOTAL_SHOPS} SHOPS • 1 CINEMA</div>
        </div>
      </header>

      <div className={cx("game-layout")}>
        <section className={cx("stage-card")} aria-label="Playable mall game">
          <canvas ref={canvasRef} className={cx("game-canvas")} aria-label="Large four-floor mall game. Use WASD or arrow keys to move." />
          <div className={cx("canvas-hud")} aria-live="polite">
            <div className={cx("floor-pill")}>FLOOR <b>{FLOORS[floor].code}</b></div>
            <div className={cx("timer-pill")}>{formatTime(elapsed)}</div>
          </div>
          {phoneVisible && started && !won && (
            <aside className={cx("phone-notification")} role="status" aria-live="assertive" aria-label="Message from Mahal">
              <div className={cx("phone-avatar")} aria-hidden="true">M</div>
              <div className={cx("phone-copy")}>
                <span>MESSAGE • NOW</span>
                <strong>Mahal</strong>
                <p>Hey, I think I saw a lost little girl.</p>
              </div>
              <button className={cx("phone-close")} aria-label="Dismiss message" onClick={() => setPhoneVisible(false)}>×</button>
            </aside>
          )}
          <div className={cx("touch-controls")} aria-label="Touch controls">
            <div className={cx("dpad")}>
              <button className={cx("touch-button touch-up")} aria-label="Move up" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setTouchKey("w", true); }} onPointerUp={() => setTouchKey("w", false)} onPointerCancel={() => setTouchKey("w", false)}>↑</button>
              <button className={cx("touch-button touch-left")} aria-label="Move left" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setTouchKey("a", true); }} onPointerUp={() => setTouchKey("a", false)} onPointerCancel={() => setTouchKey("a", false)}>←</button>
              <button className={cx("touch-button touch-down")} aria-label="Move down" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setTouchKey("s", true); }} onPointerUp={() => setTouchKey("s", false)} onPointerCancel={() => setTouchKey("s", false)}>↓</button>
              <button className={cx("touch-button touch-right")} aria-label="Move right" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setTouchKey("d", true); }} onPointerUp={() => setTouchKey("d", false)} onPointerCancel={() => setTouchKey("d", false)}>→</button>
            </div>
            <button className={cx("touch-button touch-action")} aria-label="Interact" onClick={() => interactRef.current()}>GO</button>
          </div>

          {!started && (
            <div className={cx("game-overlay")}><div className={cx("overlay-panel")}>
              <span className={cx("scene-number")}>8:42 PM • Grand Entrance</span>
              <h2>Mahal is already waiting.</h2>
              <p>Somewhere in this sprawling four-storey mall, Mahal is waiting outside the cinema. No map. No shortcuts.</p>
              <button className={cx("primary-button")} onClick={begin}>Enter the mall</button>
              <div className={cx("intro-keys")}>WASD / ARROWS TO MOVE • E TO USE ESCALATORS</div>
            </div></div>
          )}

          {won && (
            <div className={cx("game-overlay")}>
              {currentBeat ? (
                <div className={cx("dialogue-panel")}>
                  <div className={cx("dialogue-topline")}>
                    <span className={cx("scene-number")}>Outside the cinema</span>
                    <span className={cx("dialogue-count")}>{dialogueStep + 1} / {ENDING_STORY.length}</span>
                  </div>
                  <div className={cx("dialogue-card")}>
                    {"speaker" in currentBeat ? (
                      <>
                        <span className={cx("speaker-badge", `speaker-${currentBeat.speaker.toLowerCase()}`)}>{currentBeat.speaker}</span>
                        <p className={cx("spoken-line")}>{currentBeat.text}</p>
                      </>
                    ) : (
                      <p className={cx("stage-direction")}>*{currentBeat.stage}*</p>
                    )}
                  </div>
                  <div className={cx("dialogue-actions")}>
                    <span>SPACE / E TO CONTINUE</span>
                    <button className={cx("primary-button")} onClick={advanceDialogue}>Continue</button>
                  </div>
                </div>
              ) : (
                <div className={cx("overlay-panel win-panel")}>
                  <span className={cx("scene-number")}>Mahal found • Cinema found</span>
                  <h2>Something began.</h2>
                  <p>The movie was about to start, but for Mahal, this was already the moment he would remember.</p>
                  <div className={cx("score-line")}>YOUR TIME <strong>{formatTime(elapsed)}</strong></div>
                  <button className={cx("primary-button")} onClick={reset}>Play again</button>
                </div>
              )}
            </div>
          )}
        </section>

        <aside className={cx("side-panel")} aria-label="Mission and controls">
          <section className={cx("mission-card")}>
            <p className={cx("eyebrow")}>Current mission</p>
            <h1>Find Mahal.</h1>
            <p>Mahal is waiting outside the cinema. Search every wing—and remember that not every escalator takes you closer.</p>
            <div className={cx("mission-progress")}><span>SHOPS SEEN</span><strong>{discovered} / {TOTAL_SHOPS}</strong></div>
          </section>
          <section className={cx("control-card")}>
            <h2>How to play</h2>
            <div className={cx("control-row")}><span>Walk</span><span className={cx("keys")}>W A S D</span></div>
            <div className={cx("control-row")}><span>Also walk</span><span className={cx("keys")}>ARROWS</span></div>
            <div className={cx("control-row")}><span>Use / talk</span><span className={cx("keys")}>E / SPACE</span></div>
          </section>
          <section className={cx("directory-card")}>
            <h2>Mall directory</h2>
            <div className={cx("directory-list")}>
              <div className={cx("directory-row")}><span>Ground</span><span>Grand Atrium</span></div>
              <div className={cx("directory-row")}><span>Level 1</span><span>Fashion</span></div>
              <div className={cx("directory-row")}><span>Level 2</span><span>Dining & Play</span></div>
              <div className={cx("directory-row")}><span>Level 3</span><span>Sky Promenade</span></div>
              <div className={cx("directory-row")}><span>Cinema</span><span>Now playing: Evil Dead Rise</span></div>
            </div>
          </section>
          <button className={cx("reset-button")} onClick={reset}>Restart from entrance</button>
        </aside>
      </div>
    </main>
  );
}
