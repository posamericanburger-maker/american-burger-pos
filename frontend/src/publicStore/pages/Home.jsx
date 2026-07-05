import { useEffect, useState } from 'react'
import { getPublicProducts } from '../publicStoreApi'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'

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
      <Navbar />
      <Hero />

      <section id="menu" className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-4xl font-black mb-10">
          Productos destacados
        </h2>

        {loading && <p>Cargando productos...</p>}

        {!loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 hover:border-yellow-500 transition"
              >
                <div className="h-52 bg-neutral-800 flex items-center justify-center">
                  <span className="text-7xl">🍔</span>
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

                    <button className="bg-red-600 hover:bg-red-700 px-5 py-3 rounded-xl font-bold">
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
