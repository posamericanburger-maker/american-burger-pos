import logo from '../../NNN.png'

function Hero() {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden bg-black border-b border-white/10"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,199,44,.18),transparent_28%),radial-gradient(circle_at_70%_60%,rgba(218,41,28,.45),transparent_36%),linear-gradient(135deg,#020202_0%,#090000_45%,#270000_100%)]" />

      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px)] bg-[size:44px_44px]" />

      <div className="relative max-w-7xl mx-auto px-5 md:px-8 py-10 md:py-20">
        <div className="grid lg:grid-cols-[1fr_0.9fr] gap-10 items-center">

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="relative w-32 h-32 md:w-44 md:h-44 shrink-0">
                <div className="absolute inset-0 rounded-full bg-yellow-400 blur-2xl opacity-70 animate-pulse" />
                <div className="absolute inset-0 rounded-full bg-yellow-400 shadow-[0_0_60px_rgba(255,199,44,.9)]" />

                <div className="relative w-full h-full rounded-full bg-yellow-400 p-2 border-4 border-yellow-300 shadow-2xl">
                  <img
                    src={logo}
                    alt="American Burger"
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
              </div>

              <div>
                <p className="text-yellow-400 font-black tracking-[0.35em] text-xs md:text-sm">
                  ARICA · CHILE
                </p>

                <h1 className="text-4xl md:text-6xl font-black text-white leading-none mt-2">
                  AMERICAN
                  <br />
                  <span className="text-red-600">BURGER</span>
                </h1>
              </div>
            </div>

            <p className="mt-10 text-red-500 font-black tracking-[0.22em] text-sm md:text-base">
              ★ HECHAS COMO TIENEN QUE SER
            </p>

            <h2 className="mt-4 text-[56px] sm:text-7xl md:text-8xl lg:text-[105px] font-black leading-[0.82] tracking-tight text-white">
              SABOR
              <br />
              QUE
              <br />
              <span className="text-yellow-400">
                TE ATRAPA
              </span>
            </h2>

            <p className="mt-7 text-lg md:text-2xl text-white/90 max-w-2xl leading-relaxed">
              Hamburguesas premium, papas crujientes y pollo crispy.
              Compra directo desde nuestra tienda online.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <a
                href="#menu"
                className="bg-yellow-400 hover:bg-yellow-300 text-black px-8 py-5 rounded-2xl font-black text-lg text-center shadow-2xl shadow-yellow-500/20 transition hover:scale-105"
              >
                🍔 PEDIR AHORA →
              </a>

              <a
                href="https://wa.me/56930809265?text=Hola%20American%20Burger%20🍔%20quiero%20hacer%20un%20pedido."
                target="_blank"
                rel="noreferrer"
                className="border border-yellow-400/70 bg-black/50 hover:bg-white hover:text-black text-white px-8 py-5 rounded-2xl font-black text-lg text-center transition"
              >
                💬 CHAT POR WHATSAPP
              </a>
            </div>
          </div>

          <div className="relative min-h-[360px] md:min-h-[520px] flex items-center justify-center">
            <div className="absolute w-[360px] h-[360px] md:w-[560px] md:h-[560px] rounded-full bg-red-600/25 blur-3xl" />

            <div className="absolute top-4 left-4 md:top-10 md:left-0 bg-black/85 border border-white/10 rounded-2xl px-5 py-4 shadow-2xl z-10">
              <p className="text-neutral-400 text-xs font-bold">Desde</p>
              <p className="text-yellow-400 text-3xl md:text-4xl font-black">$4.900</p>
            </div>

            <div className="absolute right-0 top-10 hidden md:flex w-36 h-36 rounded-full border-4 border-yellow-400 bg-black/80 items-center justify-center text-center rotate-[-10deg] shadow-2xl z-10">
              <div>
                <p className="text-white text-3xl font-black">100%</p>
                <p className="text-yellow-400 font-black leading-none">
                  CARNE
                  <br />
                  DE RES
                </p>
              </div>
            </div>

            <div className="relative text-[250px] sm:text-[320px] md:text-[440px] leading-none drop-shadow-[0_35px_40px_rgba(0,0,0,.9)] select-none">
              🍔
            </div>

            <div className="absolute bottom-6 right-2 md:right-10 bg-yellow-400 text-black px-6 py-4 rounded-3xl shadow-2xl rotate-3">
              <p className="text-xs font-black">COMBO</p>
              <p className="text-2xl font-black">+ PAPAS</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
