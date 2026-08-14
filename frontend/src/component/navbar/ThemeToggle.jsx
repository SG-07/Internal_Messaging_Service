import { useEffect, useState } from 'react';

function ThemeToggle() {
  const [dark, setDark] = useState(
    localStorage.getItem('theme') === 'dark'
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <button
      type="button"
      onClick={() => setDark((value) => !value)}
      className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
    >
      {dark ? 'Light' : 'Dark'}
    </button>
  );
}

export default ThemeToggle;