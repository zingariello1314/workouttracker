import { useWorkout } from '../../context/WorkoutContext';
import CodeCalendarSubTab from '../code/CodeCalendarSubTab';
import CodeJournalDirectivesSubTab from '../code/CodeJournalDirectivesSubTab';
import CodeStatisticsSubTab from '../code/CodeStatisticsSubTab';

const CodeTab = () => {
  const { activeTab } = useWorkout();
  if (activeTab === 'code-journal') {
    return <CodeJournalDirectivesSubTab />;
  }
  if (activeTab === 'code-stats') {
    return <CodeStatisticsSubTab />;
  }
  return <CodeCalendarSubTab />;
};

export default CodeTab;
