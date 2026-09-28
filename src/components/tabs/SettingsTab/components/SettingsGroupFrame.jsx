import React from 'react';

const SettingsGroupFrame = ({ group, visible, children }) => {
  if (!visible) return null;

  return (
    <section
      id={`settings-group-${group.id}`}
      data-settings-tone={group.id}
      className="settings-tone scroll-mt-32 space-y-3"
      style={{ '--st-accent': group.accent }}
    >
      <h3 className="st-group-title">{group.label}</h3>
      <div className={group.layout === 'grid' ? 'grid items-start gap-4 lg:grid-cols-2' : 'space-y-4'}>
        {children}
      </div>
    </section>
  );
};

export default SettingsGroupFrame;
