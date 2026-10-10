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
      p: 'Talk with everyone on the street and help each person reach **"Wants to follow Jesus"**. Manage your energy, your Word and the clock while you do it.',
    },
    {
      h: 'Controls',
      items: [
        'Move: **W A S D** or the **arrow keys**. On a phone, drag anywhere on the street.',
        'Walk into a **gold ring** to open a place or start a conversation.',
        '**M** button: show or hide the map. **+ / −**: zoom. **›**: people and progress. **?**: these rules.',
      ],
    },
    {
      h: 'Your stats',
      items: [
        '**Energy** (starts at 80, max 100): talking costs 8 energy.',
        '**Word** (starts at 10, max 100): your Bible knowledge. It unlocks harder conversations. A wise answer gives +2.',
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
        '**{home}**: sleep to refill energy and start again at 07:00. Sleeping after 07:00 moves to the next day.',
        'The other buildings are scenery.',
      ],
    },
    {
      h: 'Conversations',
      items: [
        'You can talk between **07:00 and 21:00** with at least **15 energy**. It costs 1 hour.',
        'Each person asks 3 questions. Pick one of 3 answers: wise, partly there, or missed it.',
        '**Openness** starts at 50. Wise **+18**, partly there **+3**, missed it **−25**. At 0 the person walks away.',
        'Result: **80+** wants to follow Jesus · **45–79** seed sown · **below 45** walked away. You can try again; a better result replaces a worse one, never the other way round.',
        'After every answer you see why it was right or wrong, with a Bible reference.',
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
        'Talk to the people who need no Word.',
        'Eat if your energy is low, then do Bible study.',
        'Do evangelism training once your Word reaches 20.',
        'Sleep, then talk to the people you have unlocked.',
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
      p: 'Parlez avec tous les gens de la rue et aidez chacun à atteindre **« Veut suivre Jésus »**. Gérez votre énergie, votre Parole et l’horloge en même temps.',
    },
    {
      h: 'Commandes',
      items: [
        'Se déplacer : **W A S D** ou les **flèches**. Sur téléphone, faites glisser le doigt n’importe où dans la rue.',
        'Entrez dans un **cercle doré** pour ouvrir un lieu ou engager une conversation.',
        'Bouton **M** : afficher ou masquer la carte. **+ / −** : zoom. **›** : personnes et progression. **?** : ces règles.',
      ],
    },
    {
      h: 'Vos jauges',
      items: [
        '**Énergie** (80 au départ, 100 au maximum) : une conversation coûte 8 d’énergie.',
        '**Parole** (10 au départ, 100 au maximum) : votre connaissance de la Bible. Elle débloque des conversations plus difficiles. Une sage réponse donne +2.',
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
        '**{home}** : dormez pour refaire le plein d’énergie et repartir à 07 h 00. Dormir après 07 h 00 fait passer au jour suivant.',
        'Les autres bâtiments sont du décor.',
      ],
    },
    {
      h: 'Les conversations',
      items: [
        'Vous pouvez parler entre **07 h 00 et 21 h 00** avec au moins **15 d’énergie**. Cela prend 1 heure.',
        'Chaque personne pose 3 questions. Choisissez l’une des 3 réponses : sage, en partie juste, ou à côté.',
        'L’**ouverture** commence à 50. Sage **+18**, en partie juste **+3**, à côté **−25**. À 0, la personne s’en va.',
        'Résultat : **80 et plus** veut suivre Jésus · **45 à 79** une graine est semée · **moins de 45** est parti(e). Vous pouvez réessayer ; un meilleur résultat remplace un moins bon, jamais l’inverse.',
        'Après chaque réponse, vous voyez pourquoi elle était juste ou non, avec une référence biblique.',
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
        'Parlez aux personnes qui ne demandent aucune Parole.',
        'Mangez si votre énergie est basse, puis faites une étude biblique.',
        'Suivez la formation à l’évangélisation dès que votre Parole atteint 20.',
        'Dormez, puis parlez aux personnes que vous avez débloquées.',
      ],
    },
    {
      h: 'Sauvegarde',
      p: 'Votre progression est enregistrée automatiquement dans ce navigateur, séparément pour chaque ville. Utilisez **Recommencer** sur le premier écran pour réinitialiser une ville.',
    },
  ],
};

export const RULES: Record<Lang, RulesDoc> = { en: EN, fr: FR };
