import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { 
  Map as MapIcon, 
  Search, 
  Languages, 
  ShieldCheck, 
  Compass, 
  Menu, 
  Bell, 
  User as UserIcon,
  Mic,
  Send,
  AlertTriangle,
  Navigation,
  CloudSun,
  Heart,
  ChevronRight,
  Info,
  DollarSign,
  X,
  Volume2,
  Check,
  Activity,
  Plane,
  Wind,
  Calendar,
  Layers,
  Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { translateText, getHiddenGems, getPricingInsights, textToSpeech, STATIC_GEMS } from './lib/gemini';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { addDoc, collection, serverTimestamp, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

// --- Components ---

const ProjectLogo = () => (
  <div className="flex items-center gap-2">
    <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-forest-green via-lake-turquoise to-emerald-400 text-white shadow-sm shadow-forest-green/20">
      <svg className="w-5 h-5 text-white animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
      </svg>
      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-sunset-orange rounded-full animate-ping" />
      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-sunset-orange rounded-full" />
    </div>
    <div className="flex flex-col animate-fade-in">
      <span className="text-sm font-black tracking-tight leading-none text-forest-green uppercase">
        Yatra<span className="text-lake-turquoise">Nepal</span>
      </span>
      <span className="text-[8px] font-black text-amber-500 tracking-widest uppercase mt-0.5 leading-none">
        Himalayan Explorer
      </span>
    </div>
  </div>
);

const Navbar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => {
  const { user, login, logout } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 z-50 px-6 py-2.5 flex justify-around items-center md:top-0 md:bottom-auto md:border-t-0 md:border-b md:h-16">
      <div className="hidden md:block mr-auto">
        <ProjectLogo />
      </div>
      <div className="flex justify-around flex-1 md:flex-none md:gap-8 max-w-lg">
        <NavItem icon={<Compass size={22} />} label="Explore" active={activeTab === 'explore'} onClick={() => setActiveTab('explore')} />
        <NavItem icon={<MapIcon size={22} />} label="Map" active={activeTab === 'map'} onClick={() => setActiveTab('map')} />
        <NavItem icon={<Languages size={22} />} label="Translate" active={activeTab === 'translate'} onClick={() => setActiveTab('translate')} />
        <NavItem icon={<ShieldCheck size={22} />} label="Safety" active={activeTab === 'safety'} onClick={() => setActiveTab('safety')} />
      </div>
      <div className="flex items-center gap-4 ml-auto">
        {user ? (
          <Button variant="ghost" onClick={logout} className="flex gap-2 items-center rounded-2xl p-1.5 hover:bg-slate-100">
            <img src={user.photoURL || ''} className="w-8 h-8 rounded-full border border-slate-200" alt="User" referrerPolicy="no-referrer" />
            <span className="text-xs font-black text-slate-700 hidden lg:inline">{user.displayName || 'Explorer'}</span>
          </Button>
        ) : (
          <Button onClick={login} className="rounded-full bg-forest-green hover:bg-forest-green/90 px-6 font-bold text-xs h-9 text-white">
            Login
          </Button>
        )}
      </div>
    </nav>
  );
};

const NavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all duration-300 ${active ? 'text-forest-green scale-105 font-bold' : 'text-slate-400 hover:text-slate-700'}`}
  >
    {icon}
    <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
  </button>
);

// --- Screens ---

const ExploreScreen = ({ 
  gems, 
  loading, 
  onSelectGem,
  bookmarkedNames,
  toggleBookmark
}: { 
  gems: any[], 
  loading: boolean, 
  onSelectGem: (gem: any) => void,
  bookmarkedNames: string[],
  toggleBookmark: (name: string) => void
}) => {
  const [filter, setFilter] = useState('All');

  const filteredGems = filter === 'All' 
    ? gems 
    : filter === '★ Saved Yatras'
      ? gems.filter(g => bookmarkedNames.includes(g.name))
      : gems.filter(g => g.category === filter);

  return (
    <div className="pb-24 pt-4 px-4 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-mountain-blue mb-1 uppercase tracking-tight">Discover Nepal</h1>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-none">Uncover the Secret Sanctuaries of the Himalayas</p>
      </header>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
        {['All', 'Villages', 'Nature', 'Culture', 'Adventure', '★ Saved Yatras'].map((cat) => (
          <Button 
            key={cat}
            variant={filter === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(cat)}
            className={`rounded-full px-5 font-bold text-xs transition-all h-9 whitespace-nowrap ${
              filter === cat 
                ? 'bg-forest-green hover:bg-forest-green text-white shadow-sm shadow-forest-green/20' 
                : 'text-slate-600 bg-white border-slate-200'
            }`}
          >
            {cat}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
        {loading && gems.length === 0 ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i} className="rounded-3xl overflow-hidden border-none shadow-md">
              <Skeleton className="h-48 w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </div>
            </Card>
          ))
        ) : filteredGems.length === 0 && filter === '★ Saved Yatras' ? (
          <div className="col-span-full py-12 px-6 bg-white rounded-[32px] border border-slate-100/80 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 mx-auto animate-pulse">
              <Heart size={28} className="fill-red-200 stroke-red-400" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Your Saved Yatras are empty</h3>
              <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                You haven't bookmarked any remote destinations yet. Tap the heart icon in the corner of any destination card to save it instantly for your offline Himalayan plan!
              </p>
            </div>
          </div>
        ) : (
          filteredGems.map((gem, i) => (
            <motion.div
              key={`${gem.name}-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card 
                className="overflow-hidden rounded-[32px] border-none shadow-lg hover:shadow-xl transition-shadow cursor-pointer group bg-white"
                onClick={() => onSelectGem(gem)}
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={gem.imageUrl || `https://picsum.photos/seed/${gem.name}/800/600`} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt={gem.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${gem.name}/800/600`;
                    }}
                  />
                  
                  {/* Floating glass heart bookmark button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBookmark(gem.name);
                    }}
                    className="absolute top-4 right-4 bg-white/80 hover:bg-white text-red-500 p-2.5 rounded-full backdrop-blur-md shadow-md cursor-pointer hover:scale-110 active:scale-95 transition-all z-20"
                  >
                    <Heart 
                      size={18} 
                      className={bookmarkedNames.includes(gem.name) ? 'fill-red-500 stroke-red-500' : 'stroke-red-500'} 
                    />
                  </button>

                  <div className="absolute top-4 left-4 flex gap-2">
                    <Badge className="bg-white/95 text-slate-800 backdrop-blur-sm border-none shadow-sm text-[10px] font-black uppercase">
                      {gem.crowdLevel} Crowd
                    </Badge>
                    <Badge className="bg-[#0D9488] text-white border-none shadow-sm text-[10px] font-black uppercase">
                      {gem.category || 'Hidden Gem'}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-forest-green transition-colors">{gem.name}</h3>
                    <div className="flex items-center text-lake-turquoise text-sm font-bold bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100">
                      <Navigation size={13} className="mr-1" />
                      {gem.distance}
                    </div>
                  </div>
                  <p className="text-slate-600 text-sm line-clamp-2 mb-4">{gem.translation || gem.localDescription}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400 font-bold uppercase">
                    <span className="flex items-center"><CloudSun size={14} className="mr-1 text-slate-400" /> {gem.bestSeason}</span>
                    <span className="flex items-center"><ShieldCheck size={14} className="mr-1 text-[#0D9488]" /> {gem.safetyStatus === 'safe' ? 'Verified' : gem.safetyStatus}</span>
                  </div>
                  {gem.homestays && gem.homestays.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-550 font-bold">
                      <span className="flex items-center text-[#0D9488]"><Home size={12} className="mr-1.5" /> {gem.homestays.length} Near Homestay{gem.homestays.length > 1 ? 's' : ''}</span>
                      <span className="text-slate-650 bg-slate-50 border border-slate-100/60 shadow-xs px-2 py-0.5 rounded-xl text-[10px]">From रू {Math.min(...gem.homestays.map((h: any) => h.priceNPR)).toLocaleString()}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

const QUICK_TRANSLATIONS: Record<string, Record<string, string>> = {
  "Nepali": {
    "How much does this cost?": "यसको कति पैसा पर्छ? (Yas ko kati paisa parcha?)",
    "Where is the nearest hospital?": "नजिकैको अस्पताल कहाँ छ? (Najikaiko aspatal kaha cha?)",
    "I need help": "मलाई सहयोग चाहिन्छ (Malai sahyog chaihinchha)",
    "Can you help me find my way?": "के तपाईं मलाई बाटो देखाउन सक्नुहुन्छ? (Ke tapai malai bato dekhauna saknuhunchha?)",
    "Thank you very much": "धेरै धेरै धन्यवाद (Dherai dherai dhanyabaad)",
    "Good morning / Hello": "नमस्ते (Namaste)",
    "Where is the drinking water?": "खानेपानी कहाँ छ? (Khane pani kaha cha?)",
    "Is this food spicy?": "के यो खाना पिरो छ? (Ke yo khana piro cha?)",
    "How do I reach the tea house?": "म चिया घर कसरी पुग्न सक्छु? (Ma chiya ghar kasari pugna sakchhu?)"
  },
  "Sherpa": {
    "How much does this cost?": "दि थिउगी कटि यिन? (Di thiugi kati yin?)",
    "Where is the nearest hospital?": "मेण्टखाङ खाबा वोद? (Menthkhang khaba wod?)",
    "I need help": "ङाला रोक्श थप (Ngala roksha thap)",
    "Can you help me find my way?": "ङाला घ्येम्बा तेन तोङ? (Ngala ghyemba ten tong?)",
    "Thank you very much": "थुचि छे (Thuchi chhe)",
    "Good morning / Hello": "ताशी देलेक (Tashi delek)",
    "Where is the drinking water?": "चुम कुति वोद? (Chum kuti wod?)",
    "Is this food spicy?": "शे साना खोवो वोद? (She sana khowo wod?)",
    "How do I reach the tea house?": "ङा चियाखाङ खाबा ग्युक? (Nga chiyakhang khaba gyuk?)"
  },
  "Newari": {
    "How much does this cost?": "थुकिया गुलि वः? (Thukiya guli wo?)",
    "Where is the nearest hospital?": "अस्पताल गन दु? (Aspatal gana du?)",
    "I need help": "जितः ग्वहालि माल (Jita gwahali maala)",
    "Can you help me find my way?": "जितः लँ क्यना बियादिसँ? (Jita lan kyana biyadisand?)",
    "Thank you very much": "सुभाय् (Subhay)",
    "Good morning / Hello": "ज्वजलप्पा (Jojolappa)",
    "Where is the drinking water?": "लः गन दइ? (La gana da-ee?)",
    "Is this food spicy?": "के यो जा कडा दु? (Ke yo ja kada du?)",
    "How do I reach the tea house?": "चिया पसल गथे वनेगु? (Chiya pasal gathe wanegu?)"
  },
  "Tamang": {
    "How much does this cost?": "च्युकी कादे मुबा? (Chyuki kade muba?)",
    "Where is the nearest hospital?": "अस्पताल खानि मुबा? (Aspatal khani muba?)",
    "I need help": "ङादा म्हार ल्हो पिन्गो (Ngada mhar lho pingo)",
    "Can you help me find my way?": "ङादा ग्येम तेन पिन्गो (Ngada gyem ten pingo)",
    "Thank you very much": "तुचे (Tuche)",
    "Good morning / Hello": "फ्याफुल्ला (Fyafulla)",
    "Where is the drinking water?": "कुई खानि मुबा? (Kui khani muba?)",
    "Is this food spicy?": "चा चाबा पिजी मुबा? (Cha chaba piji muba?)",
    "How do I reach the tea house?": "ङा चियाखाङ खानि निबा? (Nga chiyakhang khani niba?)"
  },
  "Spanish": {
    "How much does this cost?": "¿Cuánto cuesta esto?",
    "Where is the nearest hospital?": "¿Dónde está el hospital más cercano?",
    "I need help": "Necesito ayuda",
    "Can you help me find my way?": "¿Puede ayudarme a encontrar el camino?",
    "Thank you very much": "Muchas gracias",
    "Good morning / Hello": "Buenos días / Hola",
    "Where is the drinking water?": "¿Dónde hay agua potable?",
    "Is this food spicy?": "¿Esta comida es picante?",
    "How do I reach the tea house?": "¿Cómo llego a la casa de té?"
  },
  "Mandarin": {
    "How much does this cost?": "这个多少钱？ (Zhège duōshǎo qián?)",
    "Where is the nearest hospital?": "最近的医院在哪？ (Zuìjìn de yīyuàn zài nǎ?)",
    "I need help": "我需要帮助 (Wǒ xūyào bāngzhù)",
    "Can you help me find my way?": "你能帮我认路吗？ (Nǐ néng bāng wǒ rèn lù ma?)",
    "Thank you very much": "非常感谢 (Fēicháng gǎnxiè)",
    "Good morning / Hello": "您好 (Nínhǎo)",
    "Where is the drinking water?": "饮用水在哪里？ (Yǐnyòngshuǐ zài nǎlǐ?)",
    "Is this food spicy?": "这个菜辣吗？ (Zhège cài là ma?)",
    "How do I reach the tea house?": "我怎么去茶屋？ (Wǒ zěnme qù cháwū?)"
  },
  "French": {
    "How much does this cost?": "Combien ça coûte ?",
    "Where is the nearest hospital?": "Où est l'hôpital le plus proche ?",
    "I need help": "J'ai besoin d'aide",
    "Can you help me find my way?": "Pouvez-vous m'aider à trouver mon chemin ?",
    "Thank you very much": "Merci beaucoup",
    "Good morning / Hello": "Bonjour",
    "Where is the drinking water?": "Où est l'eau potable ?",
    "Is this food spicy?": "Est-ce que ce plat est épicé ?",
    "How do I reach the tea house?": "Comment aller au salon de thé ?"
  },
  "German": {
    "How much does this cost?": "Wie viel kostet das?",
    "Where is the nearest hospital?": "Wo ist das nächste Krankenhaus?",
    "I need help": "Ich brauche Hilfe",
    "Can you help me find my way?": "Können Sie mir den Weg zeigen?",
    "Thank you very much": "Vielen Dank",
    "Good morning / Hello": "Guten Morgen / Hallo",
    "Where is the drinking water?": "Wo gibt es Trinkwasser?",
    "Is this food spicy?": "Ist dieses Essen scharf?",
    "How do I reach the tea house?": "Wie komme ich zum Teehaus?"
  },
  "Japanese": {
    "How much does this cost?": "これはいくらですか？ (Kore wa ikura desu ka?)",
    "Where is the nearest hospital?": "一番近い病院はどこですか？ (Ichiban chikai byōin wa doko desu ka?)",
    "I need help": "助けが必要です (Tasuke ga hitsuyō desu)",
    "Can you help me find my way?": "道を教えてくれませんか？ (Michi o oshiete kuremasen ka?)",
    "Thank you very much": "どうもありがとうございました (Dōmo arigatō gozaimashita)",
    "Good morning / Hello": "こんにちは (Konnichiwa)",
    "Where is the drinking water?": "飲料水はどこにありますか？ (Inryōsui wa doko ni arimasu ka?)",
    "Is this food spicy?": "この食べ物は辛いですか？ (Kono tabemono wa karai desu ka?)",
    "How do I reach the tea house?": "ティーハウスにはどうやって行きますか？ (Tīhausu ni wa dō yatte ikimasu ka?)"
  }
};

const TranslateScreen = () => {
  const [text, setText] = useState('');
  const [translated, setTranslated] = useState('');
  const [loading, setLoading] = useState(false);
  const [targetLang, setTargetLang] = useState('Nepali');
  const [speakForMe, setSpeakForMe] = useState(false);
  const [category, setCategory] = useState<'all' | 'essential' | 'dining' | 'emergency'>('all');

  const playAudio = async (audioText: string) => {
    // Clean audioText references brackets for cleaner speech synthesizer
    const cleanText = audioText.replace(/\([^)]*\)/g, "").trim();
    const base64Audio = await textToSpeech(cleanText);
    if (base64Audio) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const floatData = new Float32Array(bytes.length / 2);
      for (let i = 0; i < floatData.length; i++) {
        const int = (bytes[i * 2 + 1] << 8) | bytes[i * 2];
        floatData[i] = (int >= 0x8000 ? int - 0x10000 : int) / 0x8000;
      }
      
      const buffer = audioContext.createBuffer(1, floatData.length, 24000);
      buffer.getChannelData(0).set(floatData);
      
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start();
    }
  };

  const handleTranslate = async (textToUse?: string) => {
    const inputPayload = textToUse || text;
    if (!inputPayload || !inputPayload.trim()) return;
    setLoading(true);

    // 1ms client fast path first
    if (QUICK_TRANSLATIONS[targetLang] && QUICK_TRANSLATIONS[targetLang][inputPayload]) {
      const quickVal = QUICK_TRANSLATIONS[targetLang][inputPayload];
      setTranslated(quickVal);
      setLoading(false);
      if (speakForMe && quickVal) playAudio(quickVal);
      return;
    }

    // Session cache check
    const cacheKey = `${inputPayload.trim()}_to_${targetLang}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setTranslated(cached);
      setLoading(false);
      if (speakForMe && cached) playAudio(cached);
      return;
    }

    // Dynamic model request
    const result = await translateText(inputPayload, targetLang);
    const finalResult = result || '';
    setTranslated(finalResult);
    if (finalResult) {
      sessionStorage.setItem(cacheKey, finalResult);
    }
    setLoading(false);
    
    if (speakForMe && finalResult) {
      playAudio(finalResult);
    }
  };

  const filterPhrasesByCategory = () => {
    const defaultPhrases = [
      { text: "Good morning / Hello", cat: "essential" },
      { text: "Thank you very much", cat: "essential" },
      { text: "How much does this cost?", cat: "dining" },
      { text: "Is this food spicy?", cat: "dining" },
      { text: "Where is the drinking water?", cat: "dining" },
      { text: "How do I reach the tea house?", cat: "essential" },
      { text: "Can you help me find my way?", cat: "essential" },
      { text: "I need help", cat: "emergency" },
      { text: "Where is the nearest hospital?", cat: "emergency" }
    ];
    if (category === 'all') return defaultPhrases;
    return defaultPhrases.filter(p => p.cat === category);
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-2xl mx-auto h-[calc(100vh-80px)] flex flex-col">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-forest-green mb-1 leading-none">AI Translator</h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Break local & international barriers</p>
        </div>
        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
          <Switch 
            id="speak-mode" 
            checked={speakForMe} 
            onCheckedChange={setSpeakForMe}
          />
          <Label htmlFor="speak-mode" className="text-[10px] font-black text-slate-500 uppercase tracking-wider cursor-pointer">Speak For Me</Label>
        </div>
      </header>

      <div className="flex-1 flex flex-col gap-4">
        <Card className="rounded-3xl border-none shadow-md overflow-hidden bg-white">
          <CardContent className="p-0">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">English (Auto Detect)</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setText(''); setTranslated(''); }}
                className="text-xs text-slate-400 font-bold hover:text-slate-600 h-7 px-2.5 rounded-lg"
              >
                Clear
              </Button>
            </div>
            <textarea 
              className="w-full p-5 bg-transparent resize-none focus:outline-none text-base min-h-[100px] placeholder:text-slate-300 font-medium"
              placeholder="Type or tap any quick phrase to generate robust instant translations..."
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                // Trigger translation dynamically for fast typing
                if (e.target.value === '') setTranslated('');
              }}
            />
          </CardContent>
        </Card>

        {/* Translation trigger bar */}
        <div className="flex justify-center -my-1">
          <Button 
            onClick={() => handleTranslate()} 
            disabled={loading || !text.trim()}
            className="rounded-full w-14 h-14 bg-forest-green hover:bg-forest-green/90 shadow-xl shadow-forest-green/20 text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 disabled:opacity-40"
          >
            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <Languages size={24} />}
          </Button>
        </div>

        {/* Translation Output Card */}
        <Card className="rounded-3xl border-none shadow-lg overflow-hidden bg-white border border-slate-100">
          <CardContent className="p-0">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/20">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-forest-green uppercase tracking-wider">Target Language:</span>
                <select 
                  value={targetLang} 
                  onChange={(e) => {
                    setTargetLang(e.target.value);
                    if (text) {
                      handleTranslate(text);
                    }
                  }}
                  className="bg-transparent text-xs font-black uppercase tracking-wider text-forest-green focus:outline-none decoration-none cursor-pointer hover:underline border-none"
                >
                  <option value="Nepali">Nepali (National)</option>
                  <option value="Sherpa">Sherpa (Highland)</option>
                  <option value="Newari">Newari (Kathmandu)</option>
                  <option value="Tamang">Tamang (Hills)</option>
                  <option value="Spanish">Spanish (Español)</option>
                  <option value="Mandarin">Mandarin (中文)</option>
                  <option value="French">French (Français)</option>
                  <option value="German">German (Deutsch)</option>
                  <option value="Japanese">Japanese (日本語)</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                </select>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                disabled={!translated}
                className="text-forest-green hover:bg-forest-green/5 h-8 w-8 p-0 rounded-full flex items-center justify-center"
                onClick={() => translated && playAudio(translated)}
              >
                <Volume2 size={18} />
              </Button>
            </div>
            <div className="p-6 text-lg font-black text-slate-800 min-h-[110px] bg-gradient-to-br from-white to-slate-50/30">
              {translated ? (
                <p className="leading-relaxed animate-fade-in text-forest-green">{translated}</p>
              ) : (
                <span className="text-slate-300 font-medium italic text-sm">Translation will appear here instantly...</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Interactive Quick Phrases Categories panel */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quick Phrases & Dictionary</h4>
            <div className="flex gap-1">
              {(['all', 'essential', 'dining', 'emergency'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`text-[8.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md transition-colors ${
                    category === cat ? 'bg-forest-green text-white' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          
          <ScrollArea className="w-full whitespace-nowrap pb-2 outline-none">
            <div className="flex gap-2">
              {filterPhrasesByCategory().map((phraseObj, i) => (
                <Button 
                  key={i} 
                  variant="outline" 
                  className="rounded-xl border-slate-200 text-xs font-bold text-slate-700 hover:bg-forest-green/5 hover:text-forest-green hover:border-forest-green/30 h-8.5 px-3.5 transition-all bg-white"
                  onClick={() => {
                    setText(phraseObj.text);
                    setTranslated('');
                    // Auto-trigger instant dictionary path
                    if (QUICK_TRANSLATIONS[targetLang] && QUICK_TRANSLATIONS[targetLang][phraseObj.text]) {
                      setTranslated(QUICK_TRANSLATIONS[targetLang][phraseObj.text]);
                      if (speakForMe) playAudio(QUICK_TRANSLATIONS[targetLang][phraseObj.text]);
                    } else {
                      // fallback to fast translation
                      setLoading(true);
                      translateText(phraseObj.text, targetLang).then((res) => {
                        setTranslated(res || '');
                        setLoading(false);
                        if (speakForMe && res) playAudio(res);
                      });
                    }
                  }}
                >
                  {phraseObj.text}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

const mapPositions: Record<string, { top: string, left: string }> = {
  "Bandipur": { top: '55%', left: '48%' },
  "Ghandruk": { top: '48%', left: '42%' },
  "Marpha": { top: '38%', left: '40%' },
  "Tsho Rolpa": { top: '53%', left: '62%' },
  "Panch Pokhari": { top: '51%', left: '58%' },
  "Nar Phu Valley": { top: '36%', left: '44%' },
  "Phoksundo Lake": { top: '42%', left: '30%' },
  "Khaptad National Park": { top: '32%', left: '12%' },
  "Dhorpatan Hunting Reserve": { top: '46%', left: '34%' },
  "Badimalika": { top: '35%', left: '16%' },
  "Barun Valley": { top: '56%', left: '72%' }
};

const getGemPosition = (name: string) => {
  if (mapPositions[name]) return mapPositions[name];
  // Deterministic fallback based on hash of name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const top = 35 + Math.abs((hash % 30)) + '%';
  const left = 20 + Math.abs(((hash >> 3) % 65)) + '%';
  return { top, left };
};

const MapScreen = ({ gems, onSelectGem }: { gems: any[], onSelectGem: (gem: any) => void }) => {
  const [view, setView] = useState<'crowd' | 'safety' | 'weather'>('crowd');

  // Interactive zoom & panning states
  const [scale, setScale] = useState(1.1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Pinch-to-zoom states
  const [initialDistance, setInitialDistance] = useState<number | null>(null);
  const [initialScale, setInitialScale] = useState<number>(1.1);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Avoid dragging when clicking pins or interactive cards
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.z-20')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Apply safe panning margins based on scale factor
    const maxBoundX = 350 * scale;
    const maxBoundY = 250 * scale;
    setPosition({
      x: Math.max(-maxBoundX, Math.min(maxBoundX, newX)),
      y: Math.max(-maxBoundY, Math.min(maxBoundY, newY))
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomIntensity = 0.08;
    let newScale = scale + (e.deltaY < 0 ? zoomIntensity : -zoomIntensity);
    newScale = Math.max(0.7, Math.min(4.5, newScale));
    setScale(newScale);
  };

  // Touch gesture support: single finger panning & double finger pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.z-20')) return;
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
      setInitialDistance(null);
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      setInitialDistance(dist);
      setInitialScale(scale);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      const newX = touch.clientX - dragStart.x;
      const newY = touch.clientY - dragStart.y;
      const maxBoundX = 400 * scale;
      const maxBoundY = 300 * scale;
      setPosition({
        x: Math.max(-maxBoundX, Math.min(maxBoundX, newX)),
        y: Math.max(-maxBoundY, Math.min(maxBoundY, newY))
      });
    } else if (e.touches.length === 2 && initialDistance !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const factor = dist / initialDistance;
      const newScale = Math.max(0.7, Math.min(4.5, initialScale * factor));
      setScale(newScale);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setInitialDistance(null);
  };

  const resetMap = () => {
    setScale(1.1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div 
      className="h-[calc(100vh-80px)] md:h-[calc(100vh-64px)] relative overflow-hidden bg-[#F4F1EA] select-none cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Zoomable, Pannable Google Maps styled Vector Workspace Layer */}
      <div 
        className="absolute inset-0 select-none transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: 'center'
        }}
      >
        {/* Custom Physical & Topographical Vector Map */}
        <svg className="absolute inset-0 w-full h-full min-w-[1200px] min-h-[900px]" viewBox="0 0 1200 900" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Base terrain valley tone */}
          <rect width="10000" height="10000" x="-5000" y="-5000" fill="#F4F1EA" />
          
          {/* Natural Evergreen Reserves (Chitwan, Bardia, Khaptad green spaces) */}
          <path d="M 50 450 Q 250 400, 450 480 T 850 460 T 1150 430 L 1200 900 L 0 900 Z" fill="#E2EFE0" />
          <path d="M 120 550 Q 300 580, 480 530 T 800 600 T 1180 520 L 1200 900 L 0 900 Z" fill="#D2E7CD" opacity="0.8" fillRule="evenodd" />
          <path d="M 300 700 C 450 680, 600 750, 800 690 C 950 630, 1100 710, 1200 700 L 1200 900 L 0 900 Z" fill="#C5E2BE" opacity="0.6" />

          {/* Topographical Grid Lines (Light Grey spacing) */}
          <g stroke="#E8E4D8" strokeWidth="1" strokeDasharray="5 5" opacity="0.7">
            <line x1="100" y1="0" x2="100" y2="1200" />
            <line x1="300" y1="0" x2="300" y2="1200" />
            <line x1="500" y1="0" x2="500" y2="1200" />
            <line x1="700" y1="0" x2="700" y2="1200" />
            <line x1="900" y1="0" x2="900" y2="1200" />
            <line x1="1100" y1="0" x2="1100" y2="1200" />
            <line x1="0" y1="150" x2="1200" y2="150" />
            <line x1="0" y1="300" x2="1200" y2="300" />
            <line x1="0" y1="450" x2="1200" y2="450" />
            <line x1="0" y1="600" x2="1200" y2="600" />
            <line x1="0" y1="750" x2="1200" y2="750" />
          </g>

          {/* Topographic height contour lines outlining Himalayan altitudes */}
          <path d="M-50,300 C200,280 400,320 600,260 C800,200 1000,290 1250,220" fill="none" stroke="#E3DEC9" strokeWidth="2" />
          <path d="M-50,240 C220,220 450,260 650,200 C850,140 1050,210 1250,165" fill="none" stroke="#DDD7BC" strokeWidth="2" />
          <path d="M-50,180 C240,160 500,200 700,140 C900,80 1100,150 1250,105" fill="none" stroke="#D3CCA8" strokeWidth="2" />

          {/* High mountain ranges (Mt Everest, Annapurna, Manaslu snow outlines) */}
          <g fill="url(#mountainGrad)" stroke="#B0C8C3" strokeWidth="1" strokeLinejoin="round">
            <polygon points="-50,180 80,100 180,195 280,60 400,210 520,35 630,190 750,55 880,220 1000,30 1120,180 1250,90 1250,-50 -50,-50" />
          </g>
          <defs>
            <linearGradient id="mountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="35%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
          </defs>

          {/* Snowy high peak caps & ridges */}
          <polygon points="80,100 65,120 95,120" fill="#FFFFFF" />
          <polygon points="280,60 255,100 305,100" fill="#FFFFFF" />
          <polygon points="520,35 490,95 550,95" fill="#FFFFFF" />
          <polygon points="750,55 725,105 775,105" fill="#FFFFFF" />
          <polygon points="1000,30 965,90 1035,90" fill="#FFFFFF" />

          {/* Majestic glacial rivers passing through the deep valleys */}
          <g fill="none" stroke="#90C3E5" strokeLinecap="round" strokeLinejoin="round">
            {/* Koshi system */}
            <path d="M 1000 30 C 970 120, 990 250, 940 380 T 890 560 T 930 720 T 980 950" strokeWidth="5" />
            <path d="M 1120 180 C 1080 220, 1050 310, 990 380" strokeWidth="3" />
            {/* Gandaki system */}
            <path d="M 520 35 C 550 150, 520 280, 580 410 T 540 600 T 500 780 T 530 950" strokeWidth="4" strokeDasharray="0.5 0.5" />
            {/* Karnali system */}
            <path d="M 280 60 C 240 180, 290 320, 240 460 T 200 710 T 260 950" strokeWidth="5" />
          </g>

          {/* Custom Google Maps Silk Route Highway Link (Orange & Yellow double line) */}
          <path d="M -50,520 Q 250,480, 580,510 T 1250,490" fill="none" stroke="#FBD584" strokeWidth="4.5" opacity="0.9" />
          <path d="M -50,520 Q 250,480, 580,510 T 1250,490" fill="none" stroke="#FFF7E3" strokeWidth="2.5" opacity="0.95" />

          {/* Regional connecting secondary path (Beige sand line) */}
          <path d="M 280,60 Q 300,360, 580,510" fill="none" stroke="#E6D7B3" strokeWidth="2" opacity="0.8" strokeDasharray="5 5" />
          <path d="M 750,55 Q 810,290, 890,560" fill="none" stroke="#E6D7B3" strokeWidth="2.1" opacity="0.8" />
        </svg>

        {/* Heatmap Overlays (Soft ambient pulse indicator representing live conditions as map layers) */}
        <div className="absolute inset-0 pointer-events-none">
          {view === 'crowd' && (
            <>
              <div className="absolute top-[48%] left-[42%] w-48 h-48 bg-red-500/20 rounded-full blur-3xl animate-pulse" />
              <div className="absolute top-[55%] left-[48%] w-56 h-56 bg-amber-500/15 rounded-full blur-3xl" />
              <div className="absolute top-[38%] left-[40%] w-32 h-32 bg-green-500/20 rounded-full blur-2xl" />
            </>
          )}
          {view === 'safety' && (
            <>
              <div className="absolute top-[51%] left-[58%] w-44 h-44 bg-emerald-500/15 rounded-full blur-3xl" />
              <div className="absolute top-[32%] left-[12%] w-36 h-36 bg-green-500/20 rounded-full blur-2xl" />
            </>
          )}
        </div>

        {/* Dynamic Map Pins: Integrated inside pannable workspace */}
        {gems.map((gem, i) => {
          const pos = getGemPosition(gem.name);
          
          let pinColor = 'bg-forest-green';
          if (view === 'crowd') {
            if (gem.crowdLevel === 'high') {
              pinColor = 'bg-red-500';
            } else if (gem.crowdLevel === 'medium') {
              pinColor = 'bg-amber-500';
            } else {
              pinColor = 'bg-green-500';
            }
          } else if (view === 'safety') {
            if (gem.safetyStatus === 'caution') {
              pinColor = 'bg-orange-500';
            } else {
              pinColor = 'bg-teal-500';
            }
          } else if (view === 'weather') {
            pinColor = 'bg-sky-500';
          }

          return (
            <button
              key={`${gem.name}-pin-${i}`}
              className="absolute group z-10 flex flex-col items-center -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-115 active:scale-90 cursor-pointer pointer-events-auto"
              style={{ top: pos.top, left: pos.left }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectGem(gem);
              }}
            >
              {/* Ping glow background */}
              <span className={`absolute inline-flex h-8 w-8 rounded-full opacity-40 animate-ping ${
                view === 'crowd' && gem.crowdLevel === 'high' ? 'bg-red-500' : 'bg-lake-turquoise'
              }`} />
              
              {/* Main inner pin body */}
              <div className={`relative flex items-center justify-center h-8.5 w-8.5 rounded-full text-white shadow-lg border-2 border-white transition-colors duration-300 ${pinColor}`}>
                <Compass size={13} className="animate-spin-slow" />
              </div>

              {/* Highly readable micro-card tag */}
              <div className="mt-1 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-lg shadow-sm border border-slate-100/80 flex flex-col items-center pointer-events-none min-w-[70px]">
                <span className="text-[9px] font-black text-slate-800 whitespace-nowrap">{gem.name}</span>
                {view === 'crowd' && (
                  <span className="text-[7.5px] font-black text-slate-400 capitalize">{gem.crowdLevel}</span>
                )}
                {view === 'safety' && (
                  <span className="text-[7.5px] font-black text-emerald-500 capitalize">{gem.safetyStatus === 'safe' ? 'Secure' : 'Caution'}</span>
                )}
                {view === 'weather' && (
                  <span className="text-[7.5px] font-black text-sky-500 capitalize">{gem.bestSeason}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Floating Google Maps Style Zoom & Reset Widgets */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-1.5 z-20 pointer-events-auto">
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-xl w-10.5 h-10.5 bg-white border border-slate-200/60 shadow-md text-slate-700 font-extrabold hover:bg-slate-50 transition-all text-sm"
          onClick={() => setScale(prev => Math.min(4.5, prev + 0.3))}
        >
          +
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-xl w-10.5 h-10.5 bg-white border border-slate-200/60 shadow-md text-slate-700 font-extrabold hover:bg-slate-50 transition-all text-sm"
          onClick={() => setScale(prev => Math.max(0.7, prev - 0.3))}
        >
          −
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-xl w-10.5 h-10.5 bg-white border border-slate-200/60 shadow-md text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
          onClick={resetMap}
          title="Reset View"
        >
          <Compass size={16} />
        </Button>
      </div>

      {/* Map Mode Filters */}
      <div className="absolute top-6 left-6 right-6 flex flex-col gap-4">
        <div className="bg-white/80 backdrop-blur-md p-1 rounded-full shadow-lg border border-slate-100 flex gap-1 self-center z-20">
          <Button 
            variant={view === 'crowd' ? 'default' : 'ghost'} 
            size="sm" 
            className={`rounded-full px-5 text-xs font-black uppercase tracking-wider ${view === 'crowd' ? 'bg-forest-green hover:bg-forest-green text-white' : 'text-slate-500'}`}
            onClick={() => setView('crowd')}
          >
            Crowd
          </Button>
          <Button 
            variant={view === 'safety' ? 'default' : 'ghost'} 
            size="sm" 
            className={`rounded-full px-5 text-xs font-black uppercase tracking-wider ${view === 'safety' ? 'bg-forest-green hover:bg-forest-green text-white' : 'text-slate-500'}`}
            onClick={() => setView('safety')}
          >
            Safety
          </Button>
          <Button 
            variant={view === 'weather' ? 'default' : 'ghost'} 
            size="sm" 
            className={`rounded-full px-5 text-xs font-black uppercase tracking-wider ${view === 'weather' ? 'bg-forest-green hover:bg-forest-green text-white' : 'text-slate-500'}`}
            onClick={() => setView('weather')}
          >
            Weather
          </Button>
        </div>

        {/* Live list card overlay */}
        <div className="flex justify-between items-start pointer-events-none">
          <Card className="w-56 rounded-2xl border-none shadow-xl bg-white/95 backdrop-blur-md pointer-events-auto z-20">
            <CardContent className="p-3.5">
              <h4 className="text-xs font-black text-slate-900 mb-2.5 uppercase tracking-wider">Live Travel Index</h4>
              <div className="space-y-2">
                {gems.slice(0, 3).map((g) => (
                  <div 
                    key={g.name} 
                    className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors"
                    onClick={() => onSelectGem(g)}
                  >
                    <span className="text-[10px] text-slate-800 font-bold">{g.name}</span>
                    <Badge className={`${
                      g.crowdLevel === 'high' ? 'bg-red-50 text-red-600' :
                      g.crowdLevel === 'medium' ? 'bg-amber-50 text-amber-600' :
                      'bg-green-50 text-green-600'
                    } text-[8px] font-black border-none px-1.5 py-0`}>
                      {g.crowdLevel}
                    </Badge>
                  </div>
                ))}
              </div>
              <p className="text-[8.5px] text-slate-400 mt-2.5 text-center font-bold uppercase tracking-wider">Pinch or drag to traverse nepal</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Button 
        onClick={resetMap}
        className="absolute bottom-6 right-6 rounded-full w-12 h-12 bg-white text-forest-green shadow-xl hover:bg-slate-50 border-slate-100 z-20"
      >
        <Navigation size={20} className="transform rotate-45" />
      </Button>
    </div>
  );
};

const ItineraryPlanner = ({ gem }: { gem: any }) => {
  const [style, setStyle] = useState<'leisurely' | 'adventurous' | 'cultural'>('leisurely');
  const [duration, setDuration] = useState<number>(3);
  const [packingChecked, setPackingChecked] = useState<Record<string, boolean>>({});
  const [unlockedMilestone, setUnlockedMilestone] = useState<number>(0);

  // Custom generated days based on gem & selection
  const travelDays = React.useMemo(() => {
    const days = [];
    const activities = {
      leisurely: [
        "Morning scenic drive, sunrise photography checkpoints, and cozy check-in at localized boutique tea houses.",
        "Gentle nature walk to panoramic viewpoints, local organic organic herb tea tasting, and warm interactions with trekking home-owners.",
        "Visits to nearby monasteries, photography sessions of snowy ranges, and local handicraft souvenir browsing.",
        "Cozy organic breakfast on the terrace, travel logs capture, and packing bags for smooth descent back.",
      ],
      adventurous: [
        "Rapid transit to base, trek ascent with high altitude markers, packing heavy gear, and navigating steep mountain slopes.",
        "Early 4:00 AM summit trek for golden alpine sunrise view, rugged trail running to hidden blue glacial springs, and wild animal tracking.",
        "Technical rock climbing tutorial with local guides, gorge crossings via wooden suspension bridges, and campfire tales.",
        "Intense downhill speed descend back to highway links, high altitude record logs verification, and transit return to city."
      ],
      cultural: [
        "Arrival followed by a traditional marigold flower blessing ceremony, tasting local ethnic food preparations, and historical brief.",
        "Participate in authentic local harvesting, pottery making, or butter candle weaving inside historic temples with sherpa priests.",
        "Guided ethnography tour of localized ancient clay homes, fireside indigenous folk story sharing, and flute recital evenings.",
        "Traditional organic breakfast blessing, group photo with local kids, and exchanging parting souvenirs."
      ]
    };

    const phrases = activities[style] || activities.leisurely;
    for (let d = 1; d <= duration; d++) {
      const icon = d === 1 ? "🚗" : d === duration ? "✈️" : d % 2 === 0 ? "🏔️" : "🥾";
      days.push({
        day: d,
        title: d === 1 ? "Arrival & Settlement" : d === duration ? "Farewell & Return" : `Exploration Step ${d}`,
        icon,
        detail: phrases[(d - 1) % phrases.length]
      });
    }
    return days;
  }, [gem.name, style, duration]);

  const defaultPacking = React.useMemo(() => {
    const base = [
      "Altitude Hydration Tablets",
      "Robust Trekking Shoes",
      "Thermal layer windcheater",
      "High capacity powerbank",
      "Local cash rupees (NPR)"
    ];
    if (duration > 3) base.push("Offline Himalayan maps cache", "Portable oxygen canister");
    if (style === 'adventurous') base.push("Rugged Headlamp (350+ Lumens)", "Crampons & hiking poles");
    return base;
  }, [duration, style]);

  const handleTogglePacking = (item: string) => {
    setPackingChecked(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const completedCount = defaultPacking.filter(p => packingChecked[p]).length;
  const progressPercent = Math.round((completedCount / defaultPacking.length) * 100);

  return (
    <div className="bg-slate-50/70 rounded-[32px] p-6 border border-slate-100 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="text-forest-green" size={20} />
          <h4 className="text-base font-black text-slate-800 uppercase tracking-tight">Interactive Yatra Itinerary Planner</h4>
        </div>
        <Badge className="bg-forest-green text-white text-[10px] uppercase font-bold px-2 py-0.5 border-none rounded-full">Custom Route</Badge>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase text-slate-400">Travel Pace</label>
          <select 
            value={style} 
            onChange={(e) => setStyle(e.target.value as any)}
            className="w-full bg-white border border-slate-200/80 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="leisurely">🌸 Leisurely Scenic</option>
            <option value="adventurous">🏔️ Rugged Adventure</option>
            <option value="cultural">🏮 Cultural Soul</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-black uppercase text-slate-400">Duration (Days)</label>
          <select 
            value={duration} 
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="w-full bg-white border border-slate-200/80 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value={2}>2 Days (Weekend Run)</option>
            <option value={3}>3 Days (Deep Escape)</option>
            <option value={4}>4 Days (Fully Immersive)</option>
            <option value={5}>5 Days (The Expedition)</option>
          </select>
        </div>

        <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
          <label className="text-[9px] font-black uppercase text-slate-400">Guide Status</label>
          <div className="bg-emerald-50 rounded-xl p-1.5 text-center text-[10px] font-black text-emerald-750 border border-emerald-100/50 flex items-center justify-center h-full gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Guides Plentiful
          </div>
        </div>
      </div>

      {/* Day by Day Cards */}
      <div className="space-y-3.5">
        <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Interactive Trail Map & Timeline</h5>
        {travelDays.map((td, idx) => (
          <div 
            key={td.day} 
            className={`p-4 rounded-2xl bg-white border transition-all cursor-pointer ${
              unlockedMilestone >= idx 
                ? 'border-emerald-200 bg-white shadow-sm' 
                : 'border-slate-100 bg-slate-50/50 opacity-95'
            }`}
            onClick={() => setUnlockedMilestone(idx)}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{td.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400">Day {td.day}</span>
                  {unlockedMilestone >= idx ? (
                    <Badge className="bg-emerald-50 text-emerald-700 text-[8px] font-bold border-none h-4 px-1.5 py-0 leading-none">Unlocked</Badge>
                  ) : (
                    <Badge className="bg-slate-50 text-slate-400 text-[8px] font-bold border-none h-4 px-1.5 py-0 leading-none">Pending check-in</Badge>
                  )}
                </div>
                <h6 className="text-sm font-extrabold text-slate-800">{td.title}</h6>
              </div>
            </div>
            {unlockedMilestone >= idx && (
              <p className="mt-2 text-xs text-slate-600 leading-relaxed pl-8 border-l-2 border-emerald-500 ml-2.5 animate-fade-in">
                {td.detail}
                <span className="block mt-2 font-black text-emerald-600 text-[9.5px] cursor-pointer hover:underline" onClick={(e) => {
                  e.stopPropagation();
                  if (idx < travelDays.length - 1) {
                    setUnlockedMilestone(idx + 1);
                  }
                }}>
                  {idx < travelDays.length - 1 ? "✓ Check-in this campsite & proceed to next Day ➔" : "🎉 Itinerary completed! Stay safe!"}
                </span>
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Travel Prep Tracker (Packing Checklist) */}
      <div className="p-4 bg-white rounded-2xl border border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h5 className="text-[11px] font-black uppercase text-slate-700">Pre-Departure Gear Checklist</h5>
            <p className="text-[9px] text-slate-400">Check off items as you pack them securely</p>
          </div>
          <Badge className="bg-slate-100 text-slate-600 text-[9px] font-black border-none px-2 rounded-md">{progressPercent}% Loaded</Badge>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-[#0D9488] h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {defaultPacking.map((packItem) => {
            const isChecked = !!packingChecked[packItem];
            return (
              <button
                key={packItem}
                onClick={() => handleTogglePacking(packItem)}
                className={`flex items-center gap-2.5 p-2 rounded-xl text-left text-xs transition-colors border cursor-pointer ${
                  isChecked 
                    ? 'bg-emerald-50/40 border-emerald-250 text-[#0D9488] font-bold' 
                    : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-600'
                }`}
              >
                <div className={`w-4-h-4 min-w-[16px] h-[16px] rounded flex items-center justify-center border ${isChecked ? 'bg-[#0D9488] border-[#0D9488] text-white' : 'border-slate-300 bg-white'}`}>
                  {isChecked && <Check size={11} strokeWidth={3} />}
                </div>
                <span className="truncate">{packItem}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const AltitudeAdvisoryRadar = () => {
  const [altitude, setAltitude] = useState<number>(1400); // Kathmandu
  const [luklaStatus, setLuklaStatus] = useState<'open' | 'delayed' | 'grounded'>('open');
  const [chopperAccess, setChopperAccess] = useState<'clear' | 'restricted' | 'emergency-only'>('clear');

  // Realistic estimates based on elevation
  const oxygenMultiplier = Math.round(100 * Math.exp(-altitude / 8000));
  
  let amsRisk = 'low';
  let advice = "Acclimatized. Standard safety. Stay hydrated with 3L fresh spring water daily.";
  let color = "text-green-500";
  let bg = "bg-green-500/10";
  let border = "border-green-200";

  if (altitude >= 3550) {
    amsRisk = 'severe';
    advice = "⚠️ HIGH ALERT: Acclimatization rest day MANDATORY. Descend immediately if headache or persistent coughing starts. Carry portable oxygen canister.";
    color = "text-red-650";
    bg = "bg-red-500/10";
    border = "border-red-150";
  } else if (altitude >= 2500) {
    amsRisk = 'moderate';
    advice = "Acclimatization threshold. Pace climbs slowly (< 500m gain/day). Drink warm garlic soup (local remedy) + 4L water.";
    color = "text-amber-600";
    bg = "bg-amber-500/10";
    border = "border-amber-200";
  }

  // Handle simulated status tick
  useEffect(() => {
    const statuses: Array<'open' | 'delayed' | 'grounded'> = ['open', 'delayed', 'grounded'];
    const choppers: Array<'clear' | 'restricted' | 'emergency-only'> = ['clear', 'restricted', 'emergency-only'];
    
    const interval = setInterval(() => {
      setLuklaStatus(statuses[Math.floor(Math.random() * statuses.length)]);
      setChopperAccess(choppers[Math.floor(Math.random() * choppers.length)]);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="rounded-[32px] border-none shadow-md overflow-hidden bg-white">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Activity className="text-sunset-orange animate-pulse" size={20} />
          <div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Altitude & Acclimatization Safety Radar</h4>
            <p className="text-[9px] text-slate-400 font-bold uppercase leading-none">Real-time Oxygen & AMS Risk Forecaster</p>
          </div>
        </div>

        {/* Altitude dial/slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
            <span>Kathmandu (1400m)</span>
            <span className="text-sm text-forest-green font-black">{altitude.toLocaleString()}m Elevation</span>
            <span>Altitude Peak (6000m)</span>
          </div>
          <input 
            type="range" 
            min="1400" 
            max="6000" 
            step="100"
            value={altitude} 
            onChange={(e) => setAltitude(parseInt(e.target.value))}
            className="w-full accent-forest-green h-2 bg-slate-100 rounded-lg cursor-pointer"
          />
        </div>

        {/* Advisory widgets info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-center">
            <p className="text-[9px] text-slate-400 uppercase font-black mb-1 leading-none">Estimated Oxygen Level</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-slate-800">{oxygenMultiplier}%</span>
              <span className="text-[10px] text-slate-400 font-bold">of Sea Level</span>
            </div>
            <p className="text-[9px] text-slate-400 font-semibold mt-1">Acclimatized breathing rate: {(altitude / 1200).toFixed(1)}x baseline</p>
          </div>

          <div className={`p-4 rounded-2xl border ${bg} ${border} flex flex-col justify-center`}>
            <p className="text-[9px] text-slate-400 uppercase font-black mb-1 leading-none">Altitude Illness Risk</p>
            <span className={`text-xl font-black uppercase tracking-wider mt-1 ${color}`}>
              {amsRisk}
            </span>
            <p className="text-[9.5px] text-slate-500 font-medium leading-tight mt-1 line-clamp-1">{advice}</p>
          </div>
        </div>

        {/* Specific recommendations details */}
        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
          <h5 className="text-[10px] font-black uppercase text-slate-800 mb-1 leading-none tracking-wider">Acclimatization Medical Protocol</h5>
          <p className="text-xs text-slate-600 leading-relaxed font-semibold mt-1.5">
            {advice}
          </p>
        </div>

        {/* Mountain Flight Radar advisory */}
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <div className="flex justify-between items-center bg-sky-500/5 p-3 rounded-2xl border border-sky-500/10 gap-4">
            <div className="flex items-center gap-2">
              <Plane className="text-sky-600 rotate-45 flex-shrink-0" size={18} />
              <div>
                <h5 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-none mb-0.5">Lukla Tenzing-Hillary</h5>
                <p className="text-[9px] text-slate-400 font-bold uppercase leading-none">Dynamic Runway Weather Status</p>
              </div>
            </div>
            <Badge className={`${
              luklaStatus === 'open' ? 'bg-emerald-50 text-emerald-700' :
              luklaStatus === 'delayed' ? 'bg-amber-50 text-amber-700' :
              'bg-red-50 text-red-700'
            } font-black border-none text-[8px] px-2 py-0.5 capitalize`}>
              {luklaStatus === 'open' ? 'Open & Stable' : luklaStatus === 'delayed' ? 'Wind Shear Wait' : 'Temporarily Grounded'}
            </Badge>
          </div>

          <div className="flex justify-between items-center bg-amber-500/5 p-3 rounded-2xl border border-amber-500/10 gap-4">
            <div className="flex items-center gap-2">
              <Wind className="text-amber-600 flex-shrink-0" size={18} />
              <div>
                <h5 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-none mb-0.5">Emergency Heli-Rescue Clearance</h5>
                <p className="text-[9px] text-slate-400 font-bold uppercase leading-none">Live rescue flight clearances</p>
              </div>
            </div>
            <Badge className={`${
              chopperAccess === 'clear' ? 'bg-emerald-50 text-emerald-700' :
              chopperAccess === 'restricted' ? 'bg-amber-50 text-amber-700' :
              'bg-red-50 text-red-700'
            } font-black border-none text-[8px] px-2 py-0.5 capitalize`}>
              {chopperAccess === 'clear' ? 'Heli-Flight Clear' : chopperAccess === 'restricted' ? 'Severe Turbulence' : 'Emergency Priority Only'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SafetyScreen = () => {
  const { user } = useAuth();
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'safetyChecks'),
      where('uid', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setLastCheckIn(snapshot.docs[0].data());
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'safetyChecks');
    });

    return () => unsubscribe();
  }, [user]);

  const handleCheckIn = async (s: string) => {
    if (!user) {
      alert("Please login to check-in");
      return;
    }
    
    try {
      await addDoc(collection(db, 'safetyChecks'), {
        uid: user.uid,
        status: s,
        timestamp: serverTimestamp(),
        location: { lat: 27.7172, lng: 85.3240 } // Mock location
      });
      setShowCheckIn(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'safetyChecks');
    }
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-2xl mx-auto space-y-6">
      <header className="mb-4">
        <h1 className="text-3xl font-black text-mountain-blue mb-1 uppercase tracking-tight">Safety & Welfare</h1>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-none">Your Himalayan Well-being & Emergency Response Center</p>
      </header>

      <div className="grid grid-cols-1 gap-6">
        <Card className="rounded-[32px] border-none shadow-lg bg-gradient-to-br from-lake-turquoise to-teal-850 text-white p-2">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black mb-1">Are you safe?</h3>
                <p className="text-white/80 text-xs font-bold uppercase">
                  {lastCheckIn 
                    ? `Last checked: ${new Date(lastCheckIn.timestamp?.toDate()).toLocaleString()}` 
                    : 'No check-ins logged yet'}
                </p>
              </div>
              <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                lastCheckIn?.status === 'safe' ? 'bg-white/20 text-white' : 'bg-red-500/40 text-white animate-pulse'
              }`}>
                {lastCheckIn?.status || 'NOT SAVED'}
              </div>
            </div>
            <Button 
              onClick={() => setShowCheckIn(true)}
              className="w-full rounded-2xl bg-white text-lake-turquoise hover:bg-white/95 font-black text-sm py-6 border-none cursor-pointer"
            >
              Log Live Safety Welfare Check-in
            </Button>
          </CardContent>
        </Card>

        {/* Dynamic Interactive Altitude Safety Advisory System */}
        <AltitudeAdvisoryRadar />

        <div className="grid grid-cols-2 gap-4">
          <Card className="rounded-[32px] border-none shadow-md p-6 flex flex-col items-center text-center gap-3 bg-white">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500">
              <AlertTriangle size={24} />
            </div>
            <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">SOS Panic</h4>
            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">Instantly coordinates helicopter & mountain squad distress signals</p>
            <Button variant="outline" className="mt-2 rounded-full border-red-100 text-red-500 hover:bg-red-50 font-black text-[10px] uppercase h-8 px-4 cursor-pointer">Activate Signal</Button>
          </Card>
          <Card className="rounded-[32px] border-none shadow-md p-6 flex flex-col items-center text-center gap-3 bg-white">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-505">
              <Navigation size={24} />
            </div>
            <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">GPS Share</h4>
            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">Broadcast real-time high elevation trail progress to families</p>
            <Button variant="outline" className="mt-2 rounded-full border-emerald-100 text-emerald-600 hover:bg-emerald-50 font-black text-[10px] uppercase h-8 px-4 cursor-pointer">Start Share</Button>
          </Card>
        </div>

        <Card className="rounded-[32px] border-none shadow-md bg-white">
          <CardHeader>
            <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-tight">Emergency Mountain Support Units</CardTitle>
            <CardDescription className="text-xs text-slate-400 font-bold uppercase">Immediate dial numbers for high-terrain crises</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pb-6">
            <div className="flex justify-between items-center p-3.5 bg-slate-50 rounded-2xl border border-slate-100/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xs border border-slate-100">
                  <ShieldCheck size={20} className="text-[#0D9488]" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800">Tourist Police Branch</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Kathmandu HQ & Range Patrol</p>
                </div>
              </div>
              <Button variant="ghost" className="text-[#0D9488] font-black hover:bg-[#0D9488]/5 rounded-xl text-xs h-8 cursor-pointer" onClick={() => window.open('tel:1144')}>1144</Button>
            </div>
            <div className="flex justify-between items-center p-3.5 bg-slate-50 rounded-2xl border border-slate-100/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xs border border-slate-100">
                  <AlertTriangle size={20} className="text-sunset-orange" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800">Mountain Rescue Association</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Himalayan Heli Evacuation dispatch</p>
                </div>
              </div>
              <Button variant="ghost" className="text-sunset-orange font-black hover:bg-sunset-orange/5 rounded-xl text-xs h-8 cursor-pointer" onClick={() => window.open('tel:102')}>102</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <AnimatePresence>
        {showCheckIn && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8 sm:hidden" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">Safety Check</h2>
              <p className="text-slate-500 text-center mb-8">Please confirm your current status</p>
              
              <div className="grid grid-cols-1 gap-4">
                <Button 
                  onClick={() => handleCheckIn('safe')}
                  className="py-8 rounded-3xl bg-green-500 hover:bg-green-600 text-white font-bold text-lg flex justify-between px-8"
                >
                  I am safe <ShieldCheck size={24} />
                </Button>
                <Button 
                  onClick={() => handleCheckIn('need_help')}
                  variant="outline"
                  className="py-8 rounded-3xl border-yellow-200 text-yellow-600 hover:bg-yellow-50 font-bold text-lg flex justify-between px-8"
                >
                  I need minor help <Info size={24} />
                </Button>
                <Button 
                  onClick={() => handleCheckIn('danger')}
                  variant="outline"
                  className="py-8 rounded-3xl border-red-200 text-red-600 hover:bg-red-50 font-bold text-lg flex justify-between px-8"
                >
                  I am in danger <AlertTriangle size={24} />
                </Button>
              </div>
              
              <Button 
                variant="ghost" 
                className="w-full mt-6 text-slate-400"
                onClick={() => setShowCheckIn(false)}
              >
                Cancel
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('explore');
  const [gems, setGems] = useState<any[]>(STATIC_GEMS);
  const [loadingGems, setLoadingGems] = useState(true);
  const [selectedGem, setSelectedGem] = useState<any>(null);

  const [bookmarkedNames, setBookmarkedNames] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('yatra_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('yatra_bookmarks', JSON.stringify(bookmarkedNames));
  }, [bookmarkedNames]);

  const toggleBookmark = (name: string) => {
    setBookmarkedNames(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  useEffect(() => {
    const fetchGems = async () => {
      setLoadingGems(true);
      const aiGems = await getHiddenGems();
      if (aiGems && aiGems.length > 0) {
        setGems(prev => {
          const existingNames = new Set(prev.map(g => g.name));
          const newGems = aiGems.filter((g: any) => !existingNames.has(g.name));
          return [...prev, ...newGems];
        });
      }
      setLoadingGems(false);
    };
    fetchGems();
  }, []);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-himalaya-snow font-sans text-slate-900 pb-16 md:pb-0">
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {/* Mobile sticky header brand */}
        <div className="md:hidden flex items-center justify-between px-5 py-3.5 bg-white/90 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100/80 shadow-xs">
          <ProjectLogo />
          <Badge className="bg-forest-green/10 text-forest-green hover:bg-forest-green/10 font-bold rounded-full text-[9px] px-2.5 py-0.5 border-none">
            ★ LIVE ADVENTURER
          </Badge>
        </div>
        
        <main className="pt-2 md:pt-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'explore' && (
                <ExploreScreen 
                  gems={gems} 
                  loading={loadingGems} 
                  onSelectGem={setSelectedGem} 
                  bookmarkedNames={bookmarkedNames}
                  toggleBookmark={toggleBookmark}
                />
              )}
              {activeTab === 'translate' && <TranslateScreen />}
              {activeTab === 'map' && <MapScreen gems={gems} onSelectGem={setSelectedGem} />}
              {activeTab === 'safety' && <SafetyScreen />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Global Detail View Dialog */}
        <AnimatePresence>
          {selectedGem && (
            <Dialog open={!!selectedGem} onOpenChange={() => setSelectedGem(null)}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none">
                <div className="relative h-64">
                  <img 
                    src={selectedGem.imageUrl || `https://picsum.photos/seed/${selectedGem.name}/1200/800`} 
                    className="w-full h-full object-cover" 
                    alt={selectedGem.name} 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${selectedGem.name}/1200/800`;
                    }}
                  />
                </div>
                <div className="p-8">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900 mb-1">{selectedGem.name}</h2>
                      <p className="text-lake-turquoise font-medium">{selectedGem.category}</p>
                    </div>
                    <Badge variant="outline" className="text-slate-500 border-slate-200">
                      {selectedGem.distance} from KTM
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Local Insight</h4>
                      <p className="text-slate-700 italic mb-2">"{selectedGem.localDescription}"</p>
                      <p className="text-slate-500 text-sm">{selectedGem.translation}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Safety & Crowd</h4>
                      <div className="flex gap-4">
                        <div className="flex-1 p-3 bg-slate-50 rounded-2xl">
                          <p className="text-xs text-slate-400 mb-1">Status</p>
                          <p className="font-bold text-slate-700 capitalize">{selectedGem.safetyStatus}</p>
                        </div>
                        <div className="flex-1 p-3 bg-slate-50 rounded-2xl">
                          <p className="text-xs text-slate-400 mb-1">Crowd</p>
                          <p className="font-bold text-slate-700 capitalize">{selectedGem.crowdLevel}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <section>
                      <h4 className="flex items-center text-lg font-bold text-slate-900 mb-3">
                        <Navigation size={20} className="mr-2 text-lake-turquoise" /> How to Reach
                      </h4>
                      <ul className="space-y-2">
                        {selectedGem.howToReach.map((step: string, i: number) => (
                          <li key={i} className="flex gap-3 text-slate-600">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">{i+1}</span>
                            {step}
                          </li>
                        ))}
                      </ul>
                    </section>

                    <section>
                      <h4 className="flex items-center text-lg font-bold text-slate-900 mb-3">
                        <Compass size={20} className="mr-2 text-lake-turquoise" /> Things to Explore
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedGem.thingsToExplore.map((thing: string, i: number) => (
                          <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-none py-1.5 px-3">
                            {thing}
                          </Badge>
                        ))}
                      </div>
                    </section>

                    <section className="bg-lake-turquoise/5 p-6 rounded-3xl border border-lake-turquoise/10">
                      <h4 className="flex items-center text-lg font-bold text-lake-turquoise mb-3">
                        <Info size={20} className="mr-2" /> Local Tips
                      </h4>
                      <ul className="space-y-2">
                        {selectedGem.localTips.map((tip: string, i: number) => (
                          <li key={i} className="text-slate-700 text-sm flex gap-2">
                            <span className="text-lake-turquoise">•</span> {tip}
                          </li>
                        ))}
                      </ul>
                    </section>

                    {/* Co-located authentic homestays & mountain lodges */}
                    {selectedGem.homestays && selectedGem.homestays.length > 0 && (
                      <section className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <h4 className="flex items-center text-lg font-black text-slate-800 uppercase tracking-tight">
                            <Home size={20} className="mr-2 text-forest-green" /> Nearby Authentic Homestays
                          </h4>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full uppercase">Verified Pricing</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {selectedGem.homestays.map((home: any, i: number) => (
                            <div key={i} className="group bg-slate-50/50 rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-md transition-all flex flex-col justify-between">
                              <div className="relative h-32 overflow-hidden bg-slate-100">
                                <img 
                                  src={home.photoUrl} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                  alt={home.name}
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${home.name}/400/300`;
                                  }}
                                />
                                <div className="absolute bottom-2.5 left-2.5 bg-[#0D9488] text-white text-[11px] font-black uppercase px-2.5 py-1 rounded-xl shadow-sm flex items-center gap-0.5">
                                  <span>रू {home.priceNPR.toLocaleString()}</span>
                                  <span className="text-[9px] font-medium text-teal-150 uppercase">/ night</span>
                                </div>
                              </div>
                              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                                <div>
                                  <h5 className="font-extrabold text-xs text-slate-800 uppercase tracking-tight line-clamp-1">{home.name}</h5>
                                  <p className="text-[11px] text-slate-500 leading-relaxed mt-1 line-clamp-3">{home.details}</p>
                                </div>
                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                  <span className="text-[9px] font-black text-emerald-600 uppercase flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Direct Booking
                                  </span>
                                  <button 
                                    onClick={() => alert(`Connecting with ${home.name} village coordinator... Safe travel is guaranteed by YatraNepal.`)}
                                    className="text-[10px] font-bold text-forest-green hover:underline cursor-pointer"
                                  >
                                    Reserve ➔
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Integrated Hiking Trails & Sacred Shrines */}
                    {selectedGem.hikingAndTemples && selectedGem.hikingAndTemples.length > 0 && (
                      <section className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <h4 className="flex items-center text-lg font-black text-slate-800 uppercase tracking-tight">
                            <Layers size={20} className="mr-2 text-sunset-orange" /> Sights, Temples & Hikes
                          </h4>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full uppercase">Coordinates</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {selectedGem.hikingAndTemples.map((sight: any, i: number) => (
                            <div key={i} className="group bg-slate-50/50 rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-md transition-all flex flex-col justify-between">
                              <div className="relative h-32 overflow-hidden bg-slate-100">
                                <img 
                                  src={sight.photoUrl} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                  alt={sight.name}
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${sight.name}/400/300`;
                                  }}
                                />
                                <span className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-md text-white text-[9px] font-black uppercase px-2 py-1 rounded-lg">
                                  {sight.type}
                                </span>
                              </div>
                              <div className="p-4 flex-1 flex flex-col justify-between space-y-1">
                                <div>
                                  <h5 className="font-extrabold text-xs text-slate-800 uppercase tracking-tight line-clamp-1">{sight.name}</h5>
                                  <p className="text-[11px] text-slate-500 leading-relaxed mt-1 line-clamp-3">{sight.description}</p>
                                </div>
                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-extrabold uppercase">
                                  <span>📷 Photo Spot</span>
                                  <span className="text-[#0D9488]">★ Pristine</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Integrated Interactive Journey Day Planner */}
                    <ItineraryPlanner gem={selectedGem} />
                    
                    <Button 
                      className="w-full mt-8 bg-mountain-blue hover:bg-mountain-blue/90 rounded-2xl h-14 text-lg font-bold cursor-pointer"
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedGem.name + ' Nepal')}`, '_blank')}
                    >
                      Get Directions
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>

        {/* Floating Action Button for AI Chat/Translator Quick Access */}
        <div className="fixed bottom-24 right-6 md:bottom-10 z-40">
          <Dialog>
            <DialogTrigger render={<Button className="rounded-full w-14 h-14 bg-sunset-orange hover:bg-sunset-orange/90 shadow-xl shadow-sunset-orange/20 border-none" />}>
              <DollarSign size={24} />
            </DialogTrigger>
            <DialogContent className="rounded-3xl max-w-md">
              <DialogHeader>
                <DialogTitle>Smart Pricing Insights</DialogTitle>
              </DialogHeader>
              <PricingTool />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AuthProvider>
  );
}

const PricingTool = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    const data = await getPricingInsights(query);
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="space-y-6 py-4">
      <div className="flex gap-2">
        <Input 
          placeholder="e.g., Homestay in Ghandruk" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)}
          className="rounded-2xl"
        />
        <Button onClick={handleSearch} disabled={loading} className="bg-lake-turquoise rounded-2xl">
          {loading ? "..." : <Search size={20} />}
        </Button>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Average Price</span>
              <Badge className="bg-green-100 text-green-600 border-none">Fair Price</Badge>
            </div>
            <p className="text-2xl font-bold text-slate-900">{result.averagePrice}</p>
            <p className="text-sm text-slate-500 mt-1">Range: {result.fairRange}</p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-2">Smart Tips</h4>
            <ul className="space-y-2">
              {result.tips.map((tip: string, i: number) => (
                <li key={i} className="text-sm text-slate-600 flex gap-2">
                  <span className="text-lake-turquoise">✓</span> {tip}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </div>
  );
}
