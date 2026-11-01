/**
 * Curated Geography Study Library for OmniArena
 * Pre-calibrated with accurate coordinates, optimal radius thresholds, and study facts.
 */

export const MAP_CATEGORIES = [
  { id: 'all', label: 'All Locations' },
  { id: 'capitals', label: '🏛️ World Capitals' },
  { id: 'wonders', label: '🗿 World Wonders & Landmarks' },
  { id: 'nature', label: '🌊 Natural Wonders & Geography' }
];

export const MAP_PRESETS = [
  // --- WORLD CAPITALS ---
  {
    prompt: 'Tokyo (Capital of Japan)',
    lat: 35.6762,
    lng: 139.6503,
    radiusKm: 150,
    category: 'capitals',
    hint: 'Located on the eastern coast of Honshu island.',
    fact: 'Tokyo is the most populous metropolitan area in the world with over 37 million residents.'
  },
  {
    prompt: 'Paris (Capital of France)',
    lat: 48.8566,
    lng: 2.3522,
    radiusKm: 150,
    category: 'capitals',
    hint: 'Situated along the Seine River in northern-central France.',
    fact: 'Nicknamed "The City of Light" because it was one of the first European cities to adopt gas street lighting.'
  },
  {
    prompt: 'Cairo (Capital of Egypt)',
    lat: 30.0444,
    lng: 31.2357,
    radiusKm: 180,
    category: 'capitals',
    hint: 'Located near the Nile River delta in northeastern Africa.',
    fact: 'Cairo is known as the "City of a Thousand Minarets" due to its preponderance of Islamic architecture.'
  },
  {
    prompt: 'Canberra (Capital of Australia)',
    lat: -35.2809,
    lng: 149.1300,
    radiusKm: 180,
    category: 'capitals',
    hint: 'Selected as a compromise between Sydney and Melbourne.',
    fact: 'Canberra was entirely planned by American architects Walter Burley Griffin and Marion Mahony Griffin.'
  },
  {
    prompt: 'Washington, D.C. (Capital of USA)',
    lat: 38.9072,
    lng: -77.0369,
    radiusKm: 150,
    category: 'capitals',
    hint: 'Located on the Potomac River bordering Maryland and Virginia.',
    fact: 'It is a federal district, not part of any U.S. state, established by the U.S. Constitution in 1790.'
  },
  {
    prompt: 'Brasília (Capital of Brazil)',
    lat: -15.7975,
    lng: -47.8919,
    radiusKm: 200,
    category: 'capitals',
    hint: 'Planned city situated in the Brazilian Highlands.',
    fact: 'Viewed from above, the urban layout of Brasília resembles an airplane or a giant bird.'
  },
  {
    prompt: 'Ottawa (Capital of Canada)',
    lat: 45.4215,
    lng: -75.6972,
    radiusKm: 150,
    category: 'capitals',
    hint: 'Located in southern Ontario on the border with Quebec.',
    fact: 'Queen Victoria chose Ottawa as Canada’s capital in 1857 because of its defensible inland location.'
  },
  {
    prompt: 'New Delhi (Capital of India)',
    lat: 28.6139,
    lng: 77.2090,
    radiusKm: 180,
    category: 'capitals',
    hint: 'Located in northern India along the Yamuna River.',
    fact: 'Designed by British architects Sir Edwin Lutyens and Sir Herbert Baker in the early 20th century.'
  },
  {
    prompt: 'Beijing (Capital of China)',
    lat: 39.9042,
    lng: 116.4074,
    radiusKm: 200,
    category: 'capitals',
    hint: 'Located in northern China surrounded by mountain ranges.',
    fact: 'Beijing has served as the political center of China for over eight centuries.'
  },
  {
    prompt: 'Nairobi (Capital of Kenya)',
    lat: -1.2921,
    lng: 36.8219,
    radiusKm: 160,
    category: 'capitals',
    hint: 'Known as the "Green City in the Sun" in East Africa.',
    fact: 'Nairobi is the only global capital city with a national game park within its boundaries where wild lions roam.'
  },
  {
    prompt: 'Reykjavik (Capital of Iceland)',
    lat: 64.1466,
    lng: -21.9426,
    radiusKm: 120,
    category: 'capitals',
    hint: 'Located on the southwestern coast of Iceland.',
    fact: 'Reykjavik is the world’s northernmost capital of a sovereign state.'
  },
  {
    prompt: 'Athens (Capital of Greece)',
    lat: 37.9838,
    lng: 23.7275,
    radiusKm: 140,
    category: 'capitals',
    hint: 'Cradle of Western civilization in southern Europe.',
    fact: 'Athens has been continuously inhabited for over 3,400 years and gave birth to democracy.'
  },
  {
    prompt: 'Rome (Capital of Italy)',
    lat: 41.9028,
    lng: 12.4964,
    radiusKm: 150,
    category: 'capitals',
    hint: 'The "Eternal City" built on seven hills.',
    fact: 'Encompasses Vatican City, the world’s smallest independent state, entirely within its municipal boundaries.'
  },
  {
    prompt: 'London (Capital of UK)',
    lat: 51.5074,
    lng: -0.1278,
    radiusKm: 140,
    category: 'capitals',
    hint: 'Spanning the River Thames in southeastern England.',
    fact: 'The Greenwich Meridian (0° longitude) passes through London, defining Greenwich Mean Time (GMT).'
  },
  {
    prompt: 'Seoul (Capital of South Korea)',
    lat: 37.5665,
    lng: 126.9780,
    radiusKm: 140,
    category: 'capitals',
    hint: 'Bisected by the Han River on the Korean Peninsula.',
    fact: 'Seoul has had high-speed internet and tech infrastructure that pioneered global smart city architecture.'
  },

  // --- WORLD WONDERS & LANDMARKS ---
  {
    prompt: 'Pyramids of Giza (Egypt)',
    lat: 29.9792,
    lng: 31.1342,
    radiusKm: 80,
    category: 'wonders',
    hint: 'Located on the Giza Plateau on the west bank of the Nile.',
    fact: 'The Great Pyramid was the tallest man-made structure in the world for over 3,800 years.'
  },
  {
    prompt: 'Taj Mahal (Agra, India)',
    lat: 27.1751,
    lng: 78.0421,
    radiusKm: 80,
    category: 'wonders',
    hint: 'White marble mausoleum on the south bank of the Yamuna River.',
    fact: 'Commissioned in 1632 by the Mughal emperor Shah Jahan to house the tomb of his favorite wife, Mumtaz Mahal.'
  },
  {
    prompt: 'Machu Picchu (Peru)',
    lat: -13.1631,
    lng: -72.5450,
    radiusKm: 90,
    category: 'wonders',
    hint: 'Incan citadel set high in the Andes Mountains above the Urubamba River valley.',
    fact: 'Built around 1450 at 2,430 meters (7,970 ft) elevation using polished dry-stone walls without mortar.'
  },
  {
    prompt: 'Great Wall of China (Badaling, China)',
    lat: 40.3588,
    lng: 116.0153,
    radiusKm: 100,
    category: 'wonders',
    hint: 'Northern border of ancient Chinese states north of Beijing.',
    fact: 'Total length of all built sections across centuries spans over 21,196 kilometers (13,171 miles).'
  },
  {
    prompt: 'Colosseum (Rome, Italy)',
    lat: 41.8902,
    lng: 12.4922,
    radiusKm: 70,
    category: 'wonders',
    hint: 'Oval amphitheater in the center of Rome.',
    fact: 'Could hold up to 80,000 spectators and was used for gladiatorial contests and public spectacles.'
  },
  {
    prompt: 'Petra (Jordan)',
    lat: 30.3285,
    lng: 35.4444,
    radiusKm: 90,
    category: 'wonders',
    hint: 'Historical and archaeological city in southern Jordan famous for rock-cut architecture.',
    fact: 'Also called the "Rose City" due to the pink sandstone out of which its tombs and temples were carved.'
  },
  {
    prompt: 'Christ the Redeemer (Rio de Janeiro, Brazil)',
    lat: -22.9519,
    lng: -43.2105,
    radiusKm: 70,
    category: 'wonders',
    hint: 'Art Deco statue atop Corcovado mountain overlooking Rio.',
    fact: 'Stands 30 meters (98 ft) tall excluding its 8-meter pedestal and weighs 635 metric tons.'
  },
  {
    prompt: 'Mount Everest (Himalayas, Nepal/Tibet)',
    lat: 27.9881,
    lng: 86.9250,
    radiusKm: 100,
    category: 'wonders',
    hint: 'Highest mountain above sea level on Earth.',
    fact: 'Its summit stands at 8,848.86 meters (29,031.7 ft) and grows roughly 4 millimeters taller every year.'
  },
  {
    prompt: 'Grand Canyon (Arizona, USA)',
    lat: 36.1069,
    lng: -112.1129,
    radiusKm: 140,
    category: 'wonders',
    hint: 'Steep-sided canyon carved by the Colorado River in Arizona.',
    fact: 'Over 446 km (277 miles) long and exposes nearly two billion years of Earth’s geological history.'
  },
  {
    prompt: 'Panama Canal (Panama)',
    lat: 9.0800,
    lng: -79.6800,
    radiusKm: 80,
    category: 'wonders',
    hint: 'Artificial 82 km waterway connecting Atlantic and Pacific oceans.',
    fact: 'Cuts 8,000 nautical miles off the voyage around Cape Horn at the southern tip of South America.'
  },

  // --- NATURAL GEOGRAPHY & OCEANS ---
  {
    prompt: 'Sahara Desert (North Africa)',
    lat: 23.4162,
    lng: 25.6628,
    radiusKm: 1500,
    category: 'nature',
    hint: 'Spans across North Africa from the Red Sea to the Atlantic Ocean.',
    fact: 'The Sahara covers 9.2 million square kilometers, an area comparable to the entire United States.'
  },
  {
    prompt: 'Amazon Rainforest (Brazil/Peru/Colombia)',
    lat: -3.4653,
    lng: -62.2159,
    radiusKm: 1400,
    category: 'nature',
    hint: 'Spanning northern South America around the Amazon River basin.',
    fact: 'Produces approximately 6% of the world’s oxygen and holds 10% of all known species on Earth.'
  },
  {
    prompt: 'Madagascar (Island, Indian Ocean)',
    lat: -18.7669,
    lng: 46.8691,
    radiusKm: 700,
    category: 'nature',
    hint: 'Large island nation off the southeastern coast of Africa.',
    fact: 'Over 90% of Madagascar’s wildlife, including all lemur species, is found nowhere else on the planet.'
  },
  {
    prompt: 'Galápagos Islands (Ecuador)',
    lat: -0.9538,
    lng: -90.9656,
    radiusKm: 300,
    category: 'nature',
    hint: 'Volcanic archipelago in the Pacific Ocean west of Ecuador.',
    fact: 'Charles Darwin’s observations of Galápagos finches and tortoises led to his theory of evolution by natural selection.'
  },
  {
    prompt: 'Lake Baikal (Siberia, Russia)',
    lat: 53.5587,
    lng: 108.1650,
    radiusKm: 400,
    category: 'nature',
    hint: 'Massive lake in southern Siberia near the Mongolian border.',
    fact: 'The world’s deepest (1,642 m) and oldest lake, containing 20% of the world’s unfrozen surface freshwater.'
  },
  {
    prompt: 'Mariana Trench (Pacific Ocean)',
    lat: 11.3493,
    lng: 142.1996,
    radiusKm: 500,
    category: 'nature',
    hint: 'Located in the western Pacific Ocean east of the Philippines.',
    fact: 'Challenger Deep inside the trench reaches approximately 10,994 meters (36,070 ft), deeper than Mount Everest is tall.'
  },
  {
    prompt: 'Great Barrier Reef (Australia)',
    lat: -18.2871,
    lng: 147.6992,
    radiusKm: 600,
    category: 'nature',
    hint: 'Coral reef system off the coast of Queensland in northeastern Australia.',
    fact: 'The world’s largest living structure, stretching over 2,300 km (1,400 miles) and visible from outer space.'
  },
  {
    prompt: 'Victoria Falls (Zambia/Zimbabwe)',
    lat: -17.9243,
    lng: 25.8572,
    radiusKm: 100,
    category: 'nature',
    hint: 'Waterfall on the Zambezi River on the border of Zambia and Zimbabwe.',
    fact: 'Known locally as Mosi-oa-Tunya ("The Smoke That Thunders"), forming the largest sheet of falling water in the world.'
  },
  {
    prompt: 'Dead Sea (Jordan/Israel)',
    lat: 31.5590,
    lng: 35.4732,
    radiusKm: 80,
    category: 'nature',
    hint: 'Landlocked salt lake bordered by Jordan and Israel/West Bank.',
    fact: 'Its surface sits at 430.5 meters below sea level, making its shores the lowest land-based elevation on Earth.'
  }
];

/**
 * Returns a randomized set of diverse geography questions for Practice Mode
 */
export const getRandomPracticeLocations = (count = 5) => {
  const shuffled = [...MAP_PRESETS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map(p => ({
    prompt: p.prompt,
    lat: p.lat,
    lng: p.lng,
    radiusKm: p.radiusKm,
    hint: p.hint,
    fact: p.fact
  }));
};
