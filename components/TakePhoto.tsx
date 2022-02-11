import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Camera } from 'expo-camera';
import React, { useState, useEffect, useRef } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Image, Dimensions, Button } from 'react-native';

export default function TakePhoto(props) {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraRef, setCameraRef] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [photo, setPhoto] = useState(null);

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
        { (photo == null) ?
        <Camera style={{ flex: 1 }} type={type} ref={ref => {
          setCameraRef(ref);
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
            <TouchableOpacity style={styles.textCommand} onPress={props.goBackHandler}>
              <Text style={{ fontSize: 18, marginBottom: 10, color: 'white' }}> Close </Text>
            </TouchableOpacity>
            <TouchableOpacity style={{alignSelf: 'center'}} onPress={async() => {
              if(cameraRef){
                let p = await cameraRef.takePictureAsync();
                setPhoto(p);
              }
            }}>
              <View style={styles.snapButtonOut}>
                <View style={styles.snapButtonIn} >
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </Camera>
        : null }
        {
          (photo != null) ?
          <View style={styles.photo}>
            <Image style={{flex:1, width: '100%', height: '100%'}} resizeMode={'contain'} source={photo}></Image>
            <Button onPress={() => setPhoto(null)} title="Retake"></Button>
            <Button onPress={() => setPhoto(null)} title="Submit"></Button>
          </View> : null
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
  }
  });