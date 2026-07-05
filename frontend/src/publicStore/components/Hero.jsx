import logo from '../../NNN.png'

function Hero() {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden bg-black min-h-[680px] md:min-h-[760px] flex items-center"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_40%,rgba(255,199,44,0.36),transparent_32%),linear-gradient(135deg,#080808_0%,#160000_34%,#d71920_68%,#ffc400_100%)]" />

      <div className="absolute -top-32 right-0 w-[420px] h-[420px] bg-yellow-400/25 blur-3xl rounded-full" />
      <div className="absolute -bottom-32 left-0 w-[500px] h-[500px] bg-red-700/35 blur-3xl rounded-full" />

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-28 grid lg:grid-cols-2 gap-12 items-center">
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-3 bg-black/40 border border-white/10 text-white px-5 py-3 rounded-full font-black backdrop-blur">
            <img
              src={logo}
              alt="American Burger"
              className="w-9 h-9 rounded-full bg-yellow-400 p-1"
            />
            American Burger Arica
          </div>

          <h1 className="mt-8 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[0.9] tracking-tight">
            PIDE TU
            <br />
            BURGER
            <span className="block text-yellow-400">
              FAVORITA
            </span>
          </h1>

          <p className="mt-8 text-lg md:text-2xl text-white/90 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
            Hamburguesas premium, papas crujientes y pollo crispy.
            Compra directo desde nuestra tienda online.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <a
              href="#menu"
              className="bg-yellow-400 hover:bg-yellow-300 text-black px-9 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-yellow-500/25 transition hover:scale-105 text-center"
            >
              PEDIR AHORA
            </a>

            <a
              href="#pedido"
              className="bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 px-9 py-5 rounded-2xl font-black text-lg backdrop-blur transition text-center"
            >
              VER MI PEDIDO
            </a>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-3 max-w-xl mx-auto lg:mx-0">
            <div className="bg-black/35 border border-white/10 rounded-2xl p-4 backdrop-blur">
              <p className="text-2xl md:text-3xl font-black text-yellow-400">+20</p>
              <p className="text-xs md:text-sm text-white/75 font-bold">Productos</p>
            </div>

            <div className="bg-black/35 border border-white/10 rounded-2xl p-4 backdrop-blur">
              <p className="text-2xl md:text-3xl font-black text-yellow-400">25m</p>
              <p className="text-xs md:text-sm text-white/75 font-bold">Estimado</p>
            </div>

            <div className="bg-black/35 border border-white/10 rounded-2xl p-4 backdrop-blur">
              <p className="text-2xl md:text-3xl font-black text-yellow-400">+56</p>
              <p className="text-xs md:text-sm text-white/75 font-bold">WhatsApp</p>
            </div>
          </div>
        </div>

        <div className="relative flex justify-center">
          <div className="absolute w-[360px] h-[360px] md:w-[560px] md:h-[560px] rounded-full bg-yellow-400/25 blur-3xl" />

          <div className="relative">
            <div className="absolute -top-6 -left-4 md:-left-10 bg-black/75 border border-white/10 text-white px-5 py-4 rounded-2xl shadow-2xl">
              <p className="text-xs text-white/60 font-bold">Desde</p>
              <p className="text-2xl md:text-3xl font-black text-yellow-400">$4.900</p>
            </div>

            <div className="absolute -bottom-5 -right-3 md:-right-8 bg-yellow-400 text-black px-5 py-4 rounded-3xl shadow-2xl rotate-3">
              <p className="text-xs font-black">COMBO</p>
              <p className="text-xl md:text-2xl font-black">+ PAPAS</p>
            </div>

            <div className="relative text-[210px] sm:text-[260px] md:text-[340px] leading-none drop-shadow-[0_35px_35px_rgba(0,0,0,0.7)] select-none">
              🍔
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
