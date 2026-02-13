/**
 * LectureUnifiedModule - Bloc Lecture unifié (Lecture + Session Lecture Active)
 * Un seul en-tête "Lecture" avec le contenu des deux blocs empilés.
 */

import React, { memo, Suspense, lazy } from 'react';

const LectureSection = lazy(() => import('../LectureSection'));
const ActiveReadingSessionModule = lazy(() => import('./ActiveReadingSessionModule'));

const LectureUnifiedModule = memo(({
  isExpanded,
  onToggle,
  data = {},
  navigation,
  todayDate
}) => {
  const learningData = data.learning || {};

  return (
    <section className={`sidebar-section sidebar-section-enhanced ${isExpanded ? 'expanded' : ''}`}>
      <header
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label="Section Lecture"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon" aria-hidden="true">📖</span>
          Lecture
        </h2>
        <span
          className={`sidebar-section-toggle ${isExpanded ? 'expanded' : ''}`}
          aria-hidden="true"
        >
          ▼
        </span>
      </header>
      {isExpanded && (
        <div className="sidebar-section-unified-content">
          <Suspense fallback={<div className="sidebar-module-loading">Chargement...</div>}>
            <LectureSection
              embedded
              isExpanded={true}
              onToggle={() => {}}
              data={learningData}
              navigation={navigation}
              todayDate={todayDate}
            />
            <ActiveReadingSessionModule
              embedded
              isExpanded={true}
              onToggle={() => {}}
              data={data}
              navigation={navigation}
              todayDate={todayDate}
            />
          </Suspense>
        </div>
      )}
    </section>
  );
});

LectureUnifiedModule.displayName = 'LectureUnifiedModule';

export default LectureUnifiedModule;
