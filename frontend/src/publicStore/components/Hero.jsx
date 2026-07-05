import logo from '../../NNN.png'

function Hero() {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden bg-[#050505] border-b border-white/10"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_45%,rgba(255,199,44,.18),transparent_32%),radial-gradient(circle_at_35%_45%,rgba(218,41,28,.22),transparent_38%),linear-gradient(135deg,#050505_0%,#130000_45%,#3b0505_100%)]" />

      <div className="relative max-w-7xl mx-auto px-5 md:px-6 py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-3 bg-black/70 border border-white/10 rounded-full px-4 py-3">
              <img src={logo} alt="American Burger" className="w-10 h-10 rounded-full bg-yellow-400 p-1" />
              <span className="font-black text-white text-sm md:text-base">
                American Burger Arica
              </span>
            </div>

            <p className="mt-8 text-red-500 font-black tracking-widest text-sm md:text-base">
              ★ HECHAS COMO TIENEN QUE SER
            </p>

            <h1 className="mt-4 text-[58px] sm:text-7xl md:text-8xl lg:text-9xl font-black leading-[0.85] tracking-tight text-white">
              SABOR
              <br />
              QUE
              <br />
              <span className="text-yellow-400">TE ATRAPA</span>
            </h1>

            <p className="mt-7 text-lg md:text-2xl text-white/90 max-w-xl leading-relaxed">
              Hamburguesas premium, papas crujientes y pollo crispy.
              Compra directo desde nuestra tienda online.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <a
                href="#menu"
                className="bg-yellow-400 hover:bg-yellow-300 text-black px-7 py-5 rounded-2xl font-black text-lg text-center shadow-xl"
              >
                🍔 PEDIR AHORA
              </a>

              <a
                href="https://wa.me/56900000000"
                target="_blank"
                rel="noreferrer"
                className="bg-black/50 border border-yellow-400/70 text-white px-7 py-5 rounded-2xl font-black text-lg text-center"
              >
                💬 WHATSAPP
              </a>
            </div>
          </div>

          <div className="relative flex justify-center py-6 md:py-0">
            <div className="absolute w-[300px] h-[300px] md:w-[520px] md:h-[520px] rounded-full bg-red-700/30 blur-3xl" />

            <div className="relative">
              <div className="absolute -top-4 -left-2 bg-black/80 border border-white/10 rounded-2xl px-4 py-3 shadow-2xl z-10">
                <p className="text-neutral-400 text-xs font-bold">Desde</p>
                <p className="text-yellow-400 text-2xl md:text-3xl font-black">$4.900</p>
              </div>

              <div className="relative text-[210px] sm:text-[280px] md:text-[380px] leading-none drop-shadow-[0_35px_40px_rgba(0,0,0,.75)] select-none">
                🍔
              </div>

              <div className="absolute bottom-2 right-0 bg-yellow-400 text-black px-5 py-3 rounded-3xl shadow-2xl rotate-3">
                <p className="text-xs font-black">COMBO</p>
                <p className="text-xl md:text-2xl font-black">+ PAPAS</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ['🍔', 'Ingredientes frescos', 'Calidad premium.'],
            ['🛵', 'Entrega rápida', 'Pedido listo rápido.'],
            ['🛡️', 'Pago seguro', 'Efectivo o transferencia.'],
            ['👍', 'Mejor calidad', 'Sabor americano.']
          ].map(([icon, title, text]) => (
            <div key={title} className="bg-white/5 border border-white/10 rounded-3xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border border-red-500 text-red-500 flex items-center justify-center text-xl">
                {icon}
              </div>
              <div>
                <h3 className="font-black text-white">{title}</h3>
                <p className="text-sm text-neutral-400">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Hero
