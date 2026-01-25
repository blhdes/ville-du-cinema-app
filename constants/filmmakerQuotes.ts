export interface FilmmakerQuote {
  id: number; // 0-51 (week of year)
  author: string;
  nationality: string;
}

export const FILMMAKER_QUOTES: FilmmakerQuote[] = [
  { id: 0, author: "Jean-Luc Godard", nationality: "France" },
  { id: 1, author: "François Truffaut", nationality: "France" },
  { id: 2, author: "Robert Bresson", nationality: "France" },
  { id: 3, author: "Andreï Tarkovski", nationality: "Russie" },
  { id: 4, author: "Jean Cocteau", nationality: "France" },
  { id: 5, author: "Alfred Hitchcock", nationality: "Royaume-Uni" },
  { id: 6, author: "Ingmar Bergman", nationality: "Suède" },
  { id: 7, author: "Orson Welles", nationality: "États-Unis" },
  { id: 8, author: "Federico Fellini", nationality: "Italie" },
  { id: 9, author: "Akira Kurosawa", nationality: "Japon" },
  { id: 10, author: "Jean Renoir", nationality: "France" },
  { id: 11, author: "Luis Buñuel", nationality: "Espagne" },
  { id: 12, author: "Yasujirō Ozu", nationality: "Japon" },
  { id: 13, author: "Carl Theodor Dreyer", nationality: "Danemark" },
  { id: 14, author: "Jean Epstein", nationality: "France" },
  { id: 15, author: "Sergueï Eisenstein", nationality: "Russie" },
  { id: 16, author: "Fritz Lang", nationality: "Allemagne" },
  { id: 17, author: "Michelangelo Antonioni", nationality: "Italie" },
  { id: 18, author: "Pier Paolo Pasolini", nationality: "Italie" },
  { id: 19, author: "Éric Rohmer", nationality: "France" },
  { id: 20, author: "Jacques Rivette", nationality: "France" },
  { id: 21, author: "Agnès Varda", nationality: "France" },
  { id: 22, author: "Chris Marker", nationality: "France" },
  { id: 23, author: "Alain Resnais", nationality: "France" },
  { id: 24, author: "Chantal Akerman", nationality: "Belgique" },
  { id: 25, author: "Werner Herzog", nationality: "Allemagne" },
  { id: 26, author: "Rainer Werner Fassbinder", nationality: "Allemagne" },
  { id: 27, author: "Wim Wenders", nationality: "Allemagne" },
  { id: 28, author: "Jean-Marie Straub", nationality: "France" },
  { id: 29, author: "Marguerite Duras", nationality: "France" },
  { id: 30, author: "Jacques Tati", nationality: "France" },
  { id: 31, author: "Satyajit Ray", nationality: "Inde" },
  { id: 32, author: "Abbas Kiarostami", nationality: "Iran" },
  { id: 33, author: "Terrence Malick", nationality: "États-Unis" },
  { id: 34, author: "Stanley Kubrick", nationality: "États-Unis" },
  { id: 35, author: "John Cassavetes", nationality: "États-Unis" },
  { id: 36, author: "Kenji Mizoguchi", nationality: "Japon" },
  { id: 37, author: "Manoel de Oliveira", nationality: "Portugal" },
  { id: 38, author: "Theo Angelopoulos", nationality: "Grèce" },
  { id: 39, author: "Béla Tarr", nationality: "Hongrie" },
  { id: 40, author: "Pedro Costa", nationality: "Portugal" },
  { id: 41, author: "Claire Denis", nationality: "France" },
  { id: 42, author: "Hong Sang-soo", nationality: "Corée du Sud" },
  { id: 43, author: "Apichatpong Weerasethakul", nationality: "Thaïlande" },
  { id: 44, author: "Bruno Dumont", nationality: "France" },
  { id: 45, author: "Lav Diaz", nationality: "Philippines" },
  { id: 46, author: "Kelly Reichardt", nationality: "États-Unis" },
  { id: 47, author: "Céline Sciamma", nationality: "France" },
  { id: 48, author: "Lucrecia Martel", nationality: "Argentine" },
  { id: 49, author: "Tsai Ming-liang", nationality: "Taïwan" },
  { id: 50, author: "Philippe Garrel", nationality: "France" },
  { id: 51, author: "Leos Carax", nationality: "France" }
];

export function getQuoteOfTheWeek(): FilmmakerQuote {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const weekOfYear = Math.floor(diff / oneWeek);
  return FILMMAKER_QUOTES[weekOfYear % 52];
}
