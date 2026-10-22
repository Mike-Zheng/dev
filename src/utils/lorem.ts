export type CorpusId = 'lorem' | 'raven' | 'faust' | 'bateau'

const LOREM = `lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum at vero eos accusamus iusto odio dignissimos ducimus blanditiis praesentium voluptatum deleniti atque corrupti quos dolores quas molestias excepturi occaecati cupiditate provident similique mollitia animi perferendis doloribus asperiores repellat nam libero tempore cum soluta nobis eligendi optio cumque nihil impedit quo minus quod maxime placeat facere possimus omnis voluptas assumenda delectus aut reiciendis voluptatibus maiores alias consequatur perferendis itaque earum rerum hic tenetur a sapiente delectus ut aut reiciendis voluptatibus maiores alias consequatur perferendis doloribus asperiores repellat temporibus autem quibusdam officiis debitis necessitatibus saepe eveniet voluptates repudiandae recusandae`

const RAVEN = `once upon a midnight dreary while I pondered weak and weary over many a quaint and curious volume of forgotten lore while I nodded nearly napping suddenly there came a tapping as of some one gently rapping rapping at my chamber door tis some visitor I muttered tapping at my chamber door only this and nothing more ah distinctly I remember it was in the bleak December and each separate dying ember wrought its ghost upon the floor eagerly I wished the morrow vainly I had sought to borrow from my books surcease of sorrow sorrow for the lost Lenore for the rare and radiant maiden whom the angels name Lenore nameless here for evermore and the silken sad uncertain rustling of each purple curtain thrilled me filled me with fantastic terrors never felt before so that now to still the beating of my heart I stood repeating tis some visitor entreating entrance at my chamber door some late visitor entreating entrance at my chamber door this it is and nothing more presently my soul grew stronger hesitating then no longer sir said I or madam truly your forgiveness I implore but the fact is I was napping and so gently you came rapping and so faintly you came tapping tapping at my chamber door that I scarce was sure I heard you here I opened wide the door darkness there and nothing more`

const FAUST = `habe nun ach Philosophie Juristerei und Medizin und leider auch Theologie durchaus studiert mit heißem Bemühn da steh ich nun ich armer Tor und bin so klug als wie zuvor heiße Magister heiße Doktor gar und ziehe schon an die zehen Jahr herauf herab und quer und krumm meine Schüler an der Nase herum und sehe daß wir nichts wissen können das will mir schier das Herz verbrennen zwar bin ich gescheiter als all die Laffen Doktoren Magister Schreiber und Pfaffen mich plagen keine Skrupel noch Zweifel fürchte mich weder vor Hölle noch Teufel dafür ist mir auch alle Freud entrissen bilde mir nicht ein was Rechts zu wissen bilde mir nicht ein ich könnte was lehren die Menschen zu bessern und zu bekehren auch hab ich weder Gut noch Geld noch Ehr und Herrlichkeit der Welt es möchte kein Hund so länger leben drum hab ich mich der Magie ergeben ob mir durch Geistes Kraft und Mund nicht manch Geheimnis würde kund daß ich nicht mehr mit saurem Schweiß zu sagen brauche was ich nicht weiß daß ich erkenne was die Welt im Innersten zusammenhält schau alle Wirkenskraft und Samen und tu nicht mehr in Worten kramen`

const BATEAU = `comme je descendais des fleuves impassibles je ne me sentis plus guidé par les haleurs des peaux rouges criards les avaient pris pour cibles les ayant cloués nus aux poteaux de couleurs j'étais insoucieux de tous les équipages porteur de blés flamands ou de cotons anglais quand avec mes haleurs ont fini ces tapages les fleuves m'ont laissé descendre où je voulais dans les clapotements furieux des marées moi l'autre hiver plus sourd que les cerveaux d'enfants je courus et les péninsules démarrées n'ont pas subi tohu-bohus plus triomphants la tempête a béni mes éveils maritimes plus léger qu'un bouchon j'ai dansé sur les flots qu'on appelle rouleurs éternels de victimes dix nuits sans regretter l'oeil niais des falots plus douce qu'aux enfants la chair des pommes sures l'eau verte pénétra ma coque de sapin et des taches de vins bleus et des vomissures me lava dispersant gouvernail et grappin et dès lors je me suis baigné dans le poème de la mer infusé d'astres et lactescent dévorant les azurs verts où flottaison blême et ravie un noyé pensif parfois descend`

export const corpora: Record<CorpusId, string[]> = {
  lorem: LOREM.split(/\s+/),
  raven: RAVEN.split(/\s+/),
  faust: FAUST.split(/\s+/),
  bateau: BATEAU.split(/\s+/),
}

function rand(n: number): number {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0]! % n
}

function pick(words: string[]): string {
  return words[rand(words.length)] ?? ''
}

export function genWords(words: string[], n: number): string[] {
  const out: string[] = []
  let last = ''
  for (let i = 0; i < n; i++) {
    let w = pick(words)
    if (w === last && words.length > 1) w = pick(words)
    out.push(w)
    last = w
  }
  return out
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function genSentence(words: string[]): string {
  const len = 6 + rand(10)
  const ws = genWords(words, len)
  // sprinkle commas
  if (len > 8 && rand(2) === 0) {
    const at = 3 + rand(len - 5)
    ws[at] = ws[at] + ','
  }
  return capitalize(ws.join(' ')) + '.'
}

export function genParagraph(words: string[]): string {
  const n = 3 + rand(4)
  return Array.from({ length: n }, () => genSentence(words)).join(' ')
}

export function generate(corpus: CorpusId, type: 'words' | 'sentences' | 'paragraphs', length: number, startWithLorem: boolean): string {
  const words = corpora[corpus]
  const classic = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit'
  if (type === 'words') {
    const ws = genWords(words, length)
    if (startWithLorem && corpus === 'lorem') {
      const head = classic.replace(/,/g, '').toLowerCase().split(' ')
      for (let i = 0; i < Math.min(head.length, ws.length); i++) ws[i] = head[i]!
      ws[0] = capitalize(ws[0]!)
    }
    return ws.join(' ')
  }
  if (type === 'sentences') {
    const arr = Array.from({ length }, () => genSentence(words))
    if (startWithLorem && corpus === 'lorem' && arr.length) arr[0] = `${classic}, ${genWords(words, 4 + rand(5)).join(' ')}.`
    return arr.join(' ')
  }
  const paras = Array.from({ length }, () => genParagraph(words))
  if (startWithLorem && corpus === 'lorem' && paras.length) paras[0] = `${classic}, ${genWords(words, 4 + rand(5)).join(' ')}. ${paras[0]}`
  return paras.join('\n\n')
}
