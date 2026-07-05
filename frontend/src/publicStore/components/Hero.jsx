import logo from '../../NNN.png'

function Hero() {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden bg-[#050505] min-h-[780px] flex items-center border-b border-white/10"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_45%,rgba(255,199,44,0.18),transparent_30%),radial-gradient(circle_at_40%_50%,rgba(218,41,28,0.25),transparent_35%),linear-gradient(90deg,#050505_0%,#080808_38%,#210000_62%,#0a0a0a_100%)]" />

      <div className="absolute inset-0 opacity-25 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.08)_50%,transparent_100%)]" />

      <div className="absolute top-24 right-16 w-[520px] h-[520px] bg-red-600/30 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 right-0 w-[520px] h-[520px] bg-yellow-400/20 blur-[130px] rounded-full" />

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-3 bg-black/60 border border-white/10 rounded-full px-5 py-3 shadow-2xl">
              <img
                src={logo}
                alt="American Burger"
                className="w-10 h-10 rounded-full bg-yellow-400 p-1"
              />
              <span className="font-black text-white">
                American Burger Arica
              </span>
            </div>

            <p className="mt-10 text-red-500 font-black tracking-widest">
              ★ HECHAS COMO TIENEN QUE SER
            </p>

            <h1 className="mt-4 text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black leading-[0.82] tracking-tight text-white">
              SABOR
              <br />
              QUE
              <br />
              <span className="text-yellow-400">TE ATRAPA</span>
            </h1>

            <p className="mt-8 text-lg md:text-2xl text-white/90 max-w-2xl font-medium leading-relaxed">
              Hamburguesas premium, papas crujientes y pollo crispy.
              Compra directo desde nuestra tienda online.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <a
                href="#menu"
                className="bg-yellow-400 hover:bg-yellow-300 text-black px-9 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-yellow-500/25 transition hover:scale-105 text-center"
              >
                🍔 PEDIR AHORA →
              </a>

              <a
                href="https://wa.me/56900000000"
                target="_blank"
                rel="noreferrer"
                className="bg-black/40 hover:bg-white hover:text-black text-white border border-yellow-400/70 px-9 py-5 rounded-2xl font-black text-lg backdrop-blur transition text-center"
              >
                💬 CHAT POR WHATSAPP
              </a>
            </div>
          </div>

          <div className="relative min-h-[520px] flex items-center justify-center">
            <div className="absolute w-[520px] h-[520px] rounded-full bg-red-700/30 blur-3xl" />
            <div className="absolute w-[420px] h-[420px] rounded-full border-[28px] border-red-700/35 rotate-12" />

            <div className="absolute top-10 left-8 bg-black/75 border border-white/10 rounded-2xl px-5 py-4 shadow-2xl">
              <p className="text-neutral-400 text-sm font-bold">Desde</p>
              <p className="text-yellow-400 text-3xl font-black">$4.900</p>
            </div>

            <div className="absolute right-4 top-16 hidden md:flex w-40 h-40 rounded-full border-4 border-yellow-400 bg-black items-center justify-center text-center rotate-[-8deg] shadow-2xl">
              <div>
                <p className="text-white text-4xl font-black">100%</p>
                <p className="text-yellow-400 font-black leading-none">
                  CARNE
                  <br />
                  DE RES
                </p>
              </div>
            </div>

            <div className="relative text-[250px] sm:text-[320px] md:text-[390px] leading-none drop-shadow-[0_35px_40px_rgba(0,0,0,.75)] select-none">
              🍔
            </div>

            <div className="absolute bottom-8 right-8 bg-yellow-400 text-black px-6 py-4 rounded-3xl shadow-2xl rotate-3">
              <p className="text-xs font-black">COMBO</p>
              <p className="text-2xl font-black">+ PAPAS</p>
            </div>
          </div>
        </div>

        <div className="mt-10 grid md:grid-cols-4 gap-4 bg-white/5 border border-white/10 rounded-[32px] p-4 backdrop-blur-xl">
          <div className="flex items-center gap-4 p-4">
            <div className="w-14 h-14 rounded-full border border-red-500 text-red-500 flex items-center justify-center text-2xl">
              🍔
            </div>
            <div>
              <h3 className="font-black text-white">Ingredientes frescos</h3>
              <p className="text-sm text-neutral-400">
                Calidad premium en cada preparación.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4">
            <div className="w-14 h-14 rounded-full border border-red-500 text-red-500 flex items-center justify-center text-2xl">
              🛵
            </div>
            <div>
              <h3 className="font-black text-white">Entrega rápida</h3>
              <p className="text-sm text-neutral-400">
                Tu pedido listo en el menor tiempo posible.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4">
            <div className="w-14 h-14 rounded-full border border-red-500 text-red-500 flex items-center justify-center text-2xl">
              🛡️
            </div>
            <div>
              <h3 className="font-black text-white">Pago seguro</h3>
              <p className="text-sm text-neutral-400">
                Efectivo o transferencia.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4">
            <div className="w-14 h-14 rounded-full border border-red-500 text-red-500 flex items-center justify-center text-2xl">
              👍
            </div>
            <div>
              <h3 className="font-black text-white">Mejor calidad</h3>
              <p className="text-sm text-neutral-400">
                Sabor americano que conquista Arica.
              </p>
            </div>
          </div>
        </div>

        <div
          id="promos"
          className="mt-6 overflow-hidden rounded-[28px] border border-white/10 bg-black/70"
        >
          <div className="grid md:grid-cols-[240px_1fr_260px] items-center">
            <div className="bg-red-600 p-6 h-full flex items-center gap-4">
              <div className="text-4xl">🏷️</div>
              <div>
                <p className="text-white font-black text-2xl leading-none">
                  PROMO
                </p>
                <p className="text-yellow-400 font-black text-2xl leading-none">
                  ONLINE
                </p>
              </div>
            </div>

            <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-center gap-4 text-center">
              <p className="text-3xl md:text-4xl font-black text-white">
                ARMA TU COMBO
              </p>

              <p className="text-3xl md:text-4xl font-black text-yellow-400">
                PAPAS + BEBIDA
              </p>
            </div>

            <div className="bg-yellow-400 text-black p-6 text-center">
              <p className="font-black">POR SOLO</p>
              <p className="text-4xl font-black">$2.900</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
