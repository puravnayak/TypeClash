import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function AppShell({ children }) {
  return (
    <div className="h-screen w-full flex flex-col dark:bg-zinc-950">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto text-zinc-900 dark:text-white">
          {children}
        </main>
      </div>
    </div>
  )
}
