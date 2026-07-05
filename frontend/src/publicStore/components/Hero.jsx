import logo from '../../NNN.png'

function Hero() {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden bg-[#050505] border-b border-white/10"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_40%,rgba(255,199,44,.22),transparent_34%),linear-gradient(135deg,#050505_0%,#120000_42%,#4b0606_100%)]" />

      <div className="relative max-w-7xl mx-auto px-5 md:px-6 py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-3 bg-black/70 border border-white/10 rounded-full px-4 py-3">
              <img
                src={logo}
                alt="American Burger"
                className="w-10 h-10 rounded-full bg-yellow-400 p-1"
              />
              <span className="font-black text-white">
                American Burger Arica
              </span>
            </div>

            <h1 className="mt-8 text-[54px] sm:text-7xl md:text-8xl lg:text-9xl font-black leading-[0.86] tracking-tight text-white">
              TU
              <br />
              BURGER
              <br />
              <span className="text-yellow-400">FAVORITA</span>
            </h1>

            <p className="mt-7 text-lg md:text-2xl text-white/90 max-w-xl leading-relaxed">
              Hamburguesas premium, papas crujientes y pollo crispy.
              Pide online directo a American Burger.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <a
                href="#menu"
                className="bg-yellow-400 hover:bg-yellow-300 text-black px-8 py-5 rounded-full font-black text-lg text-center shadow-xl"
              >
                Pedir ahora
              </a>

              <a
                href="https://wa.me/56930809265?text=Hola%20American%20Burger%20🍔%20quiero%20hacer%20un%20pedido."
                target="_blank"
                rel="noreferrer"
                className="bg-white text-black px-8 py-5 rounded-full font-black text-lg text-center"
              >
                WhatsApp
              </a>
            </div>
          </div>

          <div className="relative flex justify-center">
            <div className="absolute w-[300px] h-[300px] md:w-[520px] md:h-[520px] rounded-full bg-yellow-400/25 blur-3xl" />

            <div className="relative">
              <div className="absolute -top-3 -left-3 bg-black border border-white/10 rounded-2xl px-4 py-3 z-10">
                <p className="text-neutral-400 text-xs font-bold">Desde</p>
                <p className="text-yellow-400 text-2xl md:text-3xl font-black">$4.900</p>
              </div>

              <div className="text-[220px] sm:text-[290px] md:text-[390px] leading-none drop-shadow-[0_35px_40px_rgba(0,0,0,.75)] select-none">
                🍔
              </div>

              <div className="absolute bottom-3 right-0 bg-yellow-400 text-black px-5 py-3 rounded-3xl shadow-2xl">
                <p className="text-xs font-black">COMBO</p>
                <p className="text-xl md:text-2xl font-black">+ PAPAS</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ['🍔', 'Carne premium'],
            ['🍟', 'Papas crujientes'],
            ['🛵', 'Delivery rápido'],
            ['💳', 'Efectivo o transferencia']
          ].map(([icon, text]) => (
            <div
              key={text}
              className="bg-white rounded-3xl p-5 flex items-center gap-4 text-black"
            >
              <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center text-xl">
                {icon}
              </div>

              <p className="font-black">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Hero
