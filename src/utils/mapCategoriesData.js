/**
 * OmniArena Comprehensive Geography Datasets
 * Modeled after SIBAQ Tracker Map Trainer & Study System
 * 
 * 7 Specialized Categories:
 * 1. India: states and union territories (All 36 states and UTs)
 * 2. Countries of the world
 * 3. Mountain ranges
 * 4. Oceans, seas and lakes
 * 5. Deserts
 * 6. Grasslands and plains
 * 7. Plateaus and basins
 */

import { INDIAN_CITIES } from '../data/maps/indian_cities_data.js';
import { INDIAN_TOURIST_PLACES } from '../data/maps/indian_tourist_places_data.js';

export const MAP_STUDY_CATEGORIES = [
  { 
    id: 'india-states', 
    name: 'India: states and union territories', 
    singular: 'state or union territory',
    center: [22.5, 82.0],
    defaultZoom: 4,
    icon: '🇮🇳'
  },
  { 
    id: 'india-cities', 
    name: 'India: Major Cities (60+)', 
    singular: 'city',
    center: [22.5, 82.0],
    defaultZoom: 4,
    icon: '🏙️'
  },
  { 
    id: 'india-tourist', 
    name: 'India: Famous Tourist Places (60+)', 
    singular: 'tourist place or heritage site',
    center: [22.5, 82.0],
    defaultZoom: 4,
    icon: '🏛️'
  },
  { 
    id: 'countries', 
    name: 'Countries of the world', 
    singular: 'country',
    center: [20.0, 0.0],
    defaultZoom: 2,
    icon: '🌍'
  },
  { 
    id: 'oceans-seas', 
    name: 'Oceans, seas and lakes', 
    singular: 'ocean, sea or lake',
    center: [20.0, 0.0],
    defaultZoom: 2,
    icon: '🌊'
  },
  { 
    id: 'mountains', 
    name: 'Mountain ranges', 
    singular: 'mountain range',
    center: [30.0, 40.0],
    defaultZoom: 2,
    icon: '🏔️'
  },
  { 
    id: 'deserts', 
    name: 'Deserts', 
    singular: 'desert',
    center: [23.0, 20.0],
    defaultZoom: 2,
    icon: '🏜️'
  },
  { 
    id: 'grasslands', 
    name: 'Grasslands and plains', 
    singular: 'grassland or plain',
    center: [20.0, 0.0],
    defaultZoom: 2,
    icon: '🌾'
  },
  { 
    id: 'plateaus', 
    name: 'Plateaus and basins', 
    singular: 'plateau or basin',
    center: [20.0, 30.0],
    defaultZoom: 2,
    icon: '⛰️'
  }
];

export const MAP_CATEGORY_ITEMS = {
  // --- 1. INDIA: STATES & UNION TERRITORIES (All 36) ---
  'india-states': [
    { id: 'in-an', name: 'Andaman and Nicobar', lat: 11.7401, lng: 92.6586, radiusKm: 250, fact: 'Union territory comprising 572 islands in the Bay of Bengal.' },
    { id: 'in-ap', name: 'Andhra Pradesh', lat: 15.9129, lng: 79.7400, radiusKm: 260, fact: 'Known as the "Rice Bowl of India" with a long coastline on the Bay of Bengal.' },
    { id: 'in-ar', name: 'Arunachal Pradesh', lat: 28.2180, lng: 94.7278, radiusKm: 220, fact: 'Known as the "Land of the Dawn-Lit Mountains", India’s easternmost state.' },
    { id: 'in-as', name: 'Assam', lat: 26.2006, lng: 92.9376, radiusKm: 200, fact: 'Famous for Assam tea, one-horned rhinoceroses in Kaziranga, and the Brahmaputra River.' },
    { id: 'in-br', name: 'Bihar', lat: 25.0961, lng: 85.3131, radiusKm: 180, fact: 'Ancient seat of learning with Nalanda University and Bodh Gaya where Buddha achieved enlightenment.' },
    { id: 'in-ch', name: 'Chandigarh', lat: 30.7333, lng: 76.7794, radiusKm: 45, fact: 'Planned union territory designed by Swiss-French architect Le Corbusier.' },
    { id: 'in-cg', name: 'Chhattisgarh', lat: 21.2787, lng: 81.8661, radiusKm: 230, fact: 'Heavily forested state rich in mineral resources and ancient tribal culture.' },
    { id: 'in-dn', name: 'Dadra and Nagar Haveli and Daman and Diu', lat: 20.4283, lng: 72.8397, radiusKm: 60, fact: 'Coastal union territory with historic Portuguese colonial fortresses.' },
    { id: 'in-dl', name: 'Delhi', lat: 28.7041, lng: 77.1025, radiusKm: 50, fact: 'National Capital Territory of India, home to the Red Fort, India Gate, and Qutub Minar.' },
    { id: 'in-ga', name: 'Goa', lat: 15.2993, lng: 74.1240, radiusKm: 70, fact: 'India’s smallest state by area, renowned for Arabian Sea beaches and Portuguese architecture.' },
    { id: 'in-gj', name: 'Gujarat', lat: 22.2587, lng: 71.1924, radiusKm: 280, fact: 'Westernmost state of India with the longest coastline, home to Asiatic lions in Gir.' },
    { id: 'in-hr', name: 'Haryana', lat: 29.0588, lng: 76.0856, radiusKm: 140, fact: 'Surrounds New Delhi on three sides, historic location of the Kurukshetra war.' },
    { id: 'in-hp', name: 'Himachal Pradesh', lat: 31.1048, lng: 77.1734, radiusKm: 160, fact: 'Himalayan state famed for snow-capped peaks, apple orchards, and hill stations.' },
    { id: 'in-jk', name: 'Jammu and Kashmir', lat: 33.7782, lng: 76.5762, radiusKm: 200, fact: 'Renowned for Dal Lake in Srinagar, houseboats, and lush Himalayan valleys.' },
    { id: 'in-jh', name: 'Jharkhand', lat: 23.6102, lng: 85.2799, radiusKm: 170, fact: 'Rich in coal, iron ore, and mineral deposits, carved out of southern Bihar in 2000.' },
    { id: 'in-ka', name: 'Karnataka', lat: 15.3173, lng: 75.7139, radiusKm: 270, fact: 'Silicon Valley hub Bengaluru, ancient ruins of Vijayanagara at Hampi, and Mysore Palace.' },
    { id: 'in-kl', name: 'Kerala', lat: 10.8505, lng: 76.2711, radiusKm: 190, fact: 'Known as "God’s Own Country", famous for tranquil backwaters, Ayurvedic traditions, and spices.' },
    { id: 'in-la', name: 'Ladakh', lat: 34.1526, lng: 77.5771, radiusKm: 230, fact: 'High-altitude cold desert plateau famed for Pangong Lake, high passes, and Buddhist monasteries.' },
    { id: 'in-ld', name: 'Lakshadweep', lat: 10.5667, lng: 72.6417, radiusKm: 160, fact: 'Archipelago of 36 coral islands and atolls in the Arabian Sea.' },
    { id: 'in-mp', name: 'Madhya Pradesh', lat: 22.9734, lng: 78.6569, radiusKm: 320, fact: 'The "Heart of India", home to Khajuraho temples, Sanchi Stupa, and tiger reserves.' },
    { id: 'in-mh', name: 'Maharashtra', lat: 19.7515, lng: 75.7139, radiusKm: 340, fact: 'Financial capital Mumbai, Western Ghats, and ancient Ajanta & Ellora cave temples.' },
    { id: 'in-mn', name: 'Manipur', lat: 24.6637, lng: 93.9063, radiusKm: 110, fact: 'Known as the "Jeweled Land", famous for the floating islands of Loktak Lake.' },
    { id: 'in-ml', name: 'Meghalaya', lat: 25.4670, lng: 91.3662, radiusKm: 110, fact: 'The "Abode of Clouds", home to Mawsynram—the wettest place on Earth—and living root bridges.' },
    { id: 'in-mz', name: 'Mizoram', lat: 23.1645, lng: 92.9376, radiusKm: 110, fact: 'Known as the "Land of the Hill People", celebrated for its high literacy and bamboo forests.' },
    { id: 'in-nl', name: 'Nagaland', lat: 26.1584, lng: 94.5624, radiusKm: 110, fact: 'Mountainous tribal state bordering Myanmar, famous for the annual Hornbill Festival.' },
    { id: 'in-od', name: 'Odisha', lat: 20.9517, lng: 85.0985, radiusKm: 230, fact: 'Home to the Konark Sun Temple, Jagannath Puri temple, and Chilika saltwater lagoon.' },
    { id: 'in-py', name: 'Puducherry', lat: 11.9416, lng: 79.8083, radiusKm: 55, fact: 'French colonial seaside heritage town and location of Sri Aurobindo Ashram.' },
    { id: 'in-pb', name: 'Punjab', lat: 31.1471, lng: 75.3412, radiusKm: 150, fact: 'The "Land of Five Rivers", heartland of Sikhism and home to the revered Golden Temple in Amritsar.' },
    { id: 'in-rj', name: 'Rajasthan', lat: 27.0238, lng: 74.2179, radiusKm: 360, fact: 'India’s largest state by area, famous for the Thar Desert, majestic forts, and palaces of Jaipur and Udaipur.' },
    { id: 'in-sk', name: 'Sikkim', lat: 27.5330, lng: 88.5122, radiusKm: 75, fact: 'Nestled beneath Kangchenjunga, India’s first fully certified organic state.' },
    { id: 'in-tn', name: 'Tamil Nadu', lat: 11.1271, lng: 78.6569, radiusKm: 250, fact: 'Cradle of ancient Dravidian architecture, towering temple gopurams, and classical Bharatanatyam dance.' },
    { id: 'in-ts', name: 'Telangana', lat: 18.1124, lng: 79.0193, radiusKm: 190, fact: 'Formed in 2014 with tech hub Hyderabad, Charminar, and Golconda Fort.' },
    { id: 'in-tr', name: 'Tripura', lat: 23.9408, lng: 91.9882, radiusKm: 75, fact: 'Northeastern state bordered by Bangladesh on three sides, home to Ujjayanta Palace.' },
    { id: 'in-up', name: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462, radiusKm: 290, fact: 'India’s most populous state, home to the Taj Mahal in Agra, Varanasi ghats, and Sangam in Prayagraj.' },
    { id: 'in-uk', name: 'Uttarakhand', lat: 30.0668, lng: 79.0193, radiusKm: 140, fact: 'The "Land of the Gods" (Devbhoomi), origin of the Ganges and Yamuna rivers in the Himalayas.' },
    { id: 'in-wb', name: 'West Bengal', lat: 22.9868, lng: 87.8550, radiusKm: 210, fact: 'Stretches from Darjeeling Himalayas to the Sundarbans mangrove tiger delta; cultural capital Kolkata.' }
  ],

  // --- 1B. 60+ MAJOR INDIAN CITIES ---
  'india-cities': INDIAN_CITIES.map(c => ({
    id: c.id,
    name: c.name,
    lat: c.coordinates[1],
    lng: c.coordinates[0],
    radiusKm: 70,
    fact: c.fact,
    state: c.state,
    region: c.region
  })),

  // --- 1C. 60+ FAMOUS INDIAN TOURIST PLACES & HERITAGE SITES ---
  'india-tourist': INDIAN_TOURIST_PLACES.map(t => ({
    id: t.id,
    name: t.name,
    lat: t.coordinates[1],
    lng: t.coordinates[0],
    radiusKm: 70,
    fact: t.fact,
    location: t.location,
    state: t.state,
    type: t.type
  })),

  // --- 2. MOUNTAIN RANGES ---
  'mountains': [
    { id: 'm-alps', name: 'Alps', lat: 46.8876, lng: 9.6570, radiusKm: 350, fact: 'Highest and most extensive mountain range system entirely in Europe, crowned by Mont Blanc.' },
    { id: 'm-altay', name: 'Altay Mountains', lat: 49.0000, lng: 89.0000, radiusKm: 450, fact: 'Central Asian range where Russia, China, Mongolia, and Kazakhstan converge.' },
    { id: 'm-altun', name: 'Altun Mountains', lat: 38.5000, lng: 88.0000, radiusKm: 350, fact: 'Rugged range in northwestern China separating the Tarim Basin from the Qaidam Basin.' },
    { id: 'm-andes', name: 'Andes', lat: -21.0000, lng: -67.0000, radiusKm: 800, fact: 'Longest continental mountain range in the world, spanning seven South American nations.' },
    { id: 'm-apennines', name: 'Apennines', lat: 43.5000, lng: 12.5000, radiusKm: 300, fact: 'Spine of the Italian peninsula stretching from Liguria to the tip of Calabria.' },
    { id: 'm-appalachians', name: 'Appalachian Mountains', lat: 37.0000, lng: -80.0000, radiusKm: 600, fact: 'Ancient North American range dating back over 480 million years.' },
    { id: 'm-asir', name: 'Asir Mountains', lat: 18.5000, lng: 42.5000, radiusKm: 250, fact: 'Highland range in southwestern Saudi Arabia parallel to the Red Sea coast.' },
    { id: 'm-atlas', name: 'Atlas Mountains', lat: 31.0000, lng: -7.0000, radiusKm: 400, fact: 'Separates the Mediterranean and Atlantic coastlines from the vast Sahara Desert across Morocco and Algeria.' },
    { id: 'm-atlassaharienh', name: 'Atlas Saharien', lat: 34.0000, lng: 2.0000, radiusKm: 300, fact: 'The eastern subrange of the Atlas Mountains bordering the northern Sahara in Algeria.' },
    { id: 'm-brooks', name: 'Brooks Range', lat: 68.0000, lng: -152.0000, radiusKm: 400, fact: 'Far northern Alaskan mountain range entirely within the Arctic Circle.' },
    { id: 'm-carpathian', name: 'Carpathian Mountains', lat: 47.0000, lng: 25.0000, radiusKm: 400, fact: 'Arc across Central and Eastern Europe, home to the largest populations of brown bears in Europe.' },
    { id: 'm-cascade', name: 'Cascade Range', lat: 45.0000, lng: -121.5000, radiusKm: 350, fact: 'Volcanic mountain chain in western North America featuring Mount Rainier and Mount St. Helens.' },
    { id: 'm-caucasus', name: 'Caucasus Mountains', lat: 42.5000, lng: 45.0000, radiusKm: 400, fact: 'Barriers between the Black Sea and Caspian Sea, featuring Mount Elbrus, Europe’s highest summit.' },
    { id: 'm-drakensberg', name: 'Drakensberg', lat: -29.0000, lng: 29.5000, radiusKm: 300, fact: 'Highest mountain range in Southern Africa, forming an escarpment in South Africa and Lesotho.' },
    { id: 'm-greatdividing', name: 'Great Dividing Range', lat: -25.0000, lng: 148.0000, radiusKm: 650, fact: 'Australia’s most substantial mountain chain stretching along the eastern coastline.' },
    { id: 'm-himalayas', name: 'Himalayas', lat: 28.0000, lng: 84.0000, radiusKm: 600, fact: 'Abode of snow hosting Earth’s highest peaks, including Mount Everest and Kanchenjunga.' },
    { id: 'm-hindukush', name: 'Hindu Kush', lat: 35.0000, lng: 71.0000, radiusKm: 350, fact: 'Rugged range between Afghanistan and Pakistan, historic gateway for travelers and conquerors.' },
    { id: 'm-karakoram', name: 'Karakoram', lat: 35.8800, lng: 76.5100, radiusKm: 300, fact: 'Spans borders of Pakistan, India, and China; hosts K2, the second highest peak on Earth.' },
    { id: 'm-kunlun', name: 'Kunlun Mountains', lat: 36.0000, lng: 84.0000, radiusKm: 500, fact: 'One of the longest mountain chains in Asia, extending over 3,000 km along northern Tibet.' },
    { id: 'm-pamir', name: 'Pamir Mountains', lat: 38.5000, lng: 73.0000, radiusKm: 250, fact: 'Known as the "Roof of the World", meeting point of the Tian Shan, Karakoram, Kunlun, and Hindu Kush.' },
    { id: 'm-rockies', name: 'Rocky Mountains', lat: 44.0000, lng: -110.0000, radiusKm: 700, fact: 'Major mountain range stretching 4,800 km from northern British Columbia down to New Mexico.' },
    { id: 'm-scandinavian', name: 'Scandinavian Mountains', lat: 65.0000, lng: 14.0000, radiusKm: 500, fact: 'Runs through the Scandinavian Peninsula, deeply carved by glaciers and fjords.' },
    { id: 'm-sierranevada', name: 'Sierra Nevada', lat: 37.5000, lng: -119.5000, radiusKm: 300, fact: 'California range home to Yosemite National Park and Mount Whitney, the highest peak in the contiguous US.' },
    { id: 'm-tianshan', name: 'Tian Shan', lat: 42.0000, lng: 80.0000, radiusKm: 500, fact: 'The "Celestial Mountains" straddling Central Asia and Xinjiang China.' },
    { id: 'm-urals', name: 'Ural Mountains', lat: 60.0000, lng: 60.0000, radiusKm: 600, fact: 'Traditional geographic boundary separating the European and Asian continents in Russia.' },
    { id: 'm-westernghats', name: 'Western Ghats', lat: 14.0000, lng: 75.0000, radiusKm: 400, fact: 'UNESCO biological hotspot older than the Himalayas running parallel to India’s western coast.' },
    { id: 'm-easternghats', name: 'Eastern Ghats', lat: 16.5000, lng: 81.0000, radiusKm: 400, fact: 'Discontinuous range of mountains along India’s eastern coast eroded by major river deltas.' },
    { id: 'm-zagros', name: 'Zagros Mountains', lat: 32.0000, lng: 50.0000, radiusKm: 450, fact: 'Longest mountain range in Iran, Iraq, and southeastern Turkey, rising above the Persian Gulf.' }
  ],

  // --- 3. COUNTRIES OF THE WORLD ---
  'countries': [
    { id: 'c-in', name: 'India', lat: 20.5937, lng: 78.9629, radiusKm: 650, fact: 'Second most populous country, cradle of ancient Indus Valley civilization and diverse cultures.' },
    { id: 'c-us', name: 'United States', lat: 37.0902, lng: -95.7129, radiusKm: 900, fact: 'Third largest nation by area, spanning 50 states from the Atlantic to Pacific.' },
    { id: 'c-cn', name: 'China', lat: 35.8617, lng: 104.1954, radiusKm: 950, fact: 'World power with millennia of recorded history, the Great Wall, and Yangtze River.' },
    { id: 'c-br', name: 'Brazil', lat: -14.2350, lng: -51.9253, radiusKm: 950, fact: 'Largest South American country, encompassing the majority of the Amazon rainforest basin.' },
    { id: 'c-ru', name: 'Russia', lat: 61.5240, lng: 105.3188, radiusKm: 1400, fact: 'The largest country on Earth by geographic territory, spanning eleven time zones.' },
    { id: 'c-au', name: 'Australia', lat: -25.2744, lng: 133.7751, radiusKm: 950, fact: 'Island continent famed for the Outback, Great Barrier Reef, and unique marsupial wildlife.' },
    { id: 'c-ca', name: 'Canada', lat: 56.1304, lng: -106.3468, radiusKm: 1100, fact: 'Second largest country by land area, home to more lakes than all other countries combined.' },
    { id: 'c-ar', name: 'Argentina', lat: -38.4161, lng: -63.6167, radiusKm: 700, fact: 'South American nation of the Pampas plains, Patagonia glaciers, and tango culture.' },
    { id: 'c-za', name: 'South Africa', lat: -30.5595, lng: 22.9375, radiusKm: 550, fact: 'The "Rainbow Nation" located at the southern tip of Africa with three capital cities.' },
    { id: 'c-eg', name: 'Egypt', lat: 26.8206, lng: 30.8025, radiusKm: 450, fact: 'Transcontinental nation linking northeast Africa with the Middle East along the Nile River.' },
    { id: 'c-sa', name: 'Saudi Arabia', lat: 23.8859, lng: 45.0792, radiusKm: 600, fact: 'Occupies the bulk of the Arabian Peninsula, home to Islam’s two holiest sanctuaries.' },
    { id: 'c-jp', name: 'Japan', lat: 36.2048, lng: 138.2529, radiusKm: 400, fact: 'East Asian archipelago of over 6,800 islands, led by Honshu and Mount Fuji.' },
    { id: 'c-de', name: 'Germany', lat: 51.1657, lng: 10.4515, radiusKm: 300, fact: 'Central European economic powerhouse, home to the Black Forest and Bavarian Alps.' },
    { id: 'c-fr', name: 'France', lat: 46.2276, lng: 2.2137, radiusKm: 350, fact: 'Western European nation famed for art, cuisine, the Eiffel Tower, and Alpine summits.' },
    { id: 'c-gb', name: 'United Kingdom', lat: 55.3781, lng: -3.4360, radiusKm: 350, fact: 'Island nation comprising England, Scotland, Wales, and Northern Ireland.' },
    { id: 'c-it', name: 'Italy', lat: 41.8719, lng: 12.5674, radiusKm: 350, fact: 'Boot-shaped Mediterranean peninsula with the greatest number of UNESCO World Heritage sites.' },
    { id: 'c-id', name: 'Indonesia', lat: -0.7893, lng: 113.9213, radiusKm: 800, fact: 'World’s largest island nation, spanning over 17,000 equatorial volcanic islands.' },
    { id: 'c-mx', name: 'Mexico', lat: 23.6345, lng: -102.5528, radiusKm: 600, fact: 'Birthplace of Maya and Aztec civilizations, bordered by the Pacific and Gulf of Mexico.' },
    { id: 'c-ng', name: 'Nigeria', lat: 9.0820, lng: 8.6753, radiusKm: 450, fact: 'Most populous country in Africa, with diverse cultural groups and the Niger River delta.' },
    { id: 'c-tr', name: 'Turkey', lat: 38.9637, lng: 35.2433, radiusKm: 450, fact: 'Bridge between Europe and Asia across the Bosphorus Strait, historic heart of the Ottoman Empire.' }
  ],

  // --- 4. OCEANS, SEAS AND LAKES ---
  'oceans-seas': [
    { id: 'o-pacific', name: 'Pacific Ocean', lat: 0.0000, lng: -160.0000, radiusKm: 1800, fact: 'Largest and deepest ocean basin on Earth, covering more surface area than all land combined.' },
    { id: 'o-atlantic', name: 'Atlantic Ocean', lat: 10.0000, lng: -30.0000, radiusKm: 1600, fact: 'Second largest ocean, dividing the Americas from Europe and Africa.' },
    { id: 'o-indian', name: 'Indian Ocean', lat: -10.0000, lng: 75.0000, radiusKm: 1500, fact: 'Third largest ocean basin, bounded by Asia to the north, Africa to the west, and Australia to the east.' },
    { id: 'o-arctic', name: 'Arctic Ocean', lat: 85.0000, lng: 0.0000, radiusKm: 900, fact: 'Smallest and shallowest of the world’s oceans, covered by polar ice sheets year-round.' },
    { id: 'o-southern', name: 'Southern Ocean', lat: -65.0000, lng: 0.0000, radiusKm: 1200, fact: 'Encircles the Antarctic continent, renowned for intense circumpolar currents.' },
    { id: 'o-mediterranean', name: 'Mediterranean Sea', lat: 35.0000, lng: 18.0000, radiusKm: 600, fact: 'Intercontinental sea connecting southern Europe, northern Africa, and western Asia.' },
    { id: 'o-caribbean', name: 'Caribbean Sea', lat: 15.0000, lng: -75.0000, radiusKm: 550, fact: 'Tropical sea in the Western Hemisphere bordered by the Antilles islands and Central America.' },
    { id: 'o-southchina', name: 'South China Sea', lat: 12.0000, lng: 114.0000, radiusKm: 550, fact: 'Marginal sea of the western Pacific, one of the world’s most heavily trafficked shipping lanes.' },
    { id: 'o-arabian', name: 'Arabian Sea', lat: 15.0000, lng: 65.0000, radiusKm: 550, fact: 'Part of the northern Indian Ocean bounded by India to the east and the Arabian Peninsula to the west.' },
    { id: 'o-bengal', name: 'Bay of Bengal', lat: 15.0000, lng: 88.0000, radiusKm: 550, fact: 'Largest water region called a bay in the world, receiving the sacred Ganges and Brahmaputra rivers.' },
    { id: 'o-redsea', name: 'Red Sea', lat: 22.0000, lng: 38.0000, radiusKm: 400, fact: 'Inlet of the Indian Ocean between Africa and Asia, connected to the Mediterranean via the Suez Canal.' },
    { id: 'o-blacksea', name: 'Black Sea', lat: 43.5000, lng: 34.5000, radiusKm: 350, fact: 'Inland marginal sea between southeastern Europe and the Caucasus mountains.' },
    { id: 'o-caspian', name: 'Caspian Sea', lat: 41.5000, lng: 51.0000, radiusKm: 400, fact: 'Earth’s largest inland body of water, classified as both the world’s largest lake and a full sea.' },
    { id: 'o-baltic', name: 'Baltic Sea', lat: 58.0000, lng: 20.0000, radiusKm: 350, fact: 'Brackish inland sea in Northern Europe bounded by the Scandinavian Peninsula.' },
    { id: 'o-victoria', name: 'Lake Victoria', lat: -1.0000, lng: 33.0000, radiusKm: 200, fact: 'Africa’s largest freshwater lake by surface area and the primary reservoir of the White Nile.' },
    { id: 'o-superior', name: 'Lake Superior', lat: 47.7000, lng: -87.5000, radiusKm: 250, fact: 'Largest freshwater lake in the world by surface area, bordering the United States and Canada.' },
    { id: 'o-baikal', name: 'Lake Baikal', lat: 53.5000, lng: 108.0000, radiusKm: 250, fact: 'Ancient Siberian lake containing 20% of Earth’s unfrozen surface freshwater, the deepest lake on Earth.' },
    { id: 'o-deadsea', name: 'Dead Sea', lat: 31.5590, lng: 35.4732, radiusKm: 80, fact: 'Landlocked hypersaline lake sitting 430.5 meters below sea level, the lowest land elevation on Earth.' }
  ],

  // --- 5. DESERTS ---
  'deserts': [
    { id: 'd-sahara', name: 'Sahara Desert', lat: 23.4162, lng: 25.6628, radiusKm: 900, fact: 'Largest hot desert in the world, covering over 9 million square kilometers across North Africa.' },
    { id: 'd-arabian', name: 'Arabian Desert', lat: 23.0000, lng: 47.0000, radiusKm: 600, fact: 'Vast wilderness occupying almost the entire Arabian Peninsula, containing the Rub al Khali sand sea.' },
    { id: 'd-gobi', name: 'Gobi Desert', lat: 43.0000, lng: 105.0000, radiusKm: 600, fact: 'Cold desert basin in northern China and southern Mongolia, historic route along the Silk Road.' },
    { id: 'd-kalahari', name: 'Kalahari Desert', lat: -23.0000, lng: 22.0000, radiusKm: 500, fact: 'Semi-arid sandy savanna in southern Africa covering Botswana, Namibia, and South Africa.' },
    { id: 'd-greatvictoria', name: 'Great Victoria Desert', lat: -29.0000, lng: 129.0000, radiusKm: 450, fact: 'Australia’s largest desert, consisting of small sandhills, grassland plains, and salt lakes.' },
    { id: 'd-patagonian', name: 'Patagonian Desert', lat: -45.0000, lng: -69.0000, radiusKm: 500, fact: 'Largest desert in Argentina, bounded by the Andes to the west and the Atlantic to the east.' },
    { id: 'd-syrian', name: 'Syrian Desert', lat: 33.0000, lng: 39.0000, radiusKm: 350, fact: 'Arid steppe landscape spanning Syria, Jordan, Iraq, and northern Saudi Arabia.' },
    { id: 'd-thar', name: 'Thar Desert', lat: 27.0000, lng: 71.0000, radiusKm: 300, fact: 'The Great Indian Desert forming a natural boundary line between India and Pakistan.' },
    { id: 'd-atacama', name: 'Atacama Desert', lat: -23.8634, lng: -69.1328, radiusKm: 350, fact: 'Driest non-polar desert on Earth, located on the Pacific coast of northern Chile.' },
    { id: 'd-namib', name: 'Namib Desert', lat: -24.0000, lng: 15.0000, radiusKm: 350, fact: 'Ancient coastal desert in southwest Africa featuring towering red dunes at Sossusvlei.' },
    { id: 'd-mojave', name: 'Mojave Desert', lat: 35.0000, lng: -116.0000, radiusKm: 250, fact: 'Arid region in southeastern California and Nevada, home to Joshua trees and Death Valley.' },
    { id: 'd-taklamakan', name: 'Taklamakan Desert', lat: 39.0000, lng: 83.0000, radiusKm: 400, fact: 'Large desert in northwestern China known locally as the "Sea of Death" with shifting sand dunes.' }
  ],

  // --- 6. GRASSLANDS AND PLAINS ---
  'grasslands': [
    { id: 'g-eurasian', name: 'Eurasian Steppe', lat: 48.0000, lng: 60.0000, radiusKm: 800, fact: 'Vast temperate grassland stretching from Hungary and Ukraine through Kazakhstan to Manchuria.' },
    { id: 'g-greatplains', name: 'Great Plains', lat: 40.0000, lng: -100.0000, radiusKm: 700, fact: 'Broad expanse of flat prairie land in North America west of the Mississippi River.' },
    { id: 'g-pampas', name: 'Pampas', lat: -35.0000, lng: -62.0000, radiusKm: 500, fact: 'Fertile South American lowlands covering central Argentina, Uruguay, and southern Brazil.' },
    { id: 'g-savanna', name: 'African Savanna', lat: -2.0000, lng: 35.0000, radiusKm: 650, fact: 'Tropical grassland biome supporting the world’s greatest migrations of wildebeest and zebras.' },
    { id: 'g-serengeti', name: 'Serengeti Plains', lat: -2.3333, lng: 34.8333, radiusKm: 250, fact: 'Tanzanian ecosystem famous for dramatic wildlife migrations across the Mara River.' },
    { id: 'g-veld', name: 'Veld', lat: -27.0000, lng: 28.0000, radiusKm: 400, fact: 'Wide open rural plateau grassland characteristic of South Africa and Zimbabwe.' },
    { id: 'g-australiandowns', name: 'Australian Downs', lat: -27.5000, lng: 151.0000, radiusKm: 350, fact: 'Agricultural and pastoral plains region in southern Queensland, Australia.' },
    { id: 'g-canterbury', name: 'Canterbury Plains', lat: -43.6000, lng: 171.8000, radiusKm: 180, fact: 'Alluvial plains in New Zealand’s South Island, formed by braided glacial rivers.' },
    { id: 'g-llanos', name: 'Llanos', lat: 7.0000, lng: -68.0000, radiusKm: 450, fact: 'Vast tropical grassland plain situated to the east of the Andes in Colombia and Venezuela.' },
    { id: 'g-indogangetic', name: 'Indo-Gangetic Plain', lat: 26.5000, lng: 82.0000, radiusKm: 550, fact: 'Fertile river plain supporting hundreds of millions of people across northern India and Pakistan.' }
  ],

  // --- 7. PLATEAUS AND BASINS ---
  'plateaus': [
    { id: 'p-tibetan', name: 'Tibetan Plateau', lat: 33.0000, lng: 88.0000, radiusKm: 700, fact: 'Known as the "Roof of the World", average elevation exceeding 4,500 meters, feeding Asia’s rivers.' },
    { id: 'p-deccan', name: 'Deccan Plateau', lat: 17.0000, lng: 77.0000, radiusKm: 500, fact: 'Large volcanic basalt plateau covering most of southern India between the Western and Eastern Ghats.' },
    { id: 'p-colorado', name: 'Colorado Plateau', lat: 37.0000, lng: -110.0000, radiusKm: 350, fact: 'High desert region centered on the Four Corners US, carved into deep canyons including Grand Canyon.' },
    { id: 'p-anatolian', name: 'Anatolian Plateau', lat: 39.0000, lng: 33.0000, radiusKm: 400, fact: 'Elevated central plateau forming the geographic heart of Turkey.' },
    { id: 'p-altiplano', name: 'Altiplano', lat: -18.0000, lng: -68.0000, radiusKm: 400, fact: 'High plateau in west-central South America, host to Lake Titicaca and Salar de Uyuni.' },
    { id: 'p-ethiopian', name: 'Ethiopian Highlands', lat: 10.0000, lng: 39.0000, radiusKm: 350, fact: 'Rugged mountainous plateau in Ethiopia, often called the "Roof of Africa".' },
    { id: 'p-amazonbasin', name: 'Amazon Basin', lat: -3.0000, lng: -62.0000, radiusKm: 850, fact: 'World’s largest drainage basin, holding roughly 20% of the world’s river flow.' },
    { id: 'p-congobasin', name: 'Congo Basin', lat: 0.0000, lng: 22.0000, radiusKm: 700, fact: 'Second largest tropical rainforest basin on Earth, spanning equatorial Central Africa.' },
    { id: 'p-tarim', name: 'Tarim Basin', lat: 40.0000, lng: 84.0000, radiusKm: 500, fact: 'Enormous endorheic drainage basin in northwestern China encircled by high mountain ranges.' },
    { id: 'p-artesian', name: 'Great Artesian Basin', lat: -26.0000, lng: 140.0000, radiusKm: 650, fact: 'Largest and deepest artesian groundwater basin in the world, underlying 22% of Australia.' }
  ]
};

/**
 * Returns all places for a category ID
 */
export const getPlacesByCategory = (categoryId = 'india-states') => {
  const norm = (categoryId || '').toLowerCase();
  if (norm.includes('cit') || norm === 'india-cities') return MAP_CATEGORY_ITEMS['india-cities'];
  if (norm.includes('tourist') || norm === 'india-tourist') return MAP_CATEGORY_ITEMS['india-tourist'];
  return MAP_CATEGORY_ITEMS[categoryId] || MAP_CATEGORY_ITEMS['india-states'];
};

/**
 * Generates 4 multiple choice options (1 correct + 3 smart distractors from the same category)
 */
export const generateMultipleChoiceOptions = (correctItem, categoryId = 'india-states') => {
  const pool = getPlacesByCategory(categoryId).filter(p => p.id !== correctItem.id);
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  const distractors = shuffled.slice(0, 3);
  
  const options = [correctItem, ...distractors].sort(() => 0.5 - Math.random());
  return options.map(opt => ({
    id: opt.id,
    name: opt.name,
    isCorrect: opt.id === correctItem.id
  }));
};

/**
 * Returns randomized locations for Practice/Trainer Mode
 */
export const getRandomTrainerLocations = (categoryId = 'india-states', mode = 'find-on-map', count = 10) => {
  const allItems = getPlacesByCategory(categoryId);
  const shuffled = [...allItems].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, Math.min(count, allItems.length));

  return selected.map(item => ({
    id: item.id,
    prompt: item.name,
    name: item.name,
    lat: item.lat,
    lng: item.lng,
    radiusKm: item.radiusKm || 200,
    fact: item.fact || '',
    categoryId,
    mode, // 'find-on-map' or 'name-the-place'
    options: mode === 'name-the-place' ? generateMultipleChoiceOptions(item, categoryId) : null
  }));
};
