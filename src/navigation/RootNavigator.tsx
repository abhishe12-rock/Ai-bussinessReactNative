// import React from 'react';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';

// import LoginScreen from '../screens/Auth/LoginScreen';
// import SignupScreen from '../screens/Auth/SignupScreen';
// import SetPasswordScreen from '../screens/Auth/SetPasswordScreen';
// import DrawerNavigator from './DrawerNavigator';

// export type RootStackParamList = {
//   Login: undefined;
//   Signup: undefined;
//   SetPassword: undefined;
//   Dashboard: { allowedModules?: Record<string, boolean>; employeeName?: string; employeeId?: string } | undefined;
// };

// const Stack = createNativeStackNavigator<RootStackParamList>();

// export default function RootNavigator() {
//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
//       <Stack.Screen name="Login" component={LoginScreen} />
//       <Stack.Screen name="Signup" component={SignupScreen} />
//       <Stack.Screen name="SetPassword" component={SetPasswordScreen} />
//       <Stack.Screen name="Dashboard" component={DrawerNavigator} />
//     </Stack.Navigator>
//   );
// }
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/Auth/SplashScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';
import SetPasswordScreen from '../screens/Auth/SetPasswordScreen';
import DrawerNavigator from './DrawerNavigator';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  SetPassword: undefined;
  Dashboard: { allowedModules?: Record<string, boolean>; employeeName?: string; employeeId?: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="SetPassword" component={SetPasswordScreen} />
      <Stack.Screen name="Dashboard" component={DrawerNavigator} />
    </Stack.Navigator>
  );
}