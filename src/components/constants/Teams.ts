// Define the Team interface
export interface Team {
  name: string;
  id: number;
  logoURL: string;
  className: string;
}

// Define the map-like structure for teams
export const TeamsById: { [key: number]: Team } = {
  // AL East
  141: { name: 'Blue Jays', id: 141, logoURL: 'https://www.mlbstatic.com/team-logos/team-cap-on-dark/141.svg', className: 'bluejays' },
  110: { name: 'Orioles', id: 110, logoURL: 'https://images.ctfassets.net/iiozhi00a8lc/t110_header_primary110_svg/f5b66eef0580ea5f0bc0ad5285f8d0fa/t110_header_primary.svg', className: 'orioles' },
  139: { name: 'Rays', id: 139, logoURL: 'https://www.mlbstatic.com/team-logos/team-cap-on-dark/139.svg', className: 'rays' },
  111: { name: 'Red Sox', id: 111, logoURL: 'https://images.ctfassets.net/iiozhi00a8lc/t111_header_primarybos_primart_header_logo_svg/2b1d10de1b49920faed03084da22b2b7/t111_header_primary.svg', className: 'redsox' },
  147: { name: 'Yankees', id: 147, logoURL: 'https://www.mlbstatic.com/team-logos/team-cap-on-dark/147.svg', className: 'yankees' },

  // AL Central
  114: { name: 'Guardians', id: 114, logoURL: 'https://images.ctfassets.net/iiozhi00a8lc/2tLb91Y8LBZIemHAqP2IWN/e6468955f23715256557e75c01f9f61a/ClevelandMonogram.svg', className: 'guardians' },
  118: { name: 'Royals', id: 118, logoURL: 'https://www.mlbstatic.com/team-logos/team-cap-on-dark/118.svg', className: 'royals' },
  116: { name: 'Tigers', id: 116, logoURL: 'https://www.mlbstatic.com/team-logos/team-cap-on-dark/116.svg', className: 'tigers' },
  142: { name: 'Twins', id: 142, logoURL: 'https://images.ctfassets.net/iiozhi00a8lc/t142_header_primaryMN_TC_19_blue_svg/c0f95eb9469a7d98b24498395d4f4dc9/MIN23_Dark_Active.svg', className: 'twins' },
  145: { name: 'White Sox', id: 145, logoURL: 'https://www.mlbstatic.com/team-logos/team-cap-on-dark/145.svg', className: 'whitesox' },

  // AL West
  108: { name: 'Angels', id: 108, logoURL: 'https://www.mlbstatic.com/team-logos/team-cap-on-dark/108.svg', className: 'angels' },
  117: { name: 'Astros', id: 117, logoURL: 'https://www.mlbstatic.com/team-logos/team-cap-on-dark/117.svg', className: 'astros' },
  133: { name: 'Athletics', id: 133, logoURL: 'https://images.ctfassets.net/iiozhi00a8lc/6pTfb3rol9EuujxQMapyVn/e58bc760571f353a06ae8fb8ccb31c40/133_gold.svg', className: 'athletics' },
  136: { name: 'Mariners', id: 136, logoURL: 'https://www.mlbstatic.com/team-logos/team-cap-on-dark/136.svg', className: 'mariners' },
  140: { name: 'Rangers', id: 140, logoURL: 'https://images.ctfassets.net/iiozhi00a8lc/6HSwMP9twv0hrrHVF4Nyo0/0f0063a3fb5f029ac4dadd420b1f1142/140.svg', className: 'rangers' },

  // NL East
  144: { name: 'Braves', id: 144, logoURL: 'https://images.ctfassets.net/iiozhi00a8lc/t144_header_primaryATL_LOGO_092019_svg/7c2f3d4d1f352fc7162dd9c765693d4d/t144_header_primary.svg', className: 'braves' },
  146: { name: 'Marlins', id: 146, logoURL: 'https://www.mlbstatic.com/team-logos/team-cap-on-dark/146.svg', className: 'marlins' },
  121: { name: 'Mets', id: 121, logoURL: 'https://www.mlbstatic.com/team-logos/team-cap-on-dark/121.svg', className: 'mets' },
  120: { name: 'Nationals', id: 120, logoURL: 'https://www.mlbstatic.com/team-logos/team-cap-on-dark/120.svg', className: 'nationals' },
  143: { name: 'Phillies', id: 143, logoURL: 'https://www.mlbstatic.com/team-logos/team-cap-on-dark/143.svg', className: 'phillies' },
  
  // NL Central
  158: { name: 'Brewers', id: 158, logoURL: 'https://images.ctfassets.net/iiozhi00a8lc/t158_header_primarycap_on_dark_svg/6091a9cdc75a6738fc4a261d9ec33454/t158_header_primary.svg', className: 'brewers' },
  138: { name: 'Cardinals', id: 138, logoURL: 'https://www.mlbstatic.com/team-logos/team-cap-on-dark/138.svg', className: 'cardinals' },
  112: { name: 'Cubs', id: 112, logoURL: 'https://www.mlbstatic.com/team-logos/team-cap-on-dark/112.svg', className: 'cubs' },
  134: { name: 'Pirates', id: 134, logoURL: 'https://www.mlbstatic.com/team-logos/team-cap-on-dark/134.svg', className: 'pirates' },
  113: { name: 'Reds', id: 113, logoURL: 'https://www.mlbstatic.com/team-logos/team-cap-on-dark/113.svg', className: 'reds' },
  
  // NL West
  109: { name: 'Diamondbacks', id: 109, logoURL: 'https://images.ctfassets.net/iiozhi00a8lc/t109_header_primaryARI_Logo_svg/7d183e9bf0770161cb912d8147cb8e37/A-Logo_Teal_2023.svg', className: 'diamondbacks' },
  119: { name: 'Dodgers', id: 119, logoURL: 'https://www.mlbstatic.com/team-logos/team-cap-on-dark/119.svg', className: 'dodgers' },
  137: { name: 'Giants', id: 137, logoURL: 'https://images.ctfassets.net/iiozhi00a8lc/6iFthXVHvcIkl6M3MXsYrz/d37031845422b150a40ada06d5d0d197/t137-primary-logo2021.svg', className: 'giants' },
  135: { name: 'Padres', id: 135, logoURL: 'https://www.mlbstatic.com/team-logos/team-cap-on-dark/135.svg', className: 'padres' },
  115: { name: 'Rockies', id: 115, logoURL: 'https://www.mlbstatic.com/team-logos/team-cap-on-dark/115.svg', className: 'rockies' },
};

// Export an array of team IDs
export const teamIds: number[] = Object.keys(TeamsById).map(Number);