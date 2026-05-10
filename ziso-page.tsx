"use client";

// ╔══════════════════════════════════════════════════════════╗
// ║  ZISO — Smart Content Vault                             ║
// ║  Aesthetic: Soft Brutalism × Y2K Pastel × Glassmorphism ║
// ║  Stack: Next.js App Router · Tailwind · Lucide React    ║
// ║  Persistence: LocalStorage (zero setup, max vibe ✨)    ║
// ╚══════════════════════════════════════════════════════════╝

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, X, Check, Trash2, Clock, Eye, Sparkles,
  Youtube, Instagram, Facebook, Twitter, Globe, Music2,
  Bell, Flame, Snowflake, Search, Moon, Sun,
  LayoutGrid, List, ExternalLink, RefreshCw, Zap,
  BookOpen, Briefcase, UtensilsCrossed, FolderOpen,
  ChevronRight, ArrowUpRight, Tag, Timer, Inbox,
} from "lucide-react";

// ─────────────────────────────────────────────
// TYPES — kiến trúc dữ liệu xịn sò 💎
// ─────────────────────────────────────────────

type Platform = "youtube" | "tiktok" | "instagram" | "facebook" | "twitter" | "threads" | "other";
type MagicCategory = "cooking" | "career" | "learning" | "general";
type BucketColor = "blush" | "mint" | "butter" | "periwinkle" | "peach" | "sage" | "lilac" | "sky";

interface SavedLink {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  platform: Platform;
  bucketId: string;
  flashNote: string;         // AI Vibe Note từ Magic Intelligence
  magicCategory: MagicCategory;
  createdAt: number;
  done: boolean;
  autoPurgeAt?: number;
  viewedAt?: number;
}

interface Bucket {
  id: string;
  name: string;
  icon: string;
  color: BucketColor;
  createdAt: number;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "warning" | "info" | "magic";
}

interface ConfirmDialog {
  linkId: string;
}

// ─────────────────────────────────────────────
// DESIGN TOKENS — màu pastel chuẩn moodboard 🎨
// ─────────────────────────────────────────────

const BUCKET_PALETTE: Record<BucketColor, {
  bg: string; border: string; text: string;
  pill: string; glow: string; dot: string;
}> = {
  blush:      { bg:"bg-[#FDF2F2]",  border:"border-[#F9C6C6]",  text:"text-[#C45C5C]",  pill:"bg-[#F9C6C6]",  glow:"shadow-[#F9C6C6]/60", dot:"bg-[#F9C6C6]"  },
  mint:       { bg:"bg-[#F0FFF4]",  border:"border-[#9FE2BF]",  text:"text-[#3A9B6F]",  pill:"bg-[#9FE2BF]",  glow:"shadow-[#9FE2BF]/60", dot:"bg-[#9FE2BF]"  },
  butter:     { bg:"bg-[#FFFDE7]",  border:"border-[#FFE082]",  text:"text-[#B8860B]",  pill:"bg-[#FFE082]",  glow:"shadow-[#FFE082]/60", dot:"bg-[#FFE082]"  },
  periwinkle: { bg:"bg-[#F0EFFF]",  border:"border-[#C5C0F5]",  text:"text-[#6B62D4]",  pill:"bg-[#C5C0F5]",  glow:"shadow-[#C5C0F5]/60", dot:"bg-[#C5C0F5]"  },
  peach:      { bg:"bg-[#FFF5EE]",  border:"border-[#FFBB94]",  text:"text-[#D2601A]",  pill:"bg-[#FFBB94]",  glow:"shadow-[#FFBB94]/60", dot:"bg-[#FFBB94]"  },
  sage:       { bg:"bg-[#F1F8F1]",  border:"border-[#A8D5A2]",  text:"text-[#4A7C59]",  pill:"bg-[#A8D5A2]",  glow:"shadow-[#A8D5A2]/60", dot:"bg-[#A8D5A2]"  },
  lilac:      { bg:"bg-[#FAF0FF]",  border:"border-[#DDB3F5]",  text:"text-[#8B44B5]",  pill:"bg-[#DDB3F5]",  glow:"shadow-[#DDB3F5]/60", dot:"bg-[#DDB3F5]"  },
  sky:        { bg:"bg-[#EFF8FF]",  border:"border-[#93D0F0]",  text:"text-[#2878A8]",  pill:"bg-[#93D0F0]",  glow:"shadow-[#93D0F0]/60", dot:"bg-[#93D0F0]"  },
};

// ─────────────────────────────────────────────
// DEFAULT BUCKETS — bộ sưu tập ban đầu 🗂️
// ─────────────────────────────────────────────

const NOW = Date.now();
const DEFAULT_BUCKETS: Bucket[] = [
  { id:"watch-later", name:"Watch Later",  icon:"🎬", color:"blush",      createdAt:NOW },
  { id:"inspo",       name:"Inspo Board",  icon:"✨", color:"periwinkle", createdAt:NOW },
  { id:"learn",       name:"Learn & Grow", icon:"📚", color:"mint",       createdAt:NOW },
  { id:"cooking",     name:"Recipes",      icon:"🍳", color:"peach",      createdAt:NOW },
  { id:"career",      name:"Career",       icon:"💼", color:"sky",        createdAt:NOW },
  { id:"vibes",       name:"Good Vibes",   icon:"🌸", color:"lilac",      createdAt:NOW },
];

const BUCKET_ICONS = ["🎬","✨","📚","🍳","💼","🌸","🎵","💡","🎨","📷","🏋️","💻","🌿","🎮","🛍️","🦋","🔖","🧪","🎯","🌎"];

// ─────────────────────────────────────────────
// ✨ MAGIC INTELLIGENCE ENGINE
// Pure JS — Regex + String manipulation, zero API deps
// ─────────────────────────────────────────────

/**
 * magicSorter(url) — Bộ não AI phân loại link chỉ bằng Regex ⚡
 * Priority: cooking > career > learning > general
 * Scan toàn bộ URL string sau khi lowercase để match không phân biệt hoa thường
 */
function magicSorter(url: string): MagicCategory {
  const s = url.toLowerCase();
  if (/cook|food|recipe|restaurant|kitchen|bake|chef|meal|dish|cuisine|yummy|tasty|eat/i.test(s))
    return "cooking";
  if (/intern|job|career|linkedin|hiring|recruit|resume|cv|work|employ|salary|interview|offer/i.test(s))
    return "career";
  if (/learn|course|edu|tutorial|how[-_]?to|study|lesson|class|training|workshop|guide|skill|knowledge/i.test(s))
    return "learning";
  return "general";
}

/**
 * magicSorterToBucketId() — Cầu nối từ category → bucket id thực tế
 * Dùng priority list để fallback gracefully khi bucket không tồn tại
 */
function magicSorterToBucketId(url: string, buckets: Bucket[]): string {
  const cat = magicSorter(url);
  const priorityMap: Record<MagicCategory, string[]> = {
    cooking:  ["cooking"],
    career:   ["career", "inspo"],
    learning: ["learn", "inspo"],
    general:  ["watch-later", "vibes"],
  };
  for (const id of priorityMap[cat]) {
    const found = buckets.find(b => b.id === id);
    if (found) return found.id;
  }
  return buckets[0]?.id ?? "watch-later";
}

/**
 * generateVibeNote(category) — Flash Note generator 🎲
 * 5 câu/category, random pick mỗi lần — đủ đa dạng, không trùng lặp nhàm chán
 */
function generateVibeNote(category: MagicCategory): string {
  const notes: Record<MagicCategory, string[]> = {
    cooking: [
      "Time to chef up! Don't forget to check the pantry first. 🥘",
      "Aprons on! This recipe might become your Sunday staple. 👨‍🍳",
      "Fork yeah! Saved this before the 2am hunger hits. 🍴",
      "Your future self will thank you when dinner panic strikes. 🧄",
      "Calories don't count when you made it yourself, right? 😇🍽️",
    ],
    career: [
      "Big moves incoming! Review this before your next interview. 🚀",
      "Your dream role is one link away — don't let this collect dust! 💼",
      "Future CEO behaviour: saved, sorted, and ready to grind. 📈",
      "Networking is just making friends with benefits (career ones). 🤝",
      "Read this, apply that, manifest the offer letter. ✉️✨",
    ],
    learning: [
      "Knowledge is power. Grab a coffee and deep dive into this! ☕",
      "Your brain is a sponge — squeeze every drop from this one. 🧠",
      "Future you just got 10% smarter. Keep stacking those W's! 📖",
      "Tutorial saved = skill unlocked (eventually, no rush bestie). 🎓",
      "Learning era activated. This one's a real gem, don't skip it. 💎",
    ],
    general: [
      "Not sure why you saved this, but past-you had a vibe. ✨",
      "Internet rabbit hole acquired. Proceed with caution (or don't). 🐇",
      "Saved for later — which historically means saved forever. 😂",
      "This link felt important at 11pm. Morning-you will decide. 🌙",
      "Your eclectic taste is showing, and honestly? Love that for you. 🦋",
    ],
  };
  const pool = notes[category];
  return pool[Math.floor(Math.random() * pool.length)];
}

// Category UI metadata — dùng trong badge và toast
const CATEGORY_META: Record<MagicCategory, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  cooking:  { label:"Cooking 🍳",  color:"text-[#D2601A]", bg:"bg-[#FFF5EE] border border-[#FFBB94]", icon:<UtensilsCrossed className="w-3 h-3"/> },
  career:   { label:"Career 💼",   color:"text-[#2878A8]", bg:"bg-[#EFF8FF] border border-[#93D0F0]", icon:<Briefcase className="w-3 h-3"/> },
  learning: { label:"Learning 📚", color:"text-[#3A9B6F]", bg:"bg-[#F0FFF4] border border-[#9FE2BF]", icon:<BookOpen className="w-3 h-3"/> },
  general:  { label:"General ✨",  color:"text-[#6B62D4]", bg:"bg-[#F0EFFF] border border-[#C5C0F5]", icon:<Sparkles className="w-3 h-3"/> },
};

// ─────────────────────────────────────────────
// PLATFORM HELPERS
// ─────────────────────────────────────────────

function detectPlatform(url: string): Platform {
  if (/youtube\.com|youtu\.be/i.test(url))  return "youtube";
  if (/tiktok\.com/i.test(url))             return "tiktok";
  if (/instagram\.com/i.test(url))          return "instagram";
  if (/facebook\.com|fb\.com/i.test(url))   return "facebook";
  if (/twitter\.com|x\.com/i.test(url))     return "twitter";
  if (/threads\.net/i.test(url))            return "threads";
  return "other";
}

// Màu nền cho platform icon
const PLATFORM_STYLE: Record<Platform, { bg: string; color: string }> = {
  youtube:   { bg:"bg-red-50",    color:"#FF0000" },
  tiktok:    { bg:"bg-gray-900",  color:"#FFFFFF" },
  instagram: { bg:"bg-pink-50",   color:"#E1306C" },
  facebook:  { bg:"bg-blue-50",   color:"#1877F2" },
  twitter:   { bg:"bg-sky-50",    color:"#1DA1F2" },
  threads:   { bg:"bg-gray-50",   color:"#000000" },
  other:     { bg:"bg-gray-50",   color:"#6B7280" },
};

function PlatformIcon({ platform, size = 14 }: { platform: Platform; size?: number }) {
  const s = `w-[${size}px] h-[${size}px]`;
  const style = { color: PLATFORM_STYLE[platform].color, width: size, height: size };
  switch (platform) {
    case "youtube":   return <Youtube   style={style} />;
    case "tiktok":    return <Music2    style={style} />;
    case "instagram": return <Instagram style={style} />;
    case "facebook":  return <Facebook  style={style} />;
    case "twitter":   return <Twitter   style={style} />;
    case "threads":   return <Globe     style={style} />;
    default:          return <Globe     style={style} />;
  }
}

// Tên hiển thị cho platform
const PLATFORM_NAME: Record<Platform, string> = {
  youtube:"YouTube", tiktok:"TikTok", instagram:"Instagram",
  facebook:"Facebook", twitter:"X (Twitter)", threads:"Threads", other:"Web",
};

function getThumbnail(url: string, platform: Platform): string {
  if (platform === "youtube") {
    const m = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (m) return `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg`;
  }
  return "";
}

function extractTitle(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\//g," ").trim();
    if (path.length > 3)
      return path.replace(/[-_]/g," ").replace(/\b\w/g, l=>l.toUpperCase()).slice(0,65);
    return u.hostname.replace("www.","").replace(/\b\w/g,l=>l.toUpperCase());
  } catch { return "Saved Link ✨"; }
}

function isStale(l: SavedLink): boolean {
  return !l.done && Date.now() - l.createdAt > 7*24*60*60*1000;
}

function timeAgo(ts: number): string {
  const d = Date.now() - ts;
  const m = Math.floor(d/60000), h = Math.floor(d/3600000), dy = Math.floor(d/86400000);
  if (m<1)  return "just now";
  if (m<60) return `${m}m ago`;
  if (h<24) return `${h}h ago`;
  return `${dy}d ago`;
}

// ─────────────────────────────────────────────
// LOCAL STORAGE
// ─────────────────────────────────────────────

const LS_LINKS   = "ziso_links_v1";
const LS_BUCKETS = "ziso_buckets_v1";

function loadLinks():   SavedLink[] { try { return JSON.parse(localStorage.getItem(LS_LINKS)||"[]");   } catch{ return []; } }
function loadBuckets(): Bucket[]    { try { const s=JSON.parse(localStorage.getItem(LS_BUCKETS)||"[]"); return s.length?s:DEFAULT_BUCKETS; } catch{ return DEFAULT_BUCKETS; } }
function saveLinks(l:   SavedLink[]) { localStorage.setItem(LS_LINKS,   JSON.stringify(l)); }
function saveBuckets(b: Bucket[])    { localStorage.setItem(LS_BUCKETS, JSON.stringify(b)); }

// ══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════

export default function ZisoApp() {
  const [links,          setLinks]          = useState<SavedLink[]>([]);
  const [buckets,        setBuckets]        = useState<Bucket[]>(DEFAULT_BUCKETS);
  const [activeBucket,   setActiveBucket]   = useState<string|null>(null);
  const [searchQ,        setSearchQ]        = useState("");
  const [toasts,         setToasts]         = useState<Toast[]>([]);
  const [confirmDlg,     setConfirmDlg]     = useState<ConfirmDialog|null>(null);
  const [previewLink,    setPreviewLink]    = useState<SavedLink|null>(null);
  const [addOpen,        setAddOpen]        = useState(false);
  const [bucketOpen,     setBucketOpen]     = useState(false);
  const [newUrl,         setNewUrl]         = useState("");
  const [purge,          setPurge]          = useState<number|null>(null);
  const [viewMode,       setViewMode]       = useState<"grid"|"list">("grid");
  const [isAdding,       setIsAdding]       = useState(false);
  const [dark,           setDark]           = useState(false);
  const [newBName,       setNewBName]       = useState("");
  const [newBIcon,       setNewBIcon]       = useState("🎬");
  const [newBColor,      setNewBColor]      = useState<BucketColor>("blush");
  const [sideOpen,       setSideOpen]       = useState(true);
  const urlRef = useRef<HTMLInputElement>(null);

  // Hydrate từ localStorage khi mount
  useEffect(() => { setLinks(loadLinks()); setBuckets(loadBuckets()); }, []);

  // Auto-purge interval: check mỗi phút, dọn link hết hạn 🧹
  useEffect(() => {
    const t = setInterval(() => {
      setLinks(prev => {
        const now = Date.now();
        const clean = prev.filter(l => !l.autoPurgeAt || l.autoPurgeAt > now);
        if (clean.length < prev.length) {
          saveLinks(clean);
          addToast("Poof! Cleaned up your old links so you can start fresh today! 🧹","info");
        }
        return clean;
      });
    }, 60_000);
    return () => clearInterval(t);
  }, []);

  // ── Toast helpers ──────────────────────────────
  const addToast = useCallback((message: string, type: Toast["type"]="success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4500);
  }, []);

  // ── One-Tap Save ───────────────────────────────
  const handleSave = async () => {
    const url = newUrl.trim();
    if (!url.startsWith("http")) {
      addToast("That doesn't look like a valid link! 🤔","warning"); return;
    }
    setIsAdding(true);
    await new Promise(r => setTimeout(r, 700)); // UI feedback delay

    const platform    = detectPlatform(url);
    const category    = magicSorter(url);
    const flashNote   = generateVibeNote(category);
    const bucketId    = magicSorterToBucketId(url, buckets);
    const bucket      = buckets.find(b => b.id === bucketId);

    const link: SavedLink = {
      id:            Math.random().toString(36).slice(2),
      url, platform, bucketId,
      title:         extractTitle(url),
      thumbnail:     getThumbnail(url, platform),
      flashNote, magicCategory: category,
      createdAt:     Date.now(),
      done:          false,
      autoPurgeAt:   purge ? Date.now() + purge*86_400_000 : undefined,
    };

    const next = [link, ...links];
    setLinks(next); saveLinks(next);
    setIsAdding(false); setAddOpen(false);
    setNewUrl(""); setPurge(null);

    // Toast cascade — đẹp như cinematic sequence 🎬
    addToast("Got it! Tucked that away safely for you! ✨","success");
    setTimeout(()=>addToast(`Sorted! Found a cozy spot in your '${bucket?.name}' folder! 🏠`,"success"),700);
    setTimeout(()=>addToast(`✦ ${CATEGORY_META[category].label} — ${flashNote}`,"magic"),1500);
    if (platform !== "other")
      setTimeout(()=>addToast("Look at you, exploring the whole internet! 🌐","info"),2400);
  };

  // ── Mark Done flow ─────────────────────────────
  const handleDone = (id: string) => setConfirmDlg({ linkId: id });

  const confirmDone = (remove: boolean) => {
    if (!confirmDlg) return;
    if (remove) {
      const next = links.filter(l => l.id !== confirmDlg.linkId);
      setLinks(next); saveLinks(next);
      addToast("Bye-bye! Making room for fresh ideas! 🌟","success");
    } else {
      const next = links.map(l => l.id===confirmDlg.linkId ? {...l,done:true} : l);
      setLinks(next); saveLinks(next);
      addToast("Marked done! Proud of you! ⭐","success");
    }
    setConfirmDlg(null);
  };

  // ── Delete ────────────────────────────────────
  const handleDelete = (id: string) => {
    const next = links.filter(l => l.id !== id);
    setLinks(next); saveLinks(next);
    addToast("Gone! Your vault is cleaner now. ✨","info");
  };

  // ── Preview ───────────────────────────────────
  const handlePreview = (link: SavedLink) => {
    const next = links.map(l => l.id===link.id ? {...l,viewedAt:Date.now()} : l);
    setLinks(next); saveLinks(next);
    setPreviewLink(link);
  };

  // ── Create Bucket ─────────────────────────────
  const handleCreateBucket = () => {
    if (!newBName.trim()) return;
    const b: Bucket = {
      id:        Math.random().toString(36).slice(2),
      name:      newBName.trim(),
      icon:      newBIcon,
      color:     newBColor,
      createdAt: Date.now(),
    };
    const next = [...buckets, b];
    setBuckets(next); saveBuckets(next);
    setBucketOpen(false); setNewBName(""); 
    addToast(`'${b.name}' bucket is live and ready! 🪣`,"success");
  };

  // ── Filtered view ──────────────────────────────
  const filtered = links.filter(l => {
    const inBucket = activeBucket ? l.bucketId===activeBucket : true;
    const inSearch = searchQ
      ? [l.title,l.url,l.flashNote].some(s=>s.toLowerCase().includes(searchQ.toLowerCase()))
      : true;
    return inBucket && inSearch;
  });

  const staleCount = links.filter(isStale).length;
  const doneCount  = links.filter(l=>l.done).length;

  // ── Derived UI ────────────────────────────────
  const activeBucketData = buckets.find(b => b.id === activeBucket);

  // ══════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════
  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${dark?"bg-[#12111A] text-[#EDE9FF]":"bg-[#FBF9FF] text-[#1E1B2E]"}`}
      style={{ fontFamily:"'DM Sans', 'Nunito', system-ui, sans-serif" }}
    >

      {/* ── Global styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=Space+Grotesk:wght@300;400;500;600;700&display=swap');

        /* — Scrollbar — */
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#C5C0F5;border-radius:99px}

        /* — Animations — */
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes popIn{0%{opacity:0;transform:scale(.82)}60%{opacity:1;transform:scale(1.04)}100%{transform:scale(1)}}
        @keyframes toastIn{from{opacity:0;transform:translateX(110%)}to{opacity:1;transform:translateX(0)}}
        @keyframes shimmer{0%{background-position:-400% 0}100%{background-position:400% 0}}
        @keyframes glow{0%,100%{box-shadow:0 0 0 0 rgba(197,192,245,.0)}50%{box-shadow:0 0 16px 4px rgba(197,192,245,.35)}}
        @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes spin360{to{transform:rotate(360deg)}}

        .anim-fade-up{animation:fadeUp .35s cubic-bezier(.25,.46,.45,.94) both}
        .anim-fade-in{animation:fadeIn .3s ease both}
        .anim-pop-in {animation:popIn  .4s cubic-bezier(.34,1.56,.64,1) both}
        .anim-toast  {animation:toastIn .38s cubic-bezier(.22,1,.36,1) both}
        .anim-float  {animation:floatY 3s ease-in-out infinite}
        .anim-spin   {animation:spin360 .8s linear infinite}

        /* — Card hover — */
        .ziso-card{transition:transform .22s ease,box-shadow .22s ease}
        .ziso-card:hover{transform:scale(1.025);box-shadow:0 10px 40px rgba(107,98,212,.12)}
        .ziso-card:hover .done-reveal{opacity:1;transform:translateY(0)}
        .done-reveal{opacity:0;transform:translateY(6px);transition:opacity .2s ease,transform .2s ease}

        /* — Sidebar item — */
        .side-item{transition:all .15s ease}
        .side-item:hover{transform:translateX(4px)}

        /* — Glass — */
        .glass{backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}

        /* — Shimmer skeleton — */
        .shimmer{background:linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);background-size:400% 100%;animation:shimmer 1.4s ease infinite}

        /* — Neon pill — */
        .neon-pill{box-shadow:0 0 10px 2px rgba(197,192,245,.4)}

        /* — Stale badge — */
        .stale-badge{animation:glow 2.2s ease-in-out infinite}
      `}</style>

      {/* ════════════════════════════════════════
          TOPBAR
      ════════════════════════════════════════ */}
      <header className={`sticky top-0 z-40 border-b glass ${
        dark?"bg-[#12111A]/85 border-[#2A2840]":"bg-white/80 border-[#EDE9FF]/70"
      }`}>
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-3">

          {/* Logo */}
          <button
            onClick={()=>setSideOpen(p=>!p)}
            className="flex items-center gap-2.5 group flex-shrink-0"
          >
            <div
              className="w-8 h-8 rounded-2xl flex items-center justify-center text-base font-black text-white shadow-sm group-hover:scale-110 transition-transform"
              style={{background:"linear-gradient(135deg,#C5C0F5,#F9C6C6,#9FE2BF)"}}
            >Z</div>
            <span
              className="font-black text-lg tracking-tighter hidden sm:block"
              style={{fontFamily:"'Space Grotesk',sans-serif",
                background:"linear-gradient(120deg,#6B62D4,#C45C5C,#3A9B6F)",
                WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}
            >ZISO</span>
          </button>

          {/* Search */}
          <div className={`flex-1 max-w-md mx-auto flex items-center gap-2 rounded-2xl px-3 py-2 border transition-all ${
            dark
              ?"bg-[#1E1C2E] border-[#2A2840] focus-within:border-[#C5C0F5]"
              :"bg-[#F5F3FF] border-[#DDD9FF] focus-within:border-[#9F99E8]"
          }`}>
            <Search className="w-3.5 h-3.5 opacity-40 flex-shrink-0"/>
            <input
              placeholder="Search your vault…"
              value={searchQ}
              onChange={e=>setSearchQ(e.target.value)}
              className="flex-1 bg-transparent outline-none text-[13px] font-medium placeholder:opacity-35"
            />
            {searchQ&&<button onClick={()=>setSearchQ("")}><X className="w-3 h-3 opacity-40 hover:opacity-80"/></button>}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
            {/* Stale nudge */}
            {staleCount>0&&(
              <button
                onClick={()=>addToast(`Psst... ${staleCount} link${staleCount>1?"s are":" is"} getting a bit dusty! 🧊 Still want to check them out?`,"warning")}
                className="relative p-2 rounded-xl bg-[#FFF5EE] hover:bg-[#FFBB94]/30 transition-colors"
              >
                <Bell className="w-4 h-4 text-[#D2601A]"/>
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#D2601A] text-white text-[8px] font-black rounded-full flex items-center justify-center">{staleCount}</span>
              </button>
            )}

            {/* View toggle */}
            <div className={`flex rounded-xl overflow-hidden border ${dark?"border-[#2A2840]":"border-[#DDD9FF]"}`}>
              {(["grid","list"] as const).map(v=>(
                <button key={v} onClick={()=>setViewMode(v)}
                  className={`p-2 transition-colors ${viewMode===v
                    ?"bg-[#C5C0F5] text-[#4A3FA0]"
                    :dark?"bg-[#1E1C2E] text-gray-500":"bg-white text-gray-400"}`}
                >{v==="grid"?<LayoutGrid className="w-3.5 h-3.5"/>:<List className="w-3.5 h-3.5"/>}</button>
              ))}
            </div>

            {/* Dark toggle */}
            <button
              onClick={()=>setDark(p=>!p)}
              className={`p-2 rounded-xl transition-colors ${dark?"bg-[#1E1C2E] text-yellow-300":"bg-[#FFFDE7] text-[#B8860B]"}`}
            >
              {dark?<Sun className="w-4 h-4"/>:<Moon className="w-4 h-4"/>}
            </button>

            {/* CTA */}
            <button
              onClick={()=>{setAddOpen(true);setTimeout(()=>urlRef.current?.focus(),80)}}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[13px] font-black text-white shadow-md hover:shadow-lg transition-all active:scale-95"
              style={{background:"linear-gradient(130deg,#9F99E8,#C5C0F5,#F9C6C6)"}}
            >
              <Plus className="w-3.5 h-3.5"/>
              <span className="hidden sm:inline">Save Link</span>
            </button>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════
          LAYOUT
      ════════════════════════════════════════ */}
      <div className="max-w-screen-xl mx-auto flex">

        {/* ── Sidebar ─────────────────────────── */}
        <aside className={`transition-all duration-300 flex-shrink-0 ${sideOpen?"w-52":"w-0 overflow-hidden"}`}>
          <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-5 px-2.5 flex flex-col gap-0.5">

            {/* Stats chips */}
            <div className="flex gap-1.5 mb-4 px-1">
              <div className={`flex-1 rounded-2xl p-2 text-center border ${dark?"bg-[#1E1C2E] border-[#2A2840]":"bg-white border-[#EDE9FF]"}`}>
                <p className="text-lg font-black">{links.length}</p>
                <p className="text-[10px] opacity-40 font-medium leading-none">saved</p>
              </div>
              <div className={`flex-1 rounded-2xl p-2 text-center border ${dark?"bg-[#1E1C2E] border-[#2A2840]":"bg-white border-[#EDE9FF]"}`}>
                <p className="text-lg font-black text-[#3A9B6F]">{doneCount}</p>
                <p className="text-[10px] opacity-40 font-medium leading-none">done</p>
              </div>
            </div>

            {/* All */}
            <button
              onClick={()=>setActiveBucket(null)}
              className={`side-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-[13px] font-semibold ${
                !activeBucket
                  ?"bg-gradient-to-r from-[#C5C0F5]/60 to-[#F9C6C6]/40 text-[#4A3FA0] border border-[#C5C0F5]/50"
                  :dark?"text-[#EDE9FF] hover:bg-[#1E1C2E]":"text-[#1E1B2E] hover:bg-[#F5F3FF]"
              }`}
            >
              <span className="text-base">🌈</span>
              <span className="flex-1 text-left">All Saved</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-lg font-bold ${!activeBucket?(dark?"bg-white/20":"bg-white/60"):dark?"bg-[#1E1C2E]":"bg-[#F5F3FF]"}`}>
                {links.length}
              </span>
            </button>

            <p className="text-[10px] font-black uppercase tracking-[.12em] opacity-30 px-3 pt-4 pb-1.5">Buckets</p>

            {buckets.map(b=>{
              const cnt   = links.filter(l=>l.bucketId===b.id).length;
              const pal   = BUCKET_PALETTE[b.color];
              const isAct = activeBucket===b.id;
              return (
                <button key={b.id}
                  onClick={()=>setActiveBucket(isAct?null:b.id)}
                  className={`side-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-[13px] font-semibold transition-colors ${
                    isAct
                      ?`${pal.bg} ${pal.text} border ${pal.border}`
                      :dark?"text-[#EDE9FF] hover:bg-[#1E1C2E]":"text-[#1E1B2E] hover:bg-[#F5F3FF]"
                  }`}
                >
                  <span className="text-base">{b.icon}</span>
                  <span className="flex-1 text-left truncate">{b.name}</span>
                  {cnt>0&&<span className={`text-[11px] px-1.5 py-0.5 rounded-lg font-bold ${isAct?"bg-white/50":dark?"bg-[#1E1C2E]":"bg-[#F5F3FF]"}`}>{cnt}</span>}
                </button>
              );
            })}

            {/* New bucket */}
            <button
              onClick={()=>setBucketOpen(true)}
              className={`side-item w-full flex items-center gap-2 px-3 py-2.5 rounded-2xl mt-2 text-[13px] font-semibold border-2 border-dashed transition-colors ${
                dark?"border-[#2A2840] text-gray-500 hover:border-[#C5C0F5] hover:text-[#C5C0F5]"
                    :"border-[#DDD9FF] text-[#9F99E8] hover:bg-[#F5F3FF]"
              }`}
            >
              <Plus className="w-4 h-4"/><span>New Bucket</span>
            </button>

          </div>
        </aside>

        {/* ── Main ────────────────────────────── */}
        <main className="flex-1 min-w-0 px-4 pt-6 pb-24">

          {/* Section heading */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-black text-2xl tracking-tight" style={{fontFamily:"'Space Grotesk',sans-serif"}}>
                {activeBucketData ? `${activeBucketData.icon} ${activeBucketData.name}` : "✦ All Saved"}
              </h1>
              <p className="text-xs opacity-40 mt-0.5 font-medium">
                {filtered.length} item{filtered.length!==1?"s":""}{searchQ?` for "${searchQ}"`:""}
              </p>
            </div>
            {doneCount>0&&(
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#F0FFF4] border border-[#9FE2BF] text-[#3A9B6F] text-xs font-bold">
                <Check className="w-3 h-3"/>{doneCount} done
              </div>
            )}
          </div>

          {/* ── Empty State ────────────────────── */}
          {filtered.length===0&&(
            <div className="flex flex-col items-center justify-center py-28 anim-fade-in">
              <div className="text-6xl mb-5 anim-float">
                {searchQ?"🔍":"🗃️"}
              </div>
              <p className="text-lg font-bold opacity-50 text-center max-w-xs leading-snug">
                {searchQ?`Nothing vibes with "${searchQ}"…`:"The warehouse is empty,\nlet's add something to it! ✨"}
              </p>
              {!searchQ&&(
                <button
                  onClick={()=>{setAddOpen(true);setTimeout(()=>urlRef.current?.focus(),80)}}
                  className="mt-6 px-6 py-3 rounded-2xl text-sm font-black text-white shadow-md hover:shadow-lg active:scale-95 transition-all"
                  style={{background:"linear-gradient(130deg,#9F99E8,#C5C0F5)"}}
                >Drop your first link ✦</button>
              )}
            </div>
          )}

          {/* ── Grid / List ────────────────────── */}
          {filtered.length>0&&(
            <div className={viewMode==="grid"
              ?"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              :"flex flex-col gap-3"
            }>
              {filtered.map((link,i) => {
                const bkt    = buckets.find(b=>b.id===link.bucketId);
                const pal    = BUCKET_PALETTE[bkt?.color??"blush"];
                const stale  = isStale(link);
                const catM   = CATEGORY_META[link.magicCategory];
                const pStyle = PLATFORM_STYLE[link.platform];

                return viewMode==="grid" ? (
                  /* ─ GRID CARD ─ */
                  <div
                    key={link.id}
                    className={`ziso-card relative rounded-3xl border overflow-hidden anim-fade-up ${
                      link.done
                        ?dark?"opacity-40 bg-[#1A1828] border-[#2A2840]":"opacity-40 bg-[#F8F8F8] border-[#E0E0E0]"
                        :dark?"bg-[#1A1828] border-[#2A2840]":"bg-white border-[#EDE9FF]/80"
                    } shadow-sm`}
                    style={{animationDelay:`${i*40}ms`}}
                  >
                    {/* Stale glow */}
                    {stale&&!link.done&&(
                      <div className="absolute top-2.5 right-2.5 z-10">
                        <div className="stale-badge flex items-center gap-1 px-2 py-0.5 rounded-xl bg-[#FFF5EE] border border-[#FFBB94] text-[#D2601A] text-[10px] font-bold">
                          <Snowflake className="w-2.5 h-2.5"/>Dusty
                        </div>
                      </div>
                    )}

                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden cursor-pointer group" onClick={()=>handlePreview(link)}>
                      {link.thumbnail
                        ?<img src={link.thumbnail} alt={link.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                           onError={e=>{(e.target as HTMLImageElement).style.display="none"}}/>
                        :<div className={`w-full h-full flex flex-col items-center justify-center gap-1 ${pal.bg}`}>
                           <span className="text-3xl">{bkt?.icon??"🔗"}</span>
                           <span className={`text-[10px] font-bold ${pal.text}`}>{bkt?.name}</span>
                         </div>
                      }
                      {/* Platform badge */}
                      <div className={`absolute bottom-2 left-2 w-6 h-6 rounded-xl flex items-center justify-center shadow-sm ${pStyle.bg}`}>
                        <PlatformIcon platform={link.platform} size={12}/>
                      </div>
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-[#1E1B2E]/0 group-hover:bg-[#1E1B2E]/20 transition-colors flex items-center justify-center">
                        <Eye className="w-7 h-7 text-white opacity-0 group-hover:opacity-100 transition-opacity"/>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-3.5">
                      {/* Bucket tag */}
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xl text-[10px] font-bold mb-2 ${pal.bg} ${pal.text}`}>
                        {bkt?.icon} {bkt?.name}
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-[13px] leading-snug mb-2 line-clamp-2">{link.title}</h3>

                      {/* Magic category badge + flash note */}
                      <div className="mb-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xl text-[10px] font-bold mb-1.5 ${catM.bg} ${catM.color}`}>
                          {catM.icon}&nbsp;{catM.label}
                        </span>
                        <p className="text-[11px] leading-relaxed opacity-50 italic line-clamp-2">{link.flashNote}</p>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mb-0">
                        <span className="text-[10px] opacity-35 font-medium">
                          <Clock className="w-2.5 h-2.5 inline mr-0.5"/>{timeAgo(link.createdAt)}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <a href={link.url} target="_blank" rel="noopener noreferrer"
                             onClick={e=>e.stopPropagation()}
                             className="p-1.5 rounded-xl hover:bg-[#F0FFF4] transition-colors">
                            <ArrowUpRight className="w-3 h-3 text-[#3A9B6F]"/>
                          </a>
                          <button onClick={()=>handleDelete(link.id)}
                             className="p-1.5 rounded-xl hover:bg-[#FDF2F2] transition-colors">
                            <Trash2 className="w-3 h-3 text-[#C45C5C]"/>
                          </button>
                        </div>
                      </div>

                      {/* Done button — hover reveal */}
                      {!link.done
                        ?<button onClick={()=>handleDone(link.id)}
                           className="done-reveal mt-2.5 w-full py-1.5 rounded-2xl text-[12px] font-black text-[#4A3FA0] transition-all hover:shadow-sm"
                           style={{background:"linear-gradient(130deg,#C5C0F5,#F9C6C6)"}}>
                           ✅ Done!
                         </button>
                        :<div className="mt-2.5 flex items-center justify-center gap-1 text-[11px] text-[#3A9B6F] font-bold">
                           <Check className="w-3 h-3"/> Completed!
                         </div>
                      }
                    </div>
                  </div>

                ) : (
                  /* ─ LIST ROW ─ */
                  <div
                    key={link.id}
                    className={`ziso-card flex items-center gap-3 p-3 rounded-2xl border anim-fade-up ${
                      link.done
                        ?dark?"opacity-40 bg-[#1A1828] border-[#2A2840]":"opacity-40 bg-[#F8F8F8] border-[#E0E0E0]"
                        :dark?"bg-[#1A1828] border-[#2A2840]":"bg-white border-[#EDE9FF]/80"
                    } shadow-sm`}
                    style={{animationDelay:`${i*25}ms`}}
                  >
                    {/* Thumb */}
                    <div className="w-16 h-12 rounded-2xl overflow-hidden flex-shrink-0 cursor-pointer" onClick={()=>handlePreview(link)}>
                      {link.thumbnail
                        ?<img src={link.thumbnail} alt="" className="w-full h-full object-cover"/>
                        :<div className={`w-full h-full flex items-center justify-center text-xl ${pal.bg}`}>{bkt?.icon}</div>
                      }
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <div className={`flex items-center gap-0.5 w-5 h-5 rounded-lg justify-center ${pStyle.bg}`}>
                          <PlatformIcon platform={link.platform} size={11}/>
                        </div>
                        <span className={`text-[10px] font-bold ${pal.text}`}>{bkt?.name}</span>
                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-[9px] font-bold ${catM.bg} ${catM.color}`}>
                          {catM.label}
                        </span>
                        {stale&&!link.done&&<Snowflake className="w-3 h-3 text-[#D2601A]"/>}
                      </div>
                      <h3 className="font-bold text-[13px] truncate">{link.title}</h3>
                      <p className="text-[11px] opacity-40 italic truncate">{link.flashNote}</p>
                    </div>

                    <span className="text-[10px] opacity-35 hidden md:block">{timeAgo(link.createdAt)}</span>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {!link.done&&(
                        <button onClick={()=>handleDone(link.id)}
                          className="done-reveal px-2.5 py-1.5 rounded-xl text-[11px] font-black text-[#4A3FA0]"
                          style={{background:"linear-gradient(130deg,#C5C0F5,#F9C6C6)"}}>
                          ✅
                        </button>
                      )}
                      <a href={link.url} target="_blank" rel="noopener noreferrer"
                         className="p-1.5 rounded-xl hover:bg-[#F0FFF4] transition-colors">
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#3A9B6F]"/>
                      </a>
                      <button onClick={()=>handleDelete(link.id)}
                         className="p-1.5 rounded-xl hover:bg-[#FDF2F2] transition-colors">
                        <Trash2 className="w-3.5 h-3.5 text-[#C45C5C]"/>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* ════════════════════════════════════════
          MODAL — ADD LINK
      ════════════════════════════════════════ */}
      {addOpen&&(
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 anim-fade-in"
          style={{background:"rgba(18,17,26,.5)",backdropFilter:"blur(6px)"}}
          onClick={e=>{if(e.target===e.currentTarget)setAddOpen(false)}}
        >
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl anim-fade-up ${dark?"bg-[#1A1828] text-[#EDE9FF]":"bg-white"}`}>

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-black text-xl" style={{fontFamily:"'Space Grotesk',sans-serif"}}>Drop a link ✦</h2>
                <p className="text-xs opacity-40 mt-0.5">ZISO sorts it automagically for you</p>
              </div>
              <button onClick={()=>setAddOpen(false)} className="p-2 rounded-xl hover:bg-[#F5F3FF] transition-colors">
                <X className="w-4 h-4"/>
              </button>
            </div>

            {/* URL input */}
            <div className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 mb-4 transition-all ${
              dark?"bg-[#12111A] border-[#2A2840] focus-within:border-[#C5C0F5]"
                  :"bg-[#F5F3FF] border-[#DDD9FF] focus-within:border-[#9F99E8]"
            }`}>
              <Globe className="w-4 h-4 opacity-35 flex-shrink-0"/>
              <input
                ref={urlRef}
                type="url"
                placeholder="https://paste-your-link-here.com"
                value={newUrl}
                onChange={e=>setNewUrl(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&handleSave()}
                className="flex-1 bg-transparent outline-none text-[13px] font-medium placeholder:opacity-35"
              />
              {/* Live platform detect */}
              {newUrl&&(
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${PLATFORM_STYLE[detectPlatform(newUrl)].bg}`}>
                  <PlatformIcon platform={detectPlatform(newUrl)} size={13}/>
                </div>
              )}
            </div>

            {/* Live preview of Magic Sort */}
            {newUrl.startsWith("http")&&(
              <div className={`rounded-2xl p-3 mb-4 border ${dark?"bg-[#12111A] border-[#2A2840]":"bg-[#F5F3FF] border-[#DDD9FF]"}`}>
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-[#9F99E8]"/>
                  <span className="text-[11px] font-bold text-[#9F99E8]">Magic Sorter Preview</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                  {(()=>{
                    const cat=magicSorter(newUrl);
                    const m=CATEGORY_META[cat];
                    const bid=magicSorterToBucketId(newUrl,buckets);
                    const bkt=buckets.find(b=>b.id===bid);
                    return(<>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xl text-[10px] font-bold ${m.bg} ${m.color}`}>
                        {m.icon}&nbsp;{m.label}
                      </span>
                      <ChevronRight className="w-3 h-3 opacity-30"/>
                      <span className={`text-[10px] font-bold ${BUCKET_PALETTE[bkt?.color??"blush"].text}`}>
                        {bkt?.icon} {bkt?.name}
                      </span>
                    </>);
                  })()}
                </div>
              </div>
            )}

            {/* Auto-purge */}
            <div className={`rounded-2xl p-3 mb-5 border ${dark?"bg-[#12111A] border-[#2A2840]":"bg-[#FFFDE7] border-[#FFE082]"}`}>
              <div className="flex items-center gap-1.5 mb-2">
                <Timer className="w-3.5 h-3.5 text-[#B8860B]"/>
                <span className="text-[11px] font-bold text-[#B8860B]">Self-Destruct Timer</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {([null,1,3,7,30] as (number|null)[]).map(d=>(
                  <button key={String(d)} onClick={()=>setPurge(d)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                      purge===d?"bg-[#B8860B] text-white":"bg-white text-[#B8860B] border border-[#FFE082] hover:bg-[#FFF9C4]"
                    }`}>
                    {d===null?"Never":`${d}d`}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSave}
              disabled={isAdding||!newUrl}
              className="w-full py-3 rounded-2xl font-black text-[14px] text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg active:scale-95"
              style={{background:"linear-gradient(130deg,#9F99E8,#C5C0F5,#F9C6C6)"}}
            >
              {isAdding
                ?<span className="flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4 anim-spin"/>Sorting the magic…</span>
                :"Save & Sort ✦"
              }
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          MODAL — CREATE BUCKET
      ════════════════════════════════════════ */}
      {bucketOpen&&(
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 anim-fade-in"
          style={{background:"rgba(18,17,26,.5)",backdropFilter:"blur(6px)"}}
          onClick={e=>{if(e.target===e.currentTarget)setBucketOpen(false)}}
        >
          <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl anim-fade-up ${dark?"bg-[#1A1828] text-[#EDE9FF]":"bg-white"}`}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-black text-xl" style={{fontFamily:"'Space Grotesk',sans-serif"}}>New Bucket 🪣</h2>
                <p className="text-xs opacity-40 mt-0.5">Design your digital space</p>
              </div>
              <button onClick={()=>setBucketOpen(false)} className="p-2 rounded-xl hover:bg-[#F5F3FF]"><X className="w-4 h-4"/></button>
            </div>

            {/* Name */}
            <input
              type="text" placeholder="Bucket name…"
              value={newBName} onChange={e=>setNewBName(e.target.value)}
              className={`w-full rounded-2xl border px-3 py-2.5 mb-4 text-[13px] font-semibold outline-none ${
                dark?"bg-[#12111A] border-[#2A2840]":"bg-[#F5F3FF] border-[#DDD9FF]"
              }`}
            />

            {/* Icon */}
            <p className="text-[10px] font-black uppercase tracking-wider opacity-40 mb-2">Icon</p>
            <div className="grid grid-cols-10 gap-1 mb-4">
              {BUCKET_ICONS.map(ic=>(
                <button key={ic} onClick={()=>setNewBIcon(ic)}
                  className={`text-xl p-1 rounded-xl transition-all ${newBIcon===ic?"bg-[#C5C0F5] scale-110":dark?"hover:bg-[#12111A]":"hover:bg-[#F5F3FF]"}`}>
                  {ic}
                </button>
              ))}
            </div>

            {/* Color */}
            <p className="text-[10px] font-black uppercase tracking-wider opacity-40 mb-2">Color</p>
            <div className="flex gap-2 flex-wrap mb-5">
              {(Object.keys(BUCKET_PALETTE) as BucketColor[]).map(c=>(
                <button key={c} onClick={()=>setNewBColor(c)}
                  className={`w-8 h-8 rounded-xl border-2 transition-all ${BUCKET_PALETTE[c].dot} ${
                    newBColor===c?"border-[#6B62D4] scale-110":"border-transparent"
                  }`}/>
              ))}
            </div>

            {/* Preview */}
            <div className={`flex items-center gap-3 p-3 rounded-2xl border mb-4 ${BUCKET_PALETTE[newBColor].bg} ${BUCKET_PALETTE[newBColor].border}`}>
              <span className="text-2xl">{newBIcon}</span>
              <span className={`font-bold text-sm ${BUCKET_PALETTE[newBColor].text}`}>{newBName||"My Bucket"}</span>
            </div>

            <button
              onClick={handleCreateBucket}
              disabled={!newBName.trim()}
              className="w-full py-3 rounded-2xl font-black text-white disabled:opacity-50 hover:shadow-lg active:scale-95 transition-all"
              style={{background:"linear-gradient(130deg,#C5C0F5,#9F99E8)"}}
            >
              Create Bucket ✦
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          DIALOG — DONE CONFIRM
      ════════════════════════════════════════ */}
      {confirmDlg&&(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 anim-fade-in"
          style={{background:"rgba(18,17,26,.55)",backdropFilter:"blur(8px)"}}
        >
          <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl anim-pop-in text-center ${dark?"bg-[#1A1828] text-[#EDE9FF]":"bg-white"}`}>
            <div className="text-5xl mb-3">🔥</div>
            <h3 className="font-black text-lg mb-1" style={{fontFamily:"'Space Grotesk',sans-serif"}}>You're on fire!</h3>
            <p className="text-sm opacity-55 mb-5 leading-relaxed">Should we clear this out to make room for new ideas?</p>
            <div className="flex gap-3">
              <button onClick={()=>confirmDone(true)}
                className="flex-1 py-3 rounded-2xl font-bold text-sm text-white transition-all active:scale-95"
                style={{background:"linear-gradient(130deg,#F9C6C6,#C45C5C)"}}>
                Yes, bye-bye! 👋
              </button>
              <button onClick={()=>confirmDone(false)}
                className={`flex-1 py-3 rounded-2xl font-bold text-sm border-2 transition-all active:scale-95 ${
                  dark?"border-[#2A2840] hover:bg-[#12111A]":"border-[#C5C0F5] text-[#6B62D4] hover:bg-[#F5F3FF]"
                }`}>
                Wait, keep it! 💜
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          MODAL — IN-APP PREVIEW
      ════════════════════════════════════════ */}
      {previewLink&&(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 anim-fade-in"
          style={{background:"rgba(0,0,0,.75)",backdropFilter:"blur(10px)"}}
          onClick={e=>{if(e.target===e.currentTarget)setPreviewLink(null)}}
        >
          <div className={`w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl anim-fade-up ${dark?"bg-[#1A1828]":"bg-white"}`}>

            {/* Header bar */}
            <div className={`flex items-center gap-3 p-4 border-b ${dark?"border-[#2A2840]":"border-[#EDE9FF]"}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${PLATFORM_STYLE[previewLink.platform].bg}`}>
                <PlatformIcon platform={previewLink.platform} size={16}/>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[13px] truncate">{previewLink.title}</h3>
                <p className="text-[10px] opacity-35 truncate">{PLATFORM_NAME[previewLink.platform]} · {previewLink.url}</p>
              </div>
              <a href={previewLink.url} target="_blank" rel="noopener noreferrer"
                 className="p-2 rounded-xl bg-[#F0FFF4] text-[#3A9B6F] hover:bg-[#9FE2BF]/30 transition-colors flex-shrink-0">
                <ExternalLink className="w-4 h-4"/>
              </a>
              <button onClick={()=>setPreviewLink(null)}
                className="p-2 rounded-xl hover:bg-[#FDF2F2] transition-colors flex-shrink-0">
                <X className="w-4 h-4"/>
              </button>
            </div>

            {/* Content */}
            <div className="relative bg-black" style={{paddingBottom:"56.25%"}}>
              {previewLink.platform==="youtube"?(()=>{
                const m=previewLink.url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                return m?<iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${m[1]}?autoplay=1`}
                  allow="autoplay;encrypted-media" allowFullScreen/>:null;
              })():(
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/50 p-8">
                  <Eye className="w-12 h-12 opacity-30"/>
                  <p className="text-sm text-center leading-relaxed">
                    Preview unavailable for {PLATFORM_NAME[previewLink.platform]}.<br/>
                    <a href={previewLink.url} target="_blank" rel="noopener noreferrer"
                       className="text-[#C5C0F5] hover:underline">Open in new tab</a> to stay focused! ✦
                  </p>
                </div>
              )}
            </div>

            {/* Flash note footer */}
            <div className={`px-4 py-3 flex items-start gap-2 border-t ${dark?"bg-[#12111A]/60 border-[#2A2840]":"bg-[#F5F3FF]/60 border-[#EDE9FF]"}`}>
              <Sparkles className="w-3.5 h-3.5 text-[#C5C0F5] flex-shrink-0 mt-0.5"/>
              <p className="text-[12px] opacity-60 italic leading-relaxed">{previewLink.flashNote}</p>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          TOASTS
      ════════════════════════════════════════ */}
      <div className="fixed bottom-5 right-4 z-50 flex flex-col gap-2 items-end">
        {toasts.map(t=>(
          <div
            key={t.id}
            className={`anim-toast flex items-start gap-2.5 pl-4 pr-3 py-3 rounded-2xl shadow-xl max-w-[300px] text-[12px] font-semibold leading-snug border ${
              t.type==="success"?"bg-white border-[#9FE2BF] text-[#1E4D35]":
              t.type==="warning"?"bg-[#FFF5EE] border-[#FFBB94] text-[#7A3A10]":
              t.type==="magic" ?"bg-[#F5F3FF] border-[#C5C0F5] text-[#3D3580] neon-pill":
              "bg-[#F0EFFF] border-[#C5C0F5] text-[#3D3580]"
            }`}
          >
            <span className="flex-1">{t.message}</span>
            <button onClick={()=>setToasts(p=>p.filter(x=>x.id!==t.id))} className="opacity-35 hover:opacity-80 flex-shrink-0 mt-0.5">
              <X className="w-3 h-3"/>
            </button>
          </div>
        ))}
      </div>

      {/* ── Mobile FAB ── */}
      <button
        onClick={()=>{setAddOpen(true);setTimeout(()=>urlRef.current?.focus(),80)}}
        className="fixed bottom-5 left-1/2 -translate-x-1/2 sm:hidden z-40 flex items-center gap-2 px-5 py-3 rounded-full font-black text-sm text-white shadow-2xl active:scale-95 transition-all"
        style={{background:"linear-gradient(130deg,#9F99E8,#C5C0F5,#F9C6C6)"}}
      >
        <Plus className="w-4 h-4"/> Save Link ✦
      </button>
    </div>
  );
}
