import React from 'react';

const TabNavigation = React.memo(
  ({
    tabs = [],
    activeTab,
    onSelect,
    className = '',
    ariaLabel = 'Navigation des onglets',
    onTabHover = null,
    onTabFocus = null
  }) => {
    const tabRefs = React.useRef([]);
    tabRefs.current = [];

    const focusTabByIndex = React.useCallback((index) => {
      const node = tabRefs.current[index];
      if (node && typeof node.focus === 'function') {
        node.focus();
      }
    }, []);

    const handleKeyDown = React.useCallback(
      (event, index) => {
        if (tabs.length === 0) {
          return;
        }
        let targetIndex = null;
        if (event.key === 'ArrowRight') {
          targetIndex = (index + 1) % tabs.length;
        } else if (event.key === 'ArrowLeft') {
          targetIndex = (index - 1 + tabs.length) % tabs.length;
        } else if (event.key === 'Home') {
          targetIndex = 0;
        } else if (event.key === 'End') {
          targetIndex = tabs.length - 1;
        }

        if (targetIndex !== null) {
          event.preventDefault();
          focusTabByIndex(targetIndex);
        }
      },
      [tabs.length, focusTabByIndex]
    );

    const handleSelect = React.useCallback(
      (tabId) => {
        if (typeof onSelect === 'function') {
          onSelect(tabId);
        }
      },
      [onSelect]
    );

    return (
      <div
        className={`mt-6 border-b border-slate-700 ${className}`}
        role="tablist"
        aria-label={ariaLabel}
      >
        <div className="flex gap-4">
          {tabs.map((tab, index) => {
            const isActive = tab.id === activeTab;
            const panelId = tab.panelId || `${tab.id}-panel`;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`${tab.id}-tab`}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                aria-selected={isActive}
                aria-controls={panelId}
                aria-label={tab.ariaLabel || tab.label}
                tabIndex={isActive ? 0 : -1}
                className={`px-4 py-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isActive
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
                onClick={() => handleSelect(tab.id)}
                onMouseEnter={() => onTabHover && onTabHover(tab.id)}
                onFocus={() => onTabFocus && onTabFocus(tab.id)}
                onKeyDown={(event) => handleKeyDown(event, index)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  },
  (prev, next) =>
    prev.activeTab === next.activeTab &&
    prev.tabs === next.tabs &&
    prev.className === next.className
);

export default TabNavigation;

