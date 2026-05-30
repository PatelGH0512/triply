import { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTrip } from '@/hooks/useTrip';
import { useTripStore } from '@/store/tripStore';
import { TripProvider } from '@/lib/context/TripContext';
import { useDays } from '@/hooks/useActivities';
import { useTripRealtime } from '@/hooks/useRealtime';
import TripHeader from '@/components/trip/TripHeader';
import TripBottomNav, { TabName } from '@/components/trip/TripBottomNav';
import OverviewScreen from './screens/overview';
import MapScreen from './screens/map';
import ChatScreen from './screens/chat';
import AiScreen from './screens/ai';
import ExpensesScreen from './screens/expenses';
import Colors from '@/constants/colors';

function TripShellContent({ tripId }: { tripId: string }) {
  const [activeTab, setActiveTab] = useState<TabName>('overview');
  const { data: days = [] } = useDays(tripId);
  const dayIds = days.map((d) => d.id);

  useTripRealtime(tripId, dayIds);

  const renderScreen = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewScreen />;
      case 'map':
        return <MapScreen />;
      case 'chat':
        return <ChatScreen />;
      case 'ai':
        return <AiScreen />;
      case 'expenses':
        return <ExpensesScreen />;
    }
  };

  return (
    <View style={styles.shell}>
      <TripHeader onAddMembers={() => {}} />
      <View style={styles.screenArea}>{renderScreen()}</View>
      <TripBottomNav activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
}

export default function TripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: trip, isLoading } = useTrip(id);
  const { setActiveTrip } = useTripStore();

  useEffect(() => {
    if (trip) setActiveTrip(trip);
  }, [trip]);

  if (isLoading || !trip) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary.coral} />
      </View>
    );
  }

  return (
    <TripProvider tripId={id} trip={trip}>
      <TripShellContent tripId={id} />
    </TripProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral.background,
  },
  shell: {
    flex: 1,
    backgroundColor: Colors.neutral.background,
  },
  screenArea: {
    flex: 1,
  },
});
