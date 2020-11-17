import React, { useEffect, useState, useContext, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
  ToastAndroid,
  Dimensions,
  Switch,
  Animated,
  Linking,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Modal from 'react-native-modal';
import Clipboard from '@react-native-community/clipboard';
import api from '../../services/api';
import CallIcon from 'react-native-vector-icons/Zocial';

import LocationService from '../../services/location';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { store } from '../../store/store';

import styles from './styles';
import { icons } from '../../styles/index';

export default function InstallationRequestDetails({ route, navigation }) {
  const [state, setState] = useState({});

  const [refreshing, setRefreshing] = useState(false);

  const [employeeRefreshing, setEmployeeRefreshing] = useState(false);

  // Estado para controlar visibilidade do datepicker
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

  const [date] = useState(new Date());

  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);

  const [time] = useState(new Date());

  // Declaração do estado global da aplicação
  const globalState = useContext(store);

  // Estado que armazena a lista mais recente de técnicos disponíveis  
  const [employees, setEmployees] = useState([]);

  // Estado que controla a visibilidade do modal de alteração de técnico
  const [employeesModal, setEmployeesModal] = useState(false);

  const [newEmployee, setNewEmployee] = useState({});

  const modalHeight = (Dimensions.get('window').width * 80) / 100;

  const [isDialogVisible, setIsDialogVisible] = useState(false);

  const [isVisited, setIsVisited] = useState(true);
  const [isInstalled, setIsInstalled] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);

  const swipeAnim = useRef(new Animated.Value(0)).current;

  const swipeOut = () => {
    Animated.timing(swipeAnim, {
      toValue: 150,
      duration: 200
    }).start();
  };

  const swipeIn = () => {
    Animated.timing(swipeAnim, {
      toValue: 0,
      duration: 200
    }).start();
  };

  const request_type = 'Ativação';

  function FloatActionBar(option, number) {
    if (number === null) {
      return Alert.alert('Erro', 'Número não informado');
    }

    if (option === 'open') {
      swipeOut();
    } else {
      swipeIn();
    }
  }

  function openWhatsapp(number) {
    if (number === null) {
      return Alert.alert('Erro', 'Número não informado');
    }
    FloatActionBar('close');

    Linking.openURL(`https://api.whatsapp.com/send?phone=55${number}`);
  }

  function dialCall(number) {
    FloatActionBar('close');

    if (number === null) {
      return Alert.alert('Erro', 'Número não informado');
    }

    let phoneNumber;

    if (Platform.OS === 'android') {
      phoneNumber = `tel:${number}`;
    }
    else {
      phoneNumber = `telprompt:${number}`;
    }

    Linking.openURL(phoneNumber);
  };

  async function loadAPI() {
    setRefreshing(true);
    const { id: request_id } = route.params;

    try {
      const response = await api.get(`request/${request_id}/${request_type}?tenant_id=${globalState.state.tenantID}`,
        {
          timeout: 10000,
          headers: {
            Authorization: `Bearer ${globalState.state.userToken}`,
          },
        },
      );

      setState(response.data);
      setRefreshing(false);
    } catch {
      ToastAndroid.show("Não foi possível atualizar", ToastAndroid.SHORT);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAPI();
  }, []);

  async function handleNewDate(event, selectedDate) {
    if (event.type === 'set') {
      setIsDatePickerVisible(false);

      try {
        const { id: request_id } = route.params;

        const response = await api.post(`request/${request_id}?tenant_id=${globalState.state.tenantID}`,
          {
            action: "update_visita_date",
            new_visita_date: selectedDate,
            request_type: request_type,
            madeBy: globalState.state.employee_id,
          },
          {
            timeout: 10000,
            headers: {
              Authorization: `Bearer ${globalState.state.userToken}`,
            },
          },
        );

        ToastAndroid.show("Alteração salva com sucesso", ToastAndroid.SHORT);

        onRefresh();
      } catch {
        Alert.alert('Erro', 'Não foi possível atualizar horário de visita');
      }
    } else if (event.type === 'dismissed') {
      setIsDatePickerVisible(false);
    }
  }

  async function handleNewTime(event, time) {
    if (event.type === 'set') {
      setIsTimePickerVisible(false);

      try {
        const { id: request_id } = route.params;

        const response = await api.post(`request/${request_id}?tenant_id=${globalState.state.tenantID}`,
          {
            action: "update_visita_time",
            new_visita_time: new Date(time.valueOf() - time.getTimezoneOffset() * 60000),
            request_type: request_type,
            madeBy: globalState.state.employee_id,
          },
          {
            timeout: 10000,
            headers: {
              Authorization: `Bearer ${globalState.state.userToken}`,
            },
          },
        );

        ToastAndroid.show("Alteração salva com sucesso", ToastAndroid.SHORT);

        onRefresh();
      } catch (e) {
        console.log(e);
        Alert.alert('Erro', 'Não foi possível atualizar horário de visita');
      }
    } else if (event.type === 'dismissed') {
      setIsTimePickerVisible(false);
    }
  }

  async function onRefresh() {
    loadAPI();
  }

  function ClosingReason() {
    if (state.motivo_fechamento === null) {
      return (
        <View style={styles.line_container}>
          <View>
            <Text style={styles.sub_text}>Motivo de fechamento</Text>
            <Text style={styles.main_text}>Não informado</Text>
          </View>
        </View>
      );
    } else {

      const [, closing_reason] = state.motivo_fechamento.split(': ');
      const [date, hora] = state.fechamento.split(' ');
      const [yyyy, mm, dd] = date.split('-');

      return (
        <>
          <View style={styles.line_container}>
            <View>
              <Text style={styles.sub_text}>Motivo de fechamento</Text>
              <Text style={styles.main_text}>{closing_reason}</Text>
            </View>
          </View>
          <View style={styles.line_container}>
            <View>
              <Text style={styles.sub_text}>Data de fechamento</Text>
              <Text style={styles.main_text}>{dd}/{mm}/{yyyy} às {hora}</Text>
            </View>
          </View>
        </>
      );
    }
  }

  function navigateToClient(client_id, client_name) {
    // Chamados de instalação não permitem abrir os detalhes do cliente
    // porque quando alguém solicita a ativação do serviço, ele ainda não é
    // de fato um cliente
    if (client_id) {
      navigation.navigate('ClientScreen', {
        client_id,
        client_name,
      });
    }
    else {
      const [firstName] = client_name.split(' ');
      ToastAndroid.show(`${firstName} ainda não é um cliente`, ToastAndroid.SHORT);
    }

  }

  function handleNavigateCTOMap(coordinate) {
    if (coordinate) {
      const [latidude, longitude] = coordinate.split(',');

      navigation.navigate('CTOs', {
        latidude: latidude,
        longitude: longitude,
        client_name: state.nome,
        client_id: state.client_id,
      });
    } else {
      Alert.alert('Impossível localizar', 'Este cliente não possui coordenadas definidas');
    }
  }

  async function closeRequest() {
    try {
      const { id: request_id } = route.params;

      const response = await api.post(`request/${request_id}?tenant_id=${globalState.state.tenantID}`,
        {
          action: "close_request",
          employee_id: globalState.state.employee_id,
          request_type: request_type,
          isVisited: isVisited,
          isInstalled: isInstalled,
          isAvailable: isAvailable,
        },
        {
          timeout: 10000,
          headers: {
            Authorization: `Bearer ${globalState.state.userToken}`,
          },
        },
      );

      onRefresh();
      setIsDialogVisible(false);
    } catch (error) {
      console.log(error);
      Alert.alert('Erro', 'Não foi possível fechar chamado');
    }
  }

  function handleCloseRequest() {
    if (globalState.state.isAdmin) {
      setIsDialogVisible(true);
    } else {
      Alert.alert('Acesso negado', 'Você não possui permissão para fechar chamados!');
    }
  }

  function RadioButton(props) {
    return (
      <View style={[{
        height: 15,
        width: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
      }, props.style]}>
        {
          props.selected ?
            <View style={{
              height: 11,
              width: 11,
              borderRadius: 6,
              backgroundColor: '#000',
            }} />
            : null
        }
      </View>
    );
  }

  async function getEmployees() {
    try {
      setEmployeeRefreshing(true);
      const response = await api.get(`employees?tenant_id=${globalState.state.tenantID}`,
        {
          timeout: 10000,
          headers: {
            Authorization: `Bearer ${globalState.state.userToken}`,
          },
        },
      );

      setEmployees(response.data);
      setEmployeeRefreshing(false);
    } catch {
      setRefreshing(false);
      ToastAndroid.show("Tente novamente", ToastAndroid.SHORT);
    }
  }

  async function openChangeEmployeeModal() {
    setEmployeesModal(true);
    getEmployees();
  }

  async function handleChangeEmployee() {
    if (Object.keys(newEmployee).length === 0) {
      ToastAndroid.show("Selecione um técnico antes de confirmar", ToastAndroid.SHORT);
    } else {
      try {
        const { id: request_id } = route.params;

        const response = await api.post(`request/${request_id}?tenant_id=${globalState.state.tenantID}`,
          {
            action: "update_employee",
            employee_id: newEmployee.id,
            request_type: request_type,
          },
          {
            timeout: 10000,
            headers: {
              Authorization: `Bearer ${globalState.state.userToken}`,
            },
          },
        );

        setEmployeesModal(false)
        onRefresh();
        ToastAndroid.show("Alteração salva com sucesso", ToastAndroid.SHORT);

      } catch {
        ToastAndroid.show("Tente novamente", ToastAndroid.SHORT);
      }
    }
  }

  function copyToClipboard(text) {
    Clipboard.setString(text);
    ToastAndroid.show("Copiado para o clipboard", ToastAndroid.SHORT);
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigateToClient(state.client_id, state.nome)} style={styles.section_header}>
        <Text style={styles.header_title}>{route.params.nome}</Text>
        <Text style={[styles.sub_text, { textAlign: 'center' }]}>
          {`${route.params.plano === 'nenhum'
            ? 'Nenhum'
            : route.params.plano} | ${route.params.ip === null ? 'Nenhum' : route.params.ip}`
          }
        </Text>
        {state.equipment_status &&
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Text
              style={[
                styles.client_status,
                {
                  color: state.equipment_status === 'Online' ? 'green' : 'red'
                }
              ]}
            >
              {state.equipment_status}
            </Text>
            <Icon
              name="circle"
              size={10}
              color={state.equipment_status === 'Online' ? 'green' : 'red'}
              style={{ marginTop: 2 }}
            />
          </View>
        }
      </TouchableOpacity>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {refreshing !== true &&
          <>
            {globalState.state.isAdmin
              ?
              <>
                <TouchableOpacity onPress={() => setIsTimePickerVisible(true)}>
                  <View style={styles.cto_line}>
                    <View>
                      <Text style={styles.sub_text}>Horário de visita</Text>
                      <Text style={styles.main_text}>
                        {state.visita}
                      </Text>
                    </View>
                    <View style={{ justifyContent: 'center' }}>
                      <Icon name="clock-outline" size={icons.tiny} color="#000" />
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setIsDatePickerVisible(true)}>
                  <View style={styles.cto_line}>
                    <View>
                      <Text style={styles.sub_text}>Data de visita</Text>
                      <Text style={styles.main_text}>
                        {state.data_visita}
                      </Text>
                    </View>
                    <View style={{ justifyContent: 'center' }}>
                      <Icon name="calendar" size={icons.tiny} color="#000" />
                    </View>
                  </View>
                </TouchableOpacity>
              </>
              :
              <>
                <View>
                  <View style={styles.cto_line}>
                    <View>
                      <Text style={styles.sub_text}>Horário de visita</Text>
                      <Text style={styles.main_text}>
                        {state.visita}
                      </Text>
                    </View>
                  </View>
                </View>

                <View>
                  <View style={styles.cto_line}>
                    <View>
                      <Text style={styles.sub_text}>Data de visita</Text>
                      <Text style={styles.main_text}>
                        {state.data_visita}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            }

            {globalState.state.isAdmin &&
              <TouchableOpacity onPress={() => openChangeEmployeeModal()}>
                <View style={styles.cto_line}>
                  <View>
                    <Text style={styles.sub_text}>Técnico responsável</Text>
                    <Text style={styles.main_text}>
                      {state.employee_name === null
                        ? 'Não assinalado'
                        : state.employee_name
                      }
                    </Text>
                  </View>
                  <View style={{ justifyContent: 'center' }}>
                    <Icon name="account-edit" size={icons.tiny} color="#000" />
                  </View>
                </View>
              </TouchableOpacity>
            }
            <View style={styles.line_container}>
              <Text style={styles.sub_text}>Assunto</Text>
              <Text style={styles.main_text}>{state.assunto}</Text>
            </View>
            <View style={styles.line_container}>
              <Text style={styles.sub_text}>Equipamento</Text>
              <Text style={styles.main_text}>
                {state.equipamento !== "nenhum"
                  ? state.equipamento
                  : 'Nenhum'
                }
              </Text>
            </View>
            <View style={styles.line_container}>
              <Text style={styles.sub_text}>Mensagem</Text>
              <Text style={styles.main_text}>
                {state.mensagem
                  ? state.mensagem
                  : 'Sem comentários'
                }
              </Text>
            </View>

            <View style={[styles.line_container, { flexDirection: 'row', justifyContent: 'space-between' }]}>
              <View>
                <Text style={styles.sub_text}>Login</Text>
                <TouchableOpacity
                  onPress={() => copyToClipboard(state.login)}
                  style={{ flexDirection: 'row', justifyContent: 'space-between' }}
                >
                  <Text style={styles.main_text_login_senha}>{state.login}</Text>
                </TouchableOpacity>
              </View>
              <View>
                <Text style={[styles.sub_text, { textAlign: 'right' }]}>Senha</Text>
                <TouchableOpacity
                  onPress={() => copyToClipboard(state.senha)}
                  style={{ flexDirection: 'row', justifyContent: 'space-between' }}
                >
                  <Text style={styles.main_text_login_senha}>{state.senha}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={() => dialCall(state.telefone)}>
              <View style={styles.clickable_line}>
                <View>
                  <Text style={styles.sub_text}>Telefone</Text>
                  <Text style={styles.main_text}>
                    {state.telefone ? state.telefone : 'Não informado'}
                  </Text>
                </View>
                {state.telefone &&
                  <View style={{ justifyContent: 'center' }}>
                    <CallIcon name="call" size={icons.tiny} color="#000" />
                  </View>
                }
              </View>
            </TouchableOpacity>

            <View>
              <TouchableOpacity onPress={() => FloatActionBar('open', state.celular)}>
                <View style={styles.clickable_line}>
                  <View>
                    <Text style={styles.sub_text}>Celular</Text>
                    <Text style={styles.main_text}>
                      {state.celular ? state.celular : 'Não informado'}
                    </Text>
                  </View>
                  {state.celular &&
                    <View style={{ justifyContent: 'center' }}>
                      <CallIcon name="call" size={icons.tiny} color="#000" />
                    </View>
                  }
                </View>
              </TouchableOpacity>
              <Animated.View style={[styles.swiped_options, { width: swipeAnim }]}>
                <TouchableOpacity
                  onPress={() => openWhatsapp(state.celular)}
                >
                  <Icon name="whatsapp" color="green" size={26} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => dialCall(state.celular)}
                >
                  <CallIcon name="call" size={26} color="green" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => FloatActionBar('close')}
                  style={{ alignItems: 'center', borderRadius: 5, padding: 5 }}
                >
                  <Icon name="close" size={18} color="#000" />
                </TouchableOpacity>
              </Animated.View>
            </View>

            <TouchableOpacity onPress={() => LocationService.navigateToCoordinate(state.coordenadas)}>
              <View style={styles.location_line}>
                <View>
                  <Text style={styles.sub_text}>Endereço</Text>
                  <Text style={styles.main_text}>{`${state.endereco}, ${state.numero} - ${state.bairro}`}</Text>
                </View>
                <View style={{ justifyContent: 'center' }}>
                  <Icon name="navigation" size={icons.tiny} color="#000" />
                </View>
              </View>
            </TouchableOpacity>
            {state.status === 'fechado'
              ?
              (<ClosingReason />)
              :
              <></>
            }

            <View>
              <TouchableOpacity onPress={() => handleNavigateCTOMap(state.coordenadas)}>
                <View style={styles.cto_line}>
                  <View>
                    <Text style={styles.sub_text}>Caixa atual</Text>
                    <Text style={styles.main_text}>{state.caixa_hermetica !== null ? state.caixa_hermetica : 'Nenhuma'}</Text>
                  </View>
                  <View style={{ justifyContent: 'center' }}>
                    <Icon name="map-search" size={icons.tiny} color="#000" />
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {state.instalado !== 'sim' &&
              <TouchableOpacity onPress={handleCloseRequest} style={styles.close_request_btn}>
                <Text style={styles.btn_label}>Fechar Chamado</Text>
              </TouchableOpacity>
            }
          </>
        }

      </ScrollView>

      {isDatePickerVisible &&
        <DateTimePicker
          mode="datetime"
          display="calendar"
          value={date}
          onChange={(event, selectedDate) => { handleNewDate(event, selectedDate) }}
        />
      }
      {isTimePickerVisible &&
        <DateTimePicker
          mode="time"
          value={time}
          onChange={(event, date) => { handleNewTime(event, date) }}
        />
      }

      <Modal
        onBackButtonPress={() => setEmployeesModal(false)}
        onBackdropPress={() => setEmployeesModal(false)}
        children={
          <View style={styles.modal_for_employees}>

            <View style={styles.mfe_current_employee_section}>
              <Text style={styles.mfe_main_text}>Técnico Atual</Text>
              <Text>{state.employee_name}</Text>
            </View>

            <View style={styles.mfe_employees_section}>
              <Text style={styles.mfe_main_text}>
                Selecione um novo técnico...
              </Text>
              <ScrollView
                showsVerticalScrollIndicator={true}
                refreshControl={
                  <RefreshControl refreshing={employeeRefreshing} onRefresh={() => getEmployees()} />
                }
                style={{ minHeight: 100, maxHeight: modalHeight }}
              >
                {employeeRefreshing === false && employees.map(employee => {
                  if (employee.nome !== state.employee_name) {
                    return (
                      < TouchableOpacity onPress={() => setNewEmployee(employee)} key={employee.id} style={{ flexDirection: 'row', alignItems: 'center', height: 30 }}>
                        {(employee.id === newEmployee.id)
                          ? <RadioButton selected />
                          : <RadioButton />
                        }
                        <Text style={{ marginLeft: 10, alignSelf: 'center' }}>{employee.nome}</Text>
                      </TouchableOpacity>
                    );
                  }
                })}
              </ScrollView>
            </View>

            <TouchableOpacity onPress={() => handleChangeEmployee()} style={styles.mfe_confirm_btn}>
              <Text style={styles.mfe_confirm_btn_label}>Confirmar</Text>
            </TouchableOpacity>

          </View>
        }
        isVisible={employeesModal}
        style={{ margin: 0 }}
        animationInTiming={500}
        animationOutTiming={500}
        useNativeDriver={true}
      />

      {isDialogVisible &&
        <Modal
          onBackButtonPress={() => setIsDialogVisible(false)}
          onBackdropPress={() => setIsDialogVisible(false)}
          children={
            <View style={styles.modal_style}>
              <View style={{ height: 35, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Text style={styles.modal_header}>
                  Fechar chamado
                </Text>
                <TouchableOpacity
                  style={{ backgroundColor: '#337AB7', borderRadius: 5, height: '100%', justifyContent: 'center' }}
                  onPress={() => closeRequest()}
                >
                  <Text style={{ marginLeft: 10, marginRight: 10, color: '#FFF', fontFamily: 'Roboto-Bold' }}>Concluir</Text>
                </TouchableOpacity>
              </View>
              <View style={{ marginTop: 30 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                  <Text>Visitado</Text>
                  <Switch
                    value={isVisited}
                    trackColor={{ false: "#767577", true: "#337AB7" }}
                    thumbColor={true ? "#f4f3f4" : "#f4f3f4"}
                    onValueChange={() => setIsVisited(!isVisited)}
                  />
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                  <Text>Instalado</Text>
                  <Switch
                    value={isInstalled}
                    trackColor={{ false: "#767577", true: "#337AB7" }}
                    thumbColor={true ? "#f4f3f4" : "#f4f3f4"}
                    onValueChange={() => setIsInstalled(!isInstalled)}
                  />
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 10 }}>
                  <Text>Disponível</Text>
                  <Switch
                    value={isAvailable}
                    trackColor={{ false: "#767577", true: "#337AB7" }}
                    thumbColor={true ? "#f4f3f4" : "#f4f3f4"}
                    onValueChange={() => setIsAvailable(!isAvailable)}
                  />
                </View>
              </View>
            </View>
          }
          isVisible={isDialogVisible}
          style={{ margin: 0 }}
          animationInTiming={500}
          animationOutTiming={500}
          useNativeDriver={true}
        />
      }
    </View >
  );
}