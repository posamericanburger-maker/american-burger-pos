const ExternalOrders = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-black">
        Pedidos Externos
      </h1>

      <p className="mt-3 text-gray-600">
        Aquí aparecerán automáticamente los pedidos de:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">

        <div className="bg-white rounded-2xl shadow p-6 border">
          <div className="text-5xl mb-3">🛵</div>
          <h2 className="font-bold text-xl">
            PedidosYa
          </h2>

          <p className="text-gray-500 mt-2">
            Sin conectar
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-6 border">
          <div className="text-5xl mb-3">🚗</div>

          <h2 className="font-bold text-xl">
            Uber Eats
          </h2>

          <p className="text-gray-500 mt-2">
            Sin conectar
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-6 border">
          <div className="text-5xl mb-3">🍔</div>

          <h2 className="font-bold text-xl">
            Página Web
          </h2>

          <p className="text-gray-500 mt-2">
            Sin conectar
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-6 border">
          <div className="text-5xl mb-3">📱</div>

          <h2 className="font-bold text-xl">
            WhatsApp
          </h2>

          <p className="text-gray-500 mt-2">
            Sin conectar
          </p>
        </div>

      </div>
    </div>
  )
}

export default ExternalOrders
