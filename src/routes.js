import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SettingsIcon from 'react-native-vector-icons/Ionicons';

import { store } from './store/store';
import { icons } from './styles/index';

import Home from './pages/Home/index';
import Details from './pages/Details/index';
import InitialConfig from './pages/InitialConfig/index';
import AuthScreen from './pages/AuthScreen/index';
import SettingsScreen from './pages/SettingsScreen/index';
import CTOMapping from './pages/CTOMapping/index';
import PickNewLocation from './pages/PickNewLocation/index';
import SearchScreen from './pages/SearchScreen/index';
import ClientDetails from './pages/ClientDetails/index';

import { fonts } from './styles/index';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator tabBarOptions={{
      keyboardHidesTabBar: true,
      labelStyle: {
        fontSize: fonts.small,
      }
    }}>
      <Tab.Screen
        name="Chamados"
        component={Home}
        options={{
          tabBarIcon: ({ color }) => (
            <Icon name="home" size={icons.tiny} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Buscar cliente',
          tabBarIcon: ({ color }) => (
            <Icon name="account-search" size={icons.tiny} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Ajustes',
          tabBarIcon: ({ color }) => (
            <SettingsIcon name="settings-outline" size={icons.tiny} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{ gestureEnabled: true, headerShown: true }}
    >
      <Stack.Screen
        name="InitialConfig"
        component={InitialConfig}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="AuthScreen"
        component={AuthScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function RootTab() {
  const globalState = useContext(store);

  return (
    <>
      {globalState.state.userToken !== null
        ?
        <Stack.Navigator
          screenOptions={{ gestureEnabled: true, headerShown: true }}
        >
          <Stack.Screen
            name="Chamados"
            component={HomeTabs}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="Details"
            component={Details}
            options={{
              title: 'Mais detalhes',
              headerStyle: {
                backgroundColor: '#FFF',
              },
              headerTintColor: '#337AB7',
              headerTransparent: true,
              headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: fonts.huge,
                marginLeft: -20,
              },
            }}
          />
          
          <Stack.Screen
            name="ClientDetails"
            component={ClientDetails}
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="CTOs"
            component={CTOMapping}
            options={{
              title: 'Mapa de CTOs',
              headerStyle: {
                backgroundColor: '#FFF',
              },
              headerTintColor: '#337AB7',
              headerTransparent: true,
              headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: fonts.huge,
                marginLeft: -20,
              },
            }}
          />

          <Stack.Screen
            name="UpdateClienteLocation"
            component={PickNewLocation}
            options={{
              title: 'Atualizar endereço',
              headerStyle: {
                backgroundColor: '#FFF',
              },
              headerTintColor: '#337AB7',
              headerTransparent: true,
              headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: fonts.huge,
                marginLeft: -20,
              },
            }}
          />

          <Stack.Screen
            name="Search"
            component={SearchScreen}
            options={{
              headerShown: true,
              title: 'Pesquisar',
              headerStyle: {
                backgroundColor: '#FFF',
              },
              headerTintColor: '#337AB7',
              headerTransparent: true,
              headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: fonts.huge,
                marginLeft: -20,
              },
            }}
          />
        </Stack.Navigator>
        :
        <AuthStack />
      }
    </>

  );
}
