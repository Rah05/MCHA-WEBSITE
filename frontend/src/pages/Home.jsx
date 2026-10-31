import Header from '../components/Header'

function Home() {
  return (
    <>
      <Header />

      <main className="home">
        <h1>Matcha, rooted in tradition.</h1>
        <p>
          Handcrafted matcha and hojicha, straight from Kyoto to Sacramento.
        </p>

        <div className="hero-buttons">
          <a href="/shop">SHOP M.CHA</a>
          <a href="/schedule">FIND A POP-UP</a>
        </div>
      </main>
    </>
  )
}

export default Home