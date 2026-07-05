function OrderSuccessModal({ open = false, order, onClose }) {
  if (!open || !order) return null

  const orderCode = order.order_number || order.number || order.id || 'pendiente'

  return (
    <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-md flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-[#111111] border border-white/10 rounded-[36px] p-8 text-center shadow-2xl">
        <div className="text-7xl mb-5">🍔</div>

        <p className="text-yellow-400 font-black tracking-widest text-sm">
          PEDIDO RECIBIDO
        </p>

        <h2 className="text-4xl font-black text-white mt-3">
          ¡Gracias por tu compra!
        </h2>

        <p className="text-neutral-400 mt-4">
          Tu pedido fue enviado correctamente al POS de American Burger.
        </p>

        <div className="mt-5 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-5 py-4 text-left">
          <p className="text-yellow-400 font-black uppercase tracking-wider text-sm">
            Próximo paso
          </p>

          <p className="text-neutral-300 mt-2 leading-relaxed">
            En los próximos minutos uno de nuestros colaboradores se pondrá en contacto
            contigo vía <strong className="text-white">WhatsApp</strong> para confirmar tu pedido,
            coordinar la forma de pago y gestionar el envío o retiro en el local.
          </p>
        </div>

        <div className="mt-8 bg-black/50 border border-white/10 rounded-3xl p-5">
          <p className="text-neutral-400 font-bold">Código de pedido</p>

          <p className="text-yellow-400 text-2xl font-black mt-2 break-all">
            #{orderCode}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 text-left">
          <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
            <p className="text-2xl">✅</p>
            <p className="text-xs text-neutral-400 font-bold mt-2">Recibido</p>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
            <p className="text-2xl">👨‍🍳</p>
            <p className="text-xs text-neutral-400 font-bold mt-2">Preparación</p>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
            <p className="text-2xl">📦</p>
            <p className="text-xs text-neutral-400 font-bold mt-2">Listo</p>
          </div>
        </div>

        <p className="mt-6 text-neutral-300 font-bold">
          Tiempo estimado: <span className="text-yellow-400">20–30 minutos</span>
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-8 w-full bg-yellow-400 hover:bg-yellow-300 text-black py-5 rounded-2xl font-black text-lg transition"
        >
          Seguir comprando
        </button>
      </div>
    </div>
  )
}

export default OrderSuccessModal
