export interface SpriteArt {
  svg: string;
  width: number;
  height: number;
}

// Each SVG is self-contained so it can be rasterized independently by Pixi.
function art(width: number, height: number, body: string): SpriteArt {
  return {
    width,
    height,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="mint" x2=".8" y2="1"><stop stop-color="#a3e2bb"/><stop offset="1" stop-color="#32958a"/></linearGradient>
        <linearGradient id="teal" x2=".8" y2="1"><stop stop-color="#70d6c6"/><stop offset="1" stop-color="#258a83"/></linearGradient>
        <linearGradient id="coral" x2=".7" y2="1"><stop stop-color="#ffac8e"/><stop offset="1" stop-color="#db655f"/></linearGradient>
        <linearGradient id="gold" x2=".7" y2="1"><stop stop-color="#ffe39a"/><stop offset="1" stop-color="#e4aa46"/></linearGradient>
        <linearGradient id="clay" x2="1" y2=".6"><stop stop-color="#edab7d"/><stop offset=".55" stop-color="#cf7b59"/><stop offset="1" stop-color="#a65d49"/></linearGradient>
        <linearGradient id="leaf" x2=".7" y2="1"><stop stop-color="#b4d982"/><stop offset="1" stop-color="#4e9568"/></linearGradient>
        <linearGradient id="fur" x2=".7" y2="1"><stop stop-color="#fff0ce"/><stop offset="1" stop-color="#dbc69e"/></linearGradient>
        <linearGradient id="glass" x2=".8" y2="1"><stop stop-color="#e0faf0"/><stop offset="1" stop-color="#80c9d4"/></linearGradient>
        <radialGradient id="shadow"><stop stop-color="#304e42" stop-opacity=".2"/><stop offset="1" stop-color="#304e42" stop-opacity="0"/></radialGradient>
      </defs>
      <g stroke="#38544a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</g>
    </svg>`,
  };
}

function shadow(w: number, h: number): string {
  return `<ellipse cx="${w / 2}" cy="${h - 3}" rx="${w * .46}" ry="3" fill="url(#shadow)" stroke="none"/>`;
}

function eyes(x: number, y: number, gap = 12): string {
  return `<g fill="#304b42" stroke="none"><ellipse cx="${x}" cy="${y}" rx="2" ry="2.8"/><ellipse cx="${x + gap}" cy="${y}" rx="2" ry="2.8"/><g fill="#fff9e9"><circle cx="${x - .5}" cy="${y - 1}" r=".7"/><circle cx="${x + gap - .5}" cy="${y - 1}" r=".7"/></g></g>`;
}

const pot = `<path d="M13 56L18 75Q32 82 46 75L51 56" fill="url(#clay)"/><path d="M19 61L22 72" stroke="#ffc39b" stroke-width="3"/><path d="M13 53Q32 48 51 53L51 59Q32 66 13 59Z" fill="#df916b"/><ellipse cx="32" cy="53" rx="19" ry="5" fill="#694d3e"/><path d="M21 53L24 54M38 52L42 53" stroke="#b38a65"/>`;

function plant(stage = 'sprout'): SpriteArt {
  const growth: Record<string, string> = {
    seed: `<path d="M26 52Q22 43 33 40Q42 45 36 52Z" fill="url(#gold)"/><path d="M29 49L34 43" stroke="#a67843"/>`,
    sprout: `<path d="M32 53Q34 43 31 34" fill="none" stroke="#51875d" stroke-width="3"/><path d="M32 41Q15 42 17 28Q30 27 32 41Z" fill="url(#leaf)"/><path d="M32 35Q32 21 47 24Q46 36 32 35Z" fill="url(#mint)"/><path d="M22 32L30 38M36 31L43 27" stroke="#eef1b1" stroke-width="1"/>`,
    young: `<path d="M32 54Q29 38 33 19" fill="none" stroke="#52865c" stroke-width="3"/><path d="M31 45Q14 46 12 32Q29 30 31 45ZM32 34Q35 20 51 23Q48 37 32 34ZM33 23Q20 23 22 11Q34 11 33 23Z" fill="url(#leaf)"/><path d="M18 35L28 42M36 30L46 26" stroke="#dbedb1" stroke-width="1.2"/>`,
    mature: `<path d="M32 54Q28 33 34 10" fill="none" stroke="#51875d" stroke-width="3"/><path d="M31 47Q12 49 7 34Q25 29 31 47ZM31 38Q36 20 57 24Q53 41 31 38ZM32 28Q14 27 13 11Q30 10 32 28ZM34 20Q34 5 48 3Q53 16 34 20Z" fill="url(#leaf)"/><path d="M14 37L28 44M36 34L50 27M19 16L29 25" stroke="#e0edb6" stroke-width="1.2"/>`,
    flower: `<path d="M32 54Q29 33 32 19" fill="none" stroke="#51875d" stroke-width="3"/><path d="M31 47Q13 47 9 32Q28 31 31 47ZM32 39Q38 22 56 28Q50 42 32 39Z" fill="url(#leaf)"/><path d="M31 9C22 -1 14 8 20 17C8 20 15 31 26 26C30 38 41 34 40 24C54 24 55 12 43 12C46 1 35 -1 31 9Z" fill="url(#coral)"/><circle cx="32" cy="18" r="7" fill="url(#gold)"/><path d="M29 16L30 16M35 19L35 19M31 22L31 22" stroke="#a67639" stroke-width="2"/>`,
  };
  return art(64, 80, shadow(64, 80) + pot + (growth[stage] ?? growth.sprout));
}

export const supportedTemplates = [
  'child_character', 'seed', 'watering_can', 'flower_pot', 'plant.basic',
  'backpack', 'storybook', 'window', 'tree', 'flower', 'rabbit', 'squirrel',
  'sparrow', 'dog', 'cat', 'butterfly', 'bee', 'ant', 'football', 'basketball',
  'ice_experiment', 'traffic_sign', 'mushroom', 'pond', 'stream',
] as const;

export function spriteArt(templateId: string, stage?: string): SpriteArt {
  switch (templateId) {
    case 'child_character':
    case 'character':
      return art(66, 100, shadow(66, 100) + `
        <path d="M44 50Q60 45 62 58L61 77Q54 84 46 77Z" fill="url(#gold)"/>
        <path d="M55 56L56 72" stroke="#fff0b7" stroke-width="3"/>
        <path d="M20 81L19 94L30 94L32 80M36 80L37 94L48 94L46 79" fill="#74bba9"/>
        <path d="M18 91Q11 95 15 98L30 98L30 91Z M37 91L38 98L53 98Q55 93 46 91Z" fill="#765e4c"/>
        <path d="M16 96L28 96M40 96L51 96" stroke="#f9ddb0" stroke-width="2"/>
        <path d="M18 51Q11 54 9 72Q8 78 13 79Q18 80 19 74L24 60M46 51Q53 54 56 68Q60 73 56 77Q51 81 48 74L42 60" fill="#f5c29f"/>
        <path d="M18 50Q32 44 47 51L51 64L42 68L22 67L14 61Z" fill="#fff2c8"/>
        <path d="M23 50L23 62L41 62L41 50L46 52L46 80Q34 88 19 80L20 52Z" fill="url(#mint)"/>
        <path d="M25 66L39 66L39 76Q32 81 25 76Z" fill="#63b6a0"/>
        <path d="M28 69L36 69" stroke="#c6eed2"/>
        <circle cx="24" cy="61" r="2" fill="#ffe1a0"/><circle cx="41" cy="61" r="2" fill="#ffe1a0"/>
        <path d="M19 50Q19 59 21 65M45 50L44 62" stroke="#d5a344" stroke-width="3"/>
        <path d="M15 25Q13 8 33 9Q52 7 53 28L50 42L17 41Z" fill="#634a3c"/>
        <ellipse cx="14" cy="35" rx="5" ry="6" fill="#f2ba98"/><ellipse cx="52" cy="35" rx="5" ry="6" fill="#f2ba98"/>
        <path d="M17 25Q30 19 49 25L50 37Q47 53 33 53Q18 52 16 38Z" fill="#f8cba6"/>
        <path d="M16 28Q16 14 35 16L48 22L49 30Q40 29 36 22Q30 31 21 29L20 35Z" fill="#634a3c"/>
        <ellipse cx="23" cy="42" rx="5" ry="3" fill="#e99583" stroke="none"/><ellipse cx="44" cy="42" rx="5" ry="3" fill="#e99583" stroke="none"/>
        ${eyes(25, 36, 16)}<path d="M30 45Q34 48 38 44M33 38L32 41L35 41" fill="none" stroke-width="1.3"/>
        <path d="M13 23Q14 4 31 3Q48 1 53 19L49 24Z" fill="url(#coral)"/>
        <path d="M16 21Q34 15 54 20Q64 22 59 26Q49 29 37 24L15 26Z" fill="#ed8a73"/>
        <path d="M21 13Q26 7 33 7" stroke="#ffd4b3" stroke-width="3" fill="none"/>
        <path d="M37 7Q42 11 43 16" stroke="#c56b60" fill="none"/>
        <path d="M26 15L29 10L32 15Z" fill="#fff0bc" stroke="none"/>
      `);
    case 'seed':
      return art(44, 52, shadow(44, 52) + `
        <path d="M7 3L35 3L40 47Q23 53 4 47Z" fill="#f6dfa1"/>
        <path d="M7 3L10 10L33 10L35 3M8 44L36 44" fill="#edd087"/>
        <path d="M10 15L33 15L34 39L9 39Z" fill="#fff7db" stroke="#c4b77c"/>
        <path d="M23 35L23 24M23 29Q12 29 13 21Q23 20 23 29ZM23 24Q24 16 31 18Q32 25 23 24Z" fill="url(#leaf)"/>
        <path d="M20 36Q14 31 19 29Q26 28 27 34Q26 39 20 36Z" fill="#ad784f"/>
        <path d="M10 6L31 6" stroke="#fff4ce"/>
      `);
    case 'watering_can':
      return art(80, 65, shadow(80, 65) + `
        <path d="M22 18C-4 8 -2 48 20 48L20 40C7 40 6 21 21 26Z" fill="url(#teal)"/>
        <path d="M48 35L64 22L69 28L53 49Z" fill="url(#teal)"/>
        <path d="M62 20L66 14L77 27L71 32Z" fill="#b6e7cf"/>
        <path d="M68 19L69 20M71 23L72 24M73 27L74 28" stroke-width="2.2"/>
        <path d="M17 25Q36 18 52 27L54 55Q39 66 18 57Z" fill="url(#teal)"/>
        <ellipse cx="35" cy="26" rx="18" ry="6" fill="#92dbc6"/>
        <ellipse cx="35" cy="25" rx="9" ry="3" fill="#39756b"/>
        <path d="M25 16Q26 4 42 9L46 20" fill="none" stroke="#396a5c" stroke-width="4"/>
        <path d="M23 34L24 49" stroke="#b2ead7" stroke-width="4"/>
        <path d="M34 43Q40 32 44 42Q46 48 40 49Q33 49 34 43Z" fill="#efd48a" stroke="#568b74"/>
      `);
    case 'flower_pot':
      return art(78, 65, shadow(78, 65) + `
        <path d="M12 21L19 57Q39 68 60 57L67 21Z" fill="url(#clay)"/>
        <path d="M23 33L27 52" stroke="#f9bd90" stroke-width="5"/>
        <path d="M8 15Q39 5 70 15L70 28Q39 40 8 28Z" fill="#eaa078"/>
        <ellipse cx="39" cy="15" rx="31" ry="10" fill="#f4bc91"/>
        <ellipse cx="39" cy="16" rx="25" ry="6" fill="#685043"/>
        <path d="M24 16L28 17M39 13L44 14M48 18L53 17" stroke="#aa8666"/>
        <path d="M16 25Q38 33 63 25" fill="none" stroke="#ffd0a5"/>
      `);
    case 'plant.basic':
    case 'plant':
      return plant(stage);
    case 'backpack':
      return art(58, 68, shadow(58, 68) + `
        <path d="M18 17Q14 2 28 2Q44 1 41 17L36 17Q38 7 28 8Q21 7 23 17Z" fill="#b98646"/>
        <path d="M12 23Q1 32 6 58L14 59M46 23Q58 36 52 60L44 58" fill="#468c79"/>
        <path d="M12 18Q29 10 46 18L49 59Q29 70 9 59Z" fill="url(#gold)"/>
        <path d="M12 19Q29 10 46 19L45 35Q28 44 13 34Z" fill="#f4ce72"/>
        <path d="M16 22Q29 17 41 22" stroke="#fff2bc" fill="none" stroke-width="3"/>
        <path d="M17 43L40 43L41 58Q28 64 17 58Z" fill="#e7b858"/>
        <path d="M18 46L39 46" stroke="#a88043"/><path d="M36 46L36 51" stroke="#fff1b4" stroke-width="3"/>
        <path d="M26 31L32 31L32 40L26 40Z" fill="#438e7b"/><path d="M28 34L30 34" stroke="#e9f1bf"/>
      `);
    case 'storybook':
      return art(64, 48, shadow(64, 48) + `
        <path d="M3 9Q18 3 32 13Q46 3 61 9L62 42Q45 38 32 46Q18 38 2 42Z" fill="#4d9b8a"/>
        <path d="M5 5Q20 1 32 11Q44 1 59 5L58 37Q44 34 32 42Q20 34 6 37Z" fill="#fff3d6"/>
        <path d="M32 12L32 40" stroke="#c5b88c"/><path d="M35 12L37 35" stroke="#e2d6b2"/>
        <path d="M10 29L17 17L22 24L27 19L28 32Z" fill="#9ec894" stroke="none"/>
        <circle cx="24" cy="13" r="3" fill="#f2c666" stroke="none"/>
        <path d="M40 15Q48 11 54 13M40 20Q48 16 54 18M40 26Q47 22 53 24" fill="none" stroke="#b3b49b"/>
        <path d="M45 34L45 44L49 41L52 44L52 32" fill="#e98273" stroke="none"/>
      `);
    case 'window':
      return art(60, 70, shadow(60, 70) + `
        <path d="M6 62L6 8Q30 -3 54 8L54 62Z" fill="#edce98"/>
        <path d="M12 57L12 13Q30 5 48 13L48 57Z" fill="url(#glass)"/>
        <path d="M14 39L31 13M29 55L46 29" stroke="#f6fff0" stroke-width="4" opacity=".7"/>
        <path d="M28 10L32 10L32 58L28 58ZM12 31L48 31L48 36L12 36Z" fill="#e5c48d"/>
        <path d="M3 60L57 60L57 67L3 67Z" fill="#f5dda9"/>
      `);
    case 'tree':
      return art(150, 185, shadow(150, 185) + `
        <path d="M65 96L63 160Q62 176 48 180Q63 186 74 179Q85 186 102 180Q88 173 86 156L84 93Z" fill="url(#clay)"/>
        <path d="M71 152L68 123L45 105M80 143L83 124L107 102" fill="none" stroke="#986b4d" stroke-width="5"/>
        <path d="M74 155Q69 164 73 172M82 158L84 174M72 117L74 139" stroke="#efb68a" fill="none"/>
        <path d="M27 113C5 113 0 88 14 74C-1 55 17 33 34 35C31 12 56 1 76 13C94 -1 120 12 120 33C145 28 155 56 140 73C157 95 136 121 115 114C100 133 75 128 67 119C51 132 32 128 27 113Z" fill="#579774"/>
        <path d="M17 70C8 52 25 37 43 40C36 18 61 7 78 22C91 7 115 21 113 41C137 35 147 55 133 71C145 91 120 107 106 97C90 112 69 106 62 94C42 111 17 98 17 70Z" fill="url(#leaf)"/>
        <path d="M31 48Q42 41 53 45M61 28Q71 24 78 31M98 44Q110 37 120 46M32 81Q43 87 52 78M79 85Q92 91 101 80" fill="none" stroke="#d0e4a2" stroke-width="4"/>
        <path d="M58 59Q70 49 81 55M108 65L113 62M49 66L54 63" fill="none" stroke="#6da677"/>
        <path d="M54 180L48 173M92 180L101 171" stroke="#78a86b" stroke-width="3"/>
      `);
    case 'flower':
      return art(65, 70, shadow(65, 70) + `
        <path d="M32 68Q35 48 31 25" stroke="#54865b" stroke-width="4" fill="none"/>
        <path d="M33 58Q13 60 10 42Q28 40 33 58ZM34 49Q40 34 57 37Q54 53 34 49Z" fill="url(#leaf)"/>
        <path d="M30 11C18 -2 10 12 17 20C0 23 8 39 22 33C23 49 40 47 42 33C57 39 65 22 49 18C54 3 38 -2 30 11Z" fill="url(#coral)"/>
        <path d="M21 15L25 18M45 23L49 23M30 36L31 32" stroke="#ffd1ae" stroke-width="3"/>
        <circle cx="32" cy="24" r="10" fill="url(#gold)"/>
        ${eyes(28, 23, 8)}<path d="M30 29Q33 31 35 28" fill="none" stroke-width="1.2"/>
      `);
    case 'rabbit':
      return art(70, 76, shadow(70, 76) + `
        <path d="M24 34C10 14 18 -3 25 4Q32 13 32 32M35 31C34 7 43 -2 47 7Q52 18 43 35" fill="url(#fur)"/>
        <path d="M24 27Q19 11 23 10M40 26Q45 10 43 9" fill="none" stroke="#e9a59b" stroke-width="4"/>
        <circle cx="58" cy="58" r="9" fill="#fff5dc"/>
        <path d="M23 42Q47 32 55 51Q62 70 44 73L24 73Q10 68 17 53Z" fill="url(#fur)"/>
        <path d="M22 60Q18 70 12 70Q9 75 24 74M41 65Q41 72 50 72" fill="#fff0d2"/>
        <path d="M16 35Q27 23 43 30Q55 35 50 48Q43 60 24 54Q12 48 16 35Z" fill="#fff2d6"/>
        ${eyes(25, 40, 16)}<path d="M30 46L36 46L33 49ZM33 49Q29 53 27 50M33 49Q36 53 39 50" fill="#d88d88" stroke-width="1.2"/>
        <path d="M17 46L9 44M18 50L10 52M46 47L56 45" stroke="#b5a890" stroke-width="1"/>
      `);
    case 'squirrel':
      return art(75, 75, shadow(75, 75) + `
        <path d="M44 66C80 73 83 21 63 9C43 -5 32 13 41 24C47 32 64 19 65 37Q66 48 48 46Z" fill="url(#clay)"/>
        <path d="M53 59C74 51 75 20 58 17Q50 14 48 19" stroke="#f4c29a" stroke-width="5" fill="none"/>
        <path d="M25 38Q47 31 50 55Q54 72 32 73L18 73Q13 67 25 65Q15 49 25 38Z" fill="#ca8d61"/>
        <path d="M28 43Q45 39 44 61Q37 70 28 62Z" fill="#f6d7ae" stroke="none"/>
        <path d="M15 28L14 10L25 20L34 18L42 8L43 31Q47 45 31 47Q12 46 12 35Z" fill="url(#clay)"/>
        <path d="M18 18L19 26M38 17L37 24" stroke="#e8b391" stroke-width="3"/>
        ${eyes(21, 31, 14)}<path d="M25 37L30 37L28 40Z" fill="#5a4b3e"/>
        <path d="M25 44L29 47L33 44" fill="#fff0c9"/>
        <path d="M18 54Q26 58 32 53" fill="none" stroke-width="4"/>
        <path d="M26 52Q32 45 39 52L37 61Q31 65 27 59Z" fill="#a8784d"/><path d="M25 52Q33 45 40 52Z" fill="#6c7150"/>
      `);
    case 'sparrow':
      return art(54, 48, shadow(54, 48) + `
        <path d="M24 36L22 45L16 46M34 37L35 45L40 46" fill="none" stroke="#916d47"/>
        <path d="M15 31L2 19L4 34L18 38" fill="#806e59"/>
        <path d="M14 26Q11 14 23 11Q25 2 37 4Q49 6 47 22Q48 37 32 40Q16 41 14 26Z" fill="#b79a70"/>
        <path d="M27 20Q40 25 46 20Q47 37 31 38Q20 36 21 30Z" fill="#f4dfb8" stroke="none"/>
        <path d="M16 23Q28 16 34 28Q28 39 17 31Z" fill="#89775b"/><path d="M20 25L28 29M19 29L25 32" stroke="#d5bc8a"/>
        <path d="M44 17L52 21L44 25Z" fill="#e6ac54"/>
        <path d="M30 12Q37 8 42 13" fill="none" stroke="#eee0bd" stroke-width="3"/>
        ${eyes(38, 16, 0)}
      `);
    case 'dog':
      return art(84, 70, shadow(84, 70) + `
        <path d="M64 38Q80 33 77 23Q84 22 82 36Q81 46 66 48" fill="#ce9a63"/>
        <path d="M27 36Q54 27 69 41L69 64L60 68L55 49L43 50L40 67L30 67Z" fill="url(#fur)"/>
        <path d="M51 35Q58 31 64 38L62 48Q52 52 48 43Z" fill="#c69260" stroke="none"/>
        <path d="M25 43L24 64Q14 64 17 68L30 68L35 45M60 61Q55 67 61 68L71 68" fill="#eed5aa"/>
        <path d="M16 14Q31 4 44 17L46 35Q42 50 26 49Q11 46 12 31Z" fill="url(#fur)"/>
        <path d="M17 14Q3 10 3 31Q4 44 14 37L20 20M39 14Q53 9 55 28Q57 42 46 39L39 24" fill="#a47753"/>
        <path d="M20 34Q28 28 37 35L36 42Q27 48 20 40Z" fill="#fff0d2" stroke="none"/>
        ${eyes(22, 28, 14)}<path d="M24 34Q29 31 33 34L29 39Z" fill="#46544a"/>
        <path d="M26 41Q31 43 35 40L34 46Q28 51 26 44Z" fill="#e9978e"/>
        <path d="M18 48Q30 54 43 46" stroke="#57a998" stroke-width="4" fill="none"/><circle cx="30" cy="53" r="3" fill="#f2cb74"/>
      `);
    case 'cat':
      return art(68, 72, shadow(68, 72) + `
        <path d="M44 60Q64 66 60 43Q59 35 65 38Q74 70 46 69" fill="#d7aa76"/>
        <path d="M23 35Q45 30 48 52L48 66Q34 74 18 68L19 57Z" fill="url(#gold)"/>
        <path d="M27 45Q40 41 41 62L28 67Z" fill="#fff0cd" stroke="none"/>
        <path d="M25 55L24 68L15 68M38 56L39 68L47 68" fill="none"/>
        <path d="M13 28L11 6L26 16L38 15L51 5L50 30Q51 47 32 47Q13 45 13 28Z" fill="url(#gold)"/>
        <path d="M16 13L18 24L23 20M46 13L40 20L46 24" fill="#e89f8b" stroke="none"/>
        <path d="M29 16L30 22M35 16L34 21" stroke="#b68752" stroke-width="2.5"/>
        ${eyes(23, 30, 16)}<path d="M28 36L34 36L31 39ZM31 39Q26 43 25 39M31 39Q35 43 38 39" fill="#d98c7d" stroke-width="1.2"/>
        <path d="M18 36L5 33M18 40L5 42M44 36L57 33M44 40L57 43" stroke="#8e8b66" stroke-width="1"/>
      `);
    case 'butterfly':
      return art(52, 45, shadow(52, 45) + `
        <path d="M25 22C18 -3 0 1 3 18Q4 29 20 29C1 30 10 47 22 40L27 27C35 49 51 42 46 32L33 28C55 29 57 1 43 3Q31 3 27 22Z" fill="url(#coral)"/>
        <path d="M20 23Q6 20 9 11Q17 7 20 23ZM33 22Q35 10 44 9Q49 21 33 22Z" fill="#ffd4b0" stroke="none"/>
        <path d="M21 32L16 36M33 32L39 36" stroke="#fff1c1" stroke-width="3"/>
        <path d="M23 17Q26 12 29 17L30 32Q26 41 23 32Z" fill="#687b59"/>
        <path d="M25 16Q23 7 20 9M28 16Q31 7 34 9" fill="none"/>
      `);
    case 'bee':
      return art(43, 36, shadow(43, 36) + `
        <path d="M20 16C4 11 10 -2 17 4L23 14C24 -2 38 3 32 11L25 18" fill="#e0f3e5"/>
        <path d="M10 19L3 23L11 26" fill="#536254"/>
        <path d="M9 23Q9 13 23 14Q38 12 39 24Q37 35 23 34Q9 33 9 23Z" fill="url(#gold)"/>
        <path d="M17 16Q13 24 18 32M24 16Q20 25 25 33" stroke="#59624b" stroke-width="5" fill="none"/>
        <path d="M31 16L31 11M36 18L39 13" fill="none"/>
        ${eyes(31, 23, 6)}<path d="M32 28Q34 30 36 28" fill="none" stroke-width="1"/>
      `);
    case 'ant':
      return art(38, 26, shadow(38, 26) + `
        <path d="M12 16L6 21L3 24M18 17L17 23L13 24M24 17L28 23L34 24M14 12L8 8L5 12M20 12L18 7L14 8" fill="none" stroke-width="1.5"/>
        <ellipse cx="10" cy="14" rx="8" ry="6" fill="#a27058"/><ellipse cx="21" cy="14" rx="5" ry="4" fill="#bd8b68"/>
        <path d="M27 8L26 2M32 8L35 3" fill="none"/><ellipse cx="29" cy="12" rx="7" ry="6" fill="#cf9b76"/>
        <path d="M6 12Q8 10 11 11" fill="none" stroke="#e3b592"/>
        ${eyes(28, 11, 5)}
      `);
    case 'football':
      return art(48, 48, shadow(48, 48) + `
        <circle cx="24" cy="24" r="22" fill="#fff3d9"/>
        <path d="M20 15L30 17L33 26L25 32L17 25Z M8 8L15 6L17 11L11 16L5 15Z M38 7L43 14L41 21L35 18Z M4 29L10 30L14 38L10 40Z M29 40L35 34L42 36L36 43L30 45Z" fill="#4a5d51"/>
        <path d="M17 11L20 15M33 21L36 18M17 25L10 30M25 32L29 40M15 6L25 3M41 21L45 28M14 38L24 43" fill="none" stroke="#a2ae97" stroke-width="1.2"/>
        <path d="M8 21Q9 16 12 14" stroke="#fffef0" stroke-width="3" fill="none"/>
      `);
    case 'basketball':
      return art(48, 48, shadow(48, 48) + `
        <circle cx="24" cy="24" r="22" fill="url(#clay)"/>
        <path d="M3 20Q23 25 43 13M13 5Q21 22 37 41M4 33Q19 29 25 3M23 46Q27 27 45 29" fill="none" stroke="#685b43" stroke-width="2"/>
        <path d="M10 16Q12 11 17 9" stroke="#ffc498" stroke-width="3" fill="none"/>
        <g fill="#b97852" stroke="none"><circle cx="14" cy="25" r=".8"/><circle cx="17" cy="27" r=".8"/><circle cx="33" cy="21" r=".8"/><circle cx="36" cy="23" r=".8"/><circle cx="21" cy="38" r=".8"/></g>
      `);
    case 'ice_experiment':
      return art(65, 63, shadow(65, 63) + `
        <path d="M3 44L15 35L54 35L62 44L60 56Q33 66 5 56Z" fill="#7ab5a6"/>
        <ellipse cx="32" cy="45" rx="28" ry="10" fill="#d5eee0"/>
        <path d="M13 39Q29 32 49 39Q56 45 42 48L21 48Q8 46 13 39Z" fill="#98d5d7" stroke="none"/>
        <path d="M17 18L34 12L48 20L47 39L30 46L17 37Z" fill="url(#glass)"/>
        <path d="M17 18L30 26L48 20M30 26L30 46" fill="none" stroke="#6ca8b1"/>
        <path d="M20 20L27 25L27 36M34 28L42 25" stroke="#f4fff3" stroke-width="3" fill="none"/>
        <path d="M25 6L25 1M20 4L30 4M54 12L54 6M51 9L57 9" stroke="#92bcbc" stroke-width="1.5"/>
        <path d="M8 53Q32 61 56 53" stroke="#b7e1c9" fill="none"/>
      `);
    case 'traffic_sign':
      return art(48, 85, shadow(48, 85) + `
        <path d="M20 34L27 34L28 81L19 81Z" fill="#baaa82"/>
        <path d="M22 43L22 75" stroke="#f5ddb2"/>
        <path d="M24 3L46 39Q47 43 41 44L7 44Q1 44 3 39L21 4Q23 1 24 3Z" fill="url(#coral)"/>
        <path d="M23 11L39 37L9 37Z" fill="#fff1ce"/>
        <circle cx="24" cy="20" r="2.5" fill="#476357" stroke="none"/>
        <path d="M23 24L20 29L16 29M23 24L28 28L31 28M23 25L24 30L19 35M24 30L29 35" fill="none" stroke-width="2.3"/>
        <path d="M13 82L18 77L31 77L36 82Z" fill="#819a74"/>
      `);
    case 'mushroom':
      return art(60, 60, shadow(60, 60) + `
        <path d="M23 29Q25 45 18 53Q28 62 42 54Q34 44 37 28Z" fill="url(#fur)"/>
        <path d="M28 36L27 49M32 39L34 51" fill="none" stroke="#cbb693" stroke-width="1.2"/>
        <path d="M3 30C5 15 17 4 30 4C43 4 55 15 57 30Q33 43 3 30Z" fill="url(#coral)"/>
        <path d="M5 30Q31 37 55 30Q46 41 32 38Q14 39 5 30Z" fill="#f5d4b0"/>
        <path d="M11 23Q12 17 17 16Q22 18 20 23Q16 27 11 23ZM28 9Q35 8 37 14Q35 20 29 17Q26 14 28 9ZM40 24Q43 18 49 23L51 28Q44 30 40 24Z" fill="#fff0ca" stroke="none"/>
        <path d="M12 56L9 50M44 56L49 49" stroke="#6e9d6c" stroke-width="2.5"/>
      `);
    case 'pond':
    case 'stream':
      return art(90, 52, shadow(90, 52) + `
        <path d="M8 42Q30 35 78 39M16 47Q44 51 84 43M36 34Q56 31 74 35" fill="none" stroke="#7dbcb3" stroke-width="2"/>
        <path d="M21 46Q22 26 16 15M25 44Q23 20 30 9M28 45Q31 28 39 24" fill="none" stroke="#6b986c" stroke-width="2.5"/>
        <path d="M16 22L14 10M29 16L31 5" stroke="#a87951" stroke-width="5"/>
        <path d="M50 40Q54 29 70 32L62 38L70 40Q60 46 50 40Z" fill="url(#leaf)"/>
      `);
    default:
      return art(48, 48, shadow(48, 48) + `
        <path d="M6 18L24 8L42 18L40 38L24 46L8 38Z" fill="url(#gold)"/>
        <path d="M6 18L24 27L42 18M24 27L24 46" fill="none"/>
        <path d="M15 13L33 23L33 31L28 34L28 25L11 16Z" fill="#78bca2" stroke="none"/>
      `);
  }
}
