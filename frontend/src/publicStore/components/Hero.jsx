function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden bg-gradient-to-r from-red-700 via-red-600 to-yellow-500">
      <div className="max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <span className="bg-yellow-400 text-black px-4 py-2 rounded-full font-bold">
            ★ NUEVO
          </span>

          <h1 className="text-6xl lg:text-7xl font-black text-white mt-8 leading-none">
            AMERICAN
            <br />
            BURGER
          </h1>

          <p className="text-white text-xl mt-8 max-w-lg leading-relaxed">
            Mucho más que hamburguesas. Carne premium, papas crujientes,
            pollo crispy y sabor americano.
          </p>

          <div className="flex gap-4 mt-10">
            <a
              href="#menu"
              className="bg-yellow-400 hover:bg-yellow-300 text-black px-8 py-4 rounded-xl font-black transition"
            >
              PEDIR AHORA
            </a>

            <a
              href="#menu"
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-black hover:bg-white hover:text-black transition"
            >
              VER MENÚ
            </a>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 blur-3xl bg-yellow-300 opacity-40 rounded-full"></div>
            <div className="relative text-[280px] select-none drop-shadow-2xl">
              🍔
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
