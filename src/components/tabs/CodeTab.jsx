import { useWorkout } from '../../context/WorkoutContext';
import CodeCalendarSubTab from '../code/CodeCalendarSubTab';
import CodeJournalDirectivesSubTab from '../code/CodeJournalDirectivesSubTab';

const CodeTab = () => {
  const { activeTab } = useWorkout();
  if (activeTab === 'code-journal') {
    return <CodeJournalDirectivesSubTab />;
  }
  return <CodeCalendarSubTab />;
};

export default CodeTab;
