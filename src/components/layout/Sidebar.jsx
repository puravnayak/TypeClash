import { Link, useLocation } from 'react-router-dom'

export default function Sidebar() {
  const location = useLocation()

  const navItems = [
    { name: 'Dashboard', icon: '🏠', path: '/' },
    { name: 'Practice', icon: '⚡', path: '/practice'},
    { name: 'Battle', icon: '🎮', path: '/battle' },
    { name: 'History', icon: '📈', path: '/history' },
    { name: 'Profile', icon: '👤', path: '/profile' },
  ]

  return (
    <aside className="hidden md:block w-60 h-full bg-zinc-100 dark:bg-zinc-800 border-r dark:border-zinc-700 p-4">
      <ul className="space-y-2">
        {navItems.map((item) => (
          <li key={item.name}>
            <Link
              to={item.path}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors ${
                location.pathname === item.path
                  ? 'bg-zinc-300 dark:bg-zinc-700 font-semibold'
                  : ''
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  )
}
