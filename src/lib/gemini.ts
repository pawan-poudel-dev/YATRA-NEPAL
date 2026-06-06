import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const translateText = async (text: string, targetLanguage: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Translate the following text strictly to ${targetLanguage}. Provide only the direct, accurate translation without explanations or conversational filler.\n\nText: ${text}`,
      config: {
        systemInstruction: "You are an elite, real-time translator for tourists visiting Nepal. You convert expressions perfectly to tourist or local Nepalese languages including Nepali, Sherpa, Newari, Tamang, Spanish, French, German, Mandarin, Hindi, Japanese. Output only the pure, high-fidelity translation.",
      }
    });
    return response.text;
  } catch (error) {
    console.error("Translation error:", error);
    return "Translation failed.";
  }
};

export const textToSpeech = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio;
  } catch (error) {
    console.error("TTS error:", error);
    return null;
  }
};

export const getHiddenGems = async (category?: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `List 8 unique hidden gems, high-altitude hiking areas, treks, or secret temples in Nepal ${category ? `in the category of ${category}` : ''}. 
      CRITICAL: For each gem, provide direct, beautiful hot-linkable image URLs representing the scenery, homestays, and activities.
      Return a JSON array of objects with: name, distance (from KTM), crowdLevel (low/medium/high), safetyStatus (safe/caution), bestSeason, localDescription (in Nepali), translation (English), howToReach (array), thingsToExplore (array), localTips (array), category, imageUrl, homestays (array of name, priceNPR, details, photoUrl), and hikingAndTemples (array of name, type, description, photoUrl).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              distance: { type: Type.STRING },
              crowdLevel: { type: Type.STRING },
              safetyStatus: { type: Type.STRING },
              bestSeason: { type: Type.STRING },
              localDescription: { type: Type.STRING },
              translation: { type: Type.STRING },
              howToReach: { type: Type.ARRAY, items: { type: Type.STRING } },
              thingsToExplore: { type: Type.ARRAY, items: { type: Type.STRING } },
              localTips: { type: Type.ARRAY, items: { type: Type.STRING } },
              category: { type: Type.STRING },
              imageUrl: { type: Type.STRING },
              homestays: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    priceNPR: { type: Type.INTEGER },
                    details: { type: Type.STRING },
                    photoUrl: { type: Type.STRING }
                  }
                }
              },
              hikingAndTemples: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    type: { type: Type.STRING },
                    description: { type: Type.STRING },
                    photoUrl: { type: Type.STRING }
                  }
                }
              }
            }
          }
        },
        tools: [{ googleSearch: {} }]
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error fetching hidden gems:", error);
    return STATIC_GEMS; // Fallback to static data if API fails
  }
};

export const STATIC_GEMS = [
  {
    name: "Bandipur",
    distance: "148 km",
    crowdLevel: "medium",
    safetyStatus: "safe",
    bestSeason: "Oct - Dec",
    localDescription: "बन्दीपुर एक सुन्दर पहाडी बस्ती हो जहाँ नेवारी संस्कृति र वास्तुकला सुरक्षित छ।",
    translation: "Bandipur is a beautiful hilltop settlement where Newari culture and architecture are preserved.",
    howToReach: ["Bus from KTM to Dumre", "Local jeep or hike to Bandipur"],
    thingsToExplore: ["Tundikhel", "Thani Mai Temple", "Siddha Gufa"],
    localTips: ["Stay in a traditional heritage home", "Watch the sunrise from the ridge"],
    category: "Villages",
    imageUrl: "https://firstcamptrek.com/wp-content/uploads/2025/07/Bandipur.webp",
    homestays: [
      {
        name: "Old Inn Bandipur Heritage",
        priceNPR: 2200,
        details: "Traditional brick dwelling with traditional wooden carvings, serving organic local Newari Samay Baji.",
        photoUrl: "https://www.welcomenepal.com/uploads/destination/bandipur2.jpg"
      },
      {
        name: "Thani Mai Horizon Homestay",
        priceNPR: 1500,
        details: "Located near the ridge stairs, offering hot homemade millet pancakes and fresh goat milk.",
        photoUrl: "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/15/33/f8/f0/old-inn-bandipur.jpg?w=600&h=400&s=1"
      }
    ],
    hikingAndTemples: [
      {
        name: "Thani Mai Temple Hiking Pathway",
        type: "Hiking Trail",
        description: "A steep stone pathway offering spectacular sunrise views over the Marsyangdi River Valley.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Bandipur_Nepal.jpg/600px-Bandipur_Nepal.jpg"
      },
      {
        name: "Khadga Devi Temple",
        type: "Secret Temple",
        description: "Enshrines the sacred sword of the King of Palpa, opened to pilgrims once a year.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Bandipur_temple.jpg/800px-Bandipur_temple.jpg"
      }
    ]
  },
  {
    name: "Ghandruk",
    distance: "200 km",
    crowdLevel: "medium",
    safetyStatus: "safe",
    bestSeason: "Mar - May, Oct - Dec",
    localDescription: "घान्द्रुक गुरुङ जातिको परम्परागत गाउँ हो जहाँबाट अन्नपूर्ण हिमालको सुन्दर दृश्य देखिन्छ।",
    translation: "Ghandruk is a traditional Gurung village offering stunning front-row views of the Annapurna range.",
    howToReach: ["Bus/Flight to Pokhara", "Jeep to Nayapul", "Hike to Ghandruk"],
    thingsToExplore: ["Gurung Museum", "Old Village Walk", "Himalayan Views"],
    localTips: ["Try local Gurung bread", "Wear traditional Gurung dress for photos"],
    category: "Villages",
    imageUrl: "https://asianheritagetreks.com/wp-content/uploads/2017/01/ghandruk-2.jpg",
    homestays: [
      {
        name: "Gurung Heritage Eco-Lodge",
        priceNPR: 1950,
        details: "Learn authentic Gurung hand-loom weaving and feast on slow-cooked organic nettle soup.",
        photoUrl: "https://www.annapurnatrekking.com/wp-content/uploads/2019/05/ghandruk-village-lodge.jpg"
      },
      {
        name: "Annapurna View Homestay House",
        priceNPR: 1600,
        details: "Enjoy freshly gathered organic vegetables straight from the backyard farm and hot spring advice.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Ghandruk_village_Nepal.jpg/600px-Ghandruk_village_Nepal.jpg"
      }
    ],
    hikingAndTemples: [
      {
        name: "Jhinu Danda Hot Springs Hike",
        type: "Hiking Trail",
        description: "Descend into the roaring Modi Khola gorge to natural, soothing thermal sulphur pools.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Jhinu_hot_spring_Modi_Khola.jpg/600px-Jhinu_hot_spring_Modi_Khola.jpg"
      },
      {
        name: "Ghandruk Gurung Cultural Museum",
        type: "Culture Spot",
        description: "Discover historic Gurung weapons, utensils, handloom weaving tools, and traditional costumes.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Ghandruk_village_Nepal.jpg/800px-Ghandruk_village_Nepal.jpg"
      }
    ]
  },
  {
    name: "Marpha",
    distance: "350 km",
    crowdLevel: "low",
    safetyStatus: "safe",
    bestSeason: "Sep - Nov",
    localDescription: "मार्फा मुस्ताङको स्याउको राजधानी मानिने सेतो घरहरूको सुन्दर गाउँ हो।",
    translation: "Marpha is a beautiful village of white-washed stone houses in Mustang, known as the apple capital.",
    howToReach: ["Flight to Jomsom", "Local bus or trek to Marpha"],
    thingsToExplore: ["Apple Orchards", "Marpha Monastery", "Stone-paved Alleys"],
    localTips: ["Taste the local apple brandy", "Visit the distillery"],
    category: "Villages",
    imageUrl: "https://acehiking.com/wp-content/uploads/2024/06/marpha-village.jpg",
    homestays: [
      {
        name: "Thakali Apple Orchard Villa",
        priceNPR: 2200,
        details: "Traditional white mud-brick rooms overlooking vast apple fields. Hosts offer cellar apple cider.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Marpha_Village_Mustang.jpg/600px-Marpha_Village_Mustang.jpg"
      },
      {
        name: "Luku-La Ancestral Home",
        priceNPR: 1800,
        details: "Comfortable hearthside dinner of genuine Thakali dal-bhat seasoned with wild Himalayan chives.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Marpha_Village_Mustang.jpg/800px-Marpha_Village_Mustang.jpg"
      }
    ],
    hikingAndTemples: [
      {
        name: "Marpha Gompa Valley Climb",
        type: "Secret Temple",
        description: "A legendary 300-year-old Nyingma monastery tucked high in the mountain clefts.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/The_Muktinath_Temple.jpg/800px-The_Muktinath_Temple.jpg"
      },
      {
        name: "Chhairo Refugee Settlement Trail",
        type: "Hiking Trail",
        description: "Trace historic caravan trails through pine woods to ancient yak-wool weaving stations.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/The_Muktinath_Temple.jpg/600px-The_Muktinath_Temple.jpg"
      }
    ]
  },
  {
    name: "Tsho Rolpa",
    distance: "115 km (to Dolakha)",
    crowdLevel: "low",
    safetyStatus: "caution",
    bestSeason: "May - Oct",
    localDescription: "छो-रोल्पा नेपालको सबैभन्दा ठूलो हिमनदी ताल हो, जुन दोलखा जिल्लामा अवस्थित छ।",
    translation: "Tsho Rolpa is one of the largest glacial lakes in Nepal, located in the Dolakha District.",
    howToReach: ["Bus to Charikot/Chetchet", "Trek through Simigaon and Beding"],
    thingsToExplore: ["Glacial Lake", "Rolwaling Valley", "Beding Village"],
    localTips: ["Acclimatize properly", "Carry warm clothing even in summer"],
    category: "Nature",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Cho-Rolpa_Glacier_lake.jpg/1200px-Cho-Rolpa_Glacier_lake.jpg",
    homestays: [
      {
        name: "Beding Sherpa Alpine Homestay",
        priceNPR: 1350,
        details: "Authentic yak and potato based high elevation diet, heavy wool blankets, solar light support.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Cho-Rolpa_Glacier_lake.jpg/600px-Cho-Rolpa_Glacier_lake.jpg"
      },
      {
        name: "Simigaon Community Cliffhouse",
        priceNPR: 1100,
        details: "A breathtaking house built on structural wooden pillars overlooking the wild Tamakoshi gorge.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/On_the_way_to_Tsho-Rolpa_Glacier_Lake.jpg/600px-On_the_way_to_Tsho-Rolpa_Glacier_Lake.jpg"
      }
    ],
    hikingAndTemples: [
      {
        name: "Under-Gorge Beding Gompa",
        type: "Secret Temple",
        description: "An incredible ancient Buddhist cave temple built directly under massive limestone waterfalls.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/On_the_way_to_Tsho-Rolpa_Glacier_Lake.jpg/600px-On_the_way_to_Tsho-Rolpa_Glacier_Lake.jpg"
      },
      {
        name: "Tsho Rolpa Glacier Lake Loop",
        type: "Hiking Trail",
        description: "A gorgeous trek surrounded by towering ice shields, culminating in a giant brilliant blue glacial basin.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Cho-Rolpa_Glacier_lake.jpg/600px-Cho-Rolpa_Glacier_lake.jpg"
      }
    ]
  },
  {
    name: "Panch Pokhari",
    distance: "80 km (to Chautara)",
    crowdLevel: "low",
    safetyStatus: "safe",
    bestSeason: "Aug - Oct",
    localDescription: "पाँच पोखरी सिन्धुपाल्चोकमा अवस्थित पाँचवटा पवित्र तालहरूको समूह हो।",
    translation: "Panch Pokhari is a group of five sacred lakes located in Sindhupalchok, a major pilgrimage site.",
    howToReach: ["Bus to Chautara or Melamchi", "Trek through Bhotang village"],
    thingsToExplore: ["Five Sacred Lakes", "Jugal Himal Views", "Local Culture"],
    localTips: ["Visit during Janai Purnima for the festival", "Carry your own camping gear"],
    category: "Nature",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Panch_Pokhari_Lakes.jpg/1200px-Panch_Pokhari_Lakes.jpg",
    homestays: [
      {
        name: "Bhotang Tamang Cultural Haven",
        priceNPR: 1200,
        details: "Cozy rooms, traditional bamboo-shoot curries, and rich stories of Tamang folklore over firewood.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Tamang_family_Nepal.jpg/600px-Tamang_family_Nepal.jpg"
      },
      {
        name: "Jugal Footprint Eco-Camp Site",
        priceNPR: 1000,
        details: "Clean setup under raw starry skies, hot local ginger soup, and expert trail route guides.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Panch_Pokhari_Lakes.jpg/600px-Panch_Pokhari_Lakes.jpg"
      }
    ],
    hikingAndTemples: [
      {
        name: "Five Sacred Lakes Temple Circuit",
        type: "Secret Temple",
        description: "Small stone temples dedicated to Lord Shiva, surrounding 5 pristine lakes reflecting the starry sky.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Panch_Pokhari_Lakes.jpg/600px-Panch_Pokhari_Lakes.jpg"
      },
      {
        name: "Bhotang Cliff Forest Pathway",
        type: "Hiking Trail",
        description: "Scale high rocky cliffs covered in vibrant orchid forests overlooking wild waterfalls.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Panch_Pokhari_Lakes.jpg/600px-Panch_Pokhari_Lakes.jpg"
      }
    ]
  },
  {
    name: "Nar Phu Valley",
    distance: "210 km (to Koto)",
    crowdLevel: "low",
    safetyStatus: "caution",
    bestSeason: "Mar - May, Sep - Nov",
    localDescription: "नार फु उपत्यका मनाङको एक दुर्गम र प्राचीन हिमाली बस्ती हो जहाँ पुरानो तिब्बती संस्कृति कायम छ।",
    translation: "Nar Phu Valley is a rugged, hidden pocket of Manang featuring dry canyons, pristine white-walled villages, and ancient Tibetan culture.",
    howToReach: ["Bus/Jeep from KTM to Besisahar then Besisahar to Koto", "Trek through Nar Phu Gate along river rapids"],
    thingsToExplore: ["Ancient Stone Villages Phu & Nar", "Himlung Himal base vistas", "Spectacular deep slate-walled canyons"],
    localTips: ["A special restricted area permit is required", "Dress warmly, night wind in Phugaon is freezing"],
    category: "Culture",
    imageUrl: "https://www.himalayantrekkers.com/wp-content/uploads/2020/06/nar-phu-valley-trek.jpg",
    homestays: [
      {
        name: "Phu Village Traditional Lodge",
        priceNPR: 1800,
        details: "Authentic stone mountain room. Includes tour of century-old yak dung stoves and barley grinding stations.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Phu_village_Nepal.jpg/600px-Phu_village_Nepal.jpg"
      },
      {
        name: "Nar Community Stone House",
        priceNPR: 1500,
        details: "Sleep under thick sheep wool blankets. Hostess serves boiled buckwheat dumplings and homemade salt butter tea.",
        photoUrl: "https://www.himalayantrekkers.com/wp-content/uploads/2020/06/nar-village-homestay.jpg"
      }
    ],
    hikingAndTemples: [
      {
        name: "Tashi Lhakhang Monastery Climb",
        type: "Secret Temple",
        description: "One of the oldest Buddhist monasteries in the region offering serene prayer rooms tucked in the rocks.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Nar_village_Nepal.jpg/600px-Nar_village_Nepal.jpg"
      },
      {
        name: "Kang La Pass Trailhead",
        type: "Hiking Trail",
        description: "Climb past fields of wild blue sheep, crossing a stunning 5,300m pass looking down on the Annapurnas.",
        photoUrl: "https://www.himalayantrekkers.com/wp-content/uploads/2020/06/kang-la-pass-nar-phu.jpg"
      }
    ]
  },
  {
    name: "Phoksundo Lake",
    distance: "750 km (Dolpa)",
    crowdLevel: "low",
    safetyStatus: "safe",
    bestSeason: "May - Oct",
    localDescription: "शे-फोक्सुण्डो ताल नेपालको सबैभन्दा गहिरो ताल हो, जसको पानी नीलो र कञ्चन छ।",
    translation: "Shey Phoksundo Lake is the deepest lake in Nepal, known for its magnificent turquoise color.",
    howToReach: ["Flight to Juphal", "Trek through Dunai and Ringmo"],
    thingsToExplore: ["Turquoise Lake", "Ringmo Village", "Bon Monasteries"],
    localTips: ["No swimming allowed", "Respect local Bon traditions"],
    category: "Nature",
    imageUrl: "https://www.responsibletreks.com/wp-content/uploads/2022/01/Lake-Phoksundo-2048x1365.jpg",
    homestays: [
      {
        name: "Ringmo Bon-Tibetan Eco Lodge",
        priceNPR: 1600,
        details: "Learn ancient Tibetan wood crafts, sleep on wool carpets, and try authentic dry wild mushrooms.",
        photoUrl: "https://www.himalayantrekkers.com/wp-content/uploads/2021/02/ringmo-village-dolpa.jpg"
      }
    ],
    hikingAndTemples: [
      {
        name: "Thasung Chholing Gompa",
        type: "Secret Temple",
        description: "A stunning centuries-old Bon monastery located at the eastern shore of the turquoise lake.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Shey_Phoksundo_Lake_Dolpa.jpg/600px-Shey_Phoksundo_Lake_Dolpa.jpg"
      },
      {
        name: "Ringmo Alpine Trek",
        type: "Hiking Trail",
        description: "Trace pine forests and rocky edges where the movie Caravan was filmed.",
        photoUrl: "https://www.responsibletreks.com/wp-content/uploads/2022/01/Phoksundo-Trek.jpg"
      }
    ]
  },
  {
    name: "Khaptad National Park",
    distance: "Far-West Nepal",
    crowdLevel: "low",
    safetyStatus: "safe",
    bestSeason: "Mar - May, Oct - Nov",
    localDescription: "खप्तड राष्ट्रिय निकुञ्ज सुदूरपश्चिमको भूस्वर्ग मानिन्छ, जहाँ सुन्दर पाटनहरू छन्।",
    translation: "Khaptad National Park is considered the 'heaven of the Far-West', famous for its rolling green meadows.",
    howToReach: ["Flight to Dhangadhi", "Drive to Silgadhi", "Trek to Khaptad"],
    thingsToExplore: ["Khaptad Saura Meadows", "Triveni Temple", "Khaptad Baba Ashram"],
    localTips: ["Carry your own camping gear", "Must visit the Ashram of the Sage"],
    category: "Adventure",
    imageUrl: "https://www.welcomenepal.com/uploads/destination/khaptad-national-park.jpg",
    homestays: [
      {
        name: "Silgadhi Gateway Homestay House",
        priceNPR: 1250,
        details: "Dine on pure ghee-steeped flatbreads (chappatis) and local mountain honey on comfortable mattresses.",
        photoUrl: "https://www.himalayantrekkers.com/wp-content/uploads/2021/04/khaptad-trek-lodge.jpg"
      }
    ],
    hikingAndTemples: [
      {
        name: "Triveni Confluence High Alt Shrines",
        type: "Secret Temple",
        description: "Meeting point of three rivers featuring three sacred shrines on rolling green meadows.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Khaptad_National_Park_Nepal.jpg/600px-Khaptad_National_Park_Nepal.jpg"
      },
      {
        name: "Khaptad Meadows Hiking Area",
        type: "Hiking Trail",
        description: "Cross 22 pristine rolling green grasslands with rich collections of high altitude medicinal herbs.",
        photoUrl: "https://www.himalayantrekkers.com/wp-content/uploads/2021/04/khaptad-meadows.jpg"
      }
    ]
  },
  {
    name: "Dhorpatan Hunting Reserve",
    distance: "Baglung District",
    crowdLevel: "low",
    safetyStatus: "safe",
    bestSeason: "Mar - May, Oct - Nov",
    localDescription: "ढोरपाटन नेपालको एकमात्र शिकार आरक्ष हो, जहाँ नीलो भेडा पाइन्छ।",
    translation: "Dhorpatan is the only hunting reserve in Nepal, home to the famous Blue Sheep.",
    howToReach: ["Drive from Baglung or Burtibang", "Trek from Beni"],
    thingsToExplore: ["Blue Sheep", "High Altitude Meadows", "Local Kham Magar Culture"],
    localTips: ["Hunting requires expensive licenses", "Great for bird watching"],
    category: "Adventure",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Blue_sheep_Pseudois_nayaur.jpg/1200px-Blue_sheep_Pseudois_nayaur.jpg",
    homestays: [
      {
        name: "Kham Magar Heritage Lodge",
        priceNPR: 1400,
        details: "Unique wooden house structure. Hosts share legendary tales of wildlife tracking and leopard spotters.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Nepali_traditional_house.jpg/600px-Nepali_traditional_house.jpg"
      }
    ],
    hikingAndTemples: [
      {
        name: "Uttarganga Temple Complex",
        type: "Secret Temple",
        description: "A small sacred riverside temple dedicated to Lord Varaha surrounded by pristine mountain valley view.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Blue_sheep_Pseudois_nayaur.jpg/600px-Blue_sheep_Pseudois_nayaur.jpg"
      }
    ]
  },
  {
    name: "Badimalika",
    distance: "780 km (Bajura)",
    crowdLevel: "low",
    safetyStatus: "safe",
    bestSeason: "Jul - Sep",
    localDescription: "बडिमालिका बाजुरा जिल्लामा अवस्थित एक पवित्र र असाध्यै सुन्दर चौर भएको सुदूरपश्चिमको धार्मिक स्थल हो।",
    translation: "Badimalika lies in Bajura district, famous for its otherworldly majestic green hill slopes, deep misty valleys, and the sacred temple at 4,200m.",
    howToReach: ["Flight to Dhangadhi or Nepalgunj, then local jeep to Sanphebagar", "Trek over 3 days across endless rolling alpine valleys"],
    thingsToExplore: ["Endless rolling green grasslands", "Badimalika temple views", "Misty mountain ridges and morning clouds"],
    localTips: ["There are no commercial hotels on the pastures, so carry sleeping bags", "Hire a local guide to avoid getting lost in misty trails"],
    category: "Adventure",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Badimalika_Temple_Bajura.jpg/1200px-Badimalika_Temple_Bajura.jpg",
    homestays: [
      {
        name: "Maure Village Shelter",
        priceNPR: 1200,
        details: "Warm mountain cabin. Hosts cook local black lentil soup, millet bread, and offer advice on ridge navigation.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Badimalika_Temple_Bajura.jpg/600px-Badimalika_Temple_Bajura.jpg"
      }
    ],
    hikingAndTemples: [
      {
        name: "Badimalika Bhagwati Temple",
        type: "Secret Temple",
        description: "Perched high on a razor thin grass ridge overlooking infinite green valleys under soft clouds.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Badimalika_Temple_Bajura.jpg/600px-Badimalika_Temple_Bajura.jpg"
      }
    ]
  },
  {
    name: "Barun Valley",
    distance: "Sankhuwasabha District",
    crowdLevel: "low",
    safetyStatus: "caution",
    bestSeason: "Mar - May, Oct - Nov",
    localDescription: "बरुण उपत्यका मकालु हिमालको काखमा रहेको एक जैविक विविधताले भरिपूर्ण क्षेत्र हो।",
    translation: "Barun Valley is a biodiverse region at the foot of Mt. Makalu, known for its pristine wilderness.",
    howToReach: ["Flight to Tumlingtar", "Drive to Num", "Trek to Barun Valley"],
    thingsToExplore: ["Makalu Base Camp", "Waterfalls", "Rare Flora and Fauna"],
    localTips: ["One of the wettest regions in Nepal", "Be prepared for leeches in monsoon"],
    category: "Nature",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Makalu_from_Barun_valley.jpg/1200px-Makalu_from_Barun_valley.jpg",
    homestays: [
      {
        name: "Num Community Sherpa Homestay",
        priceNPR: 1100,
        details: "Basic but extremely welcoming shelter. Serves fresh boiled mountain nettles, ginger tea, and potatoes.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Nepali_traditional_house.jpg/600px-Nepali_traditional_house.jpg"
      }
    ],
    hikingAndTemples: [
      {
        name: "Makalu Base Pass",
        type: "Hiking Trail",
        description: "Rugged cliffs and giant gushing waterfalls cascading down thousands of meters from giant glaciers.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Makalu_from_Barun_valley.jpg/600px-Makalu_from_Barun_valley.jpg"
      }
    ]
  }
];

export const getPricingInsights = async (item: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide pricing insights for ${item} in Nepal. Include average price, fair price range, and tips to avoid being overcharged.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            averagePrice: { type: Type.STRING },
            fairRange: { type: Type.STRING },
            tips: { type: Type.ARRAY, items: { type: Type.STRING } },
            alternatives: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error fetching pricing insights:", error);
    return null;
  }
};
