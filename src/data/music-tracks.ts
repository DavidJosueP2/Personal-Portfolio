import cover93 from "@/assets/img/albums-covers/93-til-infinity.webp"
import coverBroncho from "@/assets/img/albums-covers/broncho-easy-way-out.webp"
import coverDopeLemon from "@/assets/img/albums-covers/dope-lemon-honey-bones.webp"
import coverFroth from "@/assets/img/albums-covers/froth-patterns.webp"
import coverGhostwomanAnne from "@/assets/img/albums-covers/ghostwoman-anne-if.webp"
import coverGhostwomanDoYou from "@/assets/img/albums-covers/ghostwoman-do-you.webp"
import coverGlyders from "@/assets/img/albums-covers/glyders-marias-hunt.webp"
import coverTdcc from "@/assets/img/albums-covers/two-door-cinema-club-tourist-history.webp"
import coverWunderhorse from "@/assets/img/albums-covers/wunderhorse-cub.webp"

export type MusicTrack = {
  id: string
  title: string
  artist: string
  src: string
  cover: string
  duration: number
}

export const musicTracks: readonly MusicTrack[] = [
  {
    id: "93-til-infinity",
    title: "93 'Til Infinity",
    artist: "Souls of Mischief",
    src: new URL("../assets/music/93-publiclicense.mp3", import.meta.url).toString(),
    cover: cover93,
    duration: 286,
  },
  {
    id: "purple",
    title: "Purple",
    artist: "Wunderhorse",
    src: new URL("../assets/music/purple-publiclicense.mp3", import.meta.url).toString(),
    cover: coverWunderhorse,
    duration: 203,
  },
  {
    id: "stonecutters",
    title: "Stonecutters",
    artist: "Dope Lemon",
    src: new URL("../assets/music/stonecutters-publiclicense.mp3", import.meta.url).toString(),
    cover: coverDopeLemon,
    duration: 270,
  },
  {
    id: "do-you",
    title: "Do You",
    artist: "Ghostwoman",
    src: new URL("../assets/music/doyou-publiclicense.mp3", import.meta.url).toString(),
    cover: coverGhostwomanDoYou,
    duration: 185,
  },
  {
    id: "easy-way-out",
    title: "Easy Way Out",
    artist: "Broncho",
    src: new URL("../assets/music/easywayout-publiclicense.mp3", import.meta.url).toString(),
    cover: coverBroncho,
    duration: 181,
  },
  {
    id: "the-end-of-a-gun",
    title: "The End of a Gun",
    artist: "Ghostwoman",
    src: new URL("../assets/music/endofagun-publiclicense.mp3", import.meta.url).toString(),
    cover: coverGhostwomanAnne,
    duration: 176,
  },
  {
    id: "geneva-strangemod",
    title: "Geneva Strangemod",
    artist: "Glyders",
    src: new URL("../assets/music/geneva-publiclicense.mp3", import.meta.url).toString(),
    cover: coverGlyders,
    duration: 161,
  },
  {
    id: "i-can-talk",
    title: "I Can Talk",
    artist: "Two Door Cinema Club",
    src: new URL("../assets/music/icantalk-publiclicense.mp3", import.meta.url).toString(),
    cover: coverTdcc,
    duration: 177,
  },
  {
    id: "leader-of-the-pack",
    title: "Leader of the Pack",
    artist: "Wunderhorse",
    src: new URL("../assets/music/leader-publiclicense.mp3", import.meta.url).toString(),
    cover: coverWunderhorse,
    duration: 184,
  },
  {
    id: "lost-my-mind",
    title: "Lost My Mind",
    artist: "Froth",
    src: new URL("../assets/music/lostmymind-publiclicense.mp3", import.meta.url).toString(),
    cover: coverFroth,
    duration: 235,
  },
  {
    id: "marinade",
    title: "Marinade",
    artist: "Dope Lemon",
    src: new URL("../assets/music/marinade-publiclicense.mp3", import.meta.url).toString(),
    cover: coverDopeLemon,
    duration: 240,
  },
] as const
