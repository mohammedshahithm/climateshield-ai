export type Severity = "Critical" | "High" | "Moderate" | "Low";
export type AlertCategory = "Flood Risk" | "Heatwave" | "Air Quality" | "Infrastructure Failure" | "Cyclone Warning" | "Heavy Rainfall";
export type AlertStatus = "Active" | "Resolved";

export interface ClimateAlert {
  id: string;
  title: string;
  category: AlertCategory;
  severity: Severity;
  area: string;
  timestamp: string;
  status: AlertStatus;
  description: string;
  recommendedActions: string[];
  emergencyContacts: { name: string; number: string }[];
}

export const mockAlerts: ClimateAlert[] = [
  {
    id: "a1",
    title: "Extreme Heat Warning",
    category: "Heatwave",
    severity: "High",
    area: "T Nagar",
    timestamp: "2 Hours Ago",
    status: "Active",
    description: "Temperatures are expected to exceed 42°C today. Vulnerable individuals, especially children and the elderly, are at high risk of heatstroke.",
    recommendedActions: [
      "Stay indoors during peak heat hours (12 PM - 4 PM).",
      "Stay hydrated and avoid strenuous outdoor activities.",
      "Check on elderly neighbors."
    ],
    emergencyContacts: [
      { name: "Disaster Helpline", number: "1070" },
      { name: "Medical Emergency", number: "108" }
    ]
  },
  {
    id: "a2",
    title: "Flash Flood Watch",
    category: "Flood Risk",
    severity: "Critical",
    area: "Velachery",
    timestamp: "1 Hour Ago",
    status: "Active",
    description: "Rapid water accumulation observed in low-lying areas following sudden intense downpour. Street flooding is imminent.",
    recommendedActions: [
      "Move essential items and electronics to higher floors.",
      "Avoid driving through flooded roads.",
      "Locate the nearest designated concrete shelter."
    ],
    emergencyContacts: [
      { name: "Rescue Services", number: "112" },
      { name: "Local Corporation Zone", number: "044-2220-0335" }
    ]
  },
  {
    id: "a3",
    title: "Poor Air Quality Alert",
    category: "Air Quality",
    severity: "Moderate",
    area: "Anna Nagar",
    timestamp: "5 Hours Ago",
    status: "Active",
    description: "AQI has reached 210 (Poor). Increased particulate matter due to atmospheric inversion and local emissions.",
    recommendedActions: [
      "Limit prolonged outdoor exertion.",
      "Keep windows closed during morning hours.",
      "Use N95 masks if sensitive to respiratory issues."
    ],
    emergencyContacts: [
      { name: "Health Helpline", number: "104" }
    ]
  },
  {
    id: "a4",
    title: "Cyclone Preparedness Notice",
    category: "Cyclone Warning",
    severity: "High",
    area: "Chennai Coast",
    timestamp: "Yesterday",
    status: "Active",
    description: "A depression over the Bay of Bengal is intensifying. Expected landfall within 48 hours. Wind speeds may reach up to 90 km/h.",
    recommendedActions: [
      "Secure loose outdoor objects and trim tree branches.",
      "Stockpile 3 days of non-perishable food and water.",
      "Ensure flashlights and radios have fresh batteries."
    ],
    emergencyContacts: [
      { name: "Coastal Police", number: "1093" },
      { name: "Disaster Helpline", number: "1070" }
    ]
  },
  {
    id: "a5",
    title: "Infrastructure Outage",
    category: "Infrastructure Failure",
    severity: "High",
    area: "Tambaram",
    timestamp: "3 Hours Ago",
    status: "Active",
    description: "Main grid substation failure has caused widespread power outages affecting water pumping stations in the zone.",
    recommendedActions: [
      "Conserve stored water.",
      "Unplug sensitive electronics to prevent power surge damage.",
      "Keep refrigerators closed to maintain cold temperature."
    ],
    emergencyContacts: [
      { name: "Electricity Board (TNEB)", number: "1912" }
    ]
  },
  {
    id: "a6",
    title: "Heavy Rainfall Warning",
    category: "Heavy Rainfall",
    severity: "Moderate",
    area: "Adyar",
    timestamp: "10 Mins Ago",
    status: "Active",
    description: "Intense localized rainfall expected over the next 4 hours. Potential for waterlogging on arterial roads.",
    recommendedActions: [
      "Plan alternative travel routes.",
      "Clear balcony drains to prevent water ingress.",
      "Keep umbrellas and rain gear accessible."
    ],
    emergencyContacts: [
      { name: "Traffic Police", number: "103" }
    ]
  },
  {
    id: "a7",
    title: "Localized Flooding Resolved",
    category: "Flood Risk",
    severity: "Moderate",
    area: "OMR (Sholinganallur)",
    timestamp: "2 Days Ago",
    status: "Resolved",
    description: "Water levels have receded following the clearing of the Buckingham Canal blockages. Traffic restored.",
    recommendedActions: [
      "Boil drinking water as a precaution.",
      "Disinfect flooded ground floor areas."
    ],
    emergencyContacts: [
      { name: "Public Health Dept", number: "044-2538-4520" }
    ]
  },
  {
    id: "a8",
    title: "Extreme Heat Warning",
    category: "Heatwave",
    severity: "Critical",
    area: "Guindy",
    timestamp: "4 Hours Ago",
    status: "Active",
    description: "Severe heatwave conditions persisting. IMD has issued a Red Alert for the industrial estate area due to urban heat island effect.",
    recommendedActions: [
      "Halt outdoor construction work between 11 AM and 3 PM.",
      "Employers must provide adequate hydration stations.",
      "Seek immediate medical help if experiencing dizziness."
    ],
    emergencyContacts: [
      { name: "Ambulance", number: "108" }
    ]
  },
  {
    id: "a9",
    title: "Water Contamination Risk",
    category: "Infrastructure Failure",
    severity: "Moderate",
    area: "Mylapore",
    timestamp: "Yesterday",
    status: "Active",
    description: "Pipeline breach detected near sewage line intersection. Potential mixing of water supply.",
    recommendedActions: [
      "Do not consume tap water directly.",
      "Boil water for at least 10 minutes before use.",
      "Use bottled water for drinking and cooking."
    ],
    emergencyContacts: [
      { name: "Metro Water Helpline", number: "044-4567-4567" }
    ]
  },
  {
    id: "a10",
    title: "Air Quality Improvement",
    category: "Air Quality",
    severity: "Low",
    area: "All Zones",
    timestamp: "3 Days Ago",
    status: "Resolved",
    description: "Favorable sea breeze has cleared particulate matter. AQI is now Good (45).",
    recommendedActions: [
      "Safe to resume all outdoor activities.",
      "Open windows to ventilate homes."
    ],
    emergencyContacts: []
  }
];
