import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Camera } from 'expo-camera';
import React, { useState, useEffect, useRef } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';

const {width, height} = Dimensions.get("window")

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraRef, setCameraRef] = useState(null);
  const [usingCamera, setUsingCamera] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [photo, setPhoto] = useState(null);
  const {width, height} = Dimensions.get("window")

  useEffect(() => {
      (async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      })();
    }, []);

  if (hasPermission === null) {
      return <View />;
    }
    if (hasPermission === false) {
      return <Text>No access to camera</Text>;
    }
    return (
      <View style={{ flex: 1 }}>
        { (usingCamera == true && photo == null) && (
        <Camera style={{ flex: 1 }} type={type} ref={ref => {
          setCameraRef(ref) ;
        }}>
          <View
            style={styles.pictureView}>
            <TouchableOpacity
              style={styles.textCommand}
              onPress={() => {
                setType(
                  type === Camera.Constants.Type.back
                    ? Camera.Constants.Type.front
                    : Camera.Constants.Type.back
                );
              }}>
              <Text style={{ fontSize: 18, marginBottom: 10, color: 'white' }}> Flip </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.textCommand} onPress={() => setUsingCamera(false)}>
              <Text style={{ fontSize: 18, marginBottom: 10, color: 'white' }}> Close </Text>
            </TouchableOpacity>
            <TouchableOpacity style={{alignSelf: 'center'}} onPress={async() => {
              if(cameraRef){
                let p = await cameraRef.takePictureAsync();
                setPhoto(p);
                console.log('photo', p);
              }
            }}>
              <View style={styles.snapButtonOut}>
                <View style={styles.snapButtonIn} >
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </Camera>
        )}
        {
          (photo != null) &&
          <View style={styles.photo}>
            <Image resizeMode={'cover'} source={photo}></Image>
            <button onClick={() => setPhoto(null)}> Retake </button>
            <button onClick={() => setPhoto(null)}> Submit </button>
          </View>
        }
        { (!usingCamera) &&
          <View style={styles.button}>
            <button onClick={() => setUsingCamera(true)}> Take Picture </button>
          </View>
        }
      </View>
    );
  }
  const styles = StyleSheet.create({
    textCommand: {
      alignSelf: 'flex-end'
    },
    pictureView: {
      flex: 1,
      backgroundColor: 'transparent',
      justifyContent: 'flex-end'
    },
    button: {
      flexDirection: "row",
      justifyContent: 'center',
      alignItems: "center",
      flex: 1
    },
    snapButtonOut: {
        marginBottom: 20,
        borderWidth: 2,
        borderRadius:50,
        borderColor: 'white',
        height: 50,
        width:50,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    },
    snapButtonIn: {
      borderWidth: 2,
      borderRadius:50,
      borderColor: 'white',
      height: 40,
      width:40,
      backgroundColor: 'white'
  },
  photo: {
    flex: 1,
    borderRadius: 50,
    width: width,
    height: height,
    // overflow: 'hidden',
    resizeMode: 'contain',
    alignItems: 'center'
  }
  });