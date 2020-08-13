import React, { useState, useContext, useEffect, useReducer } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, Alert, RefreshControl, ToastAndroid } from 'react-native';
import Accordion from 'react-native-collapsible/Accordion';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import axios from 'axios';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { fonts, icons } from '../../styles/index';
import { store } from '../../store/store';

export default function ClientFinancing(props) {
  const client_id = props.data;

  const [PendingActiveSections, setPendingActiveSections] = useState([]);

  const [PaidActiveSections, setPaidActiveSections] = useState([]);

  const [state, setState] = useState(null);

  const [refreshing, setRefreshing] = useState(false);

  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

  const [switcherState, dispatch] = useReducer(reducer, {
    isEnabled: false,
    date: new Date(),
  });

  function reducer(state, action) {
    switch (action.type) {
      case 'turnOff':
        return {
          isEnabled: false,
          date: new Date(),
        }

      case 'turnOn':
        setIsDatePickerVisible(false);

        return {
          isEnabled: true,
          date: action.payload.date,
        }
    }
  }

  const globalState = useContext(store);

  async function loadAPI() {
    try {
      setRefreshing(true);
      const response = await axios.get(
        `http://${globalState.state.server_ip}:${globalState.state.server_port}/invoices/${client_id}`,
        {
          timeout: 3500,
          headers: {
            Authorization: `Bearer ${globalState.state.userToken}`,
          },
        },
      );

      setState(response.data);
      if (response.data.observacao === 'sim' && switcherState.isEnabled === false) {
        toggleSwitch();
      }
      setRefreshing(false);
    } catch (error) {
      setRefreshing(false);
      Alert.alert('Erro', 'Não foi possível comunicar com a API ClientFinancing');
    }
  }

  useEffect(() => {
    loadAPI();
  }, []);

  async function toggleSwitch() {
    if (switcherState.isEnabled === true) {
      dispatch({
        type: 'turnOff',
      });
    } else {
      setIsDatePickerVisible(true);
    }

    // try {
    //   const response = await axios.post(
    //     `http://${globalState.state.server_ip}:${globalState.state.server_port}/client/${client_id}`,
    //     {
    //       observacao: switcherState.isEnabled === true ? 'nao' : 'sim',
    //     },
    //     {
    //       timeout: 2500,
    //       headers: {
    //         Authorization: `Bearer ${globalState.state.userToken}`,
    //       },
    //     },
    //   );

    // } catch (error) {
    //   console.log(error);
    //   dispatch({
    //     type: 'turnOff',
    //     payload: {
    //       isEnable: true,
    //       date: new Date(),
    //     },
    //   });
    //   ToastAndroid.show("Erro. Tente novamente", ToastAndroid.SHORT);
    // }
  }

  const _renderHeader = (section, isActive, index) => {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Icon name={index ? "chevron-up-circle" : "chevron-down-circle"} size={icons.large} color="#337AB7" />
        <View style={{ width: '50%', alignItems: 'center' }}>
          <Text numberOfLines={1} style={[styles.main_text, { fontSize: fonts.medium, textAlign: 'left', width: '50%' }]}>Vencimento</Text>
        </View>
        {section.content.status === 'vencido'
          ? <Text style={{ color: index ? '#000' : 'red', fontFamily: 'Roboto-Light' }}>{section.title}</Text>
          : <Text style={{ color: index ? '#000' : '#337AB7', fontFamily: 'Roboto-Light' }}>{section.title}</Text>
        }
      </View>
    );
  };

  const _renderContent = (section) => {
    return (
      <>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="chevron-down-circle" size={icons.large} color="#FFF" />
          <View style={{ width: '50%', alignItems: 'center' }}>
            <Text
              style={[
                styles.main_text,
                {
                  fontSize: fonts.medium,
                  textAlign: 'left',
                  width: '50%'
                }
              ]}
            >
              Tipo
            </Text>
          </View>
          <Text style={{ fontFamily: 'Roboto-Light' }}>{section.content.tipo}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="chevron-down-circle" size={icons.large} color="#FFF" />
          <View style={{ width: '50%', alignItems: 'center' }}>
            <Text
              style={[
                styles.main_text,
                {
                  fontSize: fonts.medium,
                  textAlign: 'left',
                  width: '50%'
                }
              ]}
            >
              Valor
            </Text>
          </View>
          <Text style={{ fontFamily: 'Roboto-Light' }}>{section.content.valor}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="chevron-down-circle" size={icons.large} color="#FFF" />
          <View style={{ width: '50%', alignItems: 'center' }}>
            <Text
              style={[
                styles.main_text,
                {
                  fontSize: fonts.medium,
                  textAlign: 'left',
                  width: '50%'
                }
              ]}
            >
              Status
            </Text>
          </View>
          <Text style={{ fontFamily: 'Roboto-Light' }}>{section.content.status}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="chevron-down-circle" size={icons.large} color="#FFF" />
          <View style={{ width: '50%', alignItems: 'center' }}>
            <Text
              style={[
                styles.main_text,
                {
                  fontSize: fonts.medium,
                  textAlign: 'left',
                  flex: 1, width: '50%'
                }]}
            >
              Descrição
            </Text>
          </View>
          <View style={{ flex: 1, marginBottom: 10 }}>
            <Text style={{ fontFamily: 'Roboto-Light' }}>{section.content.descricao}</Text>
          </View>
        </View>
      </>
    );
  };

  const _renderFooter = () => {
    return (
      <View style={{ flex: 1, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#d9d9d9" }}></View>
    );
  };

  const _updateSections = (option, activeSections) => {
    if (option === 'pending') {
      setPendingActiveSections(activeSections);
    } else {
      setPaidActiveSections(activeSections);
    }
  };

  async function handleNewDate(event, selectedDate) {
    if (event.type === 'set') {
      dispatch({
        type: 'turnOn',
        payload: {
          date: selectedDate,
        },
      });
    } else if (event.type === 'dismissed') {
      setIsDatePickerVisible(false);
    }
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => loadAPI()} />
      }
    >
      <View style={styles.observation_section}>
        <View style={{ flex: 1 }}>
          <Text style={styles.main_text}>Em observação</Text>
          {switcherState.isEnabled
            ?
            <Text style={styles.sub_text}>
              {`Até: ${format(switcherState.date, 'dd/MM/yyyy')}`}
            </Text>
            :
            <Text style={styles.sub_text}>
              Habilitar o modo observasão impedirá que o sistema bloqueie o cliente
            </Text>
          }
        </View>
        <Switch
          trackColor={{ false: "#767577", true: "#337AB7" }}
          thumbColor={switcherState.isEnabled ? "#f4f3f4" : "#f4f3f4"}
          ios_backgroundColor="#3e3e3e"
          onValueChange={toggleSwitch}
          value={switcherState.isEnabled}
        />
      </View>

      <View style={styles.invoices}>
        <Text style={[styles.main_text, { marginBottom: 10 }]}>Faturas em aberto</Text>

        {/* {state !== null &&
          <Accordion
            underlayColor="#FFF"
            sections={state.invoices.pending_invoices}
            activeSections={PendingActiveSections}
            renderHeader={_renderHeader}
            renderContent={_renderContent}
            renderFooter={_renderFooter}
            onChange={(activeSections) => _updateSections('pending', activeSections)}
          />
        } */}

      </View>

      <View style={styles.invoices}>
        <Text style={[styles.main_text, { marginBottom: 10 }]}>Faturas pagas</Text>

        {/* {state !== null &&
          <Accordion
            underlayColor="#FFF"
            sections={state.invoices.paid_invoices}
            activeSections={PaidActiveSections}
            renderHeader={_renderHeader}
            renderContent={_renderContent}
            renderFooter={_renderFooter}
            onChange={(activeSections) => _updateSections('paid', activeSections)}
          />
        } */}

      </View>

      {isDatePickerVisible &&
        <DateTimePicker
          mode="datetime"
          display="calendar"
          value={switcherState.date}
          onChange={(event, selectedDate) => { handleNewDate(event, selectedDate) }}
        />
      }
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  main_text: {
    fontWeight: 'bold',
    fontSize: fonts.regular,
  },

  sub_text: {
    fontSize: fonts.small,
    color: '#989898',
  },

  observation_section: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  invoices: {
    marginTop: 15,
  },
});
