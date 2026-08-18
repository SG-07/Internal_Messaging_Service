import { useState } from "react";
import { Link } from "react-router";

import { useAuth } from "../../context/AuthContext";

import SearchBar from "./SearchBar";
import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";

function Navbar() {
  const { user } = useAuth();

  const [search, setSearch] = useState("");

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        {/* Logo */}
        <Link
          to="/dashboard"
          className="shrink-0 text-lg font-bold text-blue-600 hover:text-blue-700"
        >
          Internal Messaging
        </Link>

        {/* Search */}
        {user && (
          <div className="mx-auto w-full max-w-md">
            <SearchBar value={search} onChange={setSearch} />
          </div>
        )}

        {/* Right side */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {/* User Menu */}
          <UserMenu user={user} />
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
