import { useState } from 'react'
import logo from '../../NNN.png'

function Navbar() {
  const [open, setOpen] = useState(false)

  const closeMenu = () => setOpen(false)

  return (
    <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
        <a href="#inicio" onClick={closeMenu} className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-yellow-400 p-1 shadow-lg shadow-yellow-400/20">
            <img
              src={logo}
              alt="American Burger"
              className="w-full h-full object-contain rounded-full"
            />
          </div>

          <div>
            <h1 className="text-lg md:text-xl font-black text-white leading-none">
              AMERICAN BURGER
            </h1>
            <p className="text-xs text-yellow-400 font-bold">
              Arica · Chile
            </p>
          </div>
        </a>

        <nav className="hidden lg:flex items-center gap-8 text-sm font-black text-white">
          <a href="#inicio" className="hover:text-yellow-400 transition">Inicio</a>
          <a href="#menu" className="hover:text-yellow-400 transition">Menú</a>
          <a href="#promos" className="hover:text-yellow-400 transition">Promos</a>
          <a href="#pedido" className="hover:text-yellow-400 transition">Pedido</a>
          <a href="#contacto" className="hover:text-yellow-400 transition">Contacto</a>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a
            href="#pedido"
            className="bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-3 rounded-2xl font-black transition shadow-lg shadow-yellow-400/20"
          >
            🛒 Pedir ahora
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="lg:hidden bg-white/10 border border-white/10 text-white w-12 h-12 rounded-2xl font-black"
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {open && (
        <div className="lg:hidden bg-black border-t border-white/10 px-4 py-5 space-y-3">
          <a onClick={closeMenu} href="#inicio" className="block text-white font-black py-3">
            Inicio
          </a>

          <a onClick={closeMenu} href="#menu" className="block text-white font-black py-3">
            Menú
          </a>

          <a onClick={closeMenu} href="#promos" className="block text-white font-black py-3">
            Promos
          </a>

          <a onClick={closeMenu} href="#pedido" className="block text-white font-black py-3">
            Pedido
          </a>

          <a onClick={closeMenu} href="#contacto" className="block text-white font-black py-3">
            Contacto
          </a>

          <a
            onClick={closeMenu}
            href="#pedido"
            className="block bg-yellow-400 text-black text-center py-4 rounded-2xl font-black mt-4"
          >
            🛒 Pedir ahora
          </a>
        </div>
      )}
    </header>
  )
}

export default Navbar
