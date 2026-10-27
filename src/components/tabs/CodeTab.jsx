import { useAppNavigation } from '../../context/NavigationContext';
import CodeCalendarSubTab from '../code/CodeCalendarSubTab';
import CodeJournalDirectivesSubTab from '../code/CodeJournalDirectivesSubTab';
import CodeStatisticsSubTab from '../code/CodeStatisticsSubTab';

const CodeTab = () => {
  const { activeTab } = useAppNavigation();
  if (activeTab === 'code-journal') {
    return <CodeJournalDirectivesSubTab />;
  }
  if (activeTab === 'code-stats') {
    return <CodeStatisticsSubTab />;
  }
  return <CodeCalendarSubTab />;
};

export default CodeTab;
