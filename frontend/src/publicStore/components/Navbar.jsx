import { useEffect, useState } from 'react'
import logo from '../../NNN.png'

function Navbar() {
  const [open, setOpen] = useState(false)

  const closeMenu = () => {
    setOpen(false)
  }

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeMenu()
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <header
      className="
        sticky
        top-0
        z-50
        border-b
        border-white/10
        bg-black/90
        backdrop-blur-xl
      "
    >
      <div
        className="
          mx-auto
          flex
          h-[72px]
          max-w-7xl
          items-center
          justify-between
          px-4
          sm:h-[76px]
          sm:px-6
        "
      >
        <a
          href="#inicio"
          onClick={closeMenu}
          aria-label="Ir al inicio de American Burger"
          className="
            flex
            min-w-0
            items-center
            gap-3
          "
        >
          <div
            className="
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              overflow-hidden
              rounded-full
              border
              border-yellow-400/40
              bg-yellow-400
              p-1
              shadow-[0_0_24px_rgba(250,204,21,0.18)]
              sm:h-13
              sm:w-13
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

          <div className="min-w-0">
            <p
              className="
                truncate
                text-[15px]
                font-black
                leading-none
                tracking-tight
                text-white
                sm:text-lg
              "
            >
              AMERICAN BURGER
            </p>

            <div className="mt-1.5 flex items-center gap-2">
              <span
                className="
                  h-2
                  w-2
                  rounded-full
                  bg-green-500
                  shadow-[0_0_10px_rgba(34,197,94,0.7)]
                "
              />

              <p
                className="
                  text-[11px]
                  font-bold
                  leading-none
                  text-neutral-400
                  sm:text-xs
                "
              >
                Arica · Pedidos online
              </p>
            </div>
          </div>
        </a>

        <nav
          aria-label="Navegación principal"
          className="
            hidden
            items-center
            gap-1
            lg:flex
          "
        >
          <a
            href="#inicio"
            className="
              rounded-xl
              px-4
              py-2.5
              text-sm
              font-bold
              text-neutral-300
              transition
              hover:bg-white/5
              hover:text-white
            "
          >
            Inicio
          </a>

          <a
            href="#menu"
            className="
              rounded-xl
              px-4
              py-2.5
              text-sm
              font-bold
              text-neutral-300
              transition
              hover:bg-white/5
              hover:text-white
            "
          >
            Menú
          </a>

          <a
            href="#promos"
            className="
              rounded-xl
              px-4
              py-2.5
              text-sm
              font-bold
              text-neutral-300
              transition
              hover:bg-white/5
              hover:text-white
            "
          >
            Promociones
          </a>

          <a
            href="#contacto"
            className="
              rounded-xl
              px-4
              py-2.5
              text-sm
              font-bold
              text-neutral-300
              transition
              hover:bg-white/5
              hover:text-white
            "
          >
            Contacto
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="#menu"
            className="
              hidden
              items-center
              justify-center
              rounded-xl
              bg-yellow-400
              px-5
              py-3
              text-sm
              font-black
              text-black
              shadow-[0_10px_30px_rgba(250,204,21,0.18)]
              transition
              hover:bg-yellow-300
              active:scale-[0.97]
              md:flex
            "
          >
            VER MENÚ
          </a>

          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-xl
              border
              border-white/10
              bg-white/[0.06]
              text-white
              transition
              hover:bg-white/10
              active:scale-95
              lg:hidden
            "
          >
            {open ? (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M5 7h14" />
                <path d="M5 12h14" />
                <path d="M5 17h14" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div
        id="mobile-navigation"
        className={`
          overflow-hidden
          border-t
          border-white/10
          bg-[#080808]
          transition-all
          duration-300
          lg:hidden
          ${
            open
              ? 'max-h-[430px] opacity-100'
              : 'pointer-events-none max-h-0 opacity-0'
          }
        `}
      >
        <nav
          aria-label="Navegación móvil"
          className="
            mx-auto
            max-w-7xl
            px-4
            py-4
          "
        >
          <div className="grid gap-1">
            <a
              href="#inicio"
              onClick={closeMenu}
              className="
                flex
                items-center
                justify-between
                rounded-xl
                px-4
                py-3.5
                font-bold
                text-white
                transition
                hover:bg-white/5
              "
            >
              <span>Inicio</span>
              <span className="text-neutral-600">→</span>
            </a>

            <a
              href="#menu"
              onClick={closeMenu}
              className="
                flex
                items-center
                justify-between
                rounded-xl
                px-4
                py-3.5
                font-bold
                text-white
                transition
                hover:bg-white/5
              "
            >
              <span>Menú</span>
              <span className="text-neutral-600">→</span>
            </a>

            <a
              href="#promos"
              onClick={closeMenu}
              className="
                flex
                items-center
                justify-between
                rounded-xl
                px-4
                py-3.5
                font-bold
                text-white
                transition
                hover:bg-white/5
              "
            >
              <span>Promociones</span>
              <span className="text-neutral-600">→</span>
            </a>

            <a
              href="#contacto"
              onClick={closeMenu}
              className="
                flex
                items-center
                justify-between
                rounded-xl
                px-4
                py-3.5
                font-bold
                text-white
                transition
                hover:bg-white/5
              "
            >
              <span>Contacto</span>
              <span className="text-neutral-600">→</span>
            </a>
          </div>

          <a
            href="#menu"
            onClick={closeMenu}
            className="
              mt-3
              flex
              w-full
              items-center
              justify-center
              rounded-xl
              bg-yellow-400
              px-5
              py-4
              text-sm
              font-black
              text-black
              transition
              hover:bg-yellow-300
              active:scale-[0.98]
            "
          >
            VER MENÚ Y PEDIR
          </a>
        </nav>
      </div>
    </header>
  )
}

export default Navbar
