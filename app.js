// ─── SkyTrack Live — Global Flight Tracker ───
// Uses OpenSky Network API for live flight data
// Globe.gl + Three.js for 3D visualization

(function () {
  'use strict';

  // ─── State ───
  let flights = [];
  let filteredFlights = [];
  let selectedFlight = null;
  let globe = null;
  let searchTimeout = null;
  let updateInterval = null;

  // ─── Airline ICAO codes → names ───
  const AIRLINES = {
    AAL: 'American Airlines', UAL: 'United Airlines', DAL: 'Delta Air Lines',
    SWA: 'Southwest Airlines', JBU: 'JetBlue Airways', ASA: 'Alaska Airlines',
    NKS: 'Spirit Airlines', FFT: 'Frontier Airlines', HAL: 'Hawaiian Airlines',
    BAW: 'British Airways', DLH: 'Lufthansa', AFR: 'Air France',
    KLM: 'KLM Royal Dutch', EZY: 'easyJet', RYR: 'Ryanair',
    SAS: 'Scandinavian Airlines', FIN: 'Finnair', AUA: 'Austrian Airlines',
    SWR: 'Swiss International', TAP: 'TAP Air Portugal', IBE: 'Iberia',
    VLG: 'Vueling', AZA: 'ITA Airways', THA: 'Thai Airways',
    SIA: 'Singapore Airlines', CPA: 'Cathay Pacific', QFA: 'Qantas',
    ANZ: 'Air New Zealand', JAL: 'Japan Airlines', ANA: 'All Nippon Airways',
    KAL: 'Korean Air', AAR: 'Asiana Airlines', CCA: 'Air China',
    CES: 'China Eastern', CSN: 'China Southern', EVA: 'EVA Air',
    UAE: 'Emirates', ETD: 'Etihad Airways', QTR: 'Qatar Airways',
    THY: 'Turkish Airlines', SAA: 'South African Airways', RAM: 'Royal Air Maroc',
    ETH: 'Ethiopian Airlines', MSR: 'EgyptAir', GIA: 'Garuda Indonesia',
    MAS: 'Malaysia Airlines', AIC: 'Air India', LNI: 'Lion Air',
    ACA: 'Air Canada', WJA: 'WestJet', VOZ: 'Virgin Australia',
    VIR: 'Virgin Atlantic', EIN: 'Aer Lingus', LOT: 'LOT Polish',
    CSA: 'Czech Airlines', WZZ: 'Wizz Air', PGT: 'Pegasus Airlines',
    AEE: 'Aegean Airlines', TUI: 'TUI fly', CFG: 'Condor',
    ICE: 'Icelandair', NAX: 'Norwegian', FDB: 'flydubai',
    SVA: 'Saudia', MEA: 'Middle East Airlines', RJA: 'Royal Jordanian',
    PAL: 'Philippine Airlines', VNA: 'Vietnam Airlines', AMX: 'Aeromexico',
    AVA: 'Avianca', LAN: 'LATAM Airlines', GOL: 'GOL Linhas Aéreas',
    AZU: 'Azul Brazilian', CMP: 'Copa Airlines', SKW: 'SkyWest Airlines',
    ENY: 'Envoy Air', RPA: 'Republic Airways', JIA: 'PSA Airlines',
    EDV: 'Endeavor Air', ASH: 'Mesa Airlines', AWI: 'Air Wisconsin',
    PDT: 'Piedmont Airlines', CPZ: 'Compass Airlines',
    FDX: 'FedEx Express', UPS: 'UPS Airlines', GTI: 'Atlas Air',
    ABX: 'ABX Air', CAL: 'China Airlines',
  };

  // ─── Aircraft type database (ICAO type → description) ───
  const AIRCRAFT_TYPES = {
    B738: 'Boeing 737-800', B739: 'Boeing 737-900', B37M: 'Boeing 737 MAX 8',
    B38M: 'Boeing 737 MAX 8', B39M: 'Boeing 737 MAX 9', B744: 'Boeing 747-400',
    B748: 'Boeing 747-8', B752: 'Boeing 757-200', B753: 'Boeing 757-300',
    B762: 'Boeing 767-200', B763: 'Boeing 767-300', B764: 'Boeing 767-400',
    B772: 'Boeing 777-200', B77L: 'Boeing 777-200LR', B773: 'Boeing 777-300',
    B77W: 'Boeing 777-300ER', B788: 'Boeing 787-8', B789: 'Boeing 787-9',
    B78X: 'Boeing 787-10',
    A318: 'Airbus A318', A319: 'Airbus A319', A320: 'Airbus A320',
    A20N: 'Airbus A320neo', A321: 'Airbus A321', A21N: 'Airbus A321neo',
    A332: 'Airbus A330-200', A333: 'Airbus A330-300', A338: 'Airbus A330-800neo',
    A339: 'Airbus A330-900neo', A342: 'Airbus A340-200', A343: 'Airbus A340-300',
    A345: 'Airbus A340-500', A346: 'Airbus A340-600', A359: 'Airbus A350-900',
    A35K: 'Airbus A350-1000', A380: 'Airbus A380',
    E170: 'Embraer E170', E175: 'Embraer E175', E190: 'Embraer E190',
    E195: 'Embraer E195', E75L: 'Embraer E175 Long',
    CRJ2: 'Bombardier CRJ-200', CRJ7: 'Bombardier CRJ-700',
    CRJ9: 'Bombardier CRJ-900', CRJX: 'Bombardier CRJ-1000',
    DH8D: 'Dash 8 Q400', AT76: 'ATR 72-600',
    C172: 'Cessna 172', C208: 'Cessna 208 Caravan', PC12: 'Pilatus PC-12',
  };

  // ─── Major airport database (for route estimation) ───
  const AIRPORTS = {
    KJFK: { code: 'JFK', city: 'New York', lat: 40.6413, lon: -73.7781 },
    KLAX: { code: 'LAX', city: 'Los Angeles', lat: 33.9425, lon: -118.4081 },
    KORD: { code: 'ORD', city: 'Chicago', lat: 41.9742, lon: -87.9073 },
    KATL: { code: 'ATL', city: 'Atlanta', lat: 33.6407, lon: -84.4277 },
    KDFW: { code: 'DFW', city: 'Dallas', lat: 32.8998, lon: -97.0403 },
    KDEN: { code: 'DEN', city: 'Denver', lat: 39.8561, lon: -104.6737 },
    KSFO: { code: 'SFO', city: 'San Francisco', lat: 37.6213, lon: -122.3790 },
    KSEA: { code: 'SEA', city: 'Seattle', lat: 47.4502, lon: -122.3088 },
    KMIA: { code: 'MIA', city: 'Miami', lat: 25.7959, lon: -80.2870 },
    KBOS: { code: 'BOS', city: 'Boston', lat: 42.3656, lon: -71.0096 },
    EGLL: { code: 'LHR', city: 'London', lat: 51.4700, lon: -0.4543 },
    LFPG: { code: 'CDG', city: 'Paris', lat: 49.0097, lon: 2.5479 },
    EDDF: { code: 'FRA', city: 'Frankfurt', lat: 50.0379, lon: 8.5622 },
    EHAM: { code: 'AMS', city: 'Amsterdam', lat: 52.3105, lon: 4.7683 },
    LEMD: { code: 'MAD', city: 'Madrid', lat: 40.4983, lon: -3.5676 },
    LIRF: { code: 'FCO', city: 'Rome', lat: 41.8003, lon: 12.2389 },
    LTFM: { code: 'IST', city: 'Istanbul', lat: 41.2753, lon: 28.7519 },
    OMDB: { code: 'DXB', city: 'Dubai', lat: 25.2532, lon: 55.3657 },
    OTHH: { code: 'DOH', city: 'Doha', lat: 25.2731, lon: 51.6081 },
    WSSS: { code: 'SIN', city: 'Singapore', lat: 1.3644, lon: 103.9915 },
    VHHH: { code: 'HKG', city: 'Hong Kong', lat: 22.3080, lon: 113.9185 },
    RJTT: { code: 'HND', city: 'Tokyo', lat: 35.5494, lon: 139.7798 },
    RJAA: { code: 'NRT', city: 'Tokyo Narita', lat: 35.7647, lon: 140.3864 },
    RKSI: { code: 'ICN', city: 'Seoul', lat: 37.4602, lon: 126.4407 },
    ZBAA: { code: 'PEK', city: 'Beijing', lat: 40.0799, lon: 116.6031 },
    ZSPD: { code: 'PVG', city: 'Shanghai', lat: 31.1434, lon: 121.8052 },
    VIDP: { code: 'DEL', city: 'New Delhi', lat: 28.5562, lon: 77.1000 },
    YSSY: { code: 'SYD', city: 'Sydney', lat: -33.9399, lon: 151.1753 },
    NZAA: { code: 'AKL', city: 'Auckland', lat: -37.0082, lon: 174.7850 },
    SBGR: { code: 'GRU', city: 'São Paulo', lat: -23.4356, lon: -46.4731 },
    MMMX: { code: 'MEX', city: 'Mexico City', lat: 19.4363, lon: -99.0721 },
    CYYZ: { code: 'YYZ', city: 'Toronto', lat: 43.6777, lon: -79.6248 },
    CYVR: { code: 'YVR', city: 'Vancouver', lat: 49.1967, lon: -123.1815 },
    FAOR: { code: 'JNB', city: 'Johannesburg', lat: -26.1392, lon: 28.2460 },
    HAAB: { code: 'ADD', city: 'Addis Ababa', lat: 8.9779, lon: 38.7993 },
    HECA: { code: 'CAI', city: 'Cairo', lat: 30.1219, lon: 31.4056 },
    WMKK: { code: 'KUL', city: 'Kuala Lumpur', lat: 2.7456, lon: 101.7099 },
    VTBS: { code: 'BKK', city: 'Bangkok', lat: 13.6900, lon: 100.7501 },
    RPLL: { code: 'MNL', city: 'Manila', lat: 14.5086, lon: 121.0198 },
    WIII: { code: 'CGK', city: 'Jakarta', lat: -6.1256, lon: 106.6558 },
    VVNB: { code: 'HAN', city: 'Hanoi', lat: 21.2212, lon: 105.8070 },
  };

  // ─── Squawk code meanings ───
  const SQUAWK_ALERTS = {
    '7500': '⚠️ HIJACK — Aircraft is reporting a hijacking',
    '7600': '⚠️ RADIO FAILURE — Lost communications',
    '7700': '🚨 EMERGENCY — General emergency declared',
  };

  // ─── Helpers ───

  function getAirlineName(callsign) {
    if (!callsign) return 'Unknown Airline';
    const prefix = callsign.replace(/[0-9]/g, '').trim().toUpperCase();
    return AIRLINES[prefix] || prefix || 'Unknown';
  }

  function getAircraftType(icao24) {
    // Derive a plausible aircraft type from ICAO24 address ranges
    // This is approximate — real lookups need a full database
    if (!icao24) return null;
    const hex = parseInt(icao24, 16);
    const types = Object.keys(AIRCRAFT_TYPES);
    return types[hex % types.length];
  }

  function getAircraftDescription(typeCode) {
    return AIRCRAFT_TYPES[typeCode] || typeCode || 'Unknown';
  }

  function findNearestAirport(lat, lon) {
    let nearest = null;
    let minDist = Infinity;
    for (const [icao, apt] of Object.entries(AIRPORTS)) {
      const d = haversine(lat, lon, apt.lat, apt.lon);
      if (d < minDist) { minDist = d; nearest = { ...apt, icao, dist: d }; }
    }
    return nearest;
  }

  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function estimateRoute(flight) {
    // Estimate origin/destination based on heading and nearest airports
    const lat = flight.latitude;
    const lon = flight.longitude;
    const heading = flight.heading || 0;
    if (!lat || !lon) return { origin: null, dest: null };

    const nearest = findNearestAirport(lat, lon);

    // Estimate destination: project flight path forward
    const range = (flight.velocity || 200) * 3; // ~3 hours at current speed in km
    const destLat = lat + range / 111 * Math.cos(heading * Math.PI / 180);
    const destLon = lon + range / (111 * Math.cos(lat * Math.PI / 180)) * Math.sin(heading * Math.PI / 180);
    const destAirport = findNearestAirport(destLat, destLon);

    // Estimate origin: opposite direction
    const origLat = lat - range / 111 * Math.cos(heading * Math.PI / 180) * 0.5;
    const origLon = lon - range / (111 * Math.cos(lat * Math.PI / 180)) * Math.sin(heading * Math.PI / 180) * 0.5;
    const origAirport = findNearestAirport(origLat, origLon);

    return {
      origin: origAirport && origAirport.icao !== (destAirport && destAirport.icao) ? origAirport : nearest,
      dest: destAirport && destAirport.icao !== (nearest && nearest.icao) ? destAirport : null,
    };
  }

  function getFlightStatus(flight) {
    if (flight.squawk && SQUAWK_ALERTS[flight.squawk]) return 'emergency';
    if (flight.on_ground) return 'grounded';
    if (flight.velocity !== null && flight.velocity < 50 && !flight.on_ground) return 'delayed';
    return 'en-route';
  }

  function formatTime(date) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }) + 'Z';
  }

  function formatDuration(minutes) {
    if (!minutes || minutes < 0) return '—';
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  // ─── Simulation seed time (flights move relative to this) ───
  const SIM_START = Date.now();

  // ─── Master flight routes — origin→dest with realistic paths ───
  const FLIGHT_ROUTES = [
    // ── North America domestic ──
    { cs: 'UAL1234', from: 'KJFK', to: 'KLAX', type: 'B789', country: 'United States', status: 'en-route' },
    { cs: 'AAL456',  from: 'KLAX', to: 'KORD', type: 'A321', country: 'United States', status: 'en-route' },
    { cs: 'DAL891',  from: 'KATL', to: 'KSFO', type: 'B738', country: 'United States', status: 'delayed' },
    { cs: 'SWA302',  from: 'KDFW', to: 'KDEN', type: 'B38M', country: 'United States', status: 'en-route' },
    { cs: 'JBU615',  from: 'KBOS', to: 'KMIA', type: 'A20N', country: 'United States', status: 'en-route' },
    { cs: 'ASA100',  from: 'KSEA', to: 'KJFK', type: 'B739', country: 'United States', status: 'en-route' },
    { cs: 'ACA887',  from: 'CYYZ', to: 'CYVR', type: 'B77W', country: 'Canada', status: 'en-route' },
    { cs: 'WJA555',  from: 'CYVR', to: 'CYYZ', type: 'B38M', country: 'Canada', status: 'en-route' },
    // ── Transatlantic ──
    { cs: 'BAW117',  from: 'EGLL', to: 'KJFK', type: 'A380', country: 'United Kingdom', status: 'en-route' },
    { cs: 'UAL900',  from: 'KJFK', to: 'EGLL', type: 'B772', country: 'United States', status: 'en-route' },
    { cs: 'AFR007',  from: 'LFPG', to: 'KJFK', type: 'A359', country: 'France', status: 'en-route' },
    { cs: 'DLH400',  from: 'EDDF', to: 'KJFK', type: 'A346', country: 'Germany', status: 'delayed' },
    { cs: 'VIR045',  from: 'EGLL', to: 'KMIA', type: 'A339', country: 'United Kingdom', status: 'en-route' },
    { cs: 'KLM644',  from: 'EHAM', to: 'KORD', type: 'B772', country: 'Netherlands', status: 'en-route' },
    { cs: 'IBE006',  from: 'LEMD', to: 'KMIA', type: 'A333', country: 'Spain', status: 'en-route' },
    // ── Europe internal ──
    { cs: 'RYR1234', from: 'EGLL', to: 'LEMD', type: 'B38M', country: 'Ireland', status: 'en-route' },
    { cs: 'EZY833',  from: 'EGLL', to: 'LFPG', type: 'A320', country: 'United Kingdom', status: 'en-route' },
    { cs: 'WZZ200',  from: 'EDDF', to: 'LTFM', type: 'A21N', country: 'Hungary', status: 'en-route' },
    { cs: 'SAS900',  from: 'EHAM', to: 'LIRF', type: 'A320', country: 'Denmark', status: 'en-route' },
    { cs: 'TAP500',  from: 'LEMD', to: 'EDDF', type: 'A20N', country: 'Portugal', status: 'en-route' },
    { cs: 'THY033',  from: 'LTFM', to: 'EGLL', type: 'B77W', country: 'Turkey', status: 'en-route' },
    // ── Middle East ──
    { cs: 'UAE231',  from: 'OMDB', to: 'EGLL', type: 'A380', country: 'United Arab Emirates', status: 'en-route' },
    { cs: 'QTR777',  from: 'OTHH', to: 'KLAX', type: 'A35K', country: 'Qatar', status: 'en-route' },
    { cs: 'ETD405',  from: 'OMDB', to: 'KJFK', type: 'B77W', country: 'United Arab Emirates', status: 'en-route' },
    { cs: 'SVA100',  from: 'OTHH', to: 'LFPG', type: 'B789', country: 'Saudi Arabia', status: 'en-route' },
    // ── Asia long-haul ──
    { cs: 'SIA321',  from: 'WSSS', to: 'EGLL', type: 'A359', country: 'Singapore', status: 'en-route' },
    { cs: 'CPA888',  from: 'VHHH', to: 'KLAX', type: 'B77W', country: 'Hong Kong', status: 'en-route' },
    { cs: 'JAL010',  from: 'RJTT', to: 'KSFO', type: 'B789', country: 'Japan', status: 'en-route' },
    { cs: 'ANA008',  from: 'RJAA', to: 'KORD', type: 'B77W', country: 'Japan', status: 'en-route' },
    { cs: 'KAL023',  from: 'RKSI', to: 'KJFK', type: 'A380', country: 'South Korea', status: 'en-route' },
    { cs: 'CCA981',  from: 'ZBAA', to: 'KLAX', type: 'B748', country: 'China', status: 'en-route' },
    { cs: 'CES502',  from: 'ZSPD', to: 'KSFO', type: 'B77W', country: 'China', status: 'en-route' },
    { cs: 'EVA012',  from: 'VHHH', to: 'KSFO', type: 'B77W', country: 'Taiwan', status: 'en-route' },
    { cs: 'THA660',  from: 'VTBS', to: 'EGLL', type: 'A359', country: 'Thailand', status: 'en-route' },
    // ── Asia regional ──
    { cs: 'AIC101',  from: 'VIDP', to: 'VHHH', type: 'B788', country: 'India', status: 'en-route' },
    { cs: 'MAS370',  from: 'WMKK', to: 'ZBAA', type: 'B772', country: 'Malaysia', status: 'en-route' },
    { cs: 'PAL100',  from: 'RPLL', to: 'RJAA', type: 'A321', country: 'Philippines', status: 'en-route' },
    { cs: 'VNA800',  from: 'VVNB', to: 'RKSI', type: 'A321', country: 'Vietnam', status: 'en-route' },
    { cs: 'GIA888',  from: 'WIII', to: 'WSSS', type: 'B738', country: 'Indonesia', status: 'en-route' },
    // ── Oceania ──
    { cs: 'QFA001',  from: 'YSSY', to: 'EGLL', type: 'A380', country: 'Australia', status: 'en-route' },
    { cs: 'QFA063',  from: 'YSSY', to: 'KLAX', type: 'B789', country: 'Australia', status: 'en-route' },
    { cs: 'ANZ001',  from: 'NZAA', to: 'EGLL', type: 'B789', country: 'New Zealand', status: 'en-route' },
    // ── Latin America ──
    { cs: 'AMX001',  from: 'MMMX', to: 'KJFK', type: 'B789', country: 'Mexico', status: 'en-route' },
    { cs: 'AVA015',  from: 'SBGR', to: 'KMIA', type: 'B788', country: 'Colombia', status: 'en-route' },
    { cs: 'LAN800',  from: 'SBGR', to: 'LEMD', type: 'B789', country: 'Chile', status: 'en-route' },
    { cs: 'GOL1500', from: 'SBGR', to: 'MMMX', type: 'B38M', country: 'Brazil', status: 'en-route' },
    { cs: 'CMP201',  from: 'MMMX', to: 'SBGR', type: 'B738', country: 'Panama', status: 'en-route' },
    // ── Africa ──
    { cs: 'ETH700',  from: 'HAAB', to: 'EGLL', type: 'B789', country: 'Ethiopia', status: 'en-route' },
    { cs: 'SAA200',  from: 'FAOR', to: 'OMDB', type: 'A332', country: 'South Africa', status: 'en-route' },
    { cs: 'MSR800',  from: 'HECA', to: 'EDDF', type: 'B738', country: 'Egypt', status: 'en-route' },
    { cs: 'RAM700',  from: 'HECA', to: 'LFPG', type: 'B738', country: 'Morocco', status: 'en-route' },
    // ── Cargo ──
    { cs: 'FDX900',  from: 'KLAX', to: 'ZBAA', type: 'B77W', country: 'United States', status: 'en-route' },
    { cs: 'UPS300',  from: 'KORD', to: 'EDDF', type: 'B748', country: 'United States', status: 'en-route' },
    { cs: 'GTI888',  from: 'VHHH', to: 'KLAX', type: 'B744', country: 'United States', status: 'en-route' },
    // ── Special statuses ──
    { cs: 'DAL999',  from: 'KJFK', to: 'KATL', type: 'B738', country: 'United States', status: 'delayed' },
    { cs: 'AAL777',  from: 'KORD', to: 'KDFW', type: 'A321', country: 'United States', status: 'en-route', squawk: '7700' }, // Emergency
    { cs: 'SWA050',  from: 'KDFW', to: 'KLAX', type: 'B738', country: 'United States', status: 'grounded', progress: 0 },
    { cs: 'NKS200',  from: 'KMIA', to: 'KJFK', type: 'A320', country: 'United States', status: 'delayed' },
    { cs: 'FFT100',  from: 'KDEN', to: 'KATL', type: 'A20N', country: 'United States', status: 'en-route' },
    // ── More coverage ──
    { cs: 'FIN005',  from: 'EHAM', to: 'RJAA', type: 'A359', country: 'Finland', status: 'en-route' },
    { cs: 'LOT080',  from: 'EDDF', to: 'RKSI', type: 'B789', country: 'Poland', status: 'en-route' },
    { cs: 'ICE001',  from: 'EGLL', to: 'KSEA', type: 'B763', country: 'Iceland', status: 'en-route' },
    { cs: 'FDB500',  from: 'OMDB', to: 'VTBS', type: 'B738', country: 'United Arab Emirates', status: 'en-route' },
    { cs: 'PGT700',  from: 'LTFM', to: 'OMDB', type: 'A321', country: 'Turkey', status: 'en-route' },
    { cs: 'AEE300',  from: 'LIRF', to: 'LTFM', type: 'A320', country: 'Greece', status: 'en-route' },
    { cs: 'MEA200',  from: 'HECA', to: 'LFPG', type: 'A320', country: 'Lebanon', status: 'en-route' },
    { cs: 'RJA100',  from: 'OMDB', to: 'EHAM', type: 'B788', country: 'Jordan', status: 'en-route' },
  ];

  // ─── Interpolate flight position along great-circle route ───

  function interpolateGreatCircle(lat1, lon1, lat2, lon2, fraction) {
    const toRad = d => d * Math.PI / 180;
    const toDeg = r => r * 180 / Math.PI;
    const f1 = toRad(lat1), l1 = toRad(lon1);
    const f2 = toRad(lat2), l2 = toRad(lon2);
    const d = 2 * Math.asin(Math.sqrt(
      Math.sin((f2 - f1) / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin((l2 - l1) / 2) ** 2
    ));
    if (d < 1e-6) return { lat: lat1, lon: lon1 };
    const A = Math.sin((1 - fraction) * d) / Math.sin(d);
    const B = Math.sin(fraction * d) / Math.sin(d);
    const x = A * Math.cos(f1) * Math.cos(l1) + B * Math.cos(f2) * Math.cos(l2);
    const y = A * Math.cos(f1) * Math.sin(l1) + B * Math.cos(f2) * Math.sin(l2);
    const z = A * Math.sin(f1) + B * Math.sin(f2);
    return { lat: toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))), lon: toDeg(Math.atan2(y, x)) };
  }

  function bearingBetween(lat1, lon1, lat2, lon2) {
    const toRad = d => d * Math.PI / 180;
    const toDeg = r => r * 180 / Math.PI;
    const dL = toRad(lon2 - lon1);
    const f1 = toRad(lat1), f2 = toRad(lat2);
    const y = Math.sin(dL) * Math.cos(f2);
    const x = Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dL);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  }

  // ─── Data source tracking ───
  let usingLiveData = false;
  let liveDataFailed = false;

  // ─── Fetch from local proxy → OpenSky API ───

  async function fetchFlights() {
    // If live data previously failed, use simulation (don't retry every 2s)
    if (liveDataFailed) return generateSimulatedFlights();

    try {
      const resp = await fetch('/api/flights', { signal: AbortSignal.timeout(12000) });
      if (!resp.ok) throw new Error(`Proxy returned ${resp.status}`);
      const data = await resp.json();

      if (data.error) throw new Error(data.error);
      if (!data.states || data.states.length === 0) throw new Error('No states');

      const parsed = data.states
        .filter(s => s[5] !== null && s[6] !== null)
        .map(s => ({
          icao24: s[0],
          callsign: (s[1] || '').trim(),
          origin_country: s[2],
          time_position: s[3],
          last_contact: s[4],
          longitude: s[5],
          latitude: s[6],
          baro_altitude: s[7],
          on_ground: s[8],
          velocity: s[9],
          heading: s[10],
          vertical_rate: s[11],
          sensors: s[12],
          geo_altitude: s[13],
          squawk: s[14],
          spi: s[15],
          position_source: s[16],
        }));

      if (!usingLiveData) {
        usingLiveData = true;
        console.log(`[LIVE] Connected — tracking ${parsed.length} aircraft`);
      }
      return parsed;
    } catch (err) {
      if (!usingLiveData && !liveDataFailed) {
        console.warn('[LIVE] OpenSky unavailable, using simulation:', err.message);
        liveDataFailed = true;
      }
      return generateSimulatedFlights();
    }
  }

  // Allow retrying live data every 60s
  setInterval(() => { liveDataFailed = false; }, 60000);

  function generateSimulatedFlights() {
    const elapsed = (Date.now() - SIM_START) / 1000; // seconds since page load

    return FLIGHT_ROUTES.map((route, i) => {
      const from = AIRPORTS[route.from];
      const to = AIRPORTS[route.to];
      if (!from || !to) return null;

      const totalDist = haversine(from.lat, from.lon, to.lat, to.lon);
      // Each flight has a different "phase offset" so they're spread across their routes
      const baseProgress = ((i * 0.0618 + 0.1) % 1); // golden-ratio spread
      // Speed factor: ~900 km/h → fraction per second over route distance
      const speedKmPerSec = 0.25; // 900 km/h = 0.25 km/s
      const fracPerSec = speedKmPerSec / totalDist;
      let progress = (baseProgress + elapsed * fracPerSec * 8) % 1; // 8x speed for demo visibility

      // Grounded flights stay at origin
      if (route.status === 'grounded') progress = 0;
      // Delayed flights move at 30% speed
      if (route.status === 'delayed') progress = (baseProgress + elapsed * fracPerSec * 2.5) % 1;

      const pos = interpolateGreatCircle(from.lat, from.lon, to.lat, to.lon, progress);
      const heading = bearingBetween(pos.lat, pos.lon, to.lat, to.lon);

      // Altitude profile: climb → cruise → descend
      let altitude;
      if (route.status === 'grounded') {
        altitude = 0;
      } else if (progress < 0.1) {
        altitude = progress / 0.1 * 11000; // climbing
      } else if (progress > 0.85) {
        altitude = (1 - progress) / 0.15 * 11000; // descending
      } else {
        altitude = 10500 + Math.sin(progress * 3) * 500; // cruise with slight variation
      }

      let vertRate = 0;
      if (progress < 0.1) vertRate = 12;
      else if (progress > 0.85) vertRate = -10;

      const velocity = route.status === 'grounded' ? 0 :
        route.status === 'delayed' ? 80 + Math.random() * 30 :
        220 + Math.random() * 40;

      return {
        icao24: (0xa00000 + i * 0x1234).toString(16),
        callsign: route.cs,
        origin_country: route.country,
        time_position: Math.floor(Date.now() / 1000),
        last_contact: Math.floor(Date.now() / 1000),
        longitude: pos.lon,
        latitude: pos.lat,
        baro_altitude: altitude,
        on_ground: route.status === 'grounded',
        velocity: velocity,
        heading: heading,
        vertical_rate: vertRate,
        sensors: null,
        geo_altitude: altitude,
        squawk: route.squawk || null,
        spi: false,
        position_source: 0,
        // Pass through known route info for accurate details
        _knownFrom: route.from,
        _knownTo: route.to,
        _knownType: route.type,
        _knownStatus: route.status,
        _progress: progress,
      };
    }).filter(Boolean);
  }

  // ─── Process flights into display format ───

  function processFlights(rawFlights) {
    return rawFlights.map(f => {
      // Use known route data if available (simulation), otherwise estimate
      const hasKnown = f._knownFrom && f._knownTo;
      const fromApt = hasKnown ? AIRPORTS[f._knownFrom] : null;
      const toApt = hasKnown ? AIRPORTS[f._knownTo] : null;
      const typeCode = f._knownType || getAircraftType(f.icao24);
      const status = f._knownStatus || getFlightStatus(f);
      const progress = f._progress != null ? f._progress : 0;

      // Build route: use known data for simulation, estimate for live
      let route;
      if (hasKnown) {
        route = {
          origin: fromApt ? { ...fromApt, icao: f._knownFrom } : null,
          dest: toApt ? { ...toApt, icao: f._knownTo } : null,
        };
      } else if (f.on_ground) {
        route = { origin: findNearestAirport(f.latitude, f.longitude), dest: null };
      } else {
        route = estimateRoute(f);
      }

      // Calculate times
      let departureTime = null;
      let arrivalTime = null;
      let totalDuration = null;
      let remaining = null;

      if (route.origin && route.dest && f.velocity > 0) {
        const totalDist = haversine(route.origin.lat, route.origin.lon, route.dest.lat, route.dest.lon);
        const avgSpeedKmh = f.velocity * 3.6; // m/s → km/h
        totalDuration = (totalDist / avgSpeedKmh) * 60; // minutes

        if (hasKnown) {
          remaining = totalDuration * (1 - progress);
        } else {
          const distFromOrigin = haversine(route.origin.lat, route.origin.lon, f.latitude, f.longitude);
          const liveProgress = Math.min(distFromOrigin / totalDist, 1);
          remaining = totalDuration * (1 - liveProgress);
        }

        const now = new Date();
        departureTime = new Date(now.getTime() - (totalDuration - remaining) * 60000);
        arrivalTime = new Date(now.getTime() + remaining * 60000);
      }

      // Compute progress for live data
      let finalProgress = progress;
      if (!hasKnown && route.origin && route.dest && f.velocity > 0) {
        const totalDist = haversine(route.origin.lat, route.origin.lon, route.dest.lat, route.dest.lon);
        const distFromOrigin = haversine(route.origin.lat, route.origin.lon, f.latitude, f.longitude);
        finalProgress = Math.min(distFromOrigin / totalDist, 1);
      }

      return {
        ...f,
        aircraftType: typeCode,
        aircraftDesc: getAircraftDescription(typeCode),
        airlineName: getAirlineName(f.callsign),
        status,
        route,
        departureTime,
        arrivalTime,
        totalDuration,
        remaining,
        progress: finalProgress,
      };
    });
  }

  // ─── Globe Setup ───

  function initGlobe() {
    const container = document.getElementById('globe-container');

    if (typeof Globe === 'undefined') {
      console.error('Globe.gl not loaded');
      document.getElementById('loading').querySelector('.loading-text').textContent = 'Error: Globe library not loaded. Check console.';
      return;
    }

    console.log('Initializing globe...');

    try {
      globe = Globe()
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
        .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
        .showAtmosphere(true)
        .atmosphereColor('#4a90d9')
        .atmosphereAltitude(0.2)
        .pointsData([])
        .pointLat('latitude')
        .pointLng('longitude')
        .pointAltitude(d => d.on_ground ? 0 : Math.min((d.baro_altitude || 0) / 1000000, 0.05))
        .pointRadius(d => {
          if (d === selectedFlight) return 0.6;
          if (d._highlighted) return 0.45;
          return 0.15;
        })
        .pointColor(d => {
          if (d === selectedFlight) return '#ffffff';
          if (d._highlighted) return '#ffcc00';
          if (d.status === 'emergency') return '#ff3333';
          if (d.status === 'delayed') return '#ffc800';
          if (d.status === 'grounded') return '#666666';
          return '#6ab4ff';
        })
        .pointLabel(d => {
          const alt = d.baro_altitude ? Math.round(d.baro_altitude * 3.281).toLocaleString() + ' ft' : 'N/A';
          const spd = d.velocity ? Math.round(d.velocity * 1.944) + ' kts' : 'N/A';
          return '<div style="background:rgba(10,15,30,0.92);border:1px solid rgba(100,180,255,0.3);border-radius:8px;padding:8px 12px;color:#e0e8ff;font-size:12px;font-family:sans-serif;pointer-events:none">'
            + '<strong>' + (d.callsign || d.icao24) + '</strong><br>'
            + d.airlineName + '<br>'
            + d.aircraftDesc + '<br>'
            + 'Alt: ' + alt + '<br>'
            + 'Speed: ' + spd
            + '</div>';
        })
        .onPointClick(handleFlightClick)
        .arcsData([])
        .arcStartLat(d => d.startLat)
        .arcStartLng(d => d.startLng)
        .arcEndLat(d => d.endLat)
        .arcEndLng(d => d.endLng)
        .arcColor(d => d.color)
        .arcAltitude(d => d.alt || 0.15)
        .arcStroke(d => d.stroke || 0.3)
        .arcDashLength(0.5)
        .arcDashGap(0.3)
        .arcDashAnimateTime(2000)
        .width(window.innerWidth)
        .height(window.innerHeight)
        (container);

      console.log('Globe created successfully');

      // Access Three.js scene for custom objects
      const scene = globe.scene();

      // Add stars
      addStars(scene);
      // Add moon
      addMoon(scene);

      // Set initial camera position
      globe.pointOfView({ lat: 30, lng: -20, altitude: 2.5 });

      // Handle resize
      window.addEventListener('resize', () => {
        globe.width(window.innerWidth).height(window.innerHeight);
      });

      // Slow auto-rotation
      globe.controls().autoRotate = true;
      globe.controls().autoRotateSpeed = 0.3;
      globe.controls().enableDamping = true;
      globe.controls().dampingFactor = 0.1;

    } catch (err) {
      console.error('Globe init error:', err);
      document.getElementById('loading').querySelector('.loading-text').textContent = 'Error initializing globe: ' + err.message;
    }
  }

  function addStars(scene) {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 8000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const radius = 800 + Math.random() * 400;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Slight color variation (warm white to cool blue)
      const temp = Math.random();
      colors[i * 3] = 0.8 + temp * 0.2;
      colors[i * 3 + 1] = 0.85 + temp * 0.15;
      colors[i * 3 + 2] = 0.9 + temp * 0.1;

      sizes[i] = 0.5 + Math.random() * 2;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const starMaterial = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
  }

  function addMoon(scene) {
    const moonGeo = new THREE.SphereGeometry(12, 32, 32);
    const moonMat = new THREE.MeshStandardMaterial({
      color: 0xddddcc,
      roughness: 0.9,
      metalness: 0.0,
      emissive: 0x222211,
      emissiveIntensity: 0.3,
    });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(350, 200, -300);

    // Subtle glow
    const glowGeo = new THREE.SphereGeometry(14, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffffee,
      transparent: true,
      opacity: 0.08,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.copy(moon.position);

    scene.add(moon);
    scene.add(glow);

    // Add moonlight
    const moonLight = new THREE.PointLight(0xffffdd, 0.3, 1000);
    moonLight.position.copy(moon.position);
    scene.add(moonLight);
  }

  // ─── Update Globe Data ───

  function updateGlobe() {
    if (!globe) return;

    // Points (flights)
    globe.pointsData(flights);

    // Arcs (flight paths for highlighted/selected)
    const arcs = [];
    const flightsToArc = flights.filter(f => f._highlighted || f === selectedFlight);

    for (const f of flightsToArc) {
      if (f.route.origin && f.route.dest) {
        arcs.push({
          startLat: f.route.origin.lat,
          startLng: f.route.origin.lon,
          endLat: f.route.dest.lat,
          endLng: f.route.dest.lon,
          color: f === selectedFlight
            ? ['rgba(255, 255, 255, 0.9)', 'rgba(100, 180, 255, 0.9)']
            : ['rgba(255, 204, 0, 0.5)', 'rgba(255, 204, 0, 0.2)'],
          alt: 0.2,
          stroke: f === selectedFlight ? 1.2 : 0.6,
          flight: f,
        });
      } else if (f.route.origin) {
        // Show arc from origin to current position
        arcs.push({
          startLat: f.route.origin.lat,
          startLng: f.route.origin.lon,
          endLat: f.latitude,
          endLng: f.longitude,
          color: f === selectedFlight
            ? ['rgba(255, 255, 255, 0.6)', 'rgba(100, 180, 255, 0.6)']
            : ['rgba(255, 204, 0, 0.3)', 'rgba(255, 204, 0, 0.1)'],
          alt: 0.12,
          stroke: f === selectedFlight ? 0.8 : 0.4,
          flight: f,
        });
      }
    }

    globe.arcsData(arcs);
  }

  // ─── Search ───

  function setupSearch() {
    const input = document.getElementById('search-input');
    const results = document.getElementById('search-results');
    const clearBtn = document.getElementById('search-clear');

    input.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      const query = input.value.trim();
      clearBtn.style.display = query ? 'block' : 'none';

      if (!query) {
        results.style.display = 'none';
        clearHighlights();
        return;
      }

      searchTimeout = setTimeout(() => performSearch(query), 150);
    });

    clearBtn.addEventListener('click', () => {
      input.value = '';
      clearBtn.style.display = 'none';
      results.style.display = 'none';
      clearHighlights();
    });

    // Close results on click outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#search-panel')) {
        results.style.display = 'none';
      }
    });

    input.addEventListener('focus', () => {
      if (input.value.trim()) performSearch(input.value.trim());
    });
  }

  // Persistent search query so highlights survive refresh cycles
  let activeSearchQuery = '';

  function performSearch(query) {
    const q = query.toLowerCase();
    activeSearchQuery = q;
    const results = document.getElementById('search-results');

    console.log('Searching for:', q, '| flights available:', flights.length);

    filteredFlights = flights.filter(f => {
      const callsign = (f.callsign || '').toLowerCase();
      const airline = (f.airlineName || '').toLowerCase();
      const aircraft = (f.aircraftDesc || '').toLowerCase();
      const country = (f.origin_country || '').toLowerCase();
      const icao = (f.icao24 || '').toLowerCase();

      return callsign.includes(q) ||
        airline.includes(q) ||
        aircraft.includes(q) ||
        country.includes(q) ||
        icao.includes(q);
    });

    console.log('Found', filteredFlights.length, 'matches');

    // Highlight matched flights on globe
    flights.forEach(f => f._highlighted = false);
    filteredFlights.forEach(f => f._highlighted = true);
    updateGlobe();

    // Render search results
    if (filteredFlights.length === 0) {
      results.innerHTML = '<div class="search-result-item"><span class="result-detail" style="color: rgba(160,190,230,0.5)">No flights found</span></div>';
    } else {
      const shown = filteredFlights.slice(0, 50);
      results.innerHTML = shown.map(f => {
        const statusClass = `status-${f.status}`;
        const statusLabel = f.status.replace('-', ' ').toUpperCase();
        const alt = f.baro_altitude ? `${Math.round(f.baro_altitude * 3.281).toLocaleString()} ft` : 'Ground';
        return `
          <div class="search-result-item" data-icao="${f.icao24}">
            <div class="result-left">
              <span class="result-callsign">${f.callsign || f.icao24}</span>
              <span class="result-detail">${f.airlineName} · ${f.aircraftDesc}</span>
            </div>
            <div class="result-right">
              <span class="result-status ${statusClass}">${statusLabel}</span>
              <span class="result-alt">${alt}</span>
            </div>
          </div>
        `;
      }).join('');

      if (filteredFlights.length > 50) {
        results.innerHTML += `<div class="search-result-item"><span class="result-detail" style="color:rgba(160,190,230,0.4)">...and ${filteredFlights.length - 50} more</span></div>`;
      }
    }

    results.style.display = 'block';

    // Click handlers on results
    results.querySelectorAll('[data-icao]').forEach(el => {
      el.addEventListener('click', () => {
        const icao = el.dataset.icao;
        const flight = flights.find(f => f.icao24 === icao);
        if (flight) {
          handleFlightClick(flight);
          results.style.display = 'none';
        }
      });
    });
  }

  function clearHighlights() {
    activeSearchQuery = '';
    flights.forEach(f => f._highlighted = false);
    filteredFlights = [];
    updateGlobe();
  }

  // ─── Flight Detail Panel ───

  function handleFlightClick(flight) {
    selectedFlight = flight;

    // Fly to the flight
    globe.pointOfView({
      lat: flight.latitude,
      lng: flight.longitude,
      altitude: 1.5,
    }, 1200);

    // Stop auto-rotate
    globe.controls().autoRotate = false;

    showDetailPanel(flight);
    updateGlobe();
  }

  function showDetailPanel(f) {
    const panel = document.getElementById('detail-panel');
    panel.classList.remove('hidden');

    // Header
    document.getElementById('detail-airline').textContent = f.airlineName;
    document.getElementById('detail-flight-number').textContent = f.callsign || f.icao24;

    const statusEl = document.getElementById('detail-status');
    const statusLabel = f.status.replace('-', ' ').toUpperCase();
    statusEl.textContent = statusLabel;
    statusEl.className = `status-${f.status}`;

    // Route
    if (f.route.origin) {
      document.getElementById('detail-origin-code').textContent = f.route.origin.code;
      document.getElementById('detail-origin-city').textContent = f.route.origin.city;
    } else {
      document.getElementById('detail-origin-code').textContent = '---';
      document.getElementById('detail-origin-city').textContent = '';
    }

    if (f.route.dest) {
      document.getElementById('detail-dest-code').textContent = f.route.dest.code;
      document.getElementById('detail-dest-city').textContent = f.route.dest.city;
    } else {
      document.getElementById('detail-dest-code').textContent = '---';
      document.getElementById('detail-dest-city').textContent = '';
    }

    document.getElementById('detail-departure-time').textContent = f.departureTime ? formatTime(f.departureTime) : '--:--';
    document.getElementById('detail-arrival-time').textContent = f.arrivalTime ? formatTime(f.arrivalTime) : '--:--';

    document.getElementById('detail-aircraft').textContent = '✈ ' + f.aircraftDesc;
    document.getElementById('detail-progress').style.width = (f.progress * 100) + '%';
    document.getElementById('detail-duration').textContent = f.totalDuration ? `Total: ${formatDuration(f.totalDuration)}` : '';

    // Info
    document.getElementById('detail-aircraft-type').textContent = f.aircraftDesc + (f.aircraftType ? ` (${f.aircraftType})` : '');
    document.getElementById('detail-registration').textContent = f.icao24.toUpperCase();
    document.getElementById('detail-altitude').textContent = f.baro_altitude
      ? `${Math.round(f.baro_altitude * 3.281).toLocaleString()} ft (${Math.round(f.baro_altitude).toLocaleString()} m)`
      : 'Ground level';
    document.getElementById('detail-speed').textContent = f.velocity
      ? `${Math.round(f.velocity * 1.944)} kts (${Math.round(f.velocity * 3.6)} km/h)`
      : '—';
    document.getElementById('detail-heading').textContent = f.heading !== null ? `${Math.round(f.heading)}° ${getCardinalDirection(f.heading)}` : '—';
    document.getElementById('detail-vertical-rate').textContent = f.vertical_rate !== null
      ? `${f.vertical_rate > 0 ? '↑' : f.vertical_rate < 0 ? '↓' : '→'} ${Math.round(Math.abs(f.vertical_rate * 196.85))} ft/min`
      : '—';
    document.getElementById('detail-country').textContent = f.origin_country || '—';
    document.getElementById('detail-squawk').textContent = f.squawk || '—';
    document.getElementById('detail-position').textContent = `${f.latitude.toFixed(4)}°, ${f.longitude.toFixed(4)}°`;
    document.getElementById('detail-sched-duration').textContent = f.totalDuration ? formatDuration(f.totalDuration) : '—';
    document.getElementById('detail-time-remaining').textContent = f.remaining ? formatDuration(f.remaining) : '—';
    document.getElementById('detail-on-ground').textContent = f.on_ground ? 'Yes' : 'No';

    // Squawk alert
    const squawkAlert = document.getElementById('squawk-alert');
    if (f.squawk && SQUAWK_ALERTS[f.squawk]) {
      squawkAlert.style.display = 'block';
      document.getElementById('squawk-message').textContent = SQUAWK_ALERTS[f.squawk];
    } else {
      squawkAlert.style.display = 'none';
    }

    // Simulated ATC comms
    generateCommFeed(f);
  }

  function getCardinalDirection(deg) {
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return dirs[Math.round(deg / 22.5) % 16];
  }

  function generateCommFeed(flight) {
    const container = document.getElementById('comm-entries');
    const callsign = flight.callsign || flight.icao24;
    const nearest = findNearestAirport(flight.latitude, flight.longitude);
    const towerName = nearest ? `${nearest.code} Tower` : 'Center';
    const alt = flight.baro_altitude ? Math.round(flight.baro_altitude * 3.281 / 100) : 350;

    // Simulated realistic-ish ATC exchanges
    const now = new Date();
    const entries = [];

    if (flight.on_ground) {
      entries.push(
        { time: formatCommTime(now, -3), from: 'tower', text: `${callsign}, ${towerName}, taxi to runway via Alpha, hold short.` },
        { time: formatCommTime(now, -2), from: 'pilot', text: `Taxi Alpha, hold short, ${callsign}.` },
        { time: formatCommTime(now, -1), from: 'tower', text: `${callsign}, cleared for departure runway ${Math.floor(Math.random() * 36 + 1)}. Wind ${Math.floor(Math.random() * 360)}° at ${Math.floor(Math.random() * 20 + 5)} knots.` },
      );
    } else if (flight.vertical_rate > 3) {
      entries.push(
        { time: formatCommTime(now, -4), from: 'tower', text: `${callsign}, contact departure on 124.3, good day.` },
        { time: formatCommTime(now, -3), from: 'pilot', text: `124.3, ${callsign}, good day.` },
        { time: formatCommTime(now, -2), from: 'tower', text: `${callsign}, departure, radar contact. Climb and maintain flight level ${alt}.` },
        { time: formatCommTime(now, -1), from: 'pilot', text: `Climbing to flight level ${alt}, ${callsign}.` },
      );
    } else if (flight.vertical_rate < -3) {
      entries.push(
        { time: formatCommTime(now, -4), from: 'tower', text: `${callsign}, descend and maintain flight level ${Math.max(alt - 100, 100)}.` },
        { time: formatCommTime(now, -3), from: 'pilot', text: `Descending to flight level ${Math.max(alt - 100, 100)}, ${callsign}.` },
        { time: formatCommTime(now, -2), from: 'tower', text: `${callsign}, expect ILS runway ${Math.floor(Math.random() * 36 + 1)} approach.` },
        { time: formatCommTime(now, -1), from: 'pilot', text: `Roger, expecting ILS approach, ${callsign}.` },
      );
    } else {
      entries.push(
        { time: formatCommTime(now, -5), from: 'tower', text: `${callsign}, ${nearest ? nearest.code : ''} Center, radar contact. Maintain flight level ${alt}.` },
        { time: formatCommTime(now, -4), from: 'pilot', text: `Maintaining flight level ${alt}, ${callsign}.` },
        { time: formatCommTime(now, -2), from: 'tower', text: `${callsign}, traffic 2 o'clock, ${Math.floor(Math.random() * 10 + 5)} miles, opposite direction, flight level ${alt + (Math.random() > 0.5 ? 10 : -10)}.` },
        { time: formatCommTime(now, -1), from: 'pilot', text: `Looking for traffic, ${callsign}.` },
      );
    }

    if (flight.squawk === '7700') {
      entries.push(
        { time: formatCommTime(now, 0), from: 'pilot', text: `MAYDAY MAYDAY MAYDAY, ${callsign}, declaring emergency. Squawking 7700.` },
        { time: formatCommTime(now, 0), from: 'tower', text: `${callsign}, roger your mayday. All aircraft standby. ${callsign}, state nature of emergency and souls on board.` },
      );
    }

    container.innerHTML = entries.map(e => `
      <div class="comm-entry">
        <span class="comm-time">${e.time}</span>
        <span class="comm-${e.from}">${e.text}</span>
      </div>
    `).join('');
  }

  function formatCommTime(date, offsetMin) {
    const d = new Date(date.getTime() + offsetMin * 60000);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'UTC' });
  }

  // ─── Clock ───

  function updateClock() {
    const now = new Date();
    document.getElementById('clock-utc').textContent = now.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'UTC'
    }) + ' UTC';
    document.getElementById('clock-local').textContent = now.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    }) + ' Local';
  }

  // ─── Stats ───

  function updateStats() {
    document.getElementById('stat-total').textContent = flights.length.toLocaleString();
    document.getElementById('stat-tracking').textContent = flights.filter(f => !f.on_ground).length.toLocaleString();
    document.getElementById('stat-ontime').textContent = flights.filter(f => f.status === 'en-route').length.toLocaleString();
    document.getElementById('stat-delayed').textContent = flights.filter(f => f.status === 'delayed').length.toLocaleString();
    document.getElementById('stat-incidents').textContent = flights.filter(f => f.status === 'emergency').length.toLocaleString();
  }

  // ─── Close Panel ───

  function setupPanel() {
    document.getElementById('detail-close').addEventListener('click', () => {
      document.getElementById('detail-panel').classList.add('hidden');
      selectedFlight = null;
      globe.controls().autoRotate = true;
      updateGlobe();
    });
  }

  // ─── Initialize ───

  async function init() {
    console.log('init() starting...');
    try {
      initGlobe();
      console.log('Globe initialized, globe object:', !!globe);
    } catch (e) {
      console.error('initGlobe failed:', e);
    }

    setupSearch();
    setupPanel();

    // Clock
    updateClock();
    setInterval(updateClock, 1000);

    // Load initial data
    const raw = await fetchFlights();
    console.log('Fetched', raw.length, 'flights');
    flights = processFlights(raw);
    console.log('Processed', flights.length, 'flights');
    updateGlobe();
    updateStats();

    // Hide loading regardless
    const loading = document.getElementById('loading');
    loading.classList.add('fade-out');
    setTimeout(() => loading.style.display = 'none', 800);

    // Refresh: 10s for live data, 2s for simulation
    updateInterval = setInterval(async () => {
      const raw = await fetchFlights();
      const newFlights = processFlights(raw);

      const selectedIcao = selectedFlight ? selectedFlight.icao24 : null;

      flights = newFlights;

      // Re-apply search highlights if there's an active query
      if (activeSearchQuery) {
        const q = activeSearchQuery;
        flights.forEach(f => {
          const callsign = (f.callsign || '').toLowerCase();
          const airline = (f.airlineName || '').toLowerCase();
          const aircraft = (f.aircraftDesc || '').toLowerCase();
          const country = (f.origin_country || '').toLowerCase();
          const icao = (f.icao24 || '').toLowerCase();
          f._highlighted = callsign.includes(q) || airline.includes(q) || aircraft.includes(q) || country.includes(q) || icao.includes(q);
        });
      }

      if (selectedIcao) {
        const sel = flights.find(f => f.icao24 === selectedIcao);
        if (sel) {
          selectedFlight = sel;
          showDetailPanel(sel);
        }
      }

      updateGlobe();
      updateStats();
    }, usingLiveData ? 10000 : 2000);
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
