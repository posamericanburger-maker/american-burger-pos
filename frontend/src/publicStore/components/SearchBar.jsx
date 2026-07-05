function SearchBar({ value = '', onChange }) {
  return (
    <div className="relative w-full">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-xl">
        🔍
      </div>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar hamburguesas, papas, bebidas..."
        className="
          w-full
          bg-neutral-900
          border
          border-white/10
          focus:border-yellow-400
          text-white
          placeholder:text-neutral-500
          rounded-3xl
          pl-14
          pr-5
          py-5
          outline-none
          font-bold
          shadow-xl
          shadow-black/20
          transition
        "
      />
    </div>
  )
}

export default SearchBar
