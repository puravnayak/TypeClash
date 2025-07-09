import { ThemeToggle } from "../ui/ThemeToggle";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, login, logout } = useAuth();

  return (
    <nav className="h-16 w-full flex items-center justify-between px-4 bg-white dark:bg-zinc-900 border-b dark:border-zinc-700">
      <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
        TypeClash
      </h1>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        {user ? (
          <div className="flex items-center gap-2">
            <img src={user.photoURL } className="h-8 w-8 rounded-full" />
            <button
              onClick={logout}
              className="text-zinc-900 dark:text-white text-sm px-3 py-1 rounded border dark:border-white border-zinc-300"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={login}
            className="text-zinc-900 dark:text-white text-sm px-3 py-1 rounded border dark:border-white border-zinc-300"
          >
            Login with Google
          </button>
        )}
      </div>
    </nav>
  );
}
