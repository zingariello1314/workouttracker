import React from 'react';

const EnduranceSectionHeader = ({ title, subtitle, actions = [] }) => {
  return (
    <header className="head">
      <div>
        <div className="kicker">Défis / {title}</div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions.length > 0 && (
        <div className="hbtn">
          {actions.map((action) => {
            const { key, label, icon: Icon, onClick } = action;
            const isPrimary =
              String(key || '').includes('challenge') || String(key || '').includes('create');
            return (
              <button
                key={key || label}
                type="button"
                onClick={onClick}
                className={isPrimary ? 'btn pri' : 'btn'}
              >
                {Icon && <Icon className="w-5 h-5" />}
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};

export default React.memo(EnduranceSectionHeader);
