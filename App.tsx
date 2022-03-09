import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Camera } from 'expo-camera';
import React, { useState, useEffect, useRef } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Image, Dimensions, Alert } from 'react-native';
import TakePhoto from './components/TakePhoto';
import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';
import { Appbar, Button, Modal, TouchableRipple, RadioButton, Checkbox } from 'react-native-paper';


const {width, height} = Dimensions.get("window")

// Get reference to bundled model assets 
const modelJson = require('./assets/model/model_quantized.json');
const modelWeights = require('./assets/model/group1-shard1of1_quantized.bin');

export default function App() {
  const [usingCamera, setUsingCamera] = useState(null);
  const [model, setModel] = useState(null);
  const [dietaryRestrictionsPopUp, setDietaryRestrictionsPopUp] = useState(null);
  const [checkedPeanut, setCheckedPeanut] = useState(false);
  const [checkedGluten, setCheckedGluten] = useState(false);
  const [checkedVegan, setCheckedVegan] = useState(false);
  const [checkedLactose, setCheckedLactose] = useState(false);
  const [checkedOrganic, setCheckedOrganic] = useState(false);

  const DR = { 
    "Peanut" : checkedPeanut, 
    "Gluten" : checkedGluten, 
    "Vegan" : checkedVegan, 
    "Lactose" : checkedLactose,
    "Organic" : checkedOrganic,
  }
  const loadModel = async (src) => {
    try {
      // For graph model
      const model = await tf.loadGraphModel(src);
      setModel(model);
      // Alert.alert('Model', `Load model success`)
    } catch (err) {
        console.log(err);
    }
  }

  const setDietaryRestrictions = () => {
      DR.Peanut = checkedPeanut
      DR.Gluten = checkedGluten
      DR.Vegan = checkedVegan
      DR.Lactose = checkedLactose
      DR.Organic = checkedOrganic
  }

  useEffect(() => {
    (async () => {
      tf.ready().then(() => {
      loadModel(bundleResourceIO(modelJson, modelWeights))
      console.log(tf.getBackend());
      // console.log(tf.ENV.getBool('WEBGL_RENDER_FLOAT32_CAPABLE'))
    });
    })();
  }, []);

    return (
      <View style={{ flex: 1 }}>
        
        { (usingCamera) ?
        <View style={{ flex: 1 }}>
          <Appbar.Header>
            <Appbar.BackAction onPress={() => {setUsingCamera(!usingCamera);}} />
            <Appbar.Content title="Couchetard" subtitle={'Visual Product Search'} />
          </Appbar.Header>
          <TakePhoto model={model} dietaryRestrictions={DR}/>
          </View>
          : null
        }
        { (!usingCamera) ?
          <View style={{ flex: 1 }}>
            <Appbar.Header>
              <Appbar.Content title="Couchetard" subtitle={'Visual Product Search'} />
            </Appbar.Header>
            <View style={styles.button}>
              <Image style={{height: '50%', width: '75%', resizeMode : 'contain'}} source={require('./assets/CoucheTardLogo.svg.png')}></Image>
              <Button style={{marginTop: 20}} icon="camera" mode="contained" disabled={model==null} onPress={() => {setDietaryRestrictions(); setUsingCamera(true);}}>
                Search Item
              </Button>
              <Button onPress={() => {setDietaryRestrictionsPopUp(true);}}>Dietary Restrictions</Button>
              <Modal visible={dietaryRestrictionsPopUp} onDismiss={() => {setDietaryRestrictionsPopUp(false);}} contentContainerStyle={{alignSelf: 'center', width: "90%", backgroundColor: 'white', padding: 20}}>
                <View>
                  <CheckBox label="Peanuts" status={checkedPeanut ? 'checked' : 'unchecked'} onPress={() => {setCheckedPeanut(!checkedPeanut);}}/>
                  <CheckBox label="Gluten" status={checkedGluten ? 'checked' : 'unchecked'} onPress={() => {setCheckedGluten(!checkedGluten);}}/>
                  <CheckBox label="Vegan" status={checkedVegan ? 'checked' : 'unchecked'} onPress={() => {setCheckedVegan(!checkedVegan);}}/>
                  <CheckBox label="Lactose" status={checkedLactose ? 'checked' : 'unchecked'} onPress={() => {setCheckedLactose(!checkedLactose);}}/>
                  <CheckBox label="Organic" status={checkedOrganic ? 'checked' : 'unchecked'} onPress={() => {setCheckedOrganic(!checkedOrganic);}}/>
                </View>
              </Modal>
            </View>
          </View> : null
        }

      </View>
    );
    function CheckBox({ label, status, onPress }) {
      return (
        <TouchableOpacity onPress={onPress}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Checkbox status={status} />
            <Text style={{ fontWeight: 'bold' }}>{label}</Text>
          </View>
        </TouchableOpacity>
      );
    }
  }
  const styles = StyleSheet.create({
    button: {
      flexDirection: "column",
      justifyContent: 'center',
      alignItems: "center",
    },
    checkboxContainer: {
      flexDirection: "row",
      marginBottom: 20,
    },
    checkbox: {
      alignSelf: "center",
    },
    label: {
      margin: 8,
    }
  });