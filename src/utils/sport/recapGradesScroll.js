/** Ancrage scroll Récap → Grades (sous le header sticky du shell Récap). */

export const RECAP_GRADES_SECTION_ID = 'recap-grades-section';
export const RECAP_GRADE_DETAIL_FOCUS_ID = 'recap-grade-detail-focus';

export function scrollToRecapGradeDetail() {
  if (typeof document === 'undefined') return;
  requestAnimationFrame(() => {
    const detail = document.getElementById(RECAP_GRADE_DETAIL_FOCUS_ID);
    const section = document.getElementById(RECAP_GRADES_SECTION_ID);
    const target = detail || section;
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}
