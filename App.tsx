import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Camera } from 'expo-camera';
import React, { useState, useEffect, useRef } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Image, Dimensions, Button } from 'react-native';
import TakePhoto from './components/TakePhoto';

const {width, height} = Dimensions.get("window")

export default function App() {
  const [usingCamera, setUsingCamera] = useState(null);
  const goBackHandler = () => {
    setUsingCamera(!usingCamera);
  }
    return (
      <View style={{ flex: 1 }}>
        { (usingCamera) ?
          <TakePhoto goBackHandler={goBackHandler}/> : null
        }
        { (!usingCamera) ?
          <View style={styles.button}>
            <Text style={{fontWeight: 'bold', fontSize: 50, textAlign: 'center'}}> Couchetard Visual Product Search </Text>
            {/* <View style={styles.button}> */}
              <Button onPress={() => setUsingCamera(true)} title="Take Picture"></Button>
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