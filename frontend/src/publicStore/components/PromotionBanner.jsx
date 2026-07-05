function PromotionBanner() {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 mt-10">
      <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-r from-[#111] via-[#9d1111] to-[#ffb400] p-[1px] shadow-2xl shadow-red-900/30">
        <div className="relative rounded-[35px] bg-gradient-to-r from-black via-[#1b1b1b] to-[#2b2b2b] overflow-hidden">

          <div className="absolute right-0 top-0 w-[380px] h-[380px] bg-yellow-400/20 blur-[120px]" />

          <div className="grid lg:grid-cols-2 items-center">

            <div className="p-8 md:p-12">

              <span className="inline-flex bg-yellow-400 text-black px-5 py-2 rounded-full font-black text-sm">
                🔥 PROMOCIÓN DE LA SEMANA
              </span>

              <h2 className="mt-6 text-4xl md:text-6xl font-black text-white leading-none">
                COMBO
                <br />
                AMERICAN
              </h2>

              <p className="mt-6 text-lg text-neutral-300 max-w-xl">
                American Burger + Papas + Bebida
                con precio especial por tiempo limitado.
              </p>

              <div className="flex flex-wrap gap-4 mt-10">

                <a
                  href="#menu"
                  className="bg-yellow-400 hover:bg-yellow-300 text-black px-8 py-4 rounded-2xl font-black transition"
                >
                  PEDIR AHORA
                </a>

                <div className="flex items-center">

                  <span className="text-neutral-500 line-through text-xl mr-3">
                    $11.900
                  </span>

                  <span className="text-yellow-400 text-4xl font-black">
                    $9.900
                  </span>

                </div>

              </div>

            </div>

            <div className="relative h-[420px] flex items-center justify-center">

              <div className="absolute w-[340px] h-[340px] rounded-full bg-yellow-400/20 blur-3xl" />

              <div className="text-[260px] drop-shadow-[0_25px_30px_rgba(0,0,0,.6)]">
                🍔
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  )
}

export default PromotionBanner
