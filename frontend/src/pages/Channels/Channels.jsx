const Channels = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-black">
        Canales de Venta
      </h1>

      <p className="mt-3 text-gray-600">
        Administra las conexiones del sistema POS con plataformas externas.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">

        <div className="bg-white rounded-2xl shadow p-6 border">
          <div className="text-5xl mb-3">🛵</div>
          <h2 className="text-xl font-bold">PedidosYa</h2>
          <p className="text-gray-500 mt-2">Desconectado</p>
          <button className="mt-4 w-full bg-yellow-400 hover:bg-yellow-500 rounded-xl py-2 font-bold">
            Configurar
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow p-6 border">
          <div className="text-5xl mb-3">🚗</div>
          <h2 className="text-xl font-bold">Uber Eats</h2>
          <p className="text-gray-500 mt-2">Desconectado</p>
          <button className="mt-4 w-full bg-yellow-400 hover:bg-yellow-500 rounded-xl py-2 font-bold">
            Configurar
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow p-6 border">
          <div className="text-5xl mb-3">🍔</div>
          <h2 className="text-xl font-bold">Página Web</h2>
          <p className="text-gray-500 mt-2">Desconectado</p>
          <button className="mt-4 w-full bg-yellow-400 hover:bg-yellow-500 rounded-xl py-2 font-bold">
            Configurar
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow p-6 border">
          <div className="text-5xl mb-3">📱</div>
          <h2 className="text-xl font-bold">WhatsApp</h2>
          <p className="text-gray-500 mt-2">Desconectado</p>
          <button className="mt-4 w-full bg-yellow-400 hover:bg-yellow-500 rounded-xl py-2 font-bold">
            Configurar
          </button>
        </div>

      </div>
    </div>
  )
}

export default Channels
