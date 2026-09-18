// Static, self-contained illustrations: all coordinates share the renderer's world space.
const defs = `<defs>
  <linearGradient id="sky" x2="0" y2="1"><stop stop-color="#a9dce8"/><stop offset="1" stop-color="#e9f4e8"/></linearGradient>
  <linearGradient id="grass" x2="0.25" y2="1"><stop stop-color="#91bd7f"/><stop offset="0.55" stop-color="#bad594"/><stop offset="1" stop-color="#98c184"/></linearGradient>
  <linearGradient id="forestFloor" x2="0.7" y2="1"><stop stop-color="#689c83"/><stop offset="0.52" stop-color="#b6cd94"/><stop offset="1" stop-color="#7cab82"/></linearGradient>
  <linearGradient id="leaf" x2="0.7" y2="1"><stop stop-color="#a8cb7b"/><stop offset="0.48" stop-color="#76a967"/><stop offset="1" stop-color="#4b8867"/></linearGradient>
  <linearGradient id="water" x2="0.4" y2="1"><stop stop-color="#77bfca"/><stop offset="1" stop-color="#aedcda"/></linearGradient>
  <linearGradient id="glass" x2="1" y2="1"><stop stop-color="#d6ece3" stop-opacity="0.92"/><stop offset="1" stop-color="#78b6ad" stop-opacity="0.85"/></linearGradient>
  <linearGradient id="roof" x2="0.2" y2="1"><stop stop-color="#ee9b83"/><stop offset="1" stop-color="#cc6c65"/></linearGradient>
  <pattern id="tiles" width="32" height="19" patternUnits="userSpaceOnUse"><path d="M0 17Q8 22 16 17T32 17M16 0V17" fill="none" stroke="#b66360" stroke-opacity="0.38" stroke-width="1.5"/></pattern>
  <pattern id="gingham" width="32" height="24" patternUnits="userSpaceOnUse"><rect width="32" height="24" fill="#fff0dd"/><path d="M0 6H32M8 0V24" stroke="#e29c94" stroke-width="12" opacity="0.7"/></pattern>
  <g id="tuft" fill="none" stroke="#648f63" stroke-width="2" stroke-linecap="round"><path d="M-7 0l-3-5M0 1l2-8M7 0l4-3"/></g>
  <g id="flower"><path d="M0 1v14m0-5q-8-8-9-2m9 4q8-8 10-3" fill="none" stroke="#558865" stroke-width="2"/><g fill="#fff9e9"><ellipse cy="-4" rx="3" ry="5"/><ellipse cy="4" rx="3" ry="5"/><ellipse cx="-4" rx="5" ry="3"/><ellipse cx="4" rx="5" ry="3"/></g><circle r="2.7" fill="#edbf62"/></g>
  <g id="clover" fill="#70a274"><ellipse cx="-4" cy="-2" rx="5" ry="3" transform="rotate(25)"/><ellipse cx="4" cy="-3" rx="5" ry="3" transform="rotate(-25)"/><ellipse cy="3" rx="4" ry="3"/></g>
  <g id="shrub"><path d="M-47 4C-62-13-44-32-28-27C-29-50 8-54 19-31C42-41 63-16 48 5C25 19-25 18-47 4Z" fill="#63986b"/><path d="M-42-9C-46-26-26-30-18-22C-17-42 8-43 17-22C36-30 48-13 41-4C13 6-12-1-42-9Z" fill="#86b477"/><path d="M-20-19l6 5m28-12l-2 7m20 7l-6 3" stroke="#b0ce8d" stroke-width="3" stroke-linecap="round"/></g>
  <g id="tree"><ellipse cy="8" rx="63" ry="18" fill="#346e58" opacity="0.14"/><path d="M-13 4L-8-113H12L13 4Q1 12-13 4" fill="#a08265"/><path d="M-3 1L1-102M2-57L-26-82M4-77L28-102" fill="none" stroke="#785f50" stroke-width="4" stroke-linecap="round"/><path d="M-70-94C-94-126-71-160-48-163C-58-193-26-221 2-205C34-232 64-199 61-177C100-164 103-127 79-108C84-76 44-66 19-76C-8-57-43-65-49-84C-56-82-66-87-70-94Z" fill="url(#leaf)"/><path d="M-65-144C-64-161-44-168-29-160C-35-186-10-200 8-187C29-208 58-187 53-168" fill="none" stroke="#c1d890" stroke-width="8" stroke-linecap="round" opacity="0.5"/><path d="M-48-112l10 4m46-51l10 5m23 40l10-4M-9-98l9 2" stroke="#d0dfaa" stroke-width="4" stroke-linecap="round" opacity="0.55"/></g>
  <g id="pine"><ellipse cy="5" rx="47" ry="12" fill="#306b58" opacity="0.15"/><path d="M-7 4V-150H8V4" fill="#88725e"/><path d="M0-231Q-14-190-41-163L-24-164Q-43-125-66-109L-42-111Q-58-77-80-55Q-2-26 76-53Q53-81 39-111L61-107Q30-139 21-164L39-160Q12-196 0-231" fill="#438771"/><path d="M0-218Q-7-180-29-163L-13-165Q-24-128-46-112L-22-116Q-34-76-54-59Q-24-48-7-49" fill="#63a083"/><path d="M-8-177l13 4m-22 46l27 7m-39 39l49 9" fill="none" stroke="#95bb91" stroke-width="3" stroke-linecap="round" opacity="0.5"/></g>
  <g id="fern" fill="#4b9273"><path d="M0 0Q-3-41-30-53Q-35-31 0 0M0 0Q10-46 37-53Q39-28 0 0M0 0Q-24-31-48-24Q-35-7 0 0M0 0Q27-31 51-19Q33-2 0 0M0 0Q-8-58 8-68Q22-39 0 0"/><path d="M0 0L8-57M0 0L-25-44M0 0L32-43M0 0L-39-19M0 0L40-16" stroke="#9fc58c" stroke-width="1.8" fill="none"/></g>
  <g id="mushroom"><ellipse cy="6" rx="13" ry="4" fill="#376e58" opacity="0.16"/><path d="M-4 5L-3-12H5L6 5Q0 9-4 5" fill="#f5e9cc"/><path d="M-17-10Q-13-31 1-28Q14-25 17-10Q0-2-17-10" fill="#d7806e"/><path d="M-14-9Q0-4 15-9" fill="none" stroke="#f6d9b6" stroke-width="3"/><g fill="#f7e9d5"><ellipse cx="-6" cy="-18" rx="3" ry="2"/><circle cx="5" cy="-22" r="2.5"/><circle cx="10" cy="-13" r="2"/></g></g>
  <g id="potFlower"><ellipse cy="7" rx="19" ry="6" fill="#597b57" opacity="0.18"/><path d="M-14-16L-10 5Q0 10 10 5L14-16" fill="#cc8067"/><ellipse cy="-16" rx="16" ry="5" fill="#e49b7b"/><path d="M0-16v-29m0 16q-20-18-18-4m18-3q18-23 19-9" fill="none" stroke="#5b946b" stroke-width="4"/><g fill="#efaaa0"><circle cy="-44" r="8"/><circle cx="-17" cy="-28" r="7"/><circle cx="18" cy="-37" r="7"/></g><g fill="#ffe5a6"><circle cy="-44" r="3"/><circle cx="-17" cy="-28" r="2.5"/><circle cx="18" cy="-37" r="2.5"/></g></g>
  <g id="stone"><path d="M-16 3Q-23-3-13-9Q2-15 15-5Q22 2 12 7Q-4 11-16 3" fill="#a6b5a2"/><path d="M-15-2Q-2-12 11-3" stroke="#d4dac3" stroke-width="3" fill="none" stroke-linecap="round"/></g>
  <g id="fence"><path d="M0 4H40M0 24H40" stroke="#d9e4c4" stroke-width="5"/><path d="M7 35V-3L12-9L17-3V35" fill="#f0efda"/><path d="M17-2V35" stroke="#b6c5a8" stroke-width="2"/></g>
</defs>`;

const use = (id: string, x: number, y: number, scale = 1, rotation = 0) =>
  `<use href="#${id}" transform="translate(${x} ${y}) rotate(${rotation}) scale(${scale})"/>`;

function meadowDetails(): string {
  const locations = [[58, 330], [124, 408], [204, 365], [306, 425], [438, 335], [574, 303], [682, 359], [809, 310], [982, 355], [1154, 358], [90, 481], [276, 493], [593, 562], [718, 615], [928, 563], [1146, 539], [403, 664], [549, 695], [872, 675]];
  return locations.map(([x, y], i) => use('tuft', x, y, 0.8 + (i % 3) * 0.15) + use('clover', x + 22, y + 12, 0.65)).join('')
    + [[54, 395], [181, 473], [444, 299], [743, 328], [978, 324], [1127, 484], [663, 650], [299, 674], [976, 673]].map(([x, y]) => use('flower', x, y, 0.65)).join('');
}

function horizon(): string {
  return `<rect width="1200" height="720" fill="url(#sky)"/>
    <g fill="#f8fcf3" opacity="0.8"><path d="M50 47Q65 24 87 34Q100 11 126 30Q151 24 167 46Z"/><path d="M483 49Q503 25 526 41Q543 18 564 36Q592 31 611 52Z"/><path d="M961 42Q977 19 1000 33Q1011 14 1031 27Q1055 23 1070 44Z"/></g>
    <path d="M0 111Q119 24 239 90T483 82T737 91T1003 68T1230 92V260H0Z" fill="#99c7ad"/>
    <path d="M0 142Q112 82 241 129T501 110T777 124T1064 106T1200 121V271H0Z" fill="#80b295"/>
    <path d="M0 178Q255 144 470 178T881 162T1200 175V720H0Z" fill="url(#grass)"/>
    <path d="M0 298Q263 247 502 291T941 254T1200 289V403Q998 352 771 388T320 352T0 394Z" fill="#c7dca0" opacity="0.28"/>`;
}

function foreground(forest = false): string {
  return `<path d="M-30 705Q17 653 78 674Q94 623 151 651Q170 680 220 684L250 745H-30Z" fill="#548e68"/>
    <path d="M991 740Q1005 683 1051 692Q1043 644 1093 644Q1131 622 1154 659Q1190 644 1230 670V745Z" fill="#4c8769"/>
    ${use('shrub', 29, 694, 1.15)}${use('fern', 107, 740, 1.45, -12)}${use('fern', 1171, 731, 1.6, 12)}
    ${use('shrub', 1128, 718, 0.8)}${use('flower', 180, 703, 1.1)}${use('flower', 1039, 715, 0.85)}
    ${forest ? use('mushroom', 158, 684, 0.9) + use('mushroom', 181, 690, 0.6) : use('flower', 62, 655, 0.8)}`;
}

function home(): string {
  const fence = Array.from({ length: 31 }, (_, i) => use('fence', i * 40, 193)).join('');
  return `${horizon()}
    ${Array.from({ length: 13 }, (_, i) => use('shrub', i * 104, 193, 1.05)).join('')}${fence}
    <path d="M253 325C264 402 427 385 517 448S793 507 946 575S1096 622 1226 644" fill="none" stroke="#9cab7f" stroke-width="67" opacity="0.55"/>
    <path d="M253 322C264 399 427 382 517 445S793 504 946 572S1096 619 1226 641" fill="none" stroke="#e5e4c9" stroke-width="61"/>
    <path d="M252 303C264 380 429 362 527 427S800 486 956 553S1103 601 1226 622" fill="none" stroke="#f5f0d9" stroke-width="3"/>
    <g fill="none" stroke="#bdc2a4" stroke-width="1.5" opacity="0.7"><path d="M287 362l-12 31m80-14l-4 32m81-11l-11 32m75-1l-16 26m94 24l12-32m84 22l-7 34m83-17l-5 33m80-14l-9 35m83-7l-14 32m92 4l-14 32m83-7l-8 34"/></g>
    <ellipse cx="251" cy="325" rx="164" ry="31" fill="#527c5c" opacity="0.18"/>
    <path d="M122 191L297 169L385 204V305L296 331L122 303Z" fill="#e9e9d3"/>
    <path d="M297 171L385 204V305L297 331Z" fill="#c5d3bd"/>
    <path d="M122 284L297 311L385 287V309L297 337L122 307Z" fill="#a6b6a2"/>
    <path d="M298 313V199L207 121L117 197V298Z" fill="#faf2dd"/>
    <path d="M314 123V78L341 75L354 83V139" fill="#d2927b"/><path d="M313 79L341 74L355 81L329 87Z" fill="#f1bea0"/><path d="M322 93l13-2m-5 14l18-3" stroke="#b87b6b" stroke-width="3"/>
    <path d="M208 111L309 105L405 190L300 211Z" fill="url(#roof)"/>
    <path d="M208 111L309 105L405 190L300 211Z" fill="url(#tiles)"/>
    <path d="M100 205L207 111L300 202" fill="none" stroke="#aa6460" stroke-width="15" stroke-linejoin="round"/>
    <path d="M101 201L207 109L301 199L404 184" fill="none" stroke="#f2b09a" stroke-width="8" stroke-linejoin="round"/>
    <path d="M114 211L207 132L290 211" fill="none" stroke="#fff7e3" stroke-width="6"/>
    <circle cx="207" cy="184" r="22" fill="#e7d3b5"/><circle cx="207" cy="182" r="17" fill="#80b8b6" stroke="#fffae8" stroke-width="6"/><path d="M207 167v30m-15-15h30" stroke="#fff6de" stroke-width="3"/>
    <path d="M224 315V258Q224 230 247 230Q271 230 271 258V322Z" fill="#6c9e88" stroke="#fff7e6" stroke-width="7"/>
    <path d="M234 313v-53q0-18 13-18q14 0 14 18v57" fill="none" stroke="#99bda0" stroke-width="2"/><circle cx="259" cy="285" r="3.5" fill="#e8c37b"/>
    <path d="M222 317L274 325L290 336L231 329Z" fill="#faf0d8"/><path d="M231 329L290 336V344L231 337Z" fill="#b7bca6"/><path d="M226 339L288 347L303 357L237 350Z" fill="#e6e1c9"/>
    <path d="M143 229L181 234V274L143 269Z" fill="#8fbfbd" stroke="#fff9e6" stroke-width="6"/><path d="M161 232v40m-16-24l34 4" stroke="#fffae9" stroke-width="3"/>
    <path d="M135 270L190 278V289L135 281Z" fill="#c8836c"/>${use('flower', 147, 268, 0.7)}${use('flower', 162, 270, 0.8)}${use('flower', 177, 273, 0.7)}
    <path d="M319 233L363 220V259L319 272Z" fill="#7ca7a1" stroke="#eaf0dc" stroke-width="6"/><path d="M341 226v39m-20-14l40-12" stroke="#eaf0dc" stroke-width="3"/>
    ${use('potFlower', 199, 320, 0.9)}${use('shrub', 104, 319, 0.75)}${use('shrub', 376, 325, 0.75)}
    <ellipse cx="991" cy="320" rx="139" ry="25" fill="#507d5b" opacity="0.17"/>
    <path d="M867 216L947 132L1104 158L1115 239V310L954 330L867 294Z" fill="url(#glass)"/>
    <path d="M867 216L947 132L954 224L1115 239L1104 158L947 132" fill="#c4e5dc" opacity="0.8"/>
    <g fill="#5d9e77" opacity="0.8"><path d="M887 291v-36q-26-27-21-40q30 4 24 35q0-44 21-49q13 31-21 58v34Z"/><path d="M1020 303v-45q-23-35-13-42q23 13 16 41q13-37 32-31q-1 27-29 36v41Z"/><path d="M1066 298v-26q-22-23-14-34q24 0 18 30q7-28 26-22q3 20-23 28v25Z"/></g>
    <g stroke="#eff4df" stroke-width="5" fill="none" stroke-linejoin="round"><path d="M867 216L947 132L1104 158L1115 239V310L954 330L867 294ZM947 132L954 224V330M867 216L954 224L1115 239M989 140L998 228V324M1036 147L1043 232V317M1080 154L1087 237V313M873 258L954 278L1114 266"/><path d="M895 302V235L929 239V316"/></g>
    <path d="M867 294L954 326L1115 306V318L954 340L867 306Z" fill="#759885"/><path d="M903 303l29 11v8l-29-10" fill="#dce3cb"/>
    <path d="M978 175l15 31m27-20l8 19m29-37l15 41" stroke="#f5fff1" stroke-width="5" opacity="0.65" stroke-linecap="round"/>
    ${use('potFlower', 1129, 321, 1)}${use('shrub', 845, 308, 0.6)}
    <g transform="translate(1040 428)"><ellipse cx="47" cy="53" rx="79" ry="18" fill="#4f795d" opacity="0.15"/><path d="M0 12v45m88-35v44M7-14v43m88-24v41" stroke="#537b6b" stroke-width="7"/><path d="M-9 2L76 15L109 2L25-10Z" fill="#e3b889"/><path d="M-9 2v9l85 15l33-15V2L76 15Z" fill="#b98e6c"/><path d="M4-40L101-23V-4L4-21Z" fill="#e2b58b"/><path d="M4-30L101-13" stroke="#b18a69" stroke-width="2"/></g>
    <g><path d="M69 562L212 532L282 574L136 608Z" fill="#536f51"/><path d="M69 562L136 599L282 568V587L136 622L69 583Z" fill="#c58970"/><path d="M69 562L136 599L282 568" fill="none" stroke="#e2ad85" stroke-width="8"/>${[0,1,2,3,4].map(i => use('potFlower', 102 + i * 31, 567 - i * 3, 0.7)).join('')}<path d="M69 623L192 595L263 635L137 666Z" fill="#627c54"/><path d="M69 623L137 657L263 629V645L137 680L69 642Z" fill="#bb816b"/><path d="M69 623L137 657L263 629" fill="none" stroke="#deb08b" stroke-width="7"/>${[0,1,2,3,4].map(i => use('flower', 105 + i * 28, 626 - i * 3, 1.15) + use('clover', 113 + i * 28, 638 - i * 3, 1.3)).join('')}</g>
    ${meadowDetails()}${foreground()}`;
}

function park(): string {
  return `${horizon()}
    ${[[36,250,1.1],[184,184,0.7],[420,214,0.9],[616,183,0.7],[827,223,1.1],[1089,253,1.25],[1220,307,1.2]].map(([x,y,s]) => use('tree', x,y,s)).join('')}
    <path d="M457 205C415 289 413 316 518 359S669 451 579 515S328 584 361 751" fill="none" stroke="#99ad82" stroke-width="79"/>
    <path d="M457 203C415 287 413 314 518 357S669 449 579 513S328 582 361 749" fill="none" stroke="#e8e6cc" stroke-width="71"/>
    <path d="M429 208C381 294 399 336 510 382S623 450 560 489S286 576 326 735" fill="none" stroke="#f5efd7" stroke-width="3"/>
    <ellipse cx="220" cy="294" rx="157" ry="39" fill="#779b6e" opacity="0.23"/>
    <path d="M97 263Q185 220 301 251Q364 276 326 301Q206 340 96 299Q73 284 97 263" fill="#e6d6ad" stroke="#f3e5c3" stroke-width="6"/>
    <g stroke-linejoin="round"><path d="M118 284L146 191L190 287M260 286L286 197L324 291M146 191L286 197" fill="none" stroke="#a57860" stroke-width="9"/><path d="M146 188L285 194" stroke="#e4b184" stroke-width="7"/><path d="M180 195v64m44-62v66" stroke="#ece9d1" stroke-width="3"/><path d="M167 260l48 5l22-7l-47-5Z" fill="#659e92"/><path d="M167 260v7l48 5l22-7v-7" fill="#52877b"/></g>
    <g transform="translate(307 212)"><path d="M-2 72V-22M44 73V-17" stroke="#c6a07a" stroke-width="6"/><path d="M0 2l40 3m-40 16l40 3m-40 16l40 3" stroke="#ead9b2" stroke-width="5"/><path d="M-8-24L17-47L54-21Z" fill="#d98c77"/><path d="M43-17C50 19 46 36 82 54L104 63L97 75C40 65 27 29 30-16" fill="#83bec5" stroke="#e1eddb" stroke-width="4"/></g>
    <path d="M876 348C930 302 1038 327 1069 366C1110 377 1151 427 1120 473C1148 534 1048 566 983 546C926 568 854 533 833 496C779 475 785 407 827 384C833 359 853 351 876 348Z" fill="#7fa785"/>
    <path d="M881 354C937 316 1026 338 1060 377C1101 388 1133 427 1106 471C1126 513 1049 548 981 530C925 553 866 519 847 484C796 464 800 413 843 391C849 368 862 361 881 354Z" fill="#d8ddba"/>
    <path d="M887 366C942 333 1021 350 1050 388C1090 397 1122 430 1092 470C1110 503 1046 533 980 515C930 539 878 509 860 475C815 459 815 420 855 402C862 381 869 375 887 366Z" fill="url(#water)"/>
    <path d="M851 416Q887 379 934 389M903 488Q938 516 975 500M999 369Q1031 374 1044 391M1037 509q31-4 44-19" fill="none" stroke="#d6f0e3" stroke-width="4" stroke-linecap="round"/>
    <g fill="none" stroke="#e5f7e9" stroke-width="2" opacity="0.7"><path d="M899 426h42m37 19h62m-100 34h32m65-67h29"/></g>
    <g fill="#6ea883" stroke="#c6ddad" stroke-width="1.5"><path d="M1034 463a20 9 0 1 0 0 1l-20-1Z"/><path d="M894 444a17 8 0 1 0 0 1l-17-1Z"/></g>
    <path d="M1019 454q-14-10-5-18q5 5 6 10q3-10 10-11q7 12-11 19" fill="#f1b6b5"/>
    ${use('stone', 836, 486, 1.2)}${use('stone', 1086, 354, 0.9)}${use('stone', 1115, 505, 1.4)}
    <g stroke="#73996c" stroke-width="3" fill="none"><path d="M1128 449q-4-49 8-62m-6 62q16-38 28-39m-29 40q-20-38-13-60"/></g><path d="M1136 386l2-15m-22 18l-3-15" stroke="#a28259" stroke-width="6" stroke-linecap="round"/>
    <path d="M99 558L254 534L324 599L161 634Z" fill="#587f60" opacity="0.16"/>
    <path d="M93 548L251 524L321 589L157 625Z" fill="url(#gingham)" stroke="#fff3da" stroke-width="4" stroke-linejoin="round"/>
    <path d="M100 554l-12 4m18 3l-12 5m18 3l-11 5m18 3l-11 5m18 3l-11 5m18 3l-11 5" stroke="#f9ebd6" stroke-width="3"/>
    <g transform="translate(175 554)"><path d="M-20-1L-16 22Q4 30 26 18L30-7Z" fill="#bd9469"/><path d="M-20-1L7 7L30-7L4-13Z" fill="#e0b987"/><path d="M-6-6Q-8-40 12-31Q25-25 20-9" fill="none" stroke="#d2ac79" stroke-width="5"/><path d="M-12 9l33-1m-31 9l29-1M-4 6v18M7 9v14M17 4v17" stroke="#977957" stroke-width="1.5"/></g>
    <ellipse cx="252" cy="575" rx="20" ry="10" fill="#fffae6"/><ellipse cx="252" cy="575" rx="14" ry="6" fill="#e4e4ce"/><path d="M246 575q-9-13 2-15q5-1 7 3q12-1 7 10q-5 8-16 2" fill="#d88170"/>
    ${use('shrub', 53, 472, 1.05)}${use('shrub', 1180, 567, 1.3)}${meadowDetails()}${foreground()}`;
}

function forest(): string {
  return `<rect width="1200" height="720" fill="#b6d9ce"/>
    <path d="M0 184Q284 87 548 143T1200 122V720H0Z" fill="url(#forestFloor)"/>
    <g opacity="0.34" fill="#58978b"><path d="M30 0h21l7 217H19ZM189 0h17l14 193h-40ZM350 0h19l8 172h-34ZM522 0h13l12 159h-32ZM692 0h20l12 176h-41ZM886 0h22l12 183h-40ZM1101 0h28l12 236h-53Z"/></g>
    ${[[32,225,1.3],[178,179,1.05],[333,168,0.85],[487,139,0.7],[664,160,0.82],[835,177,1.05],[1030,199,1.2],[1197,263,1.45]].map(([x,y,s]) => use('pine',x,y,s)).join('')}
    <path d="M420 106L554 113L794 594Q660 626 522 557Z" fill="#f1edb9" opacity="0.09"/>
    <path d="M543 161C495 269 319 288 279 411S389 598 565 592S761 639 788 738" fill="none" stroke="#c6d49e" stroke-width="113" opacity="0.7"/>
    <path d="M781 174C719 261 827 305 770 377S702 473 758 555S721 667 650 746" fill="none" stroke="#507e69" stroke-width="98" opacity="0.4"/>
    <path d="M781 174C719 261 827 305 770 377S702 473 758 555S721 667 650 746" fill="none" stroke="#a9b9a0" stroke-width="86"/>
    <path d="M781 174C719 261 827 305 770 377S702 473 758 555S721 667 650 746" fill="none" stroke="url(#water)" stroke-width="68"/>
    <g fill="none" stroke="#d3ede0" stroke-width="3" stroke-linecap="round"><path d="M757 221q-10 24 5 45m27 45q3 24-13 44m-32 41q-19 19-24 36m6 52q6 27 22 42m22 56q7 26-4 44m-32 42l-17 22"/><path d="M754 298l16 3m-28 156l16 2m-10 91l17 3m-77 118l18 3" opacity="0.7"/></g>
    ${[[736,293,0.8],[811,333,0.95],[696,473,1.1],[808,547,1.3],[713,596,0.8],[688,665,1.2]].map(([x,y,s])=>use('stone',x,y,s)).join('')}
    <g transform="translate(761 351) rotate(12)"><ellipse cy="17" rx="76" ry="18" fill="#335f55" opacity="0.22"/><path d="M-77-4L72-4V22L-77 22" fill="#94785d"/><ellipse cx="-77" cy="9" rx="9" ry="14" fill="#d2b88b"/><ellipse cx="72" cy="9" rx="9" ry="14" fill="#b3946b"/><path d="M-75-10L74-10L72 9L-77 9Z" fill="#c9ad7d"/><path d="M-63-8V9m17-17V9m17-17V9m17-17V9M5-8V9M22-8V9M39-8V9M56-8V9" stroke="#9e825e" stroke-width="2"/><path d="M-69-8H67" stroke="#e7cd9c" stroke-width="3"/><path d="M-66-15v-25M62-15v-25M-66-37Q0-26 62-37" fill="none" stroke="#9a805d" stroke-width="5"/></g>
    ${use('tree', 75, 388, 1.8)}${use('tree', 1117, 373, 1.7)}${use('tree', 238, 228, 1.05)}${use('tree', 972, 237, 1.12)}
    <path d="M-37-20L64-20L67 306L88 370L51 357L31 376L15 353L-13 364L2 305Z" fill="#8a7960"/><path d="M20 0L24 297L13 339M49 56L43 293M15 178L-12 139" stroke="#6d6553" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M1160-10H1225V395L1192 376L1171 391L1172 339Z" fill="#8c7961"/><path d="M1185 14l6 320l14 32M1177 179l-39-45" stroke="#6e6551" stroke-width="6" fill="none"/>
    <path d="M-20-20H1200V19Q1168 65 1108 47Q1055 108 996 70Q945 93 897 53Q833 71 820 18Q748 37 718-14H482Q451 48 403 24Q365 80 303 49Q264 106 208 62Q171 109 118 77Q50 112-20 59Z" fill="#427f69"/>
    <path d="M-20-20H663Q637 21 596 9Q553 47 513 17Q454 48 418 14Q362 64 311 27Q271 79 218 43Q169 80 130 40Q66 81-20 35Z" fill="#669b75"/>
    <path d="M998-12Q999 48 1055 39Q1097 83 1135 46Q1183 74 1224 35V-12Z" fill="#70a37a"/>
    ${use('shrub', 118, 399, 1.05)}${use('fern', 186, 431, 1.15, -12)}${use('fern', 1052, 434, 1.2, 13)}
    <g transform="translate(149 552) rotate(-14)"><ellipse cy="19" rx="79" ry="20" fill="#527a5c" opacity="0.2"/><path d="M-67-24H49V25H-67Z" fill="#9a8164"/><ellipse cx="-67" rx="15" ry="25" fill="#bda67c"/><ellipse cx="49" rx="18" ry="25" fill="#d4be90"/><ellipse cx="49" rx="11" ry="17" fill="none" stroke="#aa9069" stroke-width="2"/><ellipse cx="49" rx="5" ry="9" fill="none" stroke="#aa9069" stroke-width="2"/><path d="M-59-14H33M-48 4h62M-53 18H29" stroke="#756a54" stroke-width="3" stroke-linecap="round"/><path d="M-50-20Q-27-40-4-25Q18-37 32-19L15-10Q-14-18-50-13Z" fill="#7fa16a"/></g>
    ${use('mushroom', 204, 522, 1.1)}${use('mushroom', 231, 536, 0.75)}${use('fern', 101, 557, 0.9)}${use('fern', 900, 625, 1.2, 19)}${use('shrub', 1146, 584, 1.3)}
    ${use('mushroom', 1022, 594, 1)}${use('mushroom', 1002, 606, 0.65)}
    ${meadowDetails()}${foreground(true)}`;
}

/** Returns a complete SVG ready for one-time rasterization into a scene texture. */
export function sceneArt(sceneId: string): string {
  const art = sceneId === 'forest' ? forest() : sceneId === 'park' ? park() : home();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720">${defs}<g stroke-linecap="round" stroke-linejoin="round">${art}</g></svg>`;
}
