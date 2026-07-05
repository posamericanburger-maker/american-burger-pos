import logo from '../../NNN.png'

function Footer() {
  return (
    <footer id="contacto" className="bg-black border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-14">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-yellow-400 p-1">
                <img
                  src={logo}
                  alt="American Burger"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>

              <div>
                <h2 className="text-2xl font-black text-white">
                  AMERICAN BURGER
                </h2>
                <p className="text-yellow-400 font-bold">
                  Arica · Chile
                </p>
              </div>
            </div>

            <p className="text-neutral-400 mt-6 max-w-xl leading-relaxed">
              Hamburguesas premium, papas crujientes, pollo crispy y el verdadero
              sabor americano en una experiencia online conectada directamente con nuestro POS.
            </p>
          </div>

          <div>
            <h3 className="text-white font-black mb-4">
              Enlaces
            </h3>

            <div className="space-y-3 text-neutral-400 font-bold">
              <a href="#inicio" className="block hover:text-yellow-400 transition">
                Inicio
              </a>

              <a href="#menu" className="block hover:text-yellow-400 transition">
                Menú
              </a>

              <a href="#promos" className="block hover:text-yellow-400 transition">
                Promociones
              </a>

              <a href="#pedido" className="block hover:text-yellow-400 transition">
                Pedido
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-black mb-4">
              Contacto
            </h3>

            <div className="space-y-3 text-neutral-400 font-bold">
              <p>📍 Arica, Chile</p>
              <p>📱 WhatsApp: +56 9 XXXX XXXX</p>
              <p>📸 Instagram: @americanburgerarica</p>
              <p>🕒 Horario: Por definir</p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row gap-4 justify-between text-neutral-500 text-sm font-bold">
          <p>
            © {new Date().getFullYear()} American Burger. Todos los derechos reservados.
          </p>

          <p>
            Plataforma conectada al POS American Burger.
          </p>
        </div>
      </div>

      <a
        href="https://wa.me/56900000000"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 left-6 z-50 bg-green-500 hover:bg-green-600 text-white px-5 py-4 rounded-3xl font-black shadow-2xl transition hover:scale-105"
      >
        💬 WhatsApp
      </a>
    </footer>
  )
}

export default Footer
