# The World Today — 24 November 2026

[![make.fun](https://make.fun/badge/news-image-20261124.svg)](https://make.fun/bounty/news-image-20261124)
[![Rank](https://make.fun/badge/news-image-20261124/aldy007x/news-image-20261124/rank.svg)](https://make.fun/bounty/news-image-20261124)
[![Reward](https://make.fun/badge/news-image-20261124/aldy007x/news-image-20261124/reward.svg)](https://make.fun/bounty/news-image-20261124)

A one-page newspaper front page summing up **Tuesday 24 November 2026** in a single
1024x1024 image — built for the
[make.fun bounty "Sum up 24 November's world news in one image"](https://make.fun/bounty/news-image-20261124).

## The stories

- **Lead — Huang returns as Nvidia chief:** Nvidia's board unanimously reinstated
  Jensen Huang as chief executive, 11 days after he resigned over revelations of
  extramarital affairs, one with a woman US authorities suspect of spying for
  China. Shares surged more than 31 percent; the US moved to blacklist Megaspeed,
  the Singapore chip firm at the centre of the scandal.
- **Korea:** Russian military planes entered South Korea's air defence zone off
  Ulleung Island; Seoul scrambled jets and told residents to shelter.
- **Libya:** seven Ukrainian sea drones sank the Russian corvette
  Merkury at Benghazi and hit the cargo ship MV Angara; a Ka-27 helicopter aboard
  was destroyed.
- **Kyiv:** a Russian strike on a five-storey block in Dymer killed 11; three more
  died at a supermarket in Vyshneve.
- **Gulf:** Iran stepped up attacks on US bases and civilian sites in the Gulf and
  sued for $290bn as a US blockade and sanctions squeeze the country.
- **Europe:** the European Commission proposed a 22nd sanctions package on Russia,
  banning Russian teams under the Russian flag in EU events.
- **Law:** Virginia and Oregon sued SpaceX over sexual imagery made by its Grok AI
  chatbot.
- **Ticker:** Mexico arrests drug lord El Chapo Isidro; Israeli strikes kill 3 in
  Gaza, including an UNRWA worker; O'Hare ground stop; Spain's right leads polls
  ahead of the Nov 29 vote; Trump, Xi and Putin issue a joint statement at APEC.

Sources: Reuters, AP, AFP, The Times, CNN, Korea JoongAng Daily.

## How it works

`main.ts` (Node 22, no dependencies) draws the whole front page with its own
pixel canvas, its own 5x7 dot-matrix type, and its own PNG writer — no image
files, no network, no external assets. It writes the image to `/output/entry.png`.

```sh
node main.ts
```

Two runs produce byte-identical output (verified with SHA-256).

## License

MIT
