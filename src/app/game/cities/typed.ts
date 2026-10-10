import type { Idea, Person, Typed } from '../types';

/**
 * DRAFT for owner review. Typed replies: for one question per person the player may write their own answer.
 * A reply is judged by the ideas it carries (see typed-answer.ts), and the three written answers still give the
 * feedback. Keywords are lower case, accents do not matter, and a word matches by its beginning ("forgiv" matches
 * "forgiven"). English and French are both accepted whichever language is on screen.
 */

/** Builds an idea from two lists written with | between the words. */
const idea = (en: string, fr: string): Idea => ({ en: en.split('|'), fr: fr.split('|') });

/** The round that can be typed: the second question in each conversation. */
const TYPED_ROUND = 1;

// Ideas used by more than one person.
const EMPATHY = idea(
  'sorry|understand|hear you|listen|must be hard|difficult|painful|here for you|loss|lost|angry|honest|grief',
  'desole|comprends|ecoute|difficile|douloureux|la pour vous|perte|perdu|colere|honnete|deuil',
);
const GOD_CLOSE = idea(
  'close to|near|cares|loves you|jesus|psalm|comfort|not alone|with you|knows',
  'proche|pres de|aime|jesus|psaume|console|pas seul|avec vous|avec toi|connait',
);
const FALL_SHORT = idea(
  'fall short|sinned|perfect|standard|cannot earn|can t earn|not enough|nobody|no one',
  'pas parfait|pech|norme|merit|ne suffit|personne',
);
const JESUS_GRACE = idea(
  'jesus|grace|gift|forgiv|cross|saviour|savior|died for',
  'jesus|grace|cadeau|don de|pardon|croix|sauveur|mort pour',
);

const TYPED: Partial<Record<string, Typed>> = {
  // Accra
  kwame: {
    ideas: [
      idea(
        'evidence|tomb|witness|eyewitness|historic|proof|fact|saw him|saw jesus',
        'preuve|tombeau|temoin|histori|fait|ont vu',
      ),
      idea(
        'look|investigat|read|examin|together|check|explore|study|test',
        'regard|enquet|lire|examin|ensemble|explor|etudi|verifi',
      ),
    ],
  },
  abena: { ideas: [FALL_SHORT, JESUS_GRACE] },
  yaw: {
    ideas: [
      idea(
        'worth|walks with|with you|never leave|not alone|carry|strength|helps',
        'vaut|avec toi|avec vous|jamais|pas seul|force|aide|porte',
      ),
      idea(
        'gift|eternal|forever|never taken|taken away|hope|promise|love|jesus',
        'cadeau|eternel|toujours|jamais enleve|esperance|promesse|amour|jesus',
      ),
    ],
  },
  efua: { ideas: [EMPATHY, GOD_CLOSE] },
  kofi: {
    ideas: [
      idea(
        'final sacrifice|once for all|once and for all|sacrifice|finished|cross|paid|died',
        'dernier sacrifice|une fois|sacrifice|termine|croix|paye|mort',
      ),
      idea(
        'power|stronger|authority|protect|spirit|free|fear|jesus|victory',
        'pouvoir|puissan|plus fort|autorite|protege|esprit|libre|peur|jesus|victoire',
      ),
    ],
  },
  ama: {
    ideas: [
      idea('forgiv|removed|east|west|clean|washed|pure|new', 'pardon|enleve|orient|occident|propre|lave|pur|nouveau'),
      idea('cross|shame|jesus|carried|grace|love|loved', 'croix|honte|jesus|porte|grace|amour|aime'),
    ],
  },
  mensah: {
    ideas: [
      idea(
        'sorry|wrong|understand|hurt|betray|should not have|not right|terrible',
        'desole|mal|comprends|blesse|trahi|pas normal|terrible',
      ),
      idea(
        'jesus|gave his life|gave|not a pastor|look at him|christ|trust jesus|not asking',
        'jesus|donne sa vie|christ|pas un pasteur|regard|confiance',
      ),
    ],
  },
  esi: {
    ideas: [
      idea('gift|grace|earn|nobody|no one|humble|not by works|free', 'cadeau|grace|merit|personne|humble|gratuit|don'),
      idea('god|jesus|offer|invite|everyone|all', 'dieu|jesus|offre|invite|tous|chacun'),
    ],
  },
  daniel: {
    ideas: [
      idea(
        'grace|forgiv|confess|faithful|mercy|welcome|return|come back|prodigal',
        'grace|pardon|confess|fidele|misericorde|accueil|retour|revenir|prodigue',
      ),
      idea('god|jesus|love|cross|new start|fresh|clean', 'dieu|jesus|amour|croix|nouveau depart|propre'),
    ],
  },
  akos: {
    ideas: [
      idea('sin|separat|turned away|wrong|fall short|broken', 'pech|separ|detourn|mal|fautes'),
      idea('gift|eternal|life|jesus|cross|died|free|saved', 'don|eternel|vie|jesus|croix|mort|gratuit|sauve'),
    ],
  },

  // Lille
  thomas: {
    ideas: [
      idea(
        'gospel|eyewitness|written|historic|evidence|manuscript|witness|close to the events|early',
        'evangile|temoin|ecrit|histori|preuve|manuscrit|proche',
      ),
      idea(
        'read|look|investigat|together|check|examin|explore|try',
        'lire|regard|enquet|ensemble|verifi|examin|explor|essay',
      ),
    ],
  },
  camille: {
    ideas: [
      idea('weary|burdened|rest|tired|exhaust|come to me|heavy', 'fatigu|fardeau|repos|epuis|venez a moi|lourd|charge'),
      idea('jesus|offers|gives|share|invite|love|care|matthew', 'jesus|offre|donne|partag|invit|amour|soin|matthieu'),
    ],
  },
  odette: { ideas: [FALL_SHORT, JESUS_GRACE] },
  karim: {
    ideas: [
      idea('prophet|honour|honor|respect|agree|isa|common', 'prophete|honor|respect|d accord|isa|commun'),
      idea(
        'forgave|forgiv|rose|risen|resurrect|cross|love|son of god|more than',
        'pardonn|ressusc|croix|amour|fils de dieu|plus qu',
      ),
    ],
  },
  julien: { ideas: [EMPATHY, GOD_CLOSE] },
  amelie: {
    ideas: [
      idea(
        'didn t only teach|gave his life|rose|risen|resurrect|died|cross|came down',
        'pas seulement|donne sa vie|ressusc|mort|croix|descendu',
      ),
      idea('love|peace|grace|jesus|different|relationship|gift', 'amour|paix|grace|jesus|different|relation|don'),
    ],
  },

  // Paris
  helene: {
    ideas: [
      idea(
        'suffer|cross|enters|with us|shares|pain|evil is real|different kind|answer',
        'souffr|croix|entre|avec nous|partage|douleur|autre genre|reponse',
      ),
      idea(
        'hard|honest|pretend|tidy|serious|fair|not easy|hope|resurrect|justice',
        'difficile|honnete|pretend|simple|serieu|juste|facile|esperance|ressusc|justice',
      ),
    ],
  },
  baptiste: {
    ideas: [
      idea('rest|tired|sleep|stop|pause|sabbath|weary|exhaust', 'repos|fatigu|dormir|arret|pause|sabbat|epuis'),
      idea(
        'gift|god|jesus|worth|life|gain the whole world|lose|value|matter',
        'don|dieu|jesus|vaut|vie|gagner le monde|perd|valeur|compte',
      ),
    ],
  },
  marc: {
    ideas: [
      idea(
        'matter|care|worth|loved|value|not forgotten|see you|not invisible',
        'compte|soucie|vaut|aime|valeur|pas oublie|te voit|vous voit',
      ),
      idea(
        'jesus|home|poor|outcast|ignored|with you|friend|church',
        'jesus|sans abri|pauvre|exclu|ignor|avec vous|avec toi|ami|eglise',
      ),
    ],
  },
  sophie: {
    ideas: [
      idea(
        'historic|witness|named|rulers|crucif|evidence|accounts|gospels|tacitus|josephus',
        'histori|temoin|nomme|crucifi|preuve|recit|evangile|tacite|josephe',
      ),
      idea('rose|risen|resurrect|explore|investigat|look|together|read', 'ressusc|explor|enquet|regard|ensemble|lire'),
    ],
  },
  vasseur: {
    ideas: [
      idea(
        'forgiv|conscience|wish|regret|guilt|sorry|wrong|mistake|ashamed',
        'pardon|conscience|regret|culpab|desole|erreur|honte|faute',
      ),
      idea(
        'quiet|moment|night|honest|think|wonder|ask|question',
        'calme|moment|nuit|honnete|pense|se demande|question',
      ),
    ],
  },
  yasmine: {
    ideas: [
      idea(
        'struck|what|which|part|tell me|curious|interest|find|stood out',
        'frapp|marqu|qu est ce|quoi|quel|partie|dis moi|dites moi|curieu|interess|trouv',
      ),
      idea(
        'not strange|normal|glad|good|wonderful|happy|great|natural',
        'pas etrange|pas du tout|normal|content|bien|merveilleu|heureu|super|naturel',
      ),
    ],
  },

  // Douai
  monique: {
    ideas: [
      idea(
        'know now|assurance|certain|sure|eternal life|finished|not because|by grace',
        'savoir|certain|sur|assurance|vie eternelle|termine|pas par|grace',
      ),
      idea('jesus|work|cross|gift|good news|faith|trust', 'jesus|oeuvre|croix|don|bonne nouvelle|foi|confiance'),
    ],
  },
  lucas: {
    ideas: [
      idea(
        'thank|honest|brave|empty|not alone|many people|clue|feel the same|hide',
        'merci|honnete|courage|vide|pas seul|beaucoup|indice|pareil|cache',
      ),
      idea(
        'jesus|life|fulfil|satisf|purpose|meaning|hear|tell you|share',
        'jesus|vie|combl|satisf|but|sens|ecout|raconter|partag',
      ),
    ],
  },
  gerard: {
    ideas: [
      idea('sorry|loss|miss|loved|wife|sad|difficult', 'desole|perte|manque|aimiez|epouse|triste|difficile'),
      idea(
        'what did|tell me|remember|her faith|see in|meant|about her',
        'qu avez vous|racont|souvenir|sa foi|voyiez|signifi|parlez',
      ),
    ],
  },
  nadia: {
    ideas: [
      idea(
        'fair|valid|understand|harm|wars|wrong|hypocri|criticis|only show|rules',
        'juste|comprends|mal fait|guerres|hypocri|critiqu|apparence|regles',
      ),
      idea(
        'relationship|jesus|personal|know god|not rules|love|offers|invite',
        'relation|jesus|personnel|connaitre dieu|pas des regles|amour|offre|invit',
      ),
    ],
  },
  pierre: {
    ideas: [
      idea(
        'love god|first commandment|first|loved us first|good|neighbour|neighbor|great',
        'aimer dieu|premier commandement|premier|nous a aimes|bien|prochain|bravo',
      ),
      idea('son|forgiv|gospel|jesus|grace|gave|cross', 'fils|pardon|evangile|jesus|grace|donne|croix'),
    ],
  },
  elise: {
    ideas: [
      idea(
        'sorry|wrong|angry|crush|shame|abuse|hurt|misrepresent|betray',
        'desole|mal|colere|ecras|honte|abus|blesse|trahi|deforme',
      ),
      idea(
        'jesus|welcomed|broken|good|not like|trust|different|gentle',
        'jesus|accueill|brise|bon|pas comme|confiance|different|doux',
      ),
    ],
  },
};

/** The same people, with the typed reply switched on for one question each. People without an entry are unchanged. */
export function withTyped(people: Person[]): Person[] {
  return people.map((p) => {
    const typed = TYPED[p.id];
    if (!typed) return p;
    return { ...p, rounds: p.rounds.map((r, i) => (i === TYPED_ROUND ? { ...r, typed } : r)) };
  });
}
