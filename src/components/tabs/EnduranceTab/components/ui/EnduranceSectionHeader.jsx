import React from 'react';

const EnduranceSectionHeader = ({ title, subtitle, actions = [] }) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
      <div>
        <h2 className="text-4xl font-bold text-white mb-2">{title}</h2>
        {subtitle && <p className="text-teal-700">{subtitle}</p>}
      </div>
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {actions.map((action) => {
            const { key, label, icon: Icon, onClick, className } = action;
            return (
              <button
                key={key || label}
                type="button"
                onClick={onClick}
                className={className}
              >
                {Icon && <Icon className="w-5 h-5" />}
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default React.memo(EnduranceSectionHeader);
