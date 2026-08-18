// frontend/src/component/navbar/Navbar.jsx

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';

import { useAuth } from '../../context/AuthContext';

import SearchBar from './SearchBar';
import UserMenu from './UserMenu';

function Navbar() {
  const { user } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [search, setSearch] = useState('');

  function handleSearchResults(response) {
    console.log('[Navbar] Search response:', response);

    navigate('/dashboard', {
      state: {
        searchResult: response,
        searchQuery: search.trim(),
      },
    });
  }

  function handleClearSearch() {
    console.log('[Navbar] Clearing search');

    setSearch('');

    // Return to the normal dashboard/inbox.
    navigate('/dashboard', {
      replace: true,
      state: {
        searchResult: null,
        searchQuery: '',
      },
    });
  }

  function handleLogoClick() {
    console.log('[Navbar] Logo clicked');

    setSearch('');

    // Always return to the normal inbox.
    navigate('/dashboard', {
      replace: true,
      state: {
        searchResult: null,
        searchQuery: '',
      },
    });
  }

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">

        {/* Logo */}
        <Link
          to="/dashboard"
          onClick={handleLogoClick}
          className="shrink-0 text-lg font-bold text-blue-600 hover:text-blue-700"
        >
          Internal Messaging
        </Link>

        {/* Search */}
        {user && (
          <div className="mx-auto w-full max-w-md">
            <SearchBar
              value={search}
              onChange={setSearch}
              onResults={handleSearchResults}
              onClear={handleClearSearch}
            />
          </div>
        )}

        {/* Right side */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <UserMenu user={user} />
        </div>

      </div>
    </nav>
  );
}

export default Navbar;