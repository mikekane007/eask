/** French names (Louis Segond) for the Bible books referenced in the game. English references are written once and translated on display. */
const BOOKS_FR: Record<string, string> = {
  Genesis: 'Genèse',
  Exodus: 'Exode',
  Deuteronomy: 'Deutéronome',
  Job: 'Job',
  Psalm: 'Psaume',
  Psalms: 'Psaumes',
  Proverbs: 'Proverbes',
  Ecclesiastes: 'Ecclésiaste',
  Ezekiel: 'Ézéchiel',
  Isaiah: 'Ésaïe',
  Jeremiah: 'Jérémie',
  Lamentations: 'Lamentations',
  Hosea: 'Osée',
  Micah: 'Michée',
  Habakkuk: 'Habacuc',
  Matthew: 'Matthieu',
  Mark: 'Marc',
  Luke: 'Luc',
  John: 'Jean',
  Acts: 'Actes',
  Romans: 'Romains',
  '1 Corinthians': '1 Corinthiens',
  '2 Corinthians': '2 Corinthiens',
  Galatians: 'Galates',
  Ephesians: 'Éphésiens',
  Philippians: 'Philippiens',
  Colossians: 'Colossiens',
  '1 Thessalonians': '1 Thessaloniciens',
  '2 Thessalonians': '2 Thessaloniciens',
  '1 Timothy': '1 Timothée',
  '2 Timothy': '2 Timothée',
  Titus: 'Tite',
  Hebrews: 'Hébreux',
  James: 'Jacques',
  '1 Peter': '1 Pierre',
  '2 Peter': '2 Pierre',
  '1 John': '1 Jean',
  Revelation: 'Apocalypse',
};

// Longest names first so "1 John" wins over "John".
const BOOK_PATTERN = new RegExp(
  `(^|[;,] ?)(${Object.keys(BOOKS_FR)
    .sort((a, b) => b.length - a.length)
    .join('|')})(?= \\d)`,
  'g',
);

/** Translates the book names in a reference such as "Romans 3:23; 1 John 1:9" for the given language. */
export function translateRef(ref: string, lang: 'en' | 'fr'): string {
  if (lang === 'en') return ref;
  return ref.replace(BOOK_PATTERN, (_m, lead: string, book: string) => lead + (BOOKS_FR[book] ?? book));
}
