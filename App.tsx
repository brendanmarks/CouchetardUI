import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Camera } from 'expo-camera';
import React, { useState, useEffect, useRef } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Image, Dimensions, Alert } from 'react-native';
import TakePhoto from './components/TakePhoto';
import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';
import { Appbar, Button } from 'react-native-paper';

const {width, height} = Dimensions.get("window")

// Get reference to bundled model assets 
const modelJson = require('./assets/model/model_quantized.json');
const modelWeights = require('./assets/model/group1-shard1of1_quantized.bin');

export default function App() {
  const [usingCamera, setUsingCamera] = useState(null);
  const [model, setModel] = useState(null);
  
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
          <TakePhoto model={model}/>
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
              <Button style={{marginTop: 20}} icon="camera" mode="contained" disabled={model==null} onPress={() => setUsingCamera(true)}>
                Search Item
              </Button>
          </View>
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
    }
  });