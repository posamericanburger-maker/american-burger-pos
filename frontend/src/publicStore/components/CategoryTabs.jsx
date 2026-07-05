const categoryIcon = (category = '') => {
  const name = String(category).toLowerCase()

  if (name.includes('hamburguesa')) return '🍔'
  if (name.includes('papa') || name.includes('snack')) return '🍟'
  if (name.includes('chiken') || name.includes('chicken') || name.includes('pollo')) return '🍗'
  if (name.includes('bebida')) return '🥤'
  if (name.includes('ingrediente')) return '➕'
  if (name.includes('combo')) return '⭐'

  return '🔥'
}

function CategoryTabs({ categories = [], selectedCategory, onSelect }) {
  return (
    <div className="sticky top-20 z-40 bg-black/90 backdrop-blur-xl border-y border-white/10">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((category) => {
            const active = selectedCategory === category

            return (
              <button
                key={category}
                type="button"
                onClick={() => onSelect(category)}
                className={`shrink-0 flex items-center gap-3 px-5 py-3 rounded-2xl font-black transition-all duration-300 border ${
                  active
                    ? 'bg-yellow-400 text-black border-yellow-400 shadow-lg shadow-yellow-400/20'
                    : 'bg-neutral-900 text-white border-white/10 hover:border-yellow-400/60'
                }`}
              >
                <span className="text-xl">{categoryIcon(category)}</span>
                <span className="whitespace-nowrap">{category}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default CategoryTabs
