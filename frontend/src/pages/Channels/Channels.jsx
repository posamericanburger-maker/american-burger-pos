import { useState } from 'react'

const Channels = () => {
  const [selected, setSelected] = useState(null)

  const channels = [
    { key: 'pedidosya', name: 'PedidosYa', icon: '🛵', status: 'Desconectado' },
    { key: 'ubereats', name: 'Uber Eats', icon: '🚗', status: 'Desconectado' },
    { key: 'web', name: 'Página Web', icon: '🍔', status: 'Preparado' },
    { key: 'whatsapp', name: 'WhatsApp', icon: '📱', status: 'Preparado' }
  ]

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-black">Canales de Venta</h1>

      <p className="mt-3 text-gray-600">
        Administra las conexiones del sistema POS con plataformas externas.
      </p>

      {selected && (
        <div className="mt-6 bg-white border border-yellow-400 rounded-2xl p-6 shadow">
          <h2 className="text-2xl font-bold">
            Configurar {selected.name}
          </h2>

          <p className="mt-3 text-gray-600">
            Este canal está preparado en el POS. Para conectarlo realmente se necesitan las credenciales/API del proveedor.
          </p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-xl p-4">
              <p className="font-bold">Estado</p>
              <p className="text-red-600">{selected.status}</p>
            </div>

            <div className="border rounded-xl p-4">
              <p className="font-bold">Endpoint interno</p>
              <p className="text-sm text-gray-600 break-all">
                /api/external-orders
              </p>
            </div>

            <div className="border rounded-xl p-4">
              <p className="font-bold">Canal</p>
              <p className="text-gray-600">{selected.key}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSelected(null)}
            className="mt-5 bg-black text-yellow-400 rounded-xl px-5 py-3 font-bold"
          >
            Cerrar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">
        {channels.map((channel) => (
          <button
            key={channel.key}
            type="button"
            onClick={() => setSelected(channel)}
            className="bg-white rounded-2xl shadow p-6 border text-left hover:border-yellow-400 hover:shadow-lg transition-all"
          >
            <div className="text-5xl mb-3">{channel.icon}</div>
            <h2 className="text-xl font-bold">{channel.name}</h2>
            <p className="text-gray-500 mt-2">{channel.status}</p>

            <div className="mt-4 w-full bg-yellow-400 rounded-xl py-2 font-bold text-center">
              Configurar
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default Channels
