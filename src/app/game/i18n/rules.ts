import type { Lang } from './i18n.service';

export interface RulesSection {
  h: string;
  /** Plain paragraph. `**bold**` is supported. */
  p?: string;
  items?: string[];
  ordered?: boolean;
}

export interface RulesDoc {
  title: string;
  sections: RulesSection[];
  peopleHeading: string;
  colPerson: string;
  colWho: string;
  colWord: string;
  mapNote: string;
  after: RulesSection[];
}

/** Placeholders {church}, {eat}, {home} are filled with the current city's own names. */
const EN: RulesDoc = {
  title: 'HOW TO PLAY',
  sections: [
    {
      h: 'Goal',
      p: 'Talk with everyone on the street and help each person reach **"Wants to follow Jesus"**. Some will say no whatever you say, and some need practical help more than words. Manage your energy, your Word and the clock while you do it.',
    },
    {
      h: 'Controls',
      items: [
        'Move: **W A S D** or the **arrow keys**. On a phone, drag anywhere on the street.',
        'Walk into a **gold ring** to open a place or start a conversation.',
        '**⇢** button (autopilot): pick the church, the café, home or a person and your character walks there by itself. Press any key or touch the controls to take over again.',
        'In every conversation one question must be **answered in your own words**. Your reply is compared with a wise one, in English or French, and you see how close you came.',
        'Give your name and choose how your character looks from the first screen of each city: **Your character**.',
        'Traffic obeys the signals and stops for you, but busy roads are still best crossed with care. Rush hours are busier than nights.',
        '**M** button: show or hide the map. **♪**: sound on or off. **+ / −**: zoom. **›**: people and progress. **?**: these rules.',
      ],
    },
    {
      h: 'Your stats',
      items: [
        '**Energy** (starts at 80, max 100): a conversation costs 20 energy.',
        '**Word** (starts at 15, max 100): your Bible knowledge. Every conversation spends 15 Word, so go back to church and study before the next person. More Word also unlocks harder conversations. A wise answer gives +2.',
        '**Time**: every hour that passes costs 1.5 energy and 0.2 Word. Time also passes slowly as you walk about (one hour takes about three minutes), so shops open and close and night falls.',
        '**Weather**: it changes through the day and depends on the city (clear, cloudy, rain, fog). It dims the light and shortens how far you can see.',
        '**Wise answers**: the share of your answers that were the best choice.',
        'If energy reaches 0 you collapse and wake at home 10 hours later with 45 energy.',
      ],
    },
    {
      h: 'Places',
      items: [
        '**{church}** (06:00–21:00): Bible study (+12 Word, 2h, −5 energy). Evangelism training (needs Word 20; +20 Word, 3h, −8 energy). Prayer meeting (+10 energy, 1h).',
        '**{eat}** (06:00–23:00): a meal gives +25 or +40 energy, 1 hour each.',
        '**{home}**: sleep to refill energy and start again at 07:00. Sleeping after 07:00 moves to the next day. Some people are reached by **phone from home**.',
        'The other buildings are scenery. Ordinary people walk the pavements on daily routines (commuters, shoppers, students, night owls) and go indoors when it rains.',
      ],
    },
    {
      h: 'Conversations',
      items: [
        'You can talk between **07:00 and 21:00** with at least **20 energy** and **15 Word**. It costs 1 hour, 20 energy and 15 Word.',
        'Each person asks 3 questions. Pick one of 3 answers: wise, partly there, or missed it.',
        '**Openness** starts at 50. Wise **+18**, partly there **+3**, missed it **−25**. At 0 the person walks away.',
        'Result: **80+** wants to follow Jesus · **45–79** seed sown · **below 45** walked away. You can try again; a better result replaces a worse one, never the other way round.',
        'After every answer you see why it was right or wrong, with a Bible reference.',
        '**Some people will say no** however well you answer. Rejection happens. Stay kind and leave the door open (openness 45 or more) and it counts as **said no, door left open**.',
        '**Some people need help, not a sermon**: a call to check on them, food, money, or telling the Presiding Elder. Caring well (80+) counts as **cared for**.',
      ],
    },
  ],
  peopleHeading: 'People and the Word they need',
  colPerson: 'Person',
  colWho: 'Who',
  colWord: 'Word',
  mapNote:
    'On the map a **gold dot** is someone you can talk to now, a **green dot** is someone you have reached, and a grey dot needs more Word.',
  after: [
    {
      h: 'Tips for wise answers',
      items: [
        'Listen first. Ask a gentle question before giving an answer.',
        'Respect their mind, their grief, their faith and their family. Never insult or threaten.',
        'Point to Jesus Himself, to grace and to the resurrection, not to rules, money or a person.',
        'Be honest: Jesus offers forgiveness and Himself, not an easy life.',
      ],
    },
    {
      h: 'A good first day',
      ordered: true,
      items: [
        'Talk to one person who needs no Word.',
        'Go to church for Bible study before the next conversation.',
        'Eat if your energy is low. Do evangelism training once your Word reaches 20.',
        'Sleep, then keep going: study, talk, study, talk.',
      ],
    },
    {
      h: 'Saving',
      p: 'Your progress saves automatically in this browser, separately for each city. Use **Start over** on the first screen to reset a city.',
    },
  ],
};

const FR: RulesDoc = {
  title: 'COMMENT JOUER',
  sections: [
    {
      h: 'But du jeu',
      p: 'Parlez avec tous les gens de la rue et aidez chacun à atteindre **« Veut suivre Jésus »**. Certains diront non quoi que vous disiez, et d’autres ont besoin d’une aide concrète plus que de paroles. Gérez votre énergie, votre Parole et l’horloge en même temps.',
    },
    {
      h: 'Commandes',
      items: [
        'Se déplacer : **W A S D** ou les **flèches**. Sur téléphone, faites glisser le doigt n’importe où dans la rue.',
        'Entrez dans un **cercle doré** pour ouvrir un lieu ou engager une conversation.',
        'Bouton **⇢** (pilote automatique) : choisissez l’église, le café, la maison ou une personne et votre personnage s’y rend tout seul. Appuyez sur une touche ou touchez les commandes pour reprendre la main.',
        'Dans chaque conversation, une question demande une **réponse écrite avec vos propres mots**. Elle est comparée à une réponse sage, en français ou en anglais, et vous voyez à quel point vous en étiez proche.',
        'Donnez votre nom et choisissez l’apparence de votre personnage sur le premier écran de chaque ville : **Votre personnage**.',
        'La circulation respecte les feux et s’arrête pour vous, mais les grandes routes se traversent toujours avec prudence. Les heures de pointe sont plus chargées que les nuits.',
        'Bouton **M** : afficher ou masquer la carte. **♪** : son activé ou coupé. **+ / −** : zoom. **›** : personnes et progression. **?** : ces règles.',
      ],
    },
    {
      h: 'Vos jauges',
      items: [
        '**Énergie** (80 au départ, 100 au maximum) : une conversation coûte 20 d’énergie.',
        '**Parole** (15 au départ, 100 au maximum) : votre connaissance de la Bible. Chaque conversation dépense 15 de Parole : retournez à l’église étudier avant la personne suivante. Plus de Parole débloque aussi des conversations plus difficiles. Une sage réponse donne +2.',
        '**Temps** : chaque heure qui passe coûte 1,5 d’énergie et 0,2 de Parole. Le temps passe aussi lentement quand vous vous promenez (une heure dure environ trois minutes) : les commerces ouvrent et ferment, et la nuit tombe.',
        '**Météo** : elle change au fil de la journée et dépend de la ville (dégagé, nuageux, pluie, brouillard). Elle baisse la lumière et réduit la portée de la vue.',
        '**Bonnes réponses** : la part de vos réponses qui étaient le meilleur choix.',
        'Si l’énergie tombe à 0, vous vous effondrez et vous vous réveillez chez vous 10 heures plus tard avec 45 d’énergie.',
      ],
    },
    {
      h: 'Les lieux',
      items: [
        '**{church}** (6 h – 21 h) : étude biblique (+12 Parole, 2 h, −5 énergie). Formation à l’évangélisation (Parole 20 requise ; +20 Parole, 3 h, −8 énergie). Réunion de prière (+10 énergie, 1 h).',
        '**{eat}** (6 h – 23 h) : un repas donne +25 ou +40 d’énergie, 1 heure chacun.',
        '**{home}** : dormez pour refaire le plein d’énergie et repartir à 07 h 00. Dormir après 07 h 00 fait passer au jour suivant. Certaines personnes se joignent **par téléphone depuis chez vous**.',
        'Les autres bâtiments sont du décor. Des gens ordinaires marchent sur les trottoirs selon leurs habitudes (travailleurs, clients, étudiants, noctambules) et rentrent à l’abri quand il pleut.',
      ],
    },
    {
      h: 'Les conversations',
      items: [
        'Vous pouvez parler entre **07 h 00 et 21 h 00** avec au moins **20 d’énergie** et **15 de Parole**. Cela prend 1 heure, 20 d’énergie et 15 de Parole.',
        'Chaque personne pose 3 questions. Choisissez l’une des 3 réponses : sage, en partie juste, ou à côté.',
        'L’**ouverture** commence à 50. Sage **+18**, en partie juste **+3**, à côté **−25**. À 0, la personne s’en va.',
        'Résultat : **80 et plus** veut suivre Jésus · **45 à 79** une graine est semée · **moins de 45** est parti(e). Vous pouvez réessayer ; un meilleur résultat remplace un moins bon, jamais l’inverse.',
        'Après chaque réponse, vous voyez pourquoi elle était juste ou non, avec une référence biblique.',
        '**Certaines personnes diront non**, même à de très bonnes réponses. Le refus arrive. Restez aimable et laissez la porte ouverte (ouverture 45 ou plus) : cela compte comme **a dit non, porte restée ouverte**.',
        '**Certaines personnes ont besoin d’aide, pas d’un sermon** : un appel pour prendre des nouvelles, de quoi manger, de l’argent, ou prévenir l’Ancien président. Bien prendre soin (80 et plus) compte comme **soutenu(e)**.',
      ],
    },
  ],
  peopleHeading: 'Les personnes et la Parole nécessaire',
  colPerson: 'Personne',
  colWho: 'Qui',
  colWord: 'Parole',
  mapNote:
    'Sur la carte, un **point doré** est quelqu’un à qui vous pouvez parler maintenant, un **point vert** quelqu’un que vous avez rencontré, et un point gris demande plus de Parole.',
  after: [
    {
      h: 'Conseils pour de sages réponses',
      items: [
        'Écoutez d’abord. Posez une question avec douceur avant de répondre.',
        'Respectez sa réflexion, sa peine, sa foi et sa famille. Ne jamais insulter ni menacer.',
        'Montrez Jésus Lui-même, la grâce et la résurrection, pas des règles, de l’argent ou une personne.',
        'Soyez honnête : Jésus offre le pardon et Lui-même, pas une vie facile.',
      ],
    },
    {
      h: 'Une bonne première journée',
      ordered: true,
      items: [
        'Parlez à une personne qui ne demande aucune Parole.',
        'Allez à l’église pour une étude biblique avant la conversation suivante.',
        'Mangez si votre énergie est basse. Suivez la formation à l’évangélisation dès que votre Parole atteint 20.',
        'Dormez, puis continuez : étudier, parler, étudier, parler.',
      ],
    },
    {
      h: 'Sauvegarde',
      p: 'Votre progression est enregistrée automatiquement dans ce navigateur, séparément pour chaque ville. Utilisez **Recommencer** sur le premier écran pour réinitialiser une ville.',
    },
  ],
};

export const RULES: Record<Lang, RulesDoc> = { en: EN, fr: FR };
