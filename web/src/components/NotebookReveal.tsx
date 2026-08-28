import { useEffect, useRef } from 'react'

const STORY_EN = {
  title: 'The Gardener and the Wilted Garden',
  paragraphs: [
    'Edwin inherited an ancient garden. His grandfather’s notebook read: “Here once bloomed roses that sang.” But now all that remained were gray-brown soil and a few dying dwarf cypresses.',
    'He resolved to restore its glory. In the first year, he traveled through seven kingdoms and bought the rarest seeds—blue-flame tulips, moonlit water-lilies, honey-drop vines. He mixed nutrient solutions according to authoritative manuals, precise to the milligram. The seedlings were dazzling at first, but within three months their leaves curled yellow and their roots blackened. He added a “super-vitality elixir”—and the soil hardened like stone.',
    'In the second year, he hired three celebrated gardeners at great cost. One said the garden lacked sunlight, so he erected an array of crystal prisms; another said it lacked music, so he played harmonic frequencies day and night; the third said it lacked spiritual energy, so he buried seventy-two feng-shui crystal stones. The garden only grew worse—the dwarf cypresses died, weeds ran riot, and even the earthworms vanished.',
    'In the third year, he despaired. One twilight, he collapsed under the only surviving wild olive tree, when he suddenly noticed a small patch of moss beside the roots—vivid emerald green, with a few beetles leisurely feeding on fallen fruit. That moss had never been watered, never fertilized, never serenaded with music.',
    'Acting on an inexplicable impulse, he scooped up a handful of soil from beneath the moss and placed it under a microscope. He saw a dense network of mycelium, like a silvery underground neural web; he saw protozoa preying on bacteria and excreting nutrients; he saw dead leaves being broken down into humus and then absorbed by root hairs. All of it, without outside intervention, ran with intricate precision and unhurried grace.',
    'Edwin threw away all his fertilizer formulas and imported seeds. He began doing something strange: every day, he simply laid the garden’s own dead branches and fallen leaves back onto the soil, occasionally turned the surface layer—and then did nothing else. He stopped measuring pH, stopped playing sound waves, stopped driving away “pests.” He merely observed: how wild peas climbed the dwarf cypresses, how lichens weathered the rocks, how ants carried spores.',
    'In the first year, the garden looked wilder than ever. In the second year, wildflowers burst from the stone crevices—three times as many species as he had ever brought from abroad. In the third year, the wild olive tree burst into a profusion of silver blossoms, and their fragrance drew back the blue-tailed bees, long thought extinct. The singing roses never returned, but there appeared an undocumented wild orchid that changed color under moonlight. From then on, the garden no longer needed his “care”—it spread, succeeded itself, died, and was reborn in an endless cycle.',
    'On his deathbed, Edwin said to his apprentice: “I spent three years searching the world for ‘vitality,’ only to find that it had always been in the rotting soil beneath my feet. Vitality is not a thing you can ‘take’—it is a state of letting it happen on its own.”',
  ],
}

const STORY_ZH = {
  title: '园丁与枯园',
  paragraphs: [
    '艾德温继承了一座古老的花园。祖父的笔记里写着：“此地曾开过会唱歌的玫瑰。”可如今只有灰褐的土层和几株垂死的矮柏。',
    '他决心重现辉煌。第一年，他走遍七国，买来最珍稀的种子——蓝焰郁金香、夜光睡莲、蜜滴藤萝。他按权威手册调配营养液，精确到毫克。花苗初时惊艳，但不出三月，叶片卷黄，根系发黑。他加施“超级活力素”，结果土壤板结如石。',
    '第二年，他高薪聘请三位名园丁。一位说缺阳光，他架起水晶棱镜阵列；一位说缺音乐，他昼夜播放和谐频率；一位说缺灵气，他埋下七十二颗风水晶石。花园反而更糟——矮柏枯死，杂草疯长，连蚯蚓都绝迹了。',
    '第三年，他绝望了。某个黄昏，他瘫坐在唯一存活的野橄榄树下，忽然发现树根旁有一小片苔藓，翠绿欲滴，上面趴着几只甲虫，正悠然啃食落果。那片苔藓从未被浇灌、从未被施肥、从未被听过音乐。',
    '他鬼使神差地挖起一捧苔藓下的土，放在显微镜下。他看到密密麻麻的菌丝网络，像一张银色的地下神经网络；他看到原生动物在捕食细菌，又排出养分；他看到枯叶被分解成腐殖质，再被根毛吸收。这一切，没有外来干预，却运转得精密而从容。',
    '艾德温扔掉所有肥料配方和进口种子。他开始做一件古怪的事：每天只把花园里的枯枝落叶重新铺回土面，偶尔翻松表层，然后——什么都不做。他不再测量酸碱度，不再播放声波，不再驱赶“害虫”。他只是观察：野豌豆如何爬上矮柏，地衣如何风化岩石，蚂蚁如何搬运孢子。',
    '第一年，花园看似更荒了。第二年，野花从石缝中涌出，种类比他从国外带回来的还多三倍。第三年，那株野橄榄树竟开出满树银花，香气引来了早已绝迹的蓝尾蜂。会唱歌的玫瑰没有重现，但出现了一种从未记载过的、能在月光下变色的野兰。花园从此不再需要他“照顾”——它自己蔓延、更替、死亡、重生，循环不息。',
    '艾德温临终前对学徒说：“我花了三年去全世界寻找‘生机’，最后发现它一直在我脚下的腐土里。生机不是一件可以‘取来’的东西，而是一种‘让它自己发生’的状态。”',
  ],
}

const COLORS = ['#ffd76a', '#8ff0dc', '#ffffff', '#c9a2ff']

type Spot = { x: number; y: number; r: number; born: number }

/**
 * Notebook story pages + potion-cursor reveal (ported from prototype v3).
 * Mount inside `.hero`; leaves CTA / magnetic buttons untouched.
 */
export function NotebookReveal() {
  const heroRef = useRef<HTMLElement | null>(null)
  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const inkEnRef = useRef<HTMLDivElement>(null)
  const inkZhRef = useRef<HTMLDivElement>(null)
  const veilRef = useRef<HTMLDivElement>(null)
  const pencilRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const hero = document.getElementById('hero-stage')
    if (!hero) return
    heroRef.current = hero
    innerRef.current = hero.querySelector('.hero-inner')

    const left = leftRef.current
    const right = rightRef.current
    const veil = veilRef.current
    const pencil = pencilRef.current
    const inks = { left: inkEnRef.current, right: inkZhRef.current }
    if (!left || !right || !pencil || !inks.left || !inks.right) return

    const spots: { left: Spot[]; right: Spot[] } = { left: [], right: [] }
    let lx = 0
    let ly = 0

    const emit = (e: PointerEvent, page: HTMLElement, key: 'left' | 'right') => {
      const r = hero.getBoundingClientRect()
      const s = document.createElement('span')
      s.className = 'spark'
      s.textContent = '✦'
      s.style.left = `${e.clientX - r.left + (Math.random() - 0.5) * 40}px`
      s.style.top = `${e.clientY - r.top + (Math.random() - 0.5) * 32}px`
      s.style.color = COLORS[(Math.random() * COLORS.length) | 0]
      s.style.fontSize = `${10 + Math.random() * 10}px`
      s.style.textShadow = '0 0 6px currentColor'
      hero.appendChild(s)
      window.setTimeout(() => s.remove(), 900)

      const pr = page.getBoundingClientRect()
      spots[key].push({
        x: Math.min(100, Math.max(0, ((e.clientX - pr.left) / pr.width) * 100)),
        y: e.clientY - pr.top,
        r: 70 + Math.random() * 80,
        born: performance.now(),
      })
      if (spots[key].length > 40) spots[key].shift()
    }

    const paint = (key: 'left' | 'right') => {
      const now = performance.now()
      spots[key] = spots[key].filter((s) => now - s.born < 1200)
      const layers = spots[key].map((s) => {
        const age = now - s.born
        const a = age < 500 ? 1 : Math.max(0, 1 - (age - 500) / 700)
        return `radial-gradient(circle ${s.r}px at ${s.x}% ${s.y}px, rgba(0,0,0,${a.toFixed(2)}) 0 55%, transparent 78%)`
      })
      const val =
        layers.join(',') || 'radial-gradient(circle 0px at 50% 50%, #000 0, transparent 0)'
      const ink = inks[key]!
      ink.style.maskImage = val
      ink.style.webkitMaskImage = val
      ink.style.maskComposite = 'add'
      ;(ink.style as CSSStyleDeclaration & { webkitMaskComposite: string }).webkitMaskComposite =
        'source-over'
    }

    const onMove = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect()
      pencil.style.left = `${e.clientX - r.left}px`
      pencil.style.top = `${e.clientY - r.top}px`
      pencil.style.opacity = '1'

      const inner = innerRef.current
      if (inner) {
        const ir = inner.getBoundingClientRect()
        inner.style.setProperty('--lx', `${e.clientX - ir.left}px`)
        inner.style.setProperty('--ly', `${e.clientY - ir.top}px`)
        inner.style.setProperty('--lr', '220px')
      }
      if (veil) {
        veil.style.setProperty('--vx', `${e.clientX - r.left}px`)
        veil.style.setProperty('--vy', `${e.clientY - r.top}px`)
        veil.style.setProperty('--vr', '260px')
      }

      const d = Math.hypot(e.clientX - lx, e.clientY - ly)
      if (d > 26) {
        lx = e.clientX
        ly = e.clientY
        const key: 'left' | 'right' =
          e.clientX < left.getBoundingClientRect().right ? 'left' : 'right'
        emit(e, key === 'left' ? left : right, key)
        paint('left')
        paint('right')
      }
    }

    const onLeave = () => {
      innerRef.current?.style.setProperty('--lr', '0px')
      veil?.style.setProperty('--vr', '0px')
      pencil.style.opacity = '0'
      lx = 0
      ly = 0
    }

    hero.addEventListener('pointermove', onMove)
    hero.addEventListener('pointerleave', onLeave)
    const tick = window.setInterval(() => {
      paint('left')
      paint('right')
    }, 120)

    return () => {
      hero.removeEventListener('pointermove', onMove)
      hero.removeEventListener('pointerleave', onLeave)
      window.clearInterval(tick)
    }
  }, [])

  return (
    <>
      <div className="notebook" aria-hidden="true">
        <div className="nb-page left" ref={leftRef}>
          <span className="page-lang">English</span>
          <div className="paper">
            <div className="ink" id="inkEn" ref={inkEnRef}>
              <h4>{STORY_EN.title}</h4>
              {STORY_EN.paragraphs.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
          </div>
        </div>
        <div className="spine" />
        <div className="nb-page right" ref={rightRef}>
          <span className="page-lang">中文</span>
          <div className="paper">
            <div className="ink" id="inkZh" ref={inkZhRef}>
              <h4>{STORY_ZH.title}</h4>
              {STORY_ZH.paragraphs.map((p) => (
                <p key={p.slice(0, 16)}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="hero-veil" ref={veilRef} />
      <div className="pencil" id="pencil" ref={pencilRef} aria-hidden="true">
        🧪
      </div>
    </>
  )
}
