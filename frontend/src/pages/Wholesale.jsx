import Header from '../components/Header'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import './Wholesale.css'

// Only a draft based on old page, needs to be approved with client before launch!!
// Wholesale pricing is only shared with approved accounts.
const WHY_MCHA = [
  {
    title: 'Sourced and made in Japan',
    text: 'Our matcha comes from Japan and is prepared with care to keep its authentic character and quality.',
  },
  {
    title: 'Blended for balance',
    text: 'A bright green color, a pleasant aroma, and a smooth, gentle bitterness in every batch.',
  },
  {
    title: 'Dependable supply',
    text: 'A flexible sourcing approach keeps product available when you need it.',
  },
  {
    title: 'Pricing built for volume',
    text: 'Buying in bulk lets us offer business pricing without giving up quality.',
  },
]

const FOR_LATTES = [
  {
    title: 'Color that holds',
    text: 'Stays a vivid green even when mixed into milk.',
  },
  {
    title: 'Smooth flavor',
    text: 'A balanced taste that works with milk and does not overpower it.',
  },
  {
    title: 'Ready for busy days',
    text: 'Consistent results across large numbers of drinks.',
  },
]

const FOR_SWEETS = [
  { title: 'Baked goods', text: 'Cakes, rolls, and pastries that keep their color and matcha flavor.' },
  { title: 'Confections', text: 'Chocolates, jellies, and dessert cubes with a bold green finish.' },
  { title: 'Mochi and daifuku', text: 'The bright coating and true matcha taste these sweets need.' },
  { title: 'Ice cream', text: 'A smooth, creamy base with a clean matcha flavor.' },
  { title: 'Sauces and glazes', text: 'Glossy, deeply colored sauces for dipping and drizzling.' },
  { title: 'Blending grades', text: 'Shades from light to deep green to suit your recipe.' },
]

const STEPS = [
  {
    title: 'Send a request',
    text: 'Fill out a short form with your contact and business details.',
  },
  {
    title: 'We review it',
    text: 'An M.CHA team member reviews your request and gets in touch.',
  },
  {
    title: 'Get your pricing',
    text: 'Approved businesses receive wholesale pricing and ordering details.',
  },
]

function Wholesale() {
  return (
    <>
      <Header />

      <main className="wholesale">
        <section className="wholesale-hero">
          <p className="wholesale-eyebrow">Wholesale</p>
          <h1>Matcha for your menu.</h1>
          <p className="wholesale-intro">
            Japanese matcha blended for lattes and sweets, made for cafes,
            bakeries, and dessert makers who need steady quality and a
            dependable supply.
          </p>
          <div className="wholesale-buttons">
            <Button href="/wholesale/inquiry">Request wholesale pricing</Button>
            <Button href="/shop" variant="secondary">Browse the shop</Button>
          </div>
        </section>

        <section className="wholesale-section">
          <p className="wholesale-eyebrow">Why M.CHA</p>
          <h2>What sets us apart</h2>
          <div className="wholesale-grid">
            {WHY_MCHA.map((item) => (
              <Card key={item.title} title={item.title}>
                <p>{item.text}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="wholesale-section">
          <p className="wholesale-eyebrow">For drinks</p>
          <h2>Made for lattes</h2>
          <div className="wholesale-grid">
            {FOR_LATTES.map((item) => (
              <Card key={item.title} title={item.title}>
                <p>{item.text}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="wholesale-band">
          <div className="wholesale-section">
            <p className="wholesale-eyebrow">For desserts</p>
            <h2>Great in sweets</h2>
            <div className="wholesale-grid">
              {FOR_SWEETS.map((item) => (
                <Card key={item.title} title={item.title}>
                  <p>{item.text}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="wholesale-section">
          <p className="wholesale-eyebrow">How it works</p>
          <h2>Three simple steps</h2>
          <ol className="wholesale-steps wholesale-steps--light">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <span className="wholesale-step-number">{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
          <p className="wholesale-note">
            Wholesale pricing is shared with approved businesses after we review
            your request.
          </p>
        </section>

        <section className="wholesale-hero">
          <h2>Ready to talk wholesale?</h2>
          <p className="wholesale-intro">
            Send us a request and we'll be in touch.
          </p>
          <Button href="/wholesale/inquiry">Request wholesale pricing</Button>
        </section>
      </main>
    </>
  )
}

export default Wholesale