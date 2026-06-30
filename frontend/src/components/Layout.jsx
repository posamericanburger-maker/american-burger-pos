import Sidebar from './Sidebar'
import Navbar from './Navbar'

const Layout = ({ title, children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />

      <div className="min-h-screen flex flex-col lg:ml-64">
        {title && <Navbar title={title} />}

        <main className="flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 pt-20 pb-24 sm:px-5 md:px-6 lg:pt-6 lg:pb-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
