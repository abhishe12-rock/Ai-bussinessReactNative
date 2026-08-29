import React, { useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import RootNavigator, { RootStackParamList } from './src/navigation/RootNavigator';

export default function App() {
  const navRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  const handleUrl = (url: string | null | undefined) => {
    if (!url || !url.includes('employee-invite')) return;
    setTimeout(() => {
      navRef.current?.navigate('SetPassword' as never);
    }, 500);
  };

  useEffect(() => {
    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer ref={navRef}>
        <RootNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}