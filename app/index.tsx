import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { getProfile } from '@/lib/api/auth';
import Colors from '@/constants/colors';

export default function Index() {
  const { session, isLoading, setUser, user } = useAuthStore();
  const [profileChecked, setProfileChecked] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!session) {
      setProfileChecked(true);
      return;
    }
    getProfile(session.user.id).then((profile) => {
      if (profile) {
        setUser(profile);
        setHasProfile(true);
      } else {
        setHasProfile(false);
      }
      setProfileChecked(true);
    });
  }, [session, isLoading]);

  if (isLoading || !profileChecked) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: Colors.neutral.background,
        }}
      >
        <ActivityIndicator size="large" color={Colors.primary.coral} />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/login" />;
  if (!hasProfile) return <Redirect href="/(auth)/profile-setup" />;
  return <Redirect href="/(app)/home" />;
}
