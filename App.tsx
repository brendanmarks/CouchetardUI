import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Camera } from 'expo-camera';
import React, { useState, useEffect, useRef } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Image, Dimensions, Button, Alert } from 'react-native';
import TakePhoto from './components/TakePhoto';
import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

const {width, height} = Dimensions.get("window")

// Get reference to bundled model assets 
const modelJson = require('./assets/model/model_quantized.json');
const modelWeights = require('./assets/model/group1-shard1of1_quantized.bin');

export default function App() {
  const [usingCamera, setUsingCamera] = useState(null);
  const [model, setModel] = useState(null);
  const goBackHandler = () => {
    setUsingCamera(!usingCamera);
  }
  const loadModel = async (src) => {
    try {
      // For graph model
      const model = await tf.loadGraphModel(src);
      setModel(model);
      Alert.alert('Model', `Load model success`)
    } catch (err) {
        console.log(err);
    }
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
          <TakePhoto goBackHandler={goBackHandler} model={model}/> : null
        }
        { (!usingCamera) ?
          <View style={styles.button}>
            <Text style={{fontWeight: 'bold', fontSize: 50, textAlign: 'center'}}> Couchetard Visual Product Search </Text>
            {/* <View style={styles.button}> */}
              <Button onPress={() => setUsingCamera(true)} disabled={model == null} title="Take Picture"></Button>
            {/* </View> */}
          </View> : null
        }
      </View>
    );
  }
  const styles = StyleSheet.create({
    button: {
      flexDirection: "column",
      justifyContent: 'center',
      alignItems: "center",
      flex: 1
    }
  });