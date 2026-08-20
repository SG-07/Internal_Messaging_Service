import { useEffect, useRef, useState } from 'react';

const DEPARTMENTS = [
  'HR',
  'Administrator',
  'IT',
  'Sales',
  'Marketing',
];

export const NO_DEPARTMENT = '__NO_DEPARTMENT__';

function DepartmentFilter({
  value,
  onChange,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      'mousedown',
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      );
    };
  }, []);

  function toggleDepartment(department) {
    if (value.includes(department)) {
      onChange(
        value.filter((item) => item !== department)
      );
    } else {
      onChange([
        ...value,
        department,
      ]);
    }
  }

  function removeDepartment(department) {
    onChange(
      value.filter(
        (item) => item !== department
      )
    );
  }

  function clearDepartments() {
    onChange([]);
  }

  function getDepartmentLabel(department) {
    if (department === NO_DEPARTMENT) {
      return 'No Department';
    }

    return department;
  }

  return (
    <div
      ref={dropdownRef}
      className="w-full max-w-md"
    >
      <label className="mb-2 block text-sm font-medium text-gray-700">
        Department
      </label>

      <div className="relative">

        {/* Dropdown button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() =>
            setOpen((current) => !current)
          }
          className="flex min-h-[42px] w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-sm outline-none transition hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
        >
          <div className="flex flex-wrap gap-1">

            {value.length === 0 && (
              <span className="text-gray-500">
                Select department
              </span>
            )}

            {value.map((department) => (
              <span
                key={department}
                className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
              >
                {getDepartmentLabel(department)}

                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();

                    removeDepartment(
                      department
                    );
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' ||
                      event.key === ' '
                    ) {
                      event.preventDefault();
                      event.stopPropagation();

                      removeDepartment(
                        department
                      );
                    }
                  }}
                  className="cursor-pointer font-bold hover:text-blue-900"
                >
                  ×
                </span>
              </span>
            ))}

          </div>

          <span className="ml-2 text-gray-500">
            {open ? '▲' : '▼'}
          </span>
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute left-0 right-0 z-50 mt-2 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">

            {/* Regular departments */}
            {DEPARTMENTS.map((department) => {
              const selected =
                value.includes(department);

              return (
                <button
                  key={department}
                  type="button"
                  onClick={() =>
                    toggleDepartment(
                      department
                    )
                  }
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded border ${
                      selected
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {selected && '✓'}
                  </span>

                  {department}
                </button>
              );
            })}

            {/* No Department */}
            <button
              type="button"
              onClick={() =>
                toggleDepartment(
                  NO_DEPARTMENT
                )
              }
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded border ${
                  value.includes(NO_DEPARTMENT)
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {value.includes(NO_DEPARTMENT) &&
                  '✓'}
              </span>

              No Department
            </button>

            {/* Clear selection */}
            {value.length > 0 && (
              <div className="mt-2 border-t pt-2">
                <button
                  type="button"
                  onClick={clearDepartments}
                  className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Clear selection
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}

export default DepartmentFilter;