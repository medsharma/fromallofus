import { useState, useEffect, useCallback, useRef } from 'react'
import { gsap } from 'gsap'
import './App.css'

/* ── Scroll Animations ──────────────────────────────── */
function useScrollAnimations() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const els = document.querySelectorAll('[data-animate]')
    if (!els.length) return
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target) }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

/* ── Count Up Number ─────────────────────────────────── */
function CountUpStat({ end, label, decimals = 0, suffix = '', animate = false, fractionOnly = false, lastDigitOnly = false }) {
  const integerPart = Math.trunc(end)
  const fractionTarget = Math.round((end - integerPart) * 10)
  const wholeTarget = Math.round(end)
  const lastDigitTarget = wholeTarget % 10
  const prefixValue = Math.floor(wholeTarget / 10)
  const initialValue = animate
    ? 0
    : (fractionOnly || lastDigitOnly ? (fractionOnly ? fractionTarget : lastDigitTarget) : end)
  const [value, setValue] = useState(initialValue)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    if (!animate) {
      setValue((fractionOnly || lastDigitOnly) ? (fractionOnly ? fractionTarget : lastDigitTarget) : end)
      return
    }
    if (hasAnimated) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(end)
      setHasAnimated(true)
      return
    }

    const el = document.querySelector(`[data-stat-label="${label}"]`)
    if (!el) return

    let rafId = 0
    let startTs = 0

    const observer = new IntersectionObserver(
      entries => {
        if (!entries[0]?.isIntersecting) return
        observer.disconnect()

        const baseDurationMs = 1400
        const target = (fractionOnly || lastDigitOnly) ? (fractionOnly ? fractionTarget : lastDigitTarget) : end
        const durationMs = (fractionOnly || lastDigitOnly)
          ? baseDurationMs * (Math.max(target, 1) / 9)
          : baseDurationMs
        const tick = ts => {
          if (!startTs) startTs = ts
          const progress = Math.min((ts - startTs) / durationMs, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setValue(target * eased)
          if (progress < 1) {
            rafId = window.requestAnimationFrame(tick)
          } else {
            setValue(target)
            setHasAnimated(true)
          }
        }

        rafId = window.requestAnimationFrame(tick)
      },
      { threshold: 0.35 }
    )

    observer.observe(el)

    return () => {
      observer.disconnect()
      if (rafId) window.cancelAnimationFrame(rafId)
    }
  }, [animate, end, fractionOnly, fractionTarget, hasAnimated, label, lastDigitOnly, lastDigitTarget])

  const shown = fractionOnly
    ? `${integerPart}.${Math.round(value)}`
    : lastDigitOnly
      ? `${prefixValue}${Math.round(value)}`
    : (decimals > 0 ? value.toFixed(decimals) : String(Math.round(value)))

  return (
    <span className="stat__n" data-stat-label={label} aria-label={`${end}${suffix} ${label}`}>
      {shown}{suffix}
    </span>
  )
}

/* ── Nav ────────────────────────────────────────────── */
function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const close = useCallback(() => setMenuOpen(false), [])

  return (
    <nav className={`nav${scrolled ? ' nav--solid' : ''}`} aria-label="Main navigation">
      <a href="/" className="nav__logo">From<em>AllOfUs</em></a>

      <ul className="nav__links" role="list">
        <li><a href="#process">How It Works</a></li>
        <li><a href="#book">The Book</a></li>
        <li><a href="#pricing">Pricing</a></li>
        <li><a href="#story">Our Story</a></li>
      </ul>

      <div className="nav__right">
        <a href="#pricing" className="nav__cta">Start a Book</a>
        <button
          className={`nav__burger${menuOpen ? ' is-open' : ''}`}
          onClick={() => setMenuOpen(v => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </div>

      <div
        id="mobile-menu"
        className={`nav__drawer${menuOpen ? ' is-open' : ''}`}
        aria-hidden={!menuOpen}
      >
        <ul className="nav__drawer-list" role="list">
          {[
            ['#process', 'How It Works'],
            ['#book',    'The Book'],
            ['#pricing', 'Pricing'],
            ['#story',   'Our Story'],
          ].map(([href, label]) => (
            <li key={href}><a href={href} onClick={close}>{label}</a></li>
          ))}
        </ul>
        <a href="#pricing" className="btn btn--teal nav__drawer-cta" onClick={close}>
          Start a Book
        </a>
      </div>
    </nav>
  )
}

/* ── Hero ───────────────────────────────────────────── */
function Hero() {
  return (
    <section className="hero" aria-label="Hero">
      <div className="hero__body">
        <p className="hero__label" data-animate>Group Gifts · Reimagined</p>
        <h1 className="hero__h1" data-animate data-delay="1">
          The Most Memorable Group Gift Ever
        </h1>
        <div data-animate data-delay="2">
          <a href="#pricing" className="btn btn--white-outline">Create Your Book</a>
        </div>
        <p className="hero__sub" data-animate data-delay="3">
          From $79 &nbsp;·&nbsp; Delivered in 96 hours &nbsp;·&nbsp; No app needed
        </p>
      </div>
    </section>
  )
}

/* ── Statement ──────────────────────────────────────── */
function Statement() {
  const stats = [
    { end: 4.9, decimals: 1, suffix: '', l: 'Average Rating' },
    { end: 94, decimals: 0, suffix: '%', l: 'Completion Rate' },
    { end: 96, decimals: 0, suffix: 'h', l: 'Delivery Guarantee' },
    { end: 50, decimals: 0, suffix: '+', l: 'Contributors Possible' },
  ]

  return (
    <section className="statement" aria-label="Value proposition">
      <p className="statement__text" data-animate>
        Not a card. Not a voucher.<br />
        A custom hardcover book, hand-designed by a real person,<br />
        filled with everyone who loves them.
      </p>
      <div className="statement__stats" role="list" aria-label="Key stats">
        {stats.map((s, i) => (
          <div className="stat" key={s.l} role="listitem" data-animate data-delay={String(i)}>
            <CountUpStat
              end={s.end}
              decimals={s.decimals}
              suffix={s.suffix}
              label={s.l}
              animate
              fractionOnly={s.l === 'Average Rating'}
              lastDigitOnly={s.l !== 'Average Rating'}
            />
            <span className="stat__l">{s.l}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ── How It Works ───────────────────────────────────── */
const STEPS = [
  { n: '01', t: 'The Link', b: 'Two minutes to create. Share it by text or email, works on any device, anywhere in the world.' },
  { n: '02', t: 'The Contribution', b: 'Everyone writes a message and uploads a photo. No app. No login. No friction.' },
  { n: '03', t: 'The Design', b: 'Our team hand-crafts every layout. No templates, every book is one of a kind.' },
  { n: '04', t: 'The Delivery', b: 'Printed and shipped to their door within 96 hours of submissions closing. Guaranteed.' },
]

function HowItWorks() {
  return (
    <section className="process" id="process" aria-labelledby="process-heading">
      <div className="wrap">
        <div className="process__top" data-animate>
          <span className="label">The Process</span>
          <h2 className="h2" id="process-heading">
            Simple to give.<br /><em>Impossible to forget.</em>
          </h2>
        </div>
        <div className="process__grid">
          {STEPS.map((s, i) => (
            <div className="process__step" key={s.n} data-animate data-delay={String(i)}>
              <span className="process__n" aria-hidden="true">{s.n}</span>
              <h3 className="process__t">{s.t}</h3>
              <p className="process__b">{s.b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── The Book ───────────────────────────────────────── */
function TheBook() {
  return (
    <section className="book" id="book" aria-labelledby="book-heading">
      <div className="book__media" aria-hidden="true">
        <video
          className="book__video"
          src="/hero.mov"
          autoPlay
          muted
          loop
          playsInline
        />
      </div>
      <div className="book__content">
        <div data-animate>
          <span className="label label--light">The Product</span>
          <h2 className="h2 h2--light" id="book-heading">
            A book worthy<br /><em>of every shelf.</em>
          </h2>
        </div>
        <ul className="book__list" data-animate data-delay="1">
          <li>Premium hardcover binding</li>
          <li>Unique interior, no templates, ever</li>
          <li>Hand-designed by a professional</li>
          <li>Printed and shipped in 96 hours</li>
          <li>Contributors from anywhere in the world</li>
        </ul>
        <div data-animate data-delay="2">
          <a href="#pricing" className="btn btn--white-outline btn--sm">See Pricing</a>
        </div>
      </div>
    </section>
  )
}

/* ── Occasion Carousel ──────────────────────────────── */
const CASES = [
  {
    name: 'Weddings & Anniversaries',
    heading: 'A lifetime of love,',
    headingEm: 'in one book.',
    body: 'Gather everyone who has watched your love story unfold, from the childhood best friend to the colleague who flew in from abroad. Works beautifully as a wedding guest book alternative, or a gift from the whole bridal party.',
    quote: '"She wept before she even reached the second page. We had 34 people from 8 countries contribute. I still cannot believe how easy it was."',
    quoteBy: 'Priya R.',
    quoteRole: 'Wedding gift · 34 contributors',
    bg: '#1B4744',
    image: '/wedding.webp',
    caption: 'Every person who watched your love story unfold, all in one place.',
  },
  {
    name: 'Milestone Birthdays',
    heading: 'Because 60 years',
    headingEm: 'deserves more than a cake.',
    body: 'A milestone birthday is a moment to reflect on every life you have touched. We make it simple for children, grandchildren, old colleagues, and long-distance friends to contribute something real and lasting.',
    quote: '"I was genuinely speechless. I expected something that looked like a school project. This looked like something from a designer\'s portfolio."',
    quoteBy: 'David J.',
    quoteRole: '60th Birthday · 28 contributors',
    bg: '#163D3A',
    image: '/birthday.webp',
    caption: 'A lifetime of moments, gathered in one place.',
  },
  {
    name: 'Graduations',
    heading: 'The beginning',
    headingEm: 'of everything.',
    body: 'Send them into the next chapter knowing exactly who is rooting for them. Parents, professors, roommates, teammates, everyone who shaped who they became, all in one book they will keep for life.',
    quote: '"My daughter carries it with her everywhere. It was the first thing that went into her dorm room, before the pillows, before anything."',
    quoteBy: 'Karen M.',
    quoteRole: 'College graduation gift · 22 contributors',
    bg: '#1B4744',
    image: '/graduation.webp',
    caption: 'Every voice that shaped them, bound together forever.',
  },
  {
    name: 'Moving Away',
    heading: 'So they always',
    headingEm: 'know where home is.',
    body: 'When someone leaves, it is easy to say we will visit and mean it. A FromAllOfUs book is a piece of the place they are leaving that they can carry with them forever, a reminder of everyone who loves them.',
    quote: '"He texted me from his new city that same night. Said it was the first thing he unpacked."',
    quoteBy: 'Amit S.',
    quoteRole: 'Farewell gift · 19 contributors',
    bg: '#163D3A',
    image: '/moving.png',
    caption: 'A piece of home they can carry anywhere.',
  },
  {
    name: 'Retirement',
    heading: 'Decades of impact.',
    headingEm: 'One book to hold it all.',
    body: 'A retiring colleague has shaped hundreds of lives. We make it possible for every one of them, current team members, alumni, clients, mentees, to say so properly, in one beautiful and lasting place.',
    quote: '"She wept the moment she opened it. I had 34 people from four countries. It was the easiest thing I have ever organized."',
    quoteBy: 'Michelle K.',
    quoteRole: 'Retirement gift · 34 contributors',
    bg: '#1B4744',
    image: '/retirement.jpg',
    caption: 'Decades of dedication, celebrated by everyone who witnessed it.',
  },
  {
    name: 'Team & Teacher Gifts',
    heading: 'The thank you',
    headingEm: 'they will actually keep.',
    body: 'A card gets read once. A book gets kept. Whether it is a teacher who changed everything or a coach who pushed them past what they thought was possible, a FromAllOfUs book says it properly.',
    quote: '"Our whole class of 28 contributed. She told us it was the best gift she had ever received in 22 years of teaching."',
    quoteBy: 'Taylor H.',
    quoteRole: 'Teacher gift · 28 contributors',
    bg: '#163D3A',
    image: '/team.jpg',
    caption: 'Because some thank-yous deserve more than a card.',
  },
]

function OccasionCarousel() {
  const [idx, setIdx] = useState(0)
  const [transitionDir, setTransitionDir] = useState('next')
  const [transitionPhase, setTransitionPhase] = useState('idle')
  const total = CASES.length

  const animateTo = useCallback((direction, updater) => {
    if (transitionPhase !== 'idle') return
    setTransitionDir(direction)
    setTransitionPhase('out')
    window.setTimeout(() => {
      setIdx(updater)
      setTransitionPhase('in')
      window.setTimeout(() => setTransitionPhase('idle'), 240)
    }, 170)
  }, [transitionPhase])

  const prev = useCallback(() => {
    animateTo('prev', i => (i - 1 + total) % total)
  }, [animateTo, total])

  const next = useCallback(() => {
    animateTo('next', i => (i + 1) % total)
  }, [animateTo, total])

  const goTo = useCallback((targetIdx) => {
    if (targetIdx === idx || transitionPhase !== 'idle') return
    const rawDiff = targetIdx - idx
    const forward = (rawDiff + total) % total
    const backward = (idx - targetIdx + total) % total
    const direction = forward <= backward ? 'next' : 'prev'
    animateTo(direction, () => targetIdx)
  }, [animateTo, idx, total, transitionPhase])
  const prevIdx = (idx - 1 + total) % total
  const nextIdx = (idx + 1) % total

  useEffect(() => {
    const fn = e => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [prev, next])

  const c = CASES[idx]
  const prevCase = CASES[prevIdx]
  const nextCase = CASES[nextIdx]

  return (
    <section className="occ" aria-labelledby="occ-heading">
      <div className="wrap">
        <div className="occ__header" data-animate>
          <div>
            <span className="label">Every Occasion</span>
            <h2 className="h2" id="occ-heading">
              For every milestone.<br /><em>Every moment of gratitude.</em>
            </h2>
          </div>
          <div className="occ__nav">
            <span className="occ__counter" aria-live="polite">
              {String(idx + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </span>
            <span className="occ__nav-hint">Click left/right cards</span>
          </div>
        </div>
      </div>

      <div className={`occ__stage occ__stage--${transitionDir} occ__stage--${transitionPhase}`}>
        <div className="occ__stage-bg" aria-hidden="true" />

        <button
          type="button"
          className="occ__preview occ__preview--left"
          onClick={prev}
          aria-label={`View previous case: ${prevCase.name}`}
        >
          <div className="occ__preview-top">
            <span>{String(prevIdx + 1).padStart(2, '0')}</span>
            <span>{prevCase.name}</span>
          </div>
          <div className="occ__preview-surface" style={{ backgroundColor: prevCase.bg, ...(prevCase.image && { backgroundImage: `url(${prevCase.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }) }} />
        </button>

        <article className="occ__feature">
          <div className="occ__feature-top">
            <span className="occ__feature-badge">{c.name}</span>
          </div>

          <div className="occ__feature-surface" style={{ background: c.bg }}>
            {c.image && (
              <>
                <img src={c.image} className="occ__feature-img" alt={c.name} />
                <div className="occ__feature-img-overlay" aria-hidden="true" />
              </>
            )}
            <h3 className="occ__feature-heading">
              {c.heading}<br /><em>{c.headingEm}</em>
            </h3>
            <p className="occ__feature-body">{c.body}</p>
            <a href="#pricing" className="btn btn--white-outline btn--sm">
              Start This Gift
            </a>
            {c.caption && <p className="occ__feature-caption">{c.caption}</p>}
          </div>
        </article>

        <button
          type="button"
          className="occ__preview occ__preview--right"
          onClick={next}
          aria-label={`View next case: ${nextCase.name}`}
        >
          <div className="occ__preview-top">
            <span>{String(nextIdx + 1).padStart(2, '0')}</span>
            <span>{nextCase.name}</span>
          </div>
          <div className="occ__preview-surface" style={{ backgroundColor: nextCase.bg, ...(nextCase.image && { backgroundImage: `url(${nextCase.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }) }} />
        </button>
      </div>

      <div className="occ__dots" role="tablist" aria-label="Occasion slides">
        {CASES.map((cs, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === idx}
            aria-label={`Go to ${cs.name}`}
            className={`occ__dot${i === idx ? ' occ__dot--active' : ''}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </section>
  )
}

/* ── Pricing ────────────────────────────────────────── */
const TIERS = [
  {
    name: 'Intimate',
    price: '$79',
    cap: 'Up to 15 contributors',
    features: ['Custom professional design', 'Premium hardcover', '96-hr delivery', 'Live dashboard'],
  },
  {
    name: 'Beloved',
    price: '$129',
    cap: 'Up to 30 contributors',
    features: ['Everything in Intimate', 'Auto submission reminders', 'Deadline nudges to stragglers'],
    featured: true,
  },
  {
    name: 'Grand',
    price: '$199',
    cap: 'Up to 50 contributors',
    features: ['Everything in Beloved', 'Priority design support', 'Expedited design queue'],
  },
  {
    name: 'Legacy',
    price: 'Custom',
    cap: '50+ contributors',
    features: ['Unlimited contributors', 'Dedicated design team', 'White-glove service', 'Bulk discounts'],
  },
]

function Pricing() {
  return (
    <section className="pricing" id="pricing" aria-labelledby="pricing-heading">
      <div className="wrap">
        <div className="pricing__top" data-animate>
          <span className="label">Pricing</span>
          <h2 className="h2" id="pricing-heading">
            Choose your<br /><em>moment.</em>
          </h2>
          <p className="pricing__sub">
            Every tier includes custom professional design, premium hardcover printing, and the 96-hour delivery guarantee.
          </p>
        </div>
        <div className="pricing__grid">
          {TIERS.map((t, i) => (
            <div
              className={`tier${t.featured ? ' tier--featured' : ''}`}
              key={t.name}
              data-animate
              data-delay={String(i)}
            >
              {t.featured && <span className="tier__tag">Most Popular</span>}
              <div className="tier__name">{t.name}</div>
              <div className="tier__price">{t.price}</div>
              <div className="tier__cap">{t.cap}</div>
              <ul className="tier__features">
                {t.features.map(f => <li key={f}>{f}</li>)}
              </ul>
              <a
                href={t.name === 'Legacy' ? 'tel:9729032550' : '#'}
                className={`btn ${t.featured ? 'btn--teal' : 'btn--outline'}`}
                aria-label={`Choose the ${t.name} plan`}
              >
                {t.name === 'Legacy' ? 'Book a Call' : `Choose ${t.name}`}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── 3D Photo Carousel ──────────────────────────────── */
function PhotoCarousel3D() {
  const stageRef = useRef(null)
  const ringRef = useRef(null)
  const imgRefs = useRef([])

  useEffect(() => {
    const stage = stageRef.current
    const ring = ringRef.current
    const imgs = imgRefs.current
    if (!ring || !imgs.length) return

    let xPos = 0

    const getBgPos = (i) =>
      (100 - gsap.utils.wrap(0, 360, gsap.getProperty(ring, 'rotationY') - 180 - i * 36) / 360 * 500) + 'px 0px'

    const drag = (e) => {
      if (e.touches) e.clientX = e.touches[0].clientX
      gsap.to(ring, {
        rotationY: '-=' + ((Math.round(e.clientX) - xPos) % 360),
        onUpdate: () => { gsap.set(imgs, { backgroundPosition: (i) => getBgPos(i) }) }
      })
      xPos = Math.round(e.clientX)
    }

    const dragEnd = () => {
      window.removeEventListener('mousemove', drag)
      window.removeEventListener('touchmove', drag)
      gsap.set(ring, { cursor: 'grab' })
    }

    const dragStart = (e) => {
      if (e.touches) e.clientX = e.touches[0].clientX
      xPos = Math.round(e.clientX)
      gsap.set(ring, { cursor: 'grabbing' })
      window.addEventListener('mousemove', drag)
      window.addEventListener('touchmove', drag)
    }

    const tl = gsap.timeline()
      .set(ring, { rotationY: 180, cursor: 'grab' })
      .set(imgs, {
        rotateY: (i) => i * -36,
        transformOrigin: '50% 50% 500px',
        z: -500,
        backgroundImage: (i) => 'url(https://picsum.photos/id/' + (i + 32) + '/600/400/)',
        backgroundPosition: (i) => getBgPos(i),
        backfaceVisibility: 'hidden'
      })
      .from(imgs, { duration: 1.5, y: 200, opacity: 0, stagger: 0.1, ease: 'expo' })
      .add(() => {
        imgs.forEach(img => {
          img.addEventListener('mouseenter', (e) => {
            const current = e.currentTarget
            gsap.to(imgs, { opacity: (i, t) => (t === current) ? 1 : 0.5, ease: 'power3' })
          })
          img.addEventListener('mouseleave', () => {
            gsap.to(imgs, { opacity: 1, ease: 'power2.inOut' })
          })
        })
      }, '-=0.5')

    stage.addEventListener('mousedown', dragStart)
    stage.addEventListener('touchstart', dragStart)
    window.addEventListener('mouseup', dragEnd)
    window.addEventListener('touchend', dragEnd)

    return () => {
      tl.kill()
      stage.removeEventListener('mousedown', dragStart)
      stage.removeEventListener('touchstart', dragStart)
      window.removeEventListener('mouseup', dragEnd)
      window.removeEventListener('touchend', dragEnd)
      window.removeEventListener('mousemove', drag)
      window.removeEventListener('touchmove', drag)
    }
  }, [])

  return (
    <section className="carousel3d-section">
      <div className="carousel3d-stage" ref={stageRef}>
        <div className="carousel3d-container">
          <div className="carousel3d-ring" ref={ringRef}>
            {Array.from({ length: 10 }, (_, i) => (
              <div
                className="carousel3d-img"
                key={i}
                ref={el => { imgRefs.current[i] = el }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Testimonials ───────────────────────────────────── */
const REVIEWS = [
  {
    q: "She wept the moment she opened it. I had 34 people from four countries, I thought it would be chaos. It was the easiest thing I've ever organized.",
    name: 'Michelle K.',
    role: 'Retirement Gift · 34 contributors',
  },
  {
    q: "I was genuinely speechless. I expected something that looked like a school project. This looked like something from a designer's portfolio.",
    name: 'David J.',
    role: '60th Birthday · 28 contributors',
    featured: true,
  },
  {
    q: "The auto reminders were a lifesaver. I didn't send a single follow-up myself. The book arrived two days before the party.",
    name: 'Priya R.',
    role: 'Farewell Gift · 21 contributors',
  },
]

function Testimonials() {
  return (
    <section className="testimonials" aria-labelledby="testimonials-heading">
      <div className="wrap">
        <div className="testimonials__top" data-animate>
          <div>
            <span className="label">Organizer Reviews</span>
            <h2 className="h2" id="testimonials-heading">
              They said it better<br /><em>than we ever could.</em>
            </h2>
          </div>
          <div aria-label="4.9 out of 5 stars">
            <span className="rating__n">4.9</span>
            <span className="rating__l">Out of 5 · Organizer reviews</span>
          </div>
        </div>
        <div className="testimonials__grid">
          {REVIEWS.map((r, i) => (
            <figure
              className={`review${r.featured ? ' review--featured' : ''}`}
              key={r.name}
              data-animate
              data-delay={String(i)}
            >
              <blockquote className="review__q">"{r.q}"</blockquote>
              <figcaption className="review__a">
                <strong>{r.name}</strong>, {r.role}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Founder Story ──────────────────────────────────── */
function FounderStory() {
  return (
    <section className="founder" id="story" aria-labelledby="story-heading">
      <div className="founder__media">
        <img
          src="/origin-reading.jpg"
          alt="Someone reading the very first handmade book, by fairy lights"
          className="founder__photo"
        />
      </div>
      <div className="founder__content">
        <div data-animate>
          <span className="label">Our Story</span>
          <h2 className="h2" id="story-heading">
            It started with<br /><em>Anika's birthday.</em>
          </h2>
        </div>
        <div className="founder__body" data-animate data-delay="1">
          <p>
            Shivan wanted to do something meaningful for his girlfriend&apos;s birthday.
            He gathered messages and photos from her friends scattered across different
            cities, and spent days designing a handmade book.
          </p>
          <p>
            When she opened it, she cried <strong>happy tears</strong>. He realized
            the gift wasn&apos;t about design skills or free time. It was about
            bringing everyone who loved her into one place.
          </p>
          <p>
            FromAllOfUs exists so that anyone can give that same gift.
          </p>
        </div>
        <div className="founder__originals" data-animate data-delay="2">
          <figure className="founder__orig-item">
            <img src="/origin-spread.jpg" alt="A page spread from the original handmade book" />
          </figure>
          <figure className="founder__orig-item">
            <img src="/origin-prints.jpg" alt="Physical printed pages from the original handmade gift" />
          </figure>
        </div>
        <p className="founder__caption" data-animate data-delay="2">The very first version, made completely by hand.</p>
        <div data-animate data-delay="3">
          <a href="#pricing" className="btn btn--outline">Start Your Book</a>
        </div>
      </div>
    </section>
  )
}

/* ── Final CTA ──────────────────────────────────────── */
function FinalCTA() {
  return (
    <section className="cta" aria-labelledby="cta-heading">
      <p className="cta__label" data-animate>Ready to begin?</p>
      <h2 className="cta__h" id="cta-heading" data-animate data-delay="1">
        The most memorable<br />
        group gift ever starts<br />
        in <em>two minutes.</em>
      </h2>
      <div data-animate data-delay="2">
        <a href="#pricing" className="btn btn--teal">Create Your Book from $79</a>
      </div>
      <p className="cta__small" data-animate data-delay="3">
        No app required &nbsp;·&nbsp; 96-hour guarantee &nbsp;·&nbsp; Human-designed &nbsp;·&nbsp; 4.9 / 5 stars
      </p>
    </section>
  )
}

/* ── Footer ─────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <div className="footer__logo">From<em>AllOfUs</em></div>
          <p className="footer__tagline">
            Turning collective love into the kind of gift someone holds onto forever.
          </p>
          <a href="tel:9729032550" className="footer__phone">972-903-2550</a>
        </div>
        <nav className="footer__col" aria-label="Product">
          <span className="footer__col-title">Product</span>
          <a href="#process">How It Works</a>
          <a href="#book">The Book</a>
          <a href="#pricing">Pricing</a>
          <a href="#pricing">Start a Book</a>
        </nav>
        <nav className="footer__col" aria-label="Occasions">
          <span className="footer__col-title">Occasions</span>
          <a href="#">Weddings</a>
          <a href="#">Birthdays</a>
          <a href="#">Graduations</a>
          <a href="#">Retirement</a>
        </nav>
        <nav className="footer__col" aria-label="Company">
          <span className="footer__col-title">Company</span>
          <a href="#story">Our Story</a>
          <a href="tel:9729032550">Book a Call</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms</a>
        </nav>
      </div>
      <div className="footer__bottom">
        <span>© 2026 FromAllOfUs. All rights reserved.</span>
        <div>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </div>
      </div>
    </footer>
  )
}

/* ── App ────────────────────────────────────────────── */
export default function App() {
  useScrollAnimations()
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Statement />
        <HowItWorks />
        <TheBook />
        <OccasionCarousel />
        <Pricing />
        <PhotoCarousel3D />
        <Testimonials />
        <FounderStory />
        <FinalCTA />
      </main>
      <Footer />
    </>
  )
}
