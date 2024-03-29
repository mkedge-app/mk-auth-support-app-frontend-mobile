import React, { useState, useEffect, useContext, useReducer } from 'react';
import MapView, { PROVIDER_GOOGLE, Marker, Callout } from 'react-native-maps';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ToastAndroid,
  RefreshControl,
} from 'react-native';
import MapViewDirections from 'react-native-maps-directions';
import Modal from 'react-native-modal';
import axios from 'axios';
import api from '../../services/api';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { store } from '../../store/store';

const GOOGLE_MAPS_APIKEY = 'AIzaSyBPMt-2IYwdXtEw37R8SV1_9RLAMSqqcEw';

import styles from './styles';
import { icons } from '../../styles/index';

export default function CTOMapping({ route, navigation }) {
  // Estes dados do cliente nunca tem seus valores alterados
  const client_latitude = parseFloat(route.params.latidude);
  const client_longitude = parseFloat(route.params.longitude);
  const client_id = route.params.client_id;
  const client_name = route.params.client_name;

  // Estados para lidar com iteração do usuário com o mapa
  const [latitude, setLatitude] = useState(client_latitude);
  const [longitude, setLongitude] = useState(client_longitude);
  const [latitudeDelta, setLatitudeDelta] = useState(0.01);
  const [longitudeDelta, setLongitudeDelta] = useState(0);

  // Estado contendo todas as CTOs existente dentro do raio de busca
  const [arrayCTOs, setArrayCTOs] = useState([]);

  // array de referencias para cada CTO do estado arrayCTOs
  const ref_arrayCTOs = [];

  // Declaração do estado global da aplicação
  const globalState = useContext(store);

  // Estado que controla todo o calculo de rotas
  const [state, dispatch] = useReducer(reducer, {
    dest_latitude: null,
    dest_longitude: null,
  });

  // Estado que guarda os dados da CTO sugerida pelo administrador
  const [suggestedCTO, setSuggestedCTO] = useState(null);

  // Estado que guarda a informação de qual CTO o usuário selecionou
  const [selectedBtn, setSelectedBtn] = useState('');

  // Estado que controla a visibilidade do modal de confirmação da alteração de CTO
  const [isVisible, setIsVisible] = useState(false);

  // Estado para controlar o refresh controller
  const [refreshing, setRefreshing] = useState(false);

  function reducer(state, action) {
    switch (action.type) {
      case 'traceroute':
        return {
          dest_latitude: action.payload.cto_latitude,
          dest_longitude: action.payload.cto_longitude,
        };
    }
  }

  function handleRegionChange({
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  }) {
    setLatitude(latitude);
    setLongitude(longitude);
    setLatitudeDelta(latitudeDelta);
    setLongitudeDelta(longitudeDelta);
  }

  function handleTraceRoute(dest_lat, dest_lgt) {
    if (dest_lat == null || dest_lgt == null) {
      Alert.alert('Erro', 'Caixa Hermetica sugerida não está no mapa');
    } else {
      dispatch({
        type: 'traceroute',
        payload: {
          cto_latitude: dest_lat,
          cto_longitude: dest_lgt,
        },
      });
    }
  }

  async function handleUpdateCTO() {
    const response_update = await api.post(
      `client/${client_id}?tenant_id=${globalState.state.tenantID}`,
      {
        new_cto: selectedBtn,
      },
      {
        timeout: 10000,
        headers: {
          Authorization: `Bearer ${globalState.state.userToken}`,
        },
      },
    );

    if (response_update.status === 200) {
      ToastAndroid.show('CTO alterada com sucesso!', ToastAndroid.SHORT);
      setIsVisible(false);
      navigation.goBack();
    }
  }

  function handleModalClosing() {
    setSelectedBtn('');
    setIsVisible(false);
  }

  function handleSelection(cto) {
    if (selectedBtn === cto.nome && cto.nome !== suggestedCTO?.nome) {
      setIsVisible(true);
    } else {
      setSelectedBtn(cto.nome);
      handleTraceRoute(parseFloat(cto.latitude), parseFloat(cto.longitude));
      ref_arrayCTOs[cto.id].showCallout();
    }
  }

  useEffect(() => {
    async function loadSuggestedCTOData() {
      const client = await api.get(
        `client/${client_id}?tenant_id=${globalState.state.tenantID}`,
        {
          timeout: 10000,
          headers: {
            Authorization: `Bearer ${globalState.state.userToken}`,
          },
        },
      );

      const { caixa_herm } = client.data;

      if (caixa_herm !== null) {
        const current_client_cto = await api.get(
          `cto?cto_name=${caixa_herm}&tenant_id=${globalState.state.tenantID}`,
          {
            timeout: 10000,
            headers: {
              Authorization: `Bearer ${globalState.state.userToken}`,
            },
          },
        );

        const route_response = await axios.get(
          `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${client_latitude},${client_longitude}&destinations=${
            current_client_cto.data.latitude
          },${
            current_client_cto.data.longitude
          }&mode=walking&key=${GOOGLE_MAPS_APIKEY}`,
        );

        current_client_cto.data.distance =
          route_response.data.rows[0].elements[0].distance.text;
        current_client_cto.data.distance_value =
          route_response.data.rows[0].elements[0].distance.value;

        setSuggestedCTO(current_client_cto.data);
      }
    }

    loadSuggestedCTOData();
  }, []);

  useEffect(() => {
    async function getCTOs() {
      setRefreshing(true);
      const response = await api.get(
        `cto/${client_latitude}/${client_longitude}?tenant_id=${
          globalState.state.tenantID
        }`,
        {
          timeout: 10000,
          headers: {
            Authorization: `Bearer ${globalState.state.userToken}`,
          },
        },
      );

      var queries_array = [];
      var array_cto = [];
      response.data.map(item => {
        const latitude = parseFloat(item.latitude);
        const longitude = parseFloat(item.longitude);

        array_cto.push(item);
        queries_array.push(
          axios.get(
            `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${client_latitude},${client_longitude}&destinations=${latitude},${longitude}&mode=walking&key=${GOOGLE_MAPS_APIKEY}`,
          ),
        );
      });

      await axios.all(queries_array).then(response => {
        response.forEach((element, index) => {
          array_cto[index].distance =
            element.data.rows[0].elements[0].distance.text;
          array_cto[index].distance_value =
            element.data.rows[0].elements[0].distance.value;
        });
      });

      // Ordenação do array com mais próximos primeiro
      array_cto.sort(function(a, b) {
        var keyA = a.distance_value,
          keyB = b.distance_value;

        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;
        return 0;
      });

      setArrayCTOs(array_cto);
      setRefreshing(false);
    }

    getCTOs();
  }, [suggestedCTO]);

  return (
    <View style={styles.container}>
      <View style={styles.map_container}>
        <MapView
          onRegionChangeComplete={handleRegionChange}
          provider={PROVIDER_GOOGLE} // remove if not using Google Maps
          style={styles.map}
          region={{
            latitude: latitude,
            longitude: longitude,
            latitudeDelta: latitudeDelta,
            longitudeDelta: longitudeDelta,
          }}>
          <Marker
            coordinate={{
              latitude: client_latitude,
              longitude: client_longitude,
            }}
            title={client_name}
          />
          {arrayCTOs.map(
            cto =>
              cto.id !== suggestedCTO?.id && (
                <Marker
                  key={cto.id}
                  coordinate={{
                    latitude: parseFloat(cto.latitude),
                    longitude: parseFloat(cto.longitude),
                  }}
                  onPress={() =>
                    handleTraceRoute(
                      parseFloat(cto.latitude),
                      parseFloat(cto.longitude),
                    )
                  }
                  ref={ref => (ref_arrayCTOs[cto.id] = ref)}>
                  <Icon
                    name={'access-point-network'}
                    size={icons.small}
                    color="#FF0000"
                  />
                  <Callout tooltip={true}>
                    <View
                      style={{
                        width: 120,
                        padding: 15,
                        backgroundColor: '#FFF',
                        opacity: 0.8,
                        borderRadius: 10,
                        alignItems: 'center',
                      }}>
                      <Text
                        style={{
                          fontWeight: 'bold',
                          fontSize: 12,
                          color: '#000',
                        }}>
                        {cto.nome}
                      </Text>
                      <Text style={{ color: '#000', fontSize: 10 }}>
                        Distancia: {cto.distance}
                      </Text>
                      <Text style={{ color: '#000', fontSize: 10 }}>
                        Conectados: {cto.connection_amount}
                      </Text>
                    </View>
                  </Callout>
                </Marker>
              ),
          )}
          {suggestedCTO !== null && (
            <Marker
              key={suggestedCTO.id}
              coordinate={{
                latitude: parseFloat(suggestedCTO.latitude),
                longitude: parseFloat(suggestedCTO.longitude),
              }}
              onPress={() =>
                handleTraceRoute(
                  parseFloat(suggestedCTO.latitude),
                  parseFloat(suggestedCTO.longitude),
                )
              }
              ref={ref => (ref_arrayCTOs[suggestedCTO.id] = ref)}>
              <Icon
                name={'access-point-network'}
                size={icons.small}
                color="#3842D2"
              />
              <Callout tooltip={true}>
                <View
                  style={{
                    width: 150,
                    padding: 15,
                    backgroundColor: '#000',
                    borderRadius: 10,
                    alignItems: 'center',
                  }}>
                  <Text
                    style={{ fontWeight: 'bold', fontSize: 16, color: '#FFF' }}>
                    {suggestedCTO.nome}
                  </Text>
                  <Text style={{ color: '#FFF', fontSize: 14 }}>
                    Distancia: {suggestedCTO.distance}
                  </Text>
                  <Text style={{ color: '#FFF', fontSize: 14 }}>
                    Conectados: {suggestedCTO.connection_amount}
                  </Text>
                </View>
              </Callout>
            </Marker>
          )}
          {state.dest_latitude !== null && (
            <MapViewDirections
              apikey={GOOGLE_MAPS_APIKEY}
              strokeWidth={8}
              strokeColor="hotpink"
              mode="WALKING"
              origin={{
                latitude: client_latitude,
                longitude: client_longitude,
              }}
              destination={{
                latitude: state.dest_latitude,
                longitude: state.dest_longitude,
              }}
            />
          )}
        </MapView>
      </View>
      <View style={styles.bottom_menu}>
        {suggestedCTO !== null ? (
          <>
            <Text style={styles.main_title}>Caixa Sugerida</Text>
            <TouchableOpacity
              style={
                suggestedCTO?.nome === selectedBtn
                  ? styles.suggested_card_selected
                  : styles.suggested_card
              }
              onPress={() => handleSelection(suggestedCTO)}>
              <View style={styles.card_name}>
                <View style={styles.icon_container}>
                  <Icon
                    name={'access-point-network'}
                    size={icons.small}
                    color="#000"
                  />
                </View>
                <Text style={styles.card_title}>
                  {suggestedCTO && suggestedCTO.nome}
                </Text>
              </View>
              <View style={styles.distance_container}>
                <Text style={styles.card_distance}>
                  {suggestedCTO ? suggestedCTO.distance : ''}
                </Text>
                <Text style={styles.connection_amount}>
                  {suggestedCTO
                    ? `${suggestedCTO.connection_amount} conectados`
                    : ''}
                </Text>
              </View>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text
              style={[
                styles.main_title,
                { marginBottom: 10, color: '#AFAFAF' },
              ]}>
              Nenhuma caixa sugerida
            </Text>
          </>
        )}

        <Text style={styles.main_title}>Mais opções</Text>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} />}>
          {arrayCTOs.length === 0 && refreshing === false ? (
            <Text
              style={[
                styles.main_title,
                { marginBottom: 10, color: '#AFAFAF' },
              ]}>
              Não há caixas próximas a este cliente
            </Text>
          ) : (
            <View style={styles.sub_cards_container}>
              {arrayCTOs.map(cto =>
                cto.nome === suggestedCTO?.nome ? (
                  <></>
                ) : selectedBtn !== cto.nome ? (
                  <TouchableOpacity
                    key={cto.nome}
                    onPress={() => handleSelection(cto)}
                    style={styles.sub_cards}>
                    <View style={styles.main_line}>
                      <Text style={styles.sub_card_title}>{cto.nome}</Text>
                      <Text
                        numberOfLines={1}
                        style={[styles.sub_card_title_distance]}>
                        {cto.distance}
                      </Text>
                    </View>
                    <Text style={styles.sub_line}>
                      {cto.connection_amount} Conectados
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    key={cto.nome}
                    onPress={() => handleSelection(cto)}
                    style={styles.sub_cards_selected}>
                    <View style={styles.main_line_selected}>
                      <Text style={styles.sub_card_title_selected}>
                        {cto.nome}
                      </Text>
                      <View style={styles.sub_card_icon_container}>
                        <Icon
                          name={'checkbox-marked-circle'}
                          size={icons.small}
                          color="#FFF"
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                ),
              )}
            </View>
          )}
        </ScrollView>
      </View>
      <Modal
        onBackButtonPress={handleModalClosing}
        onBackdropPress={handleModalClosing}
        children={
          <View style={styles.modal_style}>
            <Text
              style={{ fontSize: 18, textAlign: 'center', marginBottom: 10 }}>
              Você está prestes a alterar a caixa hermética sugerida pelo
              administrador. Deseja continuar?
            </Text>
            <TouchableOpacity style={styles.modal_cancel_btn}>
              <Text onPress={handleModalClosing} style={styles.modal_btn_style}>
                Cancelar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleUpdateCTO}
              style={styles.modal_confirm_btn}>
              <Text style={styles.modal_btn_style}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        }
        isVisible={isVisible}
        style={{ margin: 0 }}
        animationInTiming={500}
        animationOutTiming={500}
        useNativeDriver={true}
      />
    </View>
  );
}
