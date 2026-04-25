/**
 * Traffic data service
 * Since free real-time traffic APIs are limited, we generate realistic
 * traffic data based on time of day, day of week, and known traffic patterns.
 * Road segments are defined as polylines so the frontend can draw coloured roads.
 * This can be replaced with a real API (TomTom, HERE) when available.
 */

// Roads with dense waypoints that follow actual Almaty streets.
// East-West avenues run roughly horizontal; North-South avenues run roughly vertical.
const ALMATY_TRAFFIC_ROADS = [
  {
    roadName: 'Al-Farabi Ave',
    baseLoad: 70,
    segments: [
      [43.2180, 76.8520], [43.2182, 76.8600], [43.2185, 76.8700],
      [43.2188, 76.8800], [43.2190, 76.8900], [43.2192, 76.9000],
      [43.2195, 76.9100], [43.2197, 76.9200], [43.2199, 76.9300],
      [43.2201, 76.9400], [43.2203, 76.9500], [43.2205, 76.9600],
      [43.2207, 76.9700], [43.2210, 76.9800], [43.2212, 76.9900],
    ],
  },
  {
    roadName: 'Abay Ave',
    baseLoad: 65,
    segments: [
      [43.2380, 76.8550], [43.2382, 76.8650], [43.2383, 76.8750],
      [43.2385, 76.8850], [43.2386, 76.8950], [43.2388, 76.9050],
      [43.2389, 76.9150], [43.2390, 76.9250], [43.2391, 76.9350],
      [43.2392, 76.9450], [43.2393, 76.9550], [43.2394, 76.9650],
      [43.2395, 76.9750], [43.2396, 76.9850],
    ],
  },
  {
    roadName: 'Tole Bi St',
    baseLoad: 55,
    segments: [
      [43.2555, 76.8600], [43.2555, 76.8700], [43.2554, 76.8800],
      [43.2553, 76.8900], [43.2552, 76.9000], [43.2551, 76.9100],
      [43.2550, 76.9200], [43.2549, 76.9300], [43.2548, 76.9400],
      [43.2547, 76.9500], [43.2546, 76.9600], [43.2545, 76.9700],
    ],
  },
  {
    roadName: 'Raiymbek Ave',
    baseLoad: 62,
    segments: [
      [43.2680, 76.8600], [43.2680, 76.8700], [43.2680, 76.8800],
      [43.2679, 76.8900], [43.2679, 76.9000], [43.2678, 76.9100],
      [43.2678, 76.9200], [43.2677, 76.9300], [43.2677, 76.9400],
      [43.2676, 76.9500], [43.2676, 76.9600], [43.2675, 76.9700],
    ],
  },
  {
    roadName: 'Dostyk Ave',
    baseLoad: 60,
    segments: [
      [43.2120, 76.9555], [43.2170, 76.9553], [43.2220, 76.9550],
      [43.2270, 76.9548], [43.2320, 76.9545], [43.2370, 76.9542],
      [43.2420, 76.9540], [43.2470, 76.9537], [43.2520, 76.9535],
      [43.2570, 76.9532], [43.2620, 76.9530], [43.2670, 76.9528],
      [43.2720, 76.9525],
    ],
  },
  {
    roadName: 'Nazarbayev Ave',
    baseLoad: 68,
    segments: [
      [43.2120, 76.9450], [43.2170, 76.9448], [43.2220, 76.9446],
      [43.2270, 76.9444], [43.2320, 76.9442], [43.2370, 76.9440],
      [43.2420, 76.9438], [43.2470, 76.9435], [43.2520, 76.9433],
      [43.2570, 76.9430], [43.2620, 76.9428], [43.2670, 76.9425],
    ],
  },
  {
    roadName: 'Seifullin Ave',
    baseLoad: 58,
    segments: [
      [43.2150, 76.9300], [43.2200, 76.9298], [43.2250, 76.9296],
      [43.2300, 76.9294], [43.2350, 76.9292], [43.2400, 76.9290],
      [43.2450, 76.9288], [43.2500, 76.9286], [43.2550, 76.9284],
      [43.2600, 76.9282], [43.2650, 76.9280], [43.2700, 76.9278],
    ],
  },
  {
    roadName: 'Furmanov St',
    baseLoad: 50,
    segments: [
      [43.2150, 76.9650], [43.2200, 76.9648], [43.2250, 76.9646],
      [43.2300, 76.9644], [43.2350, 76.9642], [43.2400, 76.9640],
      [43.2450, 76.9638], [43.2500, 76.9636], [43.2550, 76.9634],
      [43.2600, 76.9632],
    ],
  },
  {
    roadName: 'Zhandosov St',
    baseLoad: 48,
    segments: [
      [43.2200, 76.9150], [43.2250, 76.9148], [43.2300, 76.9146],
      [43.2350, 76.9144], [43.2400, 76.9142], [43.2450, 76.9140],
      [43.2500, 76.9138], [43.2550, 76.9136],
    ],
  },
  {
    roadName: 'Timiryazev St',
    baseLoad: 45,
    segments: [
      [43.2300, 76.9050], [43.2302, 76.9150], [43.2303, 76.9250],
      [43.2305, 76.9350], [43.2306, 76.9450], [43.2308, 76.9550],
      [43.2309, 76.9650], [43.2310, 76.9750],
    ],
  },
  {
    roadName: 'Gagarin Ave',
    baseLoad: 52,
    segments: [
      [43.2130, 76.9750], [43.2180, 76.9748], [43.2230, 76.9745],
      [43.2280, 76.9742], [43.2330, 76.9740], [43.2380, 76.9738],
      [43.2430, 76.9735], [43.2480, 76.9733],
    ],
  },
  {
    roadName: 'Satpayev St',
    baseLoad: 53,
    segments: [
      [43.2285, 76.8700], [43.2286, 76.8800], [43.2287, 76.8900],
      [43.2288, 76.9000], [43.2289, 76.9100], [43.2290, 76.9200],
      [43.2291, 76.9300], [43.2292, 76.9400], [43.2293, 76.9500],
      [43.2294, 76.9600], [43.2295, 76.9700],
    ],
  },
];

function getTimeMultiplier() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  const isWeekend = day === 0 || day === 6;

  if (!isWeekend) {
    if (hour >= 7 && hour <= 9) return 1.5;
    if (hour >= 17 && hour <= 19) return 1.6;
    if (hour >= 12 && hour <= 14) return 1.2;
    if (hour >= 10 && hour <= 16) return 1.0;
    if (hour >= 20 && hour <= 23) return 0.7;
    return 0.3;
  } else {
    if (hour >= 11 && hour <= 14) return 1.0;
    if (hour >= 15 && hour <= 19) return 0.9;
    return 0.4;
  }
}

function getCongestionLevel(score) {
  if (score <= 30) return 'low';
  if (score <= 55) return 'moderate';
  if (score <= 80) return 'high';
  return 'severe';
}

function getTrafficData() {
  const multiplier = getTimeMultiplier();
  const randomVariance = () => (Math.random() - 0.5) * 20;

  return ALMATY_TRAFFIC_ROADS.map((road) => {
    const rawScore = Math.min(100, Math.max(0, road.baseLoad * multiplier + randomVariance()));
    const congestionScore = Math.round(rawScore);
    const freeFlowSpeed = 60;
    const currentSpeed = Math.round(freeFlowSpeed * (1 - congestionScore / 130));

    // Centre point of the road (used as fallback location)
    const mid = road.segments[Math.floor(road.segments.length / 2)];

    return {
      location: { lat: mid[0], lng: mid[1] },
      roadName: road.roadName,
      congestionScore,
      congestionLevel: getCongestionLevel(congestionScore),
      speedKmh: Math.max(5, currentSpeed),
      freeFlowSpeedKmh: freeFlowSpeed,
      segments: road.segments, // [[lat,lng], ...]
      city: 'Almaty',
    };
  });
}

function getTrafficForLocation(lat, lng, radiusKm = 5) {
  const allTraffic = getTrafficData();
  return allTraffic.filter((point) => {
    const dist = haversineDistance(lat, lng, point.location.lat, point.location.lng);
    return dist <= radiusKm;
  });
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

module.exports = {
  getTrafficData,
  getTrafficForLocation,
};
