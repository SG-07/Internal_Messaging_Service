// src/component/navbar/SearchBar.jsx

import { useState } from 'react';
import { getConversationsWithUser } from '../../api/conversations';

function SearchBar({
  value,
  onChange,
  onResults,
  onClear,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch(event) {
    event.preventDefault();

    console.log('[SearchBar] Form submitted');
    console.log('[SearchBar] Search value:', value);

    const identifier = value.trim();

    /*
     * If the search box is empty and the user presses Enter,
     * return to the normal inbox.
     */
    if (!identifier) {
      console.log(
        '[SearchBar] Empty search - returning to inbox'
      );

      setError('');

      if (onClear) {
        onClear();
      }

      return;
    }

    if (loading) {
      console.log(
        '[SearchBar] Search already in progress'
      );

      return;
    }

    try {
      setLoading(true);
      setError('');

      console.log(
        '[SearchBar] Calling getConversationsWithUser:',
        identifier
      );

      const response =
        await getConversationsWithUser(identifier);

      console.log(
        '[SearchBar] Backend response:',
        response
      );

      if (onResults) {
        console.log(
          '[SearchBar] Sending response to Navbar'
        );

        onResults(response);
      } else {
        console.warn(
          '[SearchBar] onResults is not defined'
        );
      }
    } catch (err) {
      console.error(
        '[SearchBar] Search failed:',
        err
      );

      setError(
        err.message ||
          'Unable to search for conversations.'
      );
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    console.log(
      '[SearchBar] Clear button clicked'
    );

    setError('');

    onChange('');

    if (onClear) {
      onClear();
    }
  }

  function handleInputChange(event) {
    const newValue = event.target.value;

    onChange(newValue);
    setError('');

    /*
     * If the user manually deletes everything from
     * the search field, immediately return to inbox.
     *
     * This makes the search bar behave naturally:
     * non-empty = search mode
     * empty = inbox mode
     */
    if (!newValue.trim() && value.trim()) {
      console.log(
        '[SearchBar] Search cleared - returning to inbox'
      );

      if (onClear) {
        onClear();
      }
    }
  }

  return (
    <div className="relative w-full">

      {/* Search Form */}
      <form onSubmit={handleSearch}>

        {/* Search Icon */}
        <button
          type="submit"
          disabled={loading}
          aria-label="Search"
          className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-500 transition hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                className="opacity-25"
              />

              <path
                d="M21 12a9 9 0 0 1-9 9"
                className="opacity-75"
              />
            </svg>
          ) : (
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
              />

              <path d="m20 20-3.5-3.5" />
            </svg>
          )}
        </button>

        {/* Input */}
        <input
          type="search"
          value={value}
          onChange={handleInputChange}
          placeholder="Search email..."
          disabled={loading}
          autoComplete="off"
          className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-9 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
        />

        {/* Clear */}
        {value && !loading && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition hover:text-blue-600"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 6l12 12" />
              <path d="M18 6 6 18" />
            </svg>
          </button>
        )}

      </form>

      {/* Search Error */}
      {error && (
        <p className="absolute left-0 top-full z-50 mt-1 text-xs text-red-600">
          {error}
        </p>
      )}

    </div>
  );
}

export default SearchBar;