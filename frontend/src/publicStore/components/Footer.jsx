import logo from '../../NNN.png'

const WHATSAPP_URL =
  'https://wa.me/56930809265?text=Hola%20American%20Burger%20🍔%20quiero%20hacer%20un%20pedido.'

const INSTAGRAM_URL =
  'https://instagram.com/americanburgerarica'

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer
      id="contacto"
      className="
        relative
        overflow-hidden
        border-t
        border-white/10
        bg-[#050505]
        text-white
      "
    >
      <div
        aria-hidden="true"
        className="
          absolute
          inset-0
          bg-[radial-gradient(circle_at_15%_20%,rgba(255,199,44,0.08),transparent_28%),radial-gradient(circle_at_85%_80%,rgba(218,41,28,0.12),transparent_32%)]
        "
      />

      <div
        className="
          relative
          mx-auto
          max-w-7xl
          px-5
          py-12

          sm:px-6
          sm:py-14

          lg:px-8
          lg:py-16
        "
      >
        <div
          className="
            grid
            gap-10

            md:grid-cols-2

            lg:grid-cols-[1.3fr_0.7fr_0.8fr]
            lg:gap-16
          "
        >
          {/* Marca */}
          <div>
            <div className="flex items-center gap-4">
              <div
                className="
                  flex
                  h-16
                  w-16
                  shrink-0
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-full
                  border
                  border-yellow-400/30
                  bg-yellow-400
                  p-1
                  shadow-[0_0_30px_rgba(255,199,44,0.14)]
                "
              >
                <img
                  src={logo}
                  alt="Logo de American Burger"
                  className="
                    h-full
                    w-full
                    rounded-full
                    object-contain
                  "
                />
              </div>

              <div>
                <h2
                  className="
                    text-xl
                    font-black
                    tracking-tight
                    text-white

                    sm:text-2xl
                  "
                >
                  AMERICAN BURGER
                </h2>

                <div className="mt-1 flex items-center gap-2">
                  <span
                    className="
                      h-2
                      w-2
                      rounded-full
                      bg-green-500
                      shadow-[0_0_10px_rgba(34,197,94,0.65)]
                    "
                  />

                  <p className="text-sm font-bold text-neutral-400">
                    Arica · Chile
                  </p>
                </div>
              </div>
            </div>

            <p
              className="
                mt-6
                max-w-xl
                text-sm
                leading-7
                text-neutral-400

                sm:text-base
              "
            >
              Hamburguesas preparadas al momento, papas crujientes
              y pollo crispy. Compra directamente desde nuestra
              tienda online y recibe tu pedido en el POS.
            </p>

            <div
              className="
                mt-6
                flex
                flex-wrap
                gap-3
              "
            >
              <a
                href="#menu"
                className="
                  inline-flex
                  items-center
                  justify-center
                  rounded-xl
                  bg-yellow-400
                  px-5
                  py-3
                  text-sm
                  font-black
                  text-black
                  transition
                  hover:bg-yellow-300
                  active:scale-[0.98]
                "
              >
                VER MENÚ
              </a>

              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-white/10
                  bg-white/[0.04]
                  px-5
                  py-3
                  text-sm
                  font-black
                  text-white
                  transition
                  hover:bg-white/[0.08]
                  active:scale-[0.98]
                "
              >
                <span aria-hidden="true">💬</span>
                WhatsApp
              </a>
            </div>
          </div>

          {/* Navegación */}
          <div>
            <h3
              className="
                text-sm
                font-black
                uppercase
                tracking-[0.16em]
                text-neutral-500
              "
            >
              Navegación
            </h3>

            <nav
              aria-label="Navegación del pie de página"
              className="mt-5 grid gap-3"
            >
              <a
                href="#inicio"
                className="
                  text-sm
                  font-bold
                  text-neutral-300
                  transition
                  hover:text-yellow-400
                "
              >
                Inicio
              </a>

              <a
                href="#menu"
                className="
                  text-sm
                  font-bold
                  text-neutral-300
                  transition
                  hover:text-yellow-400
                "
              >
                Menú
              </a>

              <a
                href="#promos"
                className="
                  text-sm
                  font-bold
                  text-neutral-300
                  transition
                  hover:text-yellow-400
                "
              >
                Promociones
              </a>

              <a
                href="#contacto"
                className="
                  text-sm
                  font-bold
                  text-neutral-300
                  transition
                  hover:text-yellow-400
                "
              >
                Contacto
              </a>
            </nav>
          </div>

          {/* Contacto */}
          <div>
            <h3
              className="
                text-sm
                font-black
                uppercase
                tracking-[0.16em]
                text-neutral-500
              "
            >
              Contacto
            </h3>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs font-bold text-neutral-500">
                  Ubicación
                </p>

                <p className="mt-1 text-sm font-bold text-neutral-300">
                  Av. Santa María 2248, Arica
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-neutral-500">
                  WhatsApp
                </p>

                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="
                    mt-1
                    inline-block
                    text-sm
                    font-bold
                    text-neutral-300
                    transition
                    hover:text-green-400
                  "
                >
                  +56 9 3080 9265
                </a>
              </div>

              <div>
                <p className="text-xs font-bold text-neutral-500">
                  Instagram
                </p>

                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="
                    mt-1
                    inline-block
                    text-sm
                    font-bold
                    text-neutral-300
                    transition
                    hover:text-pink-400
                  "
                >
                  @americanburgerarica
                </a>
              </div>

              <div>
                <p className="text-xs font-bold text-neutral-500">
                  Atención
                </p>

                <p className="mt-1 text-sm font-bold text-neutral-300">
                  Martes a domingo
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          className="
            mt-12
            flex
            flex-col
            gap-3
            border-t
            border-white/10
            pt-6
            text-xs
            text-neutral-600

            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <p>
            © {currentYear} American Burger. Todos los derechos
            reservados.
          </p>

          <p>
            Tecnología American Burger POS
          </p>
        </div>
      </div>

      {/* WhatsApp flotante */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Contactar a American Burger por WhatsApp"
        className="
          fixed
          bottom-24
          left-4
          z-40
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-full
          bg-[#25D366]
          text-2xl
          text-white
          shadow-[0_14px_40px_rgba(37,211,102,0.35)]
          transition

          hover:-translate-y-0.5
          hover:bg-[#20c55c]

          active:translate-y-0
          active:scale-95

          sm:bottom-6
          sm:left-6

          lg:h-auto
          lg:w-auto
          lg:gap-2
          lg:px-5
          lg:py-3.5
          lg:text-base
          lg:font-black
        "
      >
        <span aria-hidden="true">💬</span>

        <span className="hidden lg:inline">
          WhatsApp
        </span>
      </a>
    </footer>
  )
}

export default Footer
