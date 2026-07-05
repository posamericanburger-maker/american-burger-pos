import { useEffect, useState } from 'react'
import { getPublicProducts } from '../publicStoreApi'

function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const data = await getPublicProducts()
      setProducts(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">

      {/* HERO */}

      <section className="bg-gradient-to-r from-red-700 via-red-600 to-yellow-500">

        <div className="max-w-7xl mx-auto px-6 py-20">

          <h1 className="text-6xl font-black mb-4">
            AMERICAN
            <br />
            BURGER
          </h1>

          <p className="text-xl max-w-xl text-white/90 mb-8">
            Mucho más que hamburguesas.
            Carne premium, papas crujientes y sabor americano.
          </p>

          <button
            className="
            bg-yellow-400
            hover:bg-yellow-300
            text-black
            px-8
            py-4
            rounded-xl
            font-black
            text-lg
            transition
            "
          >
            PEDIR AHORA
          </button>

        </div>

      </section>

      {/* PRODUCTOS */}

      <section className="max-w-7xl mx-auto px-6 py-16">

        <h2 className="text-4xl font-black mb-10">

          Productos destacados

        </h2>

        {loading && (

          <p>Cargando productos...</p>

        )}

        {!loading && (

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

            {products.map(product => (

              <div
                key={product.id}
                className="
                bg-neutral-900
                rounded-2xl
                overflow-hidden
                border
                border-neutral-800
                hover:border-yellow-500
                transition
                "
              >

                <div className="h-52 bg-neutral-800 flex items-center justify-center">

                  <span className="text-7xl">

                    🍔

                  </span>

                </div>

                <div className="p-6">

                  <p className="text-yellow-400 text-sm font-bold">

                    {product.category_name}

                  </p>

                  <h3 className="text-2xl font-black mt-2">

                    {product.name}

                  </h3>

                  <p className="text-neutral-400 mt-3">

                    {product.description}

                  </p>

                  <div className="flex justify-between items-center mt-6">

                    <strong className="text-3xl text-yellow-400">

                      ${Number(product.price).toLocaleString('es-CL')}

                    </strong>

                    <button
                      className="
                      bg-red-600
                      hover:bg-red-700
                      px-5
                      py-3
                      rounded-xl
                      font-bold
                      "
                    >
                      Agregar
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </section>

    </div>
  )
}

export default Home
