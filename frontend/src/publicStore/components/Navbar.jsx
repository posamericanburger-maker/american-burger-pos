function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-black/95 backdrop-blur border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <a href="#inicio" className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center text-2xl">
            🍔
          </div>

          <div>
            <h1 className="text-xl font-black text-white leading-none">
              AMERICAN BURGER
            </h1>
            <p className="text-xs text-yellow-400 font-bold">
              Arica · Chile
            </p>
          </div>
        </a>

        <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-white">
          <a href="#inicio" className="hover:text-yellow-400 transition">Inicio</a>
          <a href="#menu" className="hover:text-yellow-400 transition">Menú</a>
          <a href="#promos" className="hover:text-yellow-400 transition">Promos</a>
          <a href="#contacto" className="hover:text-yellow-400 transition">Contacto</a>
        </nav>

        <a
          href="#pedido"
          className="bg-yellow-400 hover:bg-yellow-300 text-black px-5 py-3 rounded-xl font-black transition"
        >
          🛒 Pedido
        </a>
      </div>
    </header>
  )
}

export default Navbar
