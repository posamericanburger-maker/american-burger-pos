import logo from '../../NNN.png'

function Footer() {
  return (
    <footer
      id="contacto"
      className="bg-gradient-to-b from-[#090909] to-black border-t border-white/10"
    >
      <div className="max-w-7xl mx-auto px-5 md:px-6 py-16">

        <div className="grid md:grid-cols-4 gap-12">

          {/* Logo */}

          <div className="md:col-span-2">

            <div className="flex items-center gap-4">

              <div className="w-20 h-20 rounded-full bg-yellow-400 p-1 shadow-2xl">
                <img
                  src={logo}
                  alt="American Burger"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>

              <div>
                <h2 className="text-3xl font-black text-white">
                  AMERICAN BURGER
                </h2>

                <p className="text-yellow-400 font-bold text-lg">
                  Arica • Chile
                </p>
              </div>

            </div>

            <p className="text-neutral-400 mt-8 max-w-xl leading-8 text-lg">
              Mucho más que hamburguesas.
              Carne premium, papas crujientes, pollo crispy y una
              experiencia completamente conectada con nuestro POS.
            </p>

          </div>

          {/* Navegación */}

          <div>

            <h3 className="text-white font-black text-xl mb-5">
              Navegación
            </h3>

            <div className="space-y-4">

              <a href="#inicio" className="block text-neutral-400 hover:text-yellow-400 transition font-semibold">
                Inicio
              </a>

              <a href="#menu" className="block text-neutral-400 hover:text-yellow-400 transition font-semibold">
                Menú
              </a>

              <a href="#promos" className="block text-neutral-400 hover:text-yellow-400 transition font-semibold">
                Promociones
              </a>

              <a href="#contacto" className="block text-neutral-400 hover:text-yellow-400 transition font-semibold">
                Contacto
              </a>

            </div>

          </div>

          {/* Contacto */}

          <div>

            <h3 className="text-white font-black text-xl mb-5">
              Contacto
            </h3>

            <div className="space-y-4 text-neutral-300">

              <p>
                📍 Arica - Chile
              </p>

              <a
                href="https://wa.me/56930809265?text=Hola%20American%20Burger%20🍔%20quiero%20hacer%20un%20pedido."
                target="_blank"
                rel="noreferrer"
                className="block hover:text-green-400 transition"
              >
                📱 +56 9 3080 9265
              </a>

              <a
                href="https://instagram.com/americanburgerarica"
                target="_blank"
                rel="noreferrer"
                className="block hover:text-pink-400 transition"
              >
                📸 @americanburgerarica
              </a>

              <p>
                🕒 Martes a Domingo
              </p>

              <p>
                🍔 Pedidos Online 24/7
              </p>

            </div>

          </div>

        </div>

        <div className="border-t border-white/10 mt-14 pt-8 flex flex-col md:flex-row justify-between gap-4 text-neutral-500">

          <p>
            © {new Date().getFullYear()} American Burger.
            Todos los derechos reservados.
          </p>

          <p>
            Powered by American Burger POS
          </p>

        </div>

      </div>

      <a
        href="https://wa.me/56930809265?text=Hola%20American%20Burger%20🍔%20quiero%20hacer%20un%20pedido."
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-24 left-4 md:bottom-6 md:left-6 z-50 bg-[#25D366] hover:bg-[#1ebe5d] text-white px-6 py-4 rounded-full shadow-2xl font-black flex items-center gap-3 transition-all duration-300 hover:scale-105"
      >
        💬 WhatsApp
      </a>

    </footer>
  )
}

export default Footer
