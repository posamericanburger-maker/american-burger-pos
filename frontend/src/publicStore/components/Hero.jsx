import logo from '../../NNN.png'

const WHATSAPP_URL =
  'https://wa.me/56930809265?text=Hola%20American%20Burger%20🍔%20quiero%20hacer%20un%20pedido.'

function Hero() {
  return (
    <section
      id="inicio"
      className="
        relative
        isolate
        overflow-hidden
        border-b
        border-white/10
        bg-[#050505]
      "
    >
      {/* Fondo principal */}
      <div
        aria-hidden="true"
        className="
          absolute
          inset-0
          -z-30
          bg-[radial-gradient(circle_at_80%_30%,rgba(218,41,28,0.23),transparent_34%),radial-gradient(circle_at_20%_15%,rgba(255,199,44,0.12),transparent_28%),linear-gradient(135deg,#050505_0%,#090909_48%,#180300_100%)]
        "
      />

      {/* Trama muy sutil */}
      <div
        aria-hidden="true"
        className="
          absolute
          inset-0
          -z-20
          opacity-[0.08]
          bg-[linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)]
          bg-[size:48px_48px]
        "
      />

      {/* Mancha decorativa */}
      <div
        aria-hidden="true"
        className="
          absolute
          -right-28
          top-20
          -z-10
          h-[420px]
          w-[420px]
          rounded-full
          bg-red-600/20
          blur-[110px]

          md:h-[620px]
          md:w-[620px]
        "
      />

      <div
        className="
          mx-auto
          grid
          min-h-[calc(100svh-72px)]
          max-w-7xl
          items-center
          gap-10
          px-5
          py-10

          sm:px-6
          sm:py-14

          lg:min-h-[680px]
          lg:grid-cols-[1.05fr_0.95fr]
          lg:gap-16
          lg:px-8
          lg:py-20
        "
      >
        {/* Contenido */}
        <div className="relative z-10">
          <div
            className="
              inline-flex
              items-center
              gap-2
              rounded-full
              border
              border-yellow-400/25
              bg-yellow-400/10
              px-3.5
              py-2
              text-[11px]
              font-black
              uppercase
              tracking-[0.16em]
              text-yellow-400

              sm:text-xs
            "
          >
            <span
              className="
                h-2
                w-2
                rounded-full
                bg-green-500
                shadow-[0_0_12px_rgba(34,197,94,0.8)]
              "
            />

            Pedidos online en Arica
          </div>

          <h1
            className="
              mt-6
              max-w-[780px]
              text-[44px]
              font-black
              leading-[0.95]
              tracking-[-0.045em]
              text-white

              sm:text-6xl
              md:text-7xl
              lg:text-[82px]
            "
          >
            Hamburguesas hechas
            <span className="block text-yellow-400">
              para antojarte.
            </span>
          </h1>

          <p
            className="
              mt-6
              max-w-xl
              text-base
              leading-7
              text-neutral-300

              sm:text-lg
              sm:leading-8

              md:text-xl
            "
          >
            Carne jugosa, pan suave, queso derretido y papas
            crujientes. Haz tu pedido online de forma rápida y
            sencilla.
          </p>

          <div
            className="
              mt-8
              flex
              flex-col
              gap-3

              sm:flex-row
              sm:items-center
            "
          >
            <a
              href="#menu"
              className="
                inline-flex
                min-h-14
                items-center
                justify-center
                gap-3
                rounded-2xl
                bg-yellow-400
                px-7
                py-4
                text-base
                font-black
                text-black
                shadow-[0_18px_45px_rgba(255,199,44,0.2)]
                transition

                hover:-translate-y-0.5
                hover:bg-yellow-300
                hover:shadow-[0_22px_55px_rgba(255,199,44,0.28)]

                active:translate-y-0
                active:scale-[0.98]
              "
            >
              VER MENÚ
              <span aria-hidden="true">→</span>
            </a>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="
                inline-flex
                min-h-14
                items-center
                justify-center
                gap-2
                rounded-2xl
                border
                border-white/15
                bg-white/[0.05]
                px-6
                py-4
                text-sm
                font-black
                text-white
                transition

                hover:border-white/25
                hover:bg-white/10

                active:scale-[0.98]
              "
            >
              <span aria-hidden="true">💬</span>
              CONSULTAR
            </a>
          </div>

          <div
            className="
              mt-8
              grid
              max-w-xl
              grid-cols-1
              gap-3

              min-[420px]:grid-cols-3
            "
          >
            <div
              className="
                rounded-2xl
                border
                border-white/10
                bg-white/[0.04]
                px-4
                py-3
                backdrop-blur
              "
            >
              <p className="text-xs font-bold text-neutral-500">
                Modalidad
              </p>

              <p className="mt-1 text-sm font-black text-white">
                Retiro o delivery
              </p>
            </div>

            <div
              className="
                rounded-2xl
                border
                border-white/10
                bg-white/[0.04]
                px-4
                py-3
                backdrop-blur
              "
            >
              <p className="text-xs font-bold text-neutral-500">
                Delivery
              </p>

              <p className="mt-1 text-sm font-black text-white">
                Desde $1.500
              </p>
            </div>

            <div
              className="
                rounded-2xl
                border
                border-white/10
                bg-white/[0.04]
                px-4
                py-3
                backdrop-blur
              "
            >
              <p className="text-xs font-bold text-neutral-500">
                Ubicación
              </p>

              <p className="mt-1 text-sm font-black text-white">
                Arica, Chile
              </p>
            </div>
          </div>
        </div>

        {/* Visual principal */}
        <div
          className="
            relative
            mx-auto
            flex
            w-full
            max-w-[540px]
            items-center
            justify-center

            lg:max-w-none
          "
        >
          <div
            aria-hidden="true"
            className="
              absolute
              left-1/2
              top-1/2
              h-[310px]
              w-[310px]
              -translate-x-1/2
              -translate-y-1/2
              rounded-full
              bg-yellow-400/15
              blur-[80px]

              sm:h-[420px]
              sm:w-[420px]
            "
          />

          <div
            className="
              relative
              w-full
              overflow-hidden
              rounded-[32px]
              border
              border-white/10
              bg-gradient-to-br
              from-white/[0.08]
              to-white/[0.02]
              p-5
              shadow-[0_32px_90px_rgba(0,0,0,0.55)]
              backdrop-blur

              sm:rounded-[40px]
              sm:p-8
            "
          >
            <div
              className="
                absolute
                inset-x-8
                top-0
                h-px
                bg-gradient-to-r
                from-transparent
                via-yellow-400/70
                to-transparent
              "
            />

            <div
              className="
                flex
                items-center
                justify-between
                gap-4
              "
            >
              <div>
                <p
                  className="
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.2em]
                    text-yellow-400

                    sm:text-xs
                  "
                >
                  American Burger
                </p>

                <p
                  className="
                    mt-1
                    text-xl
                    font-black
                    text-white

                    sm:text-2xl
                  "
                >
                  Sabor que se nota
                </p>
              </div>

              <div
                className="
                  flex
                  h-14
                  w-14
                  shrink-0
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-full
                  border
                  border-yellow-400/30
                  bg-yellow-400
                  p-1
                "
              >
                <img
                  src={logo}
                  alt=""
                  aria-hidden="true"
                  className="
                    h-full
                    w-full
                    rounded-full
                    object-contain
                  "
                />
              </div>
            </div>

            <div
              className="
                relative
                mt-5
                flex
                min-h-[300px]
                items-center
                justify-center
                overflow-hidden
                rounded-[26px]
                bg-[radial-gradient(circle_at_50%_48%,rgba(255,199,44,0.2),transparent_34%),linear-gradient(145deg,#151515_0%,#080808_70%)]
                sm:min-h-[400px]
                sm:rounded-[32px]
              "
            >
              <div
                aria-hidden="true"
                className="
                  absolute
                  bottom-8
                  h-14
                  w-64
                  rounded-[100%]
                  bg-black/80
                  blur-xl
                "
              />

              <div
                aria-label="Hamburguesa American Burger"
                className="
                  relative
                  select-none
                  text-[170px]
                  leading-none
                  drop-shadow-[0_30px_30px_rgba(0,0,0,0.7)]

                  sm:text-[245px]
                "
              >
                🍔
              </div>

              <div
                className="
                  absolute
                  left-4
                  top-4
                  rounded-full
                  bg-red-600
                  px-3
                  py-2
                  text-[10px]
                  font-black
                  uppercase
                  tracking-wide
                  text-white

                  sm:left-5
                  sm:top-5
                  sm:text-xs
                "
              >
                Más vendida
              </div>

              <div
                className="
                  absolute
                  bottom-4
                  right-4
                  rounded-2xl
                  border
                  border-white/10
                  bg-black/75
                  px-4
                  py-3
                  text-right
                  backdrop-blur

                  sm:bottom-5
                  sm:right-5
                "
              >
                <p className="text-[10px] font-bold uppercase text-neutral-400">
                  Hamburguesas desde
                </p>

                <p className="mt-1 text-2xl font-black text-yellow-400">
                  $4.900
                </p>
              </div>
            </div>

            <div
              className="
                mt-5
                flex
                items-center
                justify-between
                gap-4
              "
            >
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">
                  ★★★★★
                </span>

                <span className="text-xs font-bold text-neutral-400">
                  Recomendado
                </span>
              </div>

              <a
                href="#menu"
                className="
                  text-sm
                  font-black
                  text-white
                  transition
                  hover:text-yellow-400
                "
              >
                Pedir ahora →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Franja inferior */}
      <div
        className="
          relative
          border-t
          border-white/10
          bg-black/60
          backdrop-blur
        "
      >
        <div
          className="
            mx-auto
            flex
            max-w-7xl
            flex-wrap
            items-center
            justify-center
            gap-x-6
            gap-y-2
            px-5
            py-4
            text-center
            text-xs
            font-bold
            text-neutral-400

            sm:text-sm
          "
        >
          <span>100% carne de vacuno</span>
          <span className="hidden text-yellow-400 sm:inline">
            •
          </span>
          <span>Preparación al momento</span>
          <span className="hidden text-yellow-400 sm:inline">
            •
          </span>
          <span>Compra directa online</span>
        </div>
      </div>
    </section>
  )
}

export default Hero
