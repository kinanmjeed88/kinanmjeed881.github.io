
import React, { useState, useEffect, useMemo } from 'react';
import { telegramChannels, footerData, profileConfig, socialLinks } from './data/content';
import { articlesData } from './data/articles'; // Import articles data
import { ChannelCard } from './components/ChannelCard';
import { SocialLinks } from './components/SocialLinks';
import { 
  Home, Info, 
  Wrench, Smartphone, Loader2, ChevronLeft, ChevronRight,
  AlertCircle, Send,
  Download, X, Search,
  BarChart3, PieChart,
  LayoutGrid, Copy, Facebook, Instagram, ExternalLink,
  RotateCcw, Eye, Command, AlertTriangle, BookOpen, Share2,
  Sparkles, Bot, ListPlus
} from 'lucide-react';
import { TelegramIcon } from './components/Icons'; 
import { PhoneComparisonResult, PhoneNewsItem, StatsResult, BrandFile, LocalPhone, AITool, ArticleItem } from './types';

// Importing Local Data - Using relative paths
import samsungData from './data/phones-backup/samsung.json';
import appleData from './data/phones-backup/apple.json';
import googleData from './data/phones-backup/google.json';
import xiaomiData from './data/phones-backup/xiaomi.json';
import huaweiData from './data/phones-backup/huawei.json';
import oneplusData from './data/phones-backup/oneplus.json';
import oppoData from './data/phones-backup/oppo.json';
import vivoData from './data/phones-backup/vivo.json';
import realmeData from './data/phones-backup/realme.json';
import sonyData from './data/phones-backup/sony.json';
import tecnoData from './data/phones-backup/tecno.json'; 
import infinixData from './data/phones-backup/infinix.json';

// Import AI Tools Data directly to avoid fetch/404 issues on GitHub Pages
import aiToolsData from './data/ai-tools.json';

type TabType = 'home' | 'info' | 'tools';
type ToolView = 'main' | 'ai-directory' | 'comparison' | 'phone-news' | 'stats' | 'articles';

const CACHE_KEYS = {
  PHONE_NEWS: 'techtouch_phones_strict_v4'
};

const SPEC_ORDER = [
  'network', 'launch', 'body', 'display', 'platform', 
  'memory', 'main_camera', 'selfie_camera', 'sound', 
  'comms', 'features', 'battery', 'misc'
];

const SPEC_LABELS: Record<string, string> = {
  network: "الشبكة والاتصال",
  launch: "تاريخ الإطلاق",
  body: "الهيكل والأبعاد",
  display: "الشاشة والدقة",
  platform: "المعالج والأداء",
  memory: "الذاكرة والتخزين",
  main_camera: "الكاميرا الخلفية",
  selfie_camera: "الكاميرا الأمامية",
  sound: "الصوتيات",
  comms: "واي فاي وبلوتوث",
  features: "المستشعرات والإضافات",
  battery: "البطارية والشحن",
  misc: "ألوان ومعلومات إضافية"
};

// 🔴 MASTER PROMPT
const MASTER_RULES = `
أنت تعمل داخل موقع ويب اسمه "Techtouch".
دورك الوحيد هو معالجة البيانات الموثوقة فقط.
اللغة: العربية الفصحى حصراً.
`;

// 🟡 أوامر الهواتف (للبحث فقط في حال عدم التوفر محلياً)
const PHONES_MEMORY_PROMPT = `
${MASTER_RULES}
هذا الطلب خاص بهاتف.
مهمتك: عرض مواصفات عامة ودقيقة.
يجب استخدام المفاتيح التالية حصراً في specifications:
display, platform, memory, main_camera, selfie_camera, battery, body, sound, comms, misc
المخرجات JSON:
{ "phone_name": "الاسم", "brand": "الشركة", "release_date": "السنة", "specifications": { "display": "...", "platform": "...", "memory": "...", "main_camera": "...", "battery": "...", "body": "..." }, "official_link": "", "pros": [], "cons": [] }
`;

// 🔵 أوامر المقارنة
const COMPARISON_ANALYSIS_PROMPT = `
${MASTER_RULES}
قارن بين الهاتفين بناءً على البيانات المقدمة.
الصيغة: "الهاتفان يقدمان أداءً قويًا، ولكن يتفوق {A} في... بينما {B}..."
المخرجات JSON: { "verdict": "النص" }
`;

// 🟣 أوامر الإحصائيات الذكية
const STATS_AI_PROMPT = `
${MASTER_RULES}
أنت خبير إحصائي دقيق جداً.
المخرجات JSON حصراً:
{
  "main_insight": "جملة تلخيصية دقيقة",
  "charts": [
    {
      "title": "العنوان",
      "description": "شرح",
      "chart_type": "pie" | "bar",
      "data": [
        { "label": "العنصر", "value": 50, "displayValue": "50%", "color": "#HEX" }
      ]
    }
  ]
}
`;

// --- LOCAL DB LOGIC ---
const allBrandFiles: BrandFile[] = [
  samsungData, appleData, googleData, xiaomiData, huaweiData, 
  oneplusData, oppoData, vivoData, realmeData, sonyData, tecnoData, infinixData
].filter(Boolean) as unknown as BrandFile[];

const getAllLocalPhones = (): LocalPhone[] => {
  return allBrandFiles.flatMap(brand => brand.phones || []);
};

const mapLocalToDisplay = (local: LocalPhone): PhoneNewsItem => {
  let displayStr = "";
  if (local.specs.display.main && local.specs.display.cover) {
     displayStr = `Main: ${local.specs.display.main}, Cover: ${local.specs.display.cover}`;
  } else {
     displayStr = `${local.specs.display.size || ''} ${local.specs.display.type || ''}, ${local.specs.display.resolution || ''}, ${local.specs.display.refresh_rate || ''}`.replace(/,\s*,/g, ',').trim();
  }

  const defaultNetwork = "5G / 4G LTE / Wi-Fi 6E/7";
  const defaultSound = "Stereo Speakers, High-Res Audio";
  const defaultComms = "Bluetooth 5.3/5.4, NFC, USB Type-C";

  return {
    phone_name: local.name,
    brand: local.id.split('-')[0].toUpperCase(),
    release_date: local.release_year.toString(),
    specifications: {
      network: defaultNetwork,
      launch: `Released ${local.release_year}`,
      body: `${local.manufacturing.frame}, ${local.manufacturing.back}`,
      display: displayStr,
      platform: local.specs.chipset,
      memory: `${local.specs.ram} RAM, ${local.specs.storage} Storage`,
      main_camera: local.specs.rear_camera,
      selfie_camera: local.specs.front_camera,
      sound: defaultSound,
      comms: defaultComms,
      features: `${local.manufacturing.protection}, ${local.manufacturing.water_resistance}`,
      battery: `${local.specs.battery}, ${local.specs.charging}`,
      misc: `Weight: ${local.specs.weight}, OS: ${local.specs.os}`
    },
    pros: [],
    cons: []
  };
};

const normalize = (text: string) => {
  return text.toLowerCase().trim();
};

const AdUnit = () => {
  useEffect(() => {
    try {
      const w = window as any;
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
    } catch (e) {
      console.error("AdSense Error:", e);
    }
  }, []);

  return (
    <div className="w-full flex justify-center my-8 overflow-hidden min-h-[100px]" aria-label="Advertisement">
        <ins className="adsbygoogle"
             style={{display: 'block', width: '100%'}}
             data-ad-client="ca-pub-7355327732066930"
             data-ad-slot="1234567890"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
    </div>
  );
};

const App: React.FC = () => {
  const [imageError, setImageError] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [activeToolView, setActiveToolView] = useState<ToolView>('main');
  
  // AI Tools Directory State
  const [aiTools, setAiTools] = useState<AITool[]>([]);
  const [toolSearchQuery, setToolSearchQuery] = useState('');
  const [toolPage, setToolPage] = useState(1);
  const toolsPerPage = 20;
  
  const [phoneNews, setPhoneNews] = useState<PhoneNewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [phone1, setPhone1] = useState('');
  const [phone2, setPhone2] = useState('');
  const [comparisonResult, setComparisonResult] = useState<PhoneComparisonResult | null>(null);

  const [phoneSearchQuery, setPhoneSearchQuery] = useState('');
  const [phoneSearchResult, setPhoneSearchResult] = useState<PhoneNewsItem | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [phoneSuggestions, setPhoneSuggestions] = useState<LocalPhone[]>([]);

  const [statsQuery, setStatsQuery] = useState('');
  const [statsResult, setStatsResult] = useState<StatsResult | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Article State
  const [selectedArticle, setSelectedArticle] = useState<ArticleItem | null>(null);
  const [articleSearchQuery, setArticleSearchQuery] = useState('');
  const [articleAiData, setArticleAiData] = useState<{type: 'summary' | 'details', text: string} | null>(null);
  const [articleAiLoading, setArticleAiLoading] = useState(false);

  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  const localPhonesDB = useMemo(() => getAllLocalPhones(), []);

  // Force remove splash screen on mount to prevent hanging
  useEffect(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
      splash.style.opacity = '0';
      setTimeout(() => splash.remove(), 500);
    }
  }, []);

  // Handle Deep Linking for Articles
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const articleId = params.get('article');
      
      if (articleId) {
        const found = articlesData.find(a => a.id === Number(articleId));
        if (found) {
          setActiveTab('tools');
          setActiveToolView('articles');
          setSelectedArticle(found);
        } else {
          // If article ID exists in URL but not found in data
          // Redirect to Articles list and show a non-intrusive error
          setActiveTab('tools');
          setActiveToolView('articles');
          setError('المقال المطلوب غير موجود أو تم حذفه.');
        }
      }
    } catch (e) {
      console.error("Error parsing URL params:", e);
    }
  }, []);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      setShowInstallBanner(false);
    }
  };

  const getCachedData = (key: string) => {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    try {
      const { data, timestamp } = JSON.parse(cached);
      // Cache valid for 24h
      const validity = 24 * 60 * 60 * 1000;
      return (Date.now() - timestamp < validity) ? data : null;
    } catch (e) { return null; }
  };

  const saveToCache = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  };

  const callGroqAPI = async (userContent: string, systemInstruction: string) => {
    const apiKey = (import.meta as any).env.VITE_GROQ_API_KEY; 
    if (!apiKey) throw new Error("مفتاح API غير متوفر (VITE_GROQ_API_KEY).");

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile", 
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: userContent }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1, 
          max_completion_tokens: 3000
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      let content = data.choices?.[0]?.message?.content;
      
      // FIX: Clean up markdown JSON blocks if present
      if (content) {
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(content);
      }
      throw new Error("Empty response");
    } catch (e: any) {
      console.error("Groq API Error:", e);
      throw new Error("حدث خطأ أثناء تحليل البيانات. حاول مرة أخرى.");
    }
  };

  const searchPhonesInLocalDB = (query: string): LocalPhone[] => {
    if (!query) return [];
    const queryParts = normalize(query).split(/\s+/).filter(q => q.length > 0);
    if (queryParts.length === 0) return [];

    return localPhonesDB.filter(phone => {
       const targetText = (normalize(phone.name) + " " + normalize(phone.id));
       return queryParts.every(part => targetText.includes(part));
    }).sort((a, b) => {
        return a.name.length - b.name.length;
    });
  };

  const findPhoneInLocalDB = (query: string): LocalPhone | undefined => {
     const matches = searchPhonesInLocalDB(query);
     return matches.length > 0 ? matches[0] : undefined;
  };

  // Instant Phone Search Logic
  useEffect(() => {
    if (activeToolView === 'phone-news' && phoneSearchQuery.trim().length > 0) {
       const results = searchPhonesInLocalDB(phoneSearchQuery);
       setPhoneSuggestions(results);
    } else {
       setPhoneSuggestions([]);
    }
  }, [phoneSearchQuery, activeToolView]);

  const handlePhoneSelect = (phone: LocalPhone) => {
    setPhoneSearchResult(mapLocalToDisplay(phone));
    setPhoneSearchQuery(''); // Clear query or keep it? Keeping it clears suggestions
    setPhoneSuggestions([]);
  };

  const handlePhoneSearchAI = async () => {
    if (!phoneSearchQuery.trim()) return;
    setSearchLoading(true);
    setPhoneSearchResult(null);
    setError(null);

    // AI Fallback
    try {
      const result = await callGroqAPI(`User asked for phone: "${phoneSearchQuery}". Return specs.`, PHONES_MEMORY_PROMPT);
      if (result && result.phone_name) {
        setPhoneSearchResult(result);
      } else {
        setError("لم يتم العثور على نتائج.");
      }
    } catch (e: any) {
      setError("لا تتوفر بيانات حالياً.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleComparePhones = async () => {
    if (!phone1 || !phone2) return;
    setLoading(true);
    setError(null);
    setComparisonResult(null);

    const p1Local = findPhoneInLocalDB(phone1);
    const p2Local = findPhoneInLocalDB(phone2);

    let p1Data: any = p1Local ? mapLocalToDisplay(p1Local) : null;
    let p2Data: any = p2Local ? mapLocalToDisplay(p2Local) : null;

    try {
      if (!p1Data) {
         const r = await callGroqAPI(`Phone: ${phone1}`, PHONES_MEMORY_PROMPT);
         if (r.phone_name) p1Data = r;
      }
      if (!p2Data) {
         const r = await callGroqAPI(`Phone: ${phone2}`, PHONES_MEMORY_PROMPT);
         if (r.phone_name) p2Data = r;
      }

      if (!p1Data || !p2Data) {
        setError("أحد الهاتفين غير متوفر في قاعدة البيانات للمقارنة.");
        setLoading(false);
        return;
      }

      const comparisonInput = JSON.stringify({ phone1: p1Data, phone2: p2Data });
      let verdict = "كلا الهاتفين متميزان.";
      try {
          const verdictResult = await callGroqAPI(`Compare strictly based on this data: ${comparisonInput}`, COMPARISON_ANALYSIS_PROMPT);
          if (verdictResult.verdict) verdict = verdictResult.verdict;
      } catch (e) { console.log("AI Verdict failed"); }

      setComparisonResult({
        phone1_name: p1Data.phone_name,
        phone2_name: p2Data.phone_name,
        comparison_points: [
            { feature: "الشاشة", phone1_val: p1Data.specifications?.display || "-", phone2_val: p2Data.specifications?.display || "-", winner: 0 },
            { feature: "المعالج", phone1_val: p1Data.specifications?.platform || "-", phone2_val: p2Data.specifications?.platform || "-", winner: 0 },
            { feature: "الذاكرة", phone1_val: p1Data.specifications?.memory || "-", phone2_val: p2Data.specifications?.memory || "-", winner: 0 },
            { feature: "الكاميرا", phone1_val: p1Data.specifications?.main_camera || "-", phone2_val: p2Data.specifications?.main_camera || "-", winner: 0 },
            { feature: "البطارية", phone1_val: p1Data.specifications?.battery || "-", phone2_val: p2Data.specifications?.battery || "-", winner: 0 },
            { feature: "الهيكل", phone1_val: p1Data.specifications?.body || "-", phone2_val: p2Data.specifications?.body || "-", winner: 0 }
        ],
        verdict: verdict
      });

    } catch (err: any) { 
      setError("فشل في إجراء المقارنة."); 
    } finally { 
      setLoading(false); 
    }
  };

  const fetchToolData = async (type: ToolView, force: boolean = false) => {
    setLoading(true);
    setError(null);
    setActiveToolView(type);
    
    // For AI Directory, use local import data instantly
    if (type === 'ai-directory') {
      setAiTools(aiToolsData.tools as AITool[]);
      setToolPage(1);
      setLoading(false);
      return;
    }

    // Phone News with Cache logic
    let cacheKey = '';
    if (type === 'phone-news') cacheKey = CACHE_KEYS.PHONE_NEWS;

    const cached = (!force && cacheKey) ? getCachedData(cacheKey) : null;
    
    if (cached) {
      if (type === 'phone-news') {
        setPhoneNews(cached.smartphones || []);
        setCurrentPage(1);
      }
      setLoading(false);
      return;
    }

    try {
      if (type === 'phone-news') {
        const allPhones = [...localPhonesDB].sort((a, b) => b.release_year - a.release_year);
        const mappedPhones = allPhones.map(mapLocalToDisplay);
        saveToCache(cacheKey, { smartphones: mappedPhones });
        setPhoneNews(mappedPhones);
        setCurrentPage(1);
      }
    } catch (err: any) {
      setError(err.message || "لا تتوفر بيانات.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatsRequest = async () => {
     if (!statsQuery.trim()) return;
     setStatsLoading(true);
     setStatsResult(null);

     try {
       const result = await callGroqAPI(statsQuery, STATS_AI_PROMPT);
       if (result && result.charts && Array.isArray(result.charts)) {
         setStatsResult(result);
       } else {
         setError("لم أتمكن من توليد إحصائيات دقيقة لهذا السؤال.");
       }
     } catch (e) {
       setError("حدث خطأ أثناء تحليل البيانات.");
     } finally {
       setStatsLoading(false);
     }
  };

  // Article AI Handlers
  const handleArticleAiAction = async (type: 'summary' | 'details') => {
    if (!selectedArticle) return;
    setArticleAiLoading(true);
    setArticleAiData(null);
    
    // Smooth scroll slightly to indicate action
    setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);

    const systemPrompt = `
    أنت مساعد ذكي ومحترف باللغة العربية.
    مهمتك تحليل المقالات التقنية وتلخيصها أو التوسع في شرحها.
    يجب أن يكون الرد بتنسيق JSON حصراً: { "content": "النتيجة هنا" }.
    استخدم تنسيق Markdown للنص (استخدم القوائم النقطية - والعناوين ## بشكل أنيق).
    اجعل الأسلوب رسمياً، معلوماتياً، ومرتباً جداً.
    `;

    const userPrompt = type === 'summary' 
        ? `قم بتلخيص المقال التالي الذي يحمل عنوان: "${selectedArticle.title}". \n المحتوى: ${selectedArticle.content}. \n التلخيص يجب أن يكون على شكل نقاط رئيسية واضحة (Bullet Points) تغطي أهم ما ورد في المقال باختصار مفيد.`
        : `قم بتقديم تحليل تفصيلي ومعلومات إضافية تقنية حول موضوع: "${selectedArticle.title}". \n المحتوى الأصلي للمقال: ${selectedArticle.content}. \n المطلوب: التوسع في شرح الأفكار الواردة، إضافة معلومات تقنية ذات صلة لم تذكر في المقال، وتنظيم الرد كنقاط تفصيلية وعناوين فرعية لشرح الموضوع بشكل موسع وشامل.`;

    try {
        const result = await callGroqAPI(userPrompt, systemPrompt);
        if (result && result.content) {
            setArticleAiData({ type, text: result.content });
             // Scroll to result after loading
            setTimeout(() => {
                const element = document.getElementById('ai-result-section');
                element?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } else {
            setError('تعذر الحصول على رد من الذكاء الاصطناعي');
        }
    } catch (e) {
        setError('حدث خطأ أثناء معالجة الطلب');
    } finally {
        setArticleAiLoading(false);
    }
  };

  const handleOpenArticle = (article: ArticleItem) => {
    setSelectedArticle(article);
    setArticleAiData(null); // Reset AI data
    setArticleAiLoading(false);
    // Add history state for cleaner back navigation
    window.history.pushState({ articleId: article.id }, '', `?article=${article.id}`);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleCloseArticle = () => {
    setSelectedArticle(null);
    setArticleAiData(null); // Reset AI data
    window.history.pushState({}, '', window.location.pathname);
  };

  // Article Search Filtering
  const filteredArticles = articlesData.filter(article => 
    article.title.toLowerCase().includes(articleSearchQuery.toLowerCase()) || 
    article.content.toLowerCase().includes(articleSearchQuery.toLowerCase())
  );

  // Helper to extract YouTube ID (handles Shorts, Share links, Embeds)
  const getYouTubeID = (url: string) => {
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regExp);
    return (match && match[1]) ? match[1] : null;
  };

  const renderArticleContent = (content: string) => {
    // Robust regex to capture URLs OR [Bracketed Text]
    const tokenRegex = /((?:https?:\/\/[^\s]+)|(?:\[[^\]]+\]))/g;
    
    // Find video ID for embedding
    let videoId: string | null = null;
    const urlMatches = content.match(/(https?:\/\/[^\s]+)/g) || [];
    for (const url of urlMatches) {
      const id = getYouTubeID(url);
      if (id) {
        videoId = id;
        break; 
      }
    }

    const parts = content.split(tokenRegex);

    return (
        <div className="space-y-6">
            {videoId && (
                <div className="rounded-xl overflow-hidden shadow-lg border border-slate-700/50 aspect-video w-full">
                    <iframe 
                        width="100%" 
                        height="100%" 
                        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`} 
                        title="YouTube video player" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                    ></iframe>
                </div>
            )}
            
            <div className="text-slate-200 text-sm leading-8 whitespace-pre-line text-right font-medium opacity-90">
                {parts.map((part, i) => {
                    if (!part) return null;
                    if (part.match(/^https?:\/\//)) {
                        return (
                            <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-sky-400 font-bold underline hover:text-sky-300 mx-1">
                                اضغط هنا
                            </a>
                        );
                    }
                    if (part.match(/^\[.*\]$/)) {
                        const text = part.slice(1, -1); 
                        return (
                            <span key={i} className="block text-sky-400 font-black text-lg mt-6 mb-2 border-r-4 border-sky-500 pr-2 leading-tight">
                                {text}
                            </span>
                        );
                    }
                    return <span key={i}>{part}</span>;
                })}
            </div>
        </div>
    );
  };

  const renderAiResult = (text: string) => {
     // Simple markdown rendering for AI output
     const lines = text.split('\n');
     return (
        <div className="space-y-3 text-slate-200 text-sm leading-7">
           {lines.map((line, idx) => {
              if (line.startsWith('##')) return <h3 key={idx} className="text-amber-400 font-bold text-base mt-4 border-b border-amber-500/30 pb-1">{line.replace(/#/g, '').trim()}</h3>;
              if (line.startsWith('-') || line.startsWith('•')) return <li key={idx} className="list-none flex items-start gap-2"><span className="text-amber-500 mt-1.5">•</span><span>{line.replace(/^[-•]/, '').trim()}</span></li>;
              if (line.trim() === '') return <br key={idx}/>;
              return <p key={idx}>{line}</p>;
           })}
        </div>
     );
  };

  // AI Tools Filtering
  const filteredTools = aiTools.filter(tool => 
    tool.name.toLowerCase().includes(toolSearchQuery.toLowerCase()) || 
    tool.description.some(d => d.includes(toolSearchQuery)) ||
    tool.category.toLowerCase().includes(toolSearchQuery.toLowerCase())
  );
  
  const toolSuggestions = toolSearchQuery.length > 0 
    ? aiTools.filter(tool => tool.name.toLowerCase().includes(toolSearchQuery.toLowerCase()) || tool.description.some(d => d.includes(toolSearchQuery))).slice(0, 5) 
    : [];

  // Pagination for Tools
  const indexOfLastTool = toolPage * toolsPerPage;
  const indexOfFirstTool = indexOfLastTool - toolsPerPage;
  const currentTools = filteredTools.slice(indexOfFirstTool, indexOfLastTool);
  const totalToolPages = Math.ceil(filteredTools.length / toolsPerPage);

  const nextToolPage = () => setToolPage(prev => Math.min(prev + 1, totalToolPages));
  const prevToolPage = () => setToolPage(prev => Math.max(prev - 1, 1));

  const titleStyle = "font-black text-white leading-none mb-3 whitespace-nowrap overflow-hidden text-[clamp(1rem,4vw,1.25rem)]";
  
  const ShareToolbar = ({ title, text, url }: { title: string, text: string, url: string }) => {
    const fullText = `${title}\n\n${text}\n\n🔗 ${url || 'techtouch-hub'}`;
    const handleShare = (platform: 'copy' | 'tg' | 'fb' | 'insta') => {
      if (platform === 'copy') { navigator.clipboard.writeText(fullText); alert('تم نسخ المحتوى!'); }
      else if (platform === 'tg') window.open(`https://t.me/share/url?url=${encodeURIComponent(url || 'https://t.me/techtouch7')}&text=${encodeURIComponent(fullText)}`, '_blank');
      else if (platform === 'fb') window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url || 'https://t.me/techtouch7')}`, '_blank');
      else if (platform === 'insta') { navigator.clipboard.writeText(fullText); alert('تم نسخ النص للانستجرام'); window.open('https://instagram.com', '_blank'); }
    };
    return (
      <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-700/30">
        <button onClick={() => handleShare('copy')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-600 text-slate-300 text-xs font-bold transition-colors">
            <Copy className="w-3.5 h-3.5" />
            <span>نسخ كامل المحتوى</span>
        </button>
        <div className="flex gap-2">
            <button onClick={() => handleShare('tg')} className="p-2 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 transition-colors" title="تيليكرام"><TelegramIcon className="w-4 h-4" /></button>
            <button onClick={() => handleShare('fb')} className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 transition-colors" title="فيسبوك"><Facebook className="w-4 h-4" /></button>
            <button onClick={() => handleShare('insta')} className="p-2 rounded-lg bg-pink-600/20 hover:bg-pink-600/30 text-pink-400 transition-colors" title="انستجرام"><Instagram className="w-4 h-4" /></button>
        </div>
      </div>
    );
  };

  const indexOfLastPhone = currentPage * itemsPerPage;
  const indexOfFirstPhone = indexOfLastPhone - itemsPerPage;
  const currentPhones = phoneNews.slice(indexOfFirstPhone, indexOfLastPhone);
  const totalPages = Math.ceil(phoneNews.length / itemsPerPage);

  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-sky-500/30 font-sans text-right pb-24" dir="rtl">
      
      <div className="fixed inset-0 pointer-events-none opacity-15 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-600 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4"></div>
      </div>
      
      {error && (
        <div className="fixed top-20 left-4 right-4 z-[100] bg-rose-500/95 text-white p-4 rounded-2xl shadow-xl backdrop-blur-md animate-fade-in border border-rose-400/50 flex flex-col gap-2">
            <div className="flex items-start gap-3">
               <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
               <p className="text-sm font-bold leading-relaxed">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="self-end text-xs bg-rose-700/50 px-3 py-1.5 rounded-lg hover:bg-rose-700 transition-colors">إغلاق</button>
        </div>
      )}

      <div className="relative z-10 max-w-lg mx-auto px-4 min-h-screen flex flex-col">
        
        <main className="flex-grow py-2 animate-fade-in">
          
          {activeTab === 'home' && (
             <div className="space-y-3 pb-4">
                {/* Header Section - Moved inside Home tab, removed sticky, reduced sizes */}
                <div className="pt-8 pb-4 flex flex-col items-center justify-center -mx-4 px-4 mb-2">
                  <div className="flex flex-col items-center gap-2">
                     <div className="w-16 h-16 bg-slate-800 rounded-full border-2 border-sky-500/20 shadow-xl overflow-hidden shrink-0 p-0.5">
                        {profileConfig.image && !imageError ? (
                          <img src={profileConfig.image} alt="Profile" className="w-full h-full object-cover rounded-full" onError={() => setImageError(true)} />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center text-lg font-black text-sky-400">{profileConfig.initials}</span>
                        )}
                     </div>
                     <div className="text-center space-y-0.5">
                        <h1 className="text-xl font-black tracking-tighter text-white drop-shadow-md font-sans">Techtouch</h1>
                        <p className="text-[10px] text-sky-400 font-bold tracking-widest uppercase bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/10">كنان مجيد الصائغ</p>
                     </div>
                  </div>
                </div>

                {/* Channels Title Section */}
                <div className="flex items-center gap-2 mb-4 px-2 opacity-80">
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-500 to-transparent flex-1"></div>
                    <span className="text-xs font-bold text-slate-400">قنواتي على التيليكرام</span>
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-500 to-transparent flex-1"></div>
                </div>

                {telegramChannels.map((ch, i) => <ChannelCard key={ch.id} channel={ch} index={i} />)}
                <SocialLinks links={socialLinks} />
             </div>
          )}
          
          {activeTab === 'info' && (
            <div className="space-y-6 animate-fade-in pt-6 pb-8">
              
              {/* Bot Section */}
              <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-3xl shadow-xl backdrop-blur-md space-y-6 text-right">
                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-sky-400 text-center">بخصوص بوت الطلبات على التيليكرام</h3>
                    <a href="https://t.me/techtouchAI_bot" target="_blank" className="flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-sky-500/25 group border border-white/10">
                      <Send className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                      <span>الدخول لبوت الطلبات</span>
                    </a>
                </div>

                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 text-sm space-y-3 leading-relaxed text-slate-300">
                    <p>✪ ارسل اسم التطبيق مع صورته او رابط التطبيق من متجر بلي فقط .</p>
                    <p>✪ لاتطلب كود تطبيقات مدفوعة ولا اكستريم ذني كل مايتوفر جديد مباشر انشر انته فقط تابع القنوات .</p>
                    <p className="text-yellow-400 font-bold mt-2 pt-2 border-t border-slate-700/50">البوت مخصص للطلبات مو للدردشة عندك مشكلة او سؤال اكتب بالتعليقات</p>
                </div>
              </div>

              {/* Search Methods Section */}
              <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-3xl shadow-xl backdrop-blur-md space-y-4 text-right">
                <h4 className="font-bold text-sky-400 border-b border-slate-700 pb-2">طرق البحث المتاحة في قنوات المناقشات في التيليكرام:</h4>
                <ol className="list-decimal list-inside space-y-2 text-slate-300 text-sm leading-relaxed">
                    <li>ابحث بالقناة من خلال زر البحث 🔍 واكتب اسم التطبيق بشكل صحيح.</li>
                    <li>اكتب اسم التطبيق في التعليقات (داخل قنوات المناقشة) بإسم مضبوط (مثلاً: كاب كات).</li>
                    <li>استخدم أمر البحث بكتابة كلمة "بحث" متبوع باسم التطبيق (مثلاً: بحث ياسين).</li>
                    <li>للاعلان في القناة تواصل من خلال البوت</li>
                </ol>
                <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg mt-4">
                  <p className="text-rose-400 font-bold text-xs leading-relaxed">تنبيه: حظر البوت يؤدي لحظر تلقائي لحسابك ولا يمكن استقبال اي طلب حتى لو قمت بإزالة الحظر لاحقا</p>
                </div>
              </div>

              {/* Footer Greeting */}
              <div className="text-center py-4">
                 <p className="text-slate-400 text-sm font-bold">في النهاية دمتم برعاية الله</p>
              </div>

              {/* About Us Section */}
              <div id="about-us" className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-3xl shadow-xl backdrop-blur-md space-y-4 text-right scroll-mt-24">
                <h3 className="text-lg font-bold text-white border-b border-slate-700/50 pb-2">من نحن</h3>
                <div className="text-slate-300 text-sm leading-7 space-y-2">
                   <p>أنا كنان مجيد الصائغ، من مواليد 1988، مهتم بالأخبار والمعلومات التقنية والذكاء الاصطناعي.</p>
                   <p>أعمل على نشر المحتوى التقني، وأدوات وتقنيات الذكاء الاصطناعي، والتطبيقات المعدلة، والتطبيقات الرياضية، وتطبيقات الأفلام والخدمات.</p>
                   <p>يهدف موقع TechTouch إلى تقديم محتوى تقني مبسّط ومفيد للمستخدم العربي.</p>
                </div>
              </div>

              {/* Privacy Policy Section */}
              <div id="privacy-policy" className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-3xl shadow-xl backdrop-blur-md space-y-4 text-right scroll-mt-24">
                 <h3 className="text-lg font-bold text-white border-b border-slate-700/50 pb-2">سياسة الخصوصية</h3>
                 <div className="text-slate-300 text-sm leading-7 space-y-2">
                    <p>نحن في موقع TechTouch نحترم خصوصية زوّارنا ونسعى لحمايتها.</p>
                    <p>يستخدم الموقع خدمات Google Analytics لجمع معلومات غير شخصية مثل عدد الزيارات والصفحات التي يتم تصفحها بهدف تحسين تجربة المستخدم.</p>
                    <p>كما قد نستخدم Google AdSense لعرض الإعلانات، حيث تعتمد Google على ملفات تعريف الارتباط (Cookies).</p>
                    <p>يمكن للمستخدم تعطيل ملفات تعريف الارتباط من خلال إعدادات المتصفح.</p>
                    <p>باستخدامك للموقع فإنك توافق على سياسة الخصوصية هذه، ونحتفظ بحق تحديثها عند الحاجة.</p>
                 </div>
              </div>

              {/* Google AdSense Unit */}
              <AdUnit />

              {/* Footer Links */}
              <div className="text-center pt-4 pb-8 space-y-4">
                <div className="flex justify-center gap-6 text-xs text-slate-500">
                   <a href="#about-us" className="hover:text-sky-400 transition-colors">من نحن</a>
                   <a href="#privacy-policy" className="hover:text-sky-400 transition-colors">سياسة الخصوصية</a>
                </div>
                <p className="text-slate-600 text-[10px] font-medium">{footerData.text} <a href={footerData.url} className="text-sky-500 hover:underline">@kinanmjeed</a></p>
              </div>

            </div>
          )}

          {activeTab === 'tools' && activeToolView === 'main' && (
            <div className="animate-fade-in pt-6">
               <div className="flex justify-center mb-4">
                  <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full flex items-center gap-2 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                     <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                     <span className="text-xs font-bold text-amber-400">قسم تجريبي</span>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setActiveToolView('articles')} className="col-span-2 group p-5 bg-slate-800/40 border border-indigo-500/30 rounded-3xl relative overflow-hidden hover:bg-slate-800/60 transition-all">
                      <div className="flex flex-col items-start gap-3">
                        <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400"><BookOpen className="w-5 h-5" /></div>
                        <div className="w-full text-right">
                           <h3 className="font-bold text-lg text-white truncate w-full">مقالات تقنية</h3>
                           <p className="text-xs text-slate-400 truncate w-full">دليلك التقني والمعلوماتي</p>
                        </div>
                      </div>
                  </button>
                  <button onClick={() => fetchToolData('ai-directory')} className="col-span-2 group p-6 bg-slate-800/40 border border-amber-500/30 rounded-3xl relative overflow-hidden hover:bg-slate-800/60 transition-all">
                      <div className="absolute top-0 right-0 p-4 opacity-10"><Command size={80} /></div>
                      <div className="relative z-10 flex flex-col items-start gap-3">
                        <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-400"><Command className="w-7 h-7" /></div>
                        <div className="text-right w-full">
                           <h3 className="font-bold text-xl text-white truncate w-full">دليل أدوات AI</h3>
                           <p className="text-sm text-slate-400 truncate w-full">أكثر من 50 أداة (بحث فوري)</p>
                        </div>
                      </div>
                  </button>

                  <button onClick={() => fetchToolData('phone-news')} className="group p-5 bg-slate-800/40 border border-sky-500/30 rounded-3xl relative overflow-hidden hover:bg-slate-800/60 transition-all">
                     <div className="flex flex-col items-start gap-3">
                        <div className="w-10 h-10 bg-sky-500/20 rounded-xl flex items-center justify-center text-sky-400"><Smartphone className="w-5 h-5" /></div>
                        <div className="w-full text-right"><h3 className="font-bold text-base text-white truncate w-full">الهواتف</h3><p className="text-[10px] text-slate-400 truncate w-full">قاعدة بيانات موثوقة</p></div>
                     </div>
                  </button>
                  <button onClick={() => setActiveToolView('comparison')} className="group p-5 bg-slate-800/40 border border-emerald-500/30 rounded-3xl relative overflow-hidden hover:bg-slate-800/60 transition-all">
                     <div className="flex flex-col items-start gap-3">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400"><LayoutGrid className="w-5 h-5" /></div>
                        <div className="w-full text-right"><h3 className="font-bold text-base text-white truncate w-full">مقارنة</h3><p className="text-[10px] text-slate-400 truncate w-full">مقارنة شاملة</p></div>
                     </div>
                  </button>
                  <button onClick={() => setActiveToolView('stats')} className="col-span-2 group p-5 bg-slate-800/40 border border-pink-500/30 rounded-3xl relative overflow-hidden hover:bg-slate-800/60 transition-all">
                      <div className="flex flex-col items-start gap-3">
                        <div className="w-10 h-10 bg-pink-500/20 rounded-xl flex items-center justify-center text-pink-400"><BarChart3 className="w-5 h-5" /></div>
                        <div className="w-full text-right">
                           <h3 className="font-bold text-base text-white truncate w-full">إحصائيات</h3>
                           <p className="text-[10px] text-slate-400 truncate w-full">تحليل بياني</p>
                        </div>
                      </div>
                  </button>
               </div>
            </div>
          )}

          {activeTab === 'tools' && activeToolView !== 'main' && (
             <div className="space-y-4 animate-slide-up pb-8 pt-6">
                <button onClick={() => { 
                    if (activeToolView === 'articles' && selectedArticle) {
                        handleCloseArticle();
                    } else {
                        setActiveToolView('main'); setPhoneSearchResult(null); setStatsResult(null); setToolSearchQuery(''); setSelectedArticle(null); setArticleSearchQuery('');
                    }
                }} className="flex items-center gap-2 text-slate-400 hover:text-white mb-2">
                   <ChevronLeft className="w-5 h-5" /> <span className="text-sm font-bold">رجوع</span>
                </button>

                {/* AI Tools Directory View */}
                {activeToolView === 'ai-directory' && (
                   <div className="space-y-4">
                      {/* Search Bar */}
                      <div className="relative">
                         <div className="flex items-center bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3 focus-within:border-amber-500/50 transition-colors">
                            <Search className="w-5 h-5 text-slate-400 ml-3" />
                            <input 
                               type="text" 
                               value={toolSearchQuery}
                               onChange={(e) => {
                                   setToolSearchQuery(e.target.value);
                                   setToolPage(1); // Reset to first page on search
                               }}
                               placeholder="ابحث عن أداة ذكاء اصطناعي..."
                               className="bg-transparent border-none outline-none text-white w-full text-sm placeholder:text-slate-500"
                            />
                            {toolSearchQuery && (
                                <button onClick={() => { setToolSearchQuery(''); setToolPage(1); }} className="p-1 hover:bg-slate-700 rounded-full text-slate-400"><X className="w-4 h-4" /></button>
                            )}
                         </div>

                         {/* Autocomplete Suggestions */}
                         {toolSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700/50 rounded-xl shadow-xl z-50 overflow-hidden">
                               {toolSuggestions.map(tool => (
                                  <button 
                                    key={tool.id}
                                    onClick={() => { setToolSearchQuery(tool.name); setToolPage(1); }}
                                    className="w-full text-right px-4 py-3 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white border-b border-slate-700/30 last:border-0 transition-colors flex items-center justify-between group"
                                  >
                                     <span>{tool.name}</span>
                                     <span className="text-[10px] bg-slate-900 text-slate-500 px-2 py-0.5 rounded group-hover:bg-slate-800 group-hover:text-amber-400 transition-colors">{tool.category}</span>
                                  </button>
                               ))}
                            </div>
                         )}
                      </div>

                      {/* Tools Grid */}
                      <div className="grid gap-4">
                         {currentTools.length > 0 ? (
                            currentTools.map(tool => (
                               <div key={tool.id} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 hover:border-amber-500/30 transition-all group relative overflow-hidden">
                                   <div className="flex justify-between items-start mb-3">
                                      <div>
                                         <h3 className="font-black text-lg text-white mb-1 group-hover:text-amber-400 transition-colors">{tool.name}</h3>
                                         <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                            <span className="bg-slate-700/50 px-2 py-0.5 rounded">{tool.company}</span>
                                            <span className="opacity-50">•</span>
                                            <span>{tool.country}</span>
                                         </div>
                                      </div>
                                      <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded-lg font-bold">
                                         {tool.category}
                                      </span>
                                   </div>

                                   <ul className="space-y-1.5 mb-4">
                                      {tool.description.map((line, idx) => (
                                         <li key={idx} className="text-xs text-slate-300 leading-relaxed pl-3 relative before:content-['•'] before:absolute before:text-slate-600">
                                            {line}
                                         </li>
                                      ))}
                                   </ul>

                                   {tool.free_note && (
                                      <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 text-xs text-emerald-400 font-bold flex items-center gap-2">
                                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                         {tool.free_note}
                                      </div>
                                   )}

                                   <a href={tool.official_url} target="_blank" className="flex items-center justify-center gap-2 w-full bg-slate-700/50 hover:bg-amber-600 hover:text-white text-slate-300 font-bold py-2.5 rounded-xl transition-all text-sm group-hover:shadow-lg group-hover:shadow-amber-900/20 mb-2">
                                      <span>زيارة الموقع الرسمي</span>
                                      <ExternalLink className="w-4 h-4" />
                                   </a>
                                   
                                   <ShareToolbar 
                                      title={tool.name} 
                                      text={`${tool.description.join('\n')}\n\n${tool.official_url}`} 
                                      url={tool.official_url} 
                                   />
                               </div>
                            ))
                         ) : (
                            <div className="text-center py-10 text-slate-500">
                               <p>لم يتم العثور على أداة بهذا الاسم.</p>
                            </div>
                         )}
                      </div>
                      
                      {/* Pagination Controls */}
                      {totalToolPages > 1 && (
                          <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-700/50">
                             <button onClick={prevToolPage} disabled={toolPage === 1} className="p-2 rounded-xl bg-slate-800 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"><ChevronRight className="w-5 h-5"/></button>
                             <span className="text-xs font-bold text-slate-400">صفحة {toolPage} من {totalToolPages}</span>
                             <button onClick={nextToolPage} disabled={toolPage === totalToolPages} className="p-2 rounded-xl bg-slate-800 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"><ChevronLeft className="w-5 h-5"/></button>
                          </div>
                      )}
                   </div>
                )}
                
                {/* Phone Search & News View */}
                {activeToolView === 'phone-news' && (
                  <div className="space-y-4">
                     <div className="relative z-50">
                        <div className="flex gap-2">
                           <div className="flex-1 relative">
                             <input type="text" value={phoneSearchQuery} onChange={(e)=>setPhoneSearchQuery(e.target.value)} placeholder="اكتب اسم الهاتف للبحث..." className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 text-sm focus:border-sky-500 outline-none h-12" />
                             {phoneSearchQuery && (
                                <button onClick={() => { setPhoneSearchQuery(''); setPhoneSuggestions([]); }} className="absolute left-3 top-3.5 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                             )}
                           </div>
                           <button onClick={handlePhoneSearchAI} className="bg-sky-500 text-white w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">{searchLoading ? <Loader2 className="animate-spin w-5 h-5"/> : <Search className="w-5 h-5"/>}</button>
                           <button onClick={() => fetchToolData('phone-news', true)} className="bg-slate-800 hover:bg-slate-700 text-sky-400 w-12 h-12 rounded-xl flex items-center justify-center border border-slate-700 flex-shrink-0" title="اقتراح هواتف"><RotateCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /></button>
                        </div>
                        
                        {/* Instant Phone Suggestions */}
                        {phoneSuggestions.length > 0 && (
                           <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                              {phoneSuggestions.map((phone, idx) => (
                                 <button 
                                   key={idx}
                                   onClick={() => handlePhoneSelect(phone)}
                                   className="w-full text-right px-4 py-3 text-sm text-slate-200 hover:bg-slate-700/80 border-b border-slate-700/50 last:border-0 transition-colors flex justify-between items-center"
                                 >
                                    <span>{phone.name}</span>
                                    <span className="text-[10px] text-slate-500">{phone.release_year}</span>
                                 </button>
                              ))}
                           </div>
                        )}
                     </div>
                     
                     {phoneSearchResult ? (
                        <div className="bg-slate-800/60 border border-sky-500/30 p-5 rounded-3xl animate-fade-in relative shadow-2xl">
                           <button onClick={() => setPhoneSearchResult(null)} className="absolute top-4 left-4 p-1 bg-slate-700/50 rounded-full text-slate-300 hover:text-white"><X className="w-4 h-4" /></button>
                           
                           <div className="mb-6 border-b border-slate-700/50 pb-4">
                             <h2 className={titleStyle}>{phoneSearchResult.phone_name}</h2>
                             <div className="flex items-center gap-3">
                               <span className="bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded text-xs font-bold">{phoneSearchResult.brand}</span>
                             </div>
                           </div>

                           <div className="space-y-6">
                              {Object.entries(phoneSearchResult.specifications).length > 0 ? (
                                 SPEC_ORDER.map((key) => {
                                   if (!phoneSearchResult.specifications[key]) return null;
                                   return (
                                     <div key={key} className="space-y-2">
                                        <h4 className="text-xs font-bold text-sky-500 uppercase tracking-wider border-r-2 border-sky-500 pr-2">{SPEC_LABELS[key] || key}</h4>
                                        <p className="text-sm text-slate-200 leading-relaxed bg-slate-900/30 p-3 rounded-lg border border-slate-700/30" dir="rtl">
                                          {phoneSearchResult.specifications[key]}
                                        </p>
                                     </div>
                                   );
                                 })
                              ) : (
                                <p className="text-slate-400 text-center">لا توجد تفاصيل متاحة حالياً.</p>
                              )}
                           </div>
                           <ShareToolbar title={phoneSearchResult.phone_name} text="مواصفات" url="" />
                        </div>
                     ) : (
                        <div className="space-y-3">
                            {/* Hide main list when searching to satisfy "data disappears" request */}
                            {phoneSuggestions.length === 0 && (
                                <>
                                   {currentPhones.map((phone, idx) => (
                                      <div key={idx} className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 hover:bg-slate-800/60 transition-all cursor-pointer group" onClick={() => setPhoneSearchResult(phone)}>
                                         <div className="flex justify-between items-center mb-2 overflow-hidden">
                                            <h3 className="font-bold text-white text-base">{phone.phone_name}</h3>
                                            <button className="flex items-center gap-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0">
                                              <Eye className="w-3.5 h-3.5" />
                                              عرض التفاصيل
                                            </button>
                                         </div>
                                      </div>
                                   ))}

                                   {totalPages > 1 && (
                                      <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-700/50">
                                         <button onClick={prevPage} disabled={currentPage === 1} className="p-2 rounded-xl bg-slate-800 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"><ChevronRight className="w-5 h-5"/></button>
                                         <span className="text-xs font-bold text-slate-400">صفحة {currentPage} من {totalPages}</span>
                                         <button onClick={nextPage} disabled={currentPage === totalPages} className="p-2 rounded-xl bg-slate-800 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"><ChevronLeft className="w-5 h-5"/></button>
                                      </div>
                                   )}
                                </>
                            )}
                        </div>
                     )}
                  </div>
                )}

                {activeToolView === 'comparison' && (
                   <div className="space-y-4">
                      <div className="bg-slate-800/40 p-5 rounded-2xl space-y-3 border border-slate-700/50">
                          <h3 className="text-center font-bold text-white mb-2">مقارنة شاملة</h3>
                          <div className="flex gap-2">
                            <input value={phone1} onChange={e=>setPhone1(e.target.value)} placeholder="الهاتف الأول" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm focus:border-emerald-500 outline-none text-center"/>
                            <span className="self-center font-bold text-slate-500">VS</span>
                            <input value={phone2} onChange={e=>setPhone2(e.target.value)} placeholder="الهاتف الثاني" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm focus:border-emerald-500 outline-none text-center"/>
                          </div>
                          <button onClick={handleComparePhones} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-bold transition-colors shadow-lg shadow-emerald-900/20">{loading ? <Loader2 className="animate-spin w-5 h-5 mx-auto"/> : 'بدء المقارنة التفصيلية'}</button>
                      </div>

                      {comparisonResult && (
                         <div className="bg-slate-800/60 border border-emerald-500/30 p-4 rounded-2xl animate-fade-in">
                            <h4 className="font-black text-center text-xl mb-6 text-white bg-slate-900/50 py-2 rounded-xl border border-slate-700/50">
                               <span className="text-emerald-400">{comparisonResult.phone1_name}</span> <span className="text-slate-500 text-sm mx-2">ضد</span> <span className="text-sky-400">{comparisonResult.phone2_name}</span>
                            </h4>
                            <div className="space-y-1">
                               {comparisonResult.comparison_points.map((point, i) => (
                                  <div key={i} className="grid grid-cols-[1fr,auto,1fr] gap-2 text-xs border-b border-slate-700/50 py-3 last:border-0 items-center">
                                      <div className="text-left pl-1 text-slate-300">{point.phone1_val}</div>
                                      <div className="bg-slate-900 px-2 py-1 rounded text-[10px] text-slate-500 font-bold">{point.feature}</div>
                                      <div className="text-right pr-1 text-slate-300">{point.phone2_val}</div>
                                  </div>
                               ))}
                            </div>
                            <div className="mt-6 bg-emerald-900/10 border border-emerald-500/20 p-4 rounded-xl">
                               <h5 className="font-bold text-emerald-500 mb-2 text-sm">الخلاصة:</h5>
                               <p className="text-xs text-slate-200 leading-relaxed">{comparisonResult.verdict}</p>
                            </div>
                            <ShareToolbar title={`مقارنة: ${comparisonResult.phone1_name} vs ${comparisonResult.phone2_name}`} text={comparisonResult.verdict} url="" />
                         </div>
                      )}
                   </div>
                )}

                {activeToolView === 'stats' && (
                   <div className="space-y-4">
                      <div className="flex gap-2">
                        <input value={statsQuery} onChange={e=>setStatsQuery(e.target.value)} placeholder="مثال: عدد سكان العالم سنة 2030..." className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 text-sm outline-none" />
                        <button onClick={handleStatsRequest} className="bg-pink-500 text-white p-3 rounded-xl">{statsLoading ? <Loader2 className="animate-spin w-5 h-5"/> : <PieChart className="w-5 h-5"/>}</button>
                      </div>
                      
                      {statsResult && (
                         <div className="space-y-4 animate-fade-in">
                            <div className="bg-slate-800/40 p-3 rounded-xl border border-pink-500/10">
                               <p className="text-sm font-bold text-pink-300 text-center">{statsResult.main_insight}</p>
                            </div>
                            
                            {statsResult.charts.map((chart, chartIndex) => (
                              <div key={chartIndex} className="bg-slate-800/40 p-4 rounded-2xl border border-pink-500/20 shadow-lg">
                                  <h3 className="font-bold text-white mb-2 truncate">{chart.title}</h3>
                                  <p className="text-xs text-slate-400 mb-4">{chart.description}</p>
                                  
                                  {chart.data.map((d,i)=>(
                                    <div key={i} className="mb-3">
                                        <div className="flex justify-between text-xs mb-1">
                                          <span className="text-slate-300 truncate max-w-[70%]">{d.label}</span>
                                          <span className="text-pink-400 font-bold">{d.displayValue}</span>
                                        </div>
                                        <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                                          <div style={{width: `${Math.min(d.value, 100)}%`, backgroundColor: d.color || '#ec4899'}} className="h-full rounded-full transition-all duration-1000"/>
                                        </div>
                                    </div>
                                  ))}
                              </div>
                            ))}
                            <ShareToolbar title="إحصائيات Techtouch" text={statsResult.main_insight} url="" />
                         </div>
                      )}
                   </div>
                )}

                {activeToolView === 'articles' && (
                  <div className="space-y-4 animate-fade-in">
                    {selectedArticle ? (
                       <div className="bg-slate-800/60 border border-indigo-500/30 p-5 rounded-3xl animate-slide-up relative shadow-2xl">
                          <div className="absolute top-4 left-4 flex gap-2 z-10">
                             <button onClick={() => {
                                 // Generate deep link
                                 const shareUrl = `${window.location.origin}${window.location.pathname}?article=${selectedArticle.id}`;
                                 navigator.clipboard.writeText(shareUrl);
                                 alert('تم نسخ رابط المنشور!');
                             }} className="p-1.5 bg-slate-700/50 rounded-full text-slate-300 hover:text-white transition-colors border border-slate-600/30">
                                 <Share2 className="w-4 h-4" />
                             </button>
                             <button onClick={handleCloseArticle} className="p-1.5 bg-slate-700/50 rounded-full text-slate-300 hover:text-white transition-colors border border-slate-600/30">
                                 <X className="w-4 h-4" />
                             </button>
                          </div>
                          
                          <div className="mb-6 border-b border-slate-700/50 pb-6 pr-4 pl-4 pt-14 bg-slate-900/80 rounded-2xl border border-slate-700/50 shadow-inner">
                             <h2 className="font-black text-white text-lg leading-tight mb-2">{selectedArticle.title}</h2>
                             <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                                <span>{selectedArticle.date || 'تاريخ غير محدد'}</span>
                             </div>

                             {/* AI Action Buttons */}
                             <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-700/30">
                                <button 
                                    onClick={() => handleArticleAiAction('summary')}
                                    disabled={articleAiLoading}
                                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-900/20 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {articleAiLoading && !articleAiData ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4" />}
                                    <span>تلخيص المحتوى AI</span>
                                </button>
                                <button 
                                    onClick={() => handleArticleAiAction('details')}
                                    disabled={articleAiLoading}
                                    className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-xl transition-all active:scale-95 border border-slate-600 disabled:opacity-50"
                                >
                                    <ListPlus className="w-4 h-4" />
                                    <span>تفاصيل أكثر AI</span>
                                </button>
                             </div>
                          </div>
                          
                          {renderArticleContent(selectedArticle.content)}

                          {/* AI Result Section */}
                          <div id="ai-result-section" className="scroll-mt-6">
                            {(articleAiData || articleAiLoading) && (
                                <div className="mt-8 pt-6 border-t border-slate-700/50 animate-slide-up">
                                    <div className={`p-5 rounded-2xl border relative overflow-hidden transition-colors ${
                                        articleAiData?.type === 'summary' 
                                        ? 'bg-amber-950/20 border-amber-500/30' 
                                        : 'bg-indigo-950/20 border-indigo-500/30'
                                    }`}>
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50"></div>
                                        
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className={`p-2 rounded-lg ${
                                                articleAiData?.type === 'summary' ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-400'
                                            }`}>
                                                <Bot className="w-5 h-5" />
                                            </div>
                                            <h3 className={`font-bold text-sm ${
                                                articleAiData?.type === 'summary' ? 'text-amber-400' : 'text-indigo-400'
                                            }`}>
                                                {articleAiLoading ? 'جاري التحليل الذكي...' : (articleAiData?.type === 'summary' ? 'ملخص الذكاء الاصطناعي' : 'تحليل وتفاصيل إضافية')}
                                            </h3>
                                        </div>

                                        {articleAiLoading ? (
                                            <div className="flex flex-col items-center justify-center py-8 gap-3 text-slate-400">
                                                <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
                                                <p className="text-xs animate-pulse">جاري معالجة النص وتوليد النقاط...</p>
                                            </div>
                                        ) : (
                                            renderAiResult(articleAiData?.text || '')
                                        )}
                                    </div>
                                </div>
                            )}
                          </div>
                       </div>
                    ) : (
                       <div className="space-y-3">
                           {/* Added Article Search Bar */}
                           <div className="relative mb-4">
                                <div className="flex items-center bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3 focus-within:border-indigo-500/50 transition-colors">
                                <Search className="w-5 h-5 text-slate-400 ml-3" />
                                <input 
                                    type="text" 
                                    value={articleSearchQuery}
                                    onChange={(e) => setArticleSearchQuery(e.target.value)}
                                    placeholder="ابحث في المقالات..."
                                    className="bg-transparent border-none outline-none text-white w-full text-sm placeholder:text-slate-500"
                                />
                                {articleSearchQuery && (
                                    <button onClick={() => setArticleSearchQuery('')} className="p-1 hover:bg-slate-700 rounded-full text-slate-400"><X className="w-4 h-4" /></button>
                                )}
                                </div>
                           </div>

                          {filteredArticles.length > 0 ? (
                             filteredArticles.map((article) => (
                                <div key={article.id} onClick={() => handleOpenArticle(article)} className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 hover:bg-slate-800/60 transition-all cursor-pointer group flex items-start gap-3 relative overflow-hidden">
                                   <div className="absolute inset-0 bg-gradient-to-l from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                   <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0 mt-0.5"><BookOpen className="w-5 h-5" /></div>
                                   <div className="flex-1 relative z-10">
                                      <h3 className="font-bold text-white text-base leading-snug group-hover:text-indigo-400 transition-colors line-clamp-2">{article.title}</h3>
                                      <div className="flex items-center gap-2 mt-2">
                                         <span className="text-[10px] text-slate-500 font-bold bg-slate-900/50 px-2 py-0.5 rounded border border-slate-700/50">{article.date || 'جديد'}</span>
                                         <span className="text-indigo-500 text-[10px] font-bold flex items-center gap-0.5 mr-auto pl-1 group-hover:-translate-x-1 transition-transform">
                                            اقرأ المزيد <ChevronLeft className="w-3 h-3"/>
                                         </span>
                                      </div>
                                   </div>
                                </div>
                             ))
                          ) : (
                            <div className="text-center py-8 text-slate-500">
                               <p>لم يتم العثور على مقالات تطابق بحثك.</p>
                            </div>
                          )}
                       </div>
                    )}
                  </div>
                )}
             </div>
          )}

        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#0f172a]/95 backdrop-blur-xl border-t border-slate-800 pb-safe z-50 h-[80px] px-6 shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
        <div className="flex justify-between items-center h-full max-w-lg mx-auto">
           <button onClick={() => { setActiveTab('home'); setActiveToolView('main'); }} className={`flex flex-col items-center justify-center gap-1.5 w-16 transition-all duration-300 ${activeTab === 'home' ? 'text-sky-400 -translate-y-1' : 'text-slate-500 hover:text-slate-300'}`}>
              <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'home' ? 'bg-sky-500/10' : ''}`}><Home className={`w-6 h-6 ${activeTab === 'home' ? 'fill-sky-500/20' : ''}`} /></div><span className="text-[10px] font-bold">الرئيسية</span>
           </button>
           <button onClick={() => { setActiveTab('tools'); setActiveToolView('main'); }} className={`flex flex-col items-center justify-center gap-1.5 w-16 transition-all duration-300 ${activeTab === 'tools' ? 'text-violet-400 -translate-y-1' : 'text-slate-500 hover:text-slate-300'}`}>
              <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'tools' ? 'bg-violet-500/10' : ''}`}><Wrench className={`w-6 h-6 ${activeTab === 'tools' ? 'fill-violet-500/20' : ''}`} /></div><span className="text-[10px] font-bold">الأدوات</span>
           </button>
           <button onClick={() => { setActiveTab('info'); setActiveToolView('main'); }} className={`flex flex-col items-center justify-center gap-1.5 w-16 transition-all duration-300 ${activeTab === 'info' ? 'text-emerald-400 -translate-y-1' : 'text-slate-500 hover:text-slate-300'}`}>
              <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'info' ? 'bg-emerald-500/10' : ''}`}><Info className={`w-6 h-6 ${activeTab === 'info' ? 'fill-emerald-500/20' : ''}`} /></div><span className="text-[10px] font-bold">معلومات</span>
           </button>
        </div>
      </nav>

      {showInstallBanner && (
        <div className="fixed bottom-[90px] left-4 right-4 z-[100] animate-slide-up">
          <div className="bg-gradient-to-r from-sky-900/90 to-slate-900/90 border border-sky-500/30 backdrop-blur-md p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/20"><Download className="w-6 h-6 text-white" /></div>
              <div className="text-right"><h3 className="font-bold text-sm text-white">تثبيت التطبيق</h3><p className="text-[10px] text-sky-200">أضف للشاشة الرئيسية</p></div>
            </div>
            <div className="flex gap-2">
               <button onClick={() => setShowInstallBanner(false)} className="p-2 text-slate-400 hover:bg-white/10 rounded-lg"><X className="w-4 h-4"/></button>
               <button onClick={handleInstallClick} className="px-4 py-2 bg-white text-sky-600 text-xs font-black rounded-xl hover:bg-sky-50">تثبيت</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
