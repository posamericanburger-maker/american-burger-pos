import { formatDate } from '../utils/helpers'

const Navbar = ({ title }) => {
  const today = formatDate(new Date())

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-poppins font-bold text-black">{title}</h1>
        <p className="text-sm text-gray-500">{today}</p>
      </div>
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
          <span className="text-black font-bold">AB</span>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
