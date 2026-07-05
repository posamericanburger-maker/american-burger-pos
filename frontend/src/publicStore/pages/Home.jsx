import { useEffect, useMemo, useState } from 'react'
import { getPublicProducts } from '../publicStoreApi'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'

function Home() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
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

  const addToCart = (product) => {
    setCart((current) => {
      const exists = current.find((item) => item.id === product.id)

      if (exists) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [...current, { ...product, quantity: 1 }]
    })
  }

  const removeFromCart = (id) => {
    setCart((current) => current.filter((item) => item.id !== id))
  }

  const total = useMemo(() => {
    return cart.reduce((sum, item) => {
      return sum + Number(item.price || 0) * Number(item.quantity || 1)
    }, 0)
  }, [cart])

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

                    <button
                      onClick={() => addToCart(product)}
                      className="bg-red-600 hover:bg-red-700 px-5 py-3 rounded-xl font-bold"
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

      <section id="pedido" className="max-w-7xl mx-auto px-6 pb-20">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8">
          <h2 className="text-3xl font-black mb-6">Tu pedido</h2>

          {cart.length === 0 ? (
            <p className="text-neutral-400">Aún no has agregado productos.</p>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center border-b border-neutral-800 pb-4">
                  <div>
                    <h3 className="font-black">{item.name}</h3>
                    <p className="text-neutral-400">
                      Cantidad: {item.quantity}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <strong className="text-yellow-400">
                      ${Number(item.price * item.quantity).toLocaleString('es-CL')}
                    </strong>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="bg-red-600 px-4 py-2 rounded-lg font-bold"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center pt-6">
                <strong className="text-2xl">Total</strong>
                <strong className="text-3xl text-yellow-400">
                  ${Number(total).toLocaleString('es-CL')}
                </strong>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Home
