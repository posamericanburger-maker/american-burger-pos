import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ExternalOrders = () => {
  const navigate = useNavigate()
  const [message, setMessage] = useState('')

  const channels = [
    {
      name: 'PedidosYa',
      icon: '🛵',
      status: 'Sin conectar',
      action: () => setMessage('PedidosYa aún no está conectado. Primero debes tener acceso API o integrador.')
    },
    {
      name: 'Uber Eats',
      icon: '🚗',
      status: 'Sin conectar',
      action: () => setMessage('Uber Eats aún no está conectado. Primero debes tener acceso API o integrador.')
    },
    {
      name: 'Página Web',
      icon: '🍔',
      status: 'Preparado para conectar',
      action: () => navigate('/canales')
    },
    {
      name: 'WhatsApp',
      icon: '📱',
      status: 'Preparado para conectar',
      action: () => navigate('/canales')
    }
  ]

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-black">
        Pedidos Externos
      </h1>

      <p className="mt-3 text-gray-600">
        Aquí aparecerán automáticamente los pedidos de plataformas externas.
      </p>

      {message && (
        <div className="mt-6 bg-yellow-50 border border-yellow-400 text-black rounded-xl p-4 font-semibold">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">
        {channels.map((channel) => (
          <button
            key={channel.name}
            type="button"
            onClick={channel.action}
            className="bg-white rounded-2xl shadow p-6 border text-left hover:border-yellow-400 hover:shadow-lg transition-all"
          >
            <div className="text-5xl mb-3">{channel.icon}</div>

            <h2 className="font-bold text-xl">
              {channel.name}
            </h2>

            <p className="text-gray-500 mt-2">
              {channel.status}
            </p>

            <div className="mt-5 bg-yellow-400 text-black text-center rounded-xl py-2 font-bold">
              Ver / Configurar
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default ExternalOrders
