import { StatusBar } from 'expo-status-bar';
import { Camera } from 'expo-camera';
import React, { useState, useEffect, useRef } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Image, Dimensions, Alert } from 'react-native';
// import { MobileModel, ImageUtil } from 'react-native-pytorch-core';
import * as tf from '@tensorflow/tfjs';
import { fetch, decodeJpeg, bundleResourceIO } from '@tensorflow/tfjs-react-native';
import { manipulateAsync, FlipType, SaveFormat } from 'expo-image-manipulator';
import { Button, Card, Snackbar, Modal, RadioButton, TouchableRipple, Title, DataTable,ProgressBar,Colors  } from 'react-native-paper';

// const model = require('../assets/models/model_best_resnet.ptl');
const image_classes = require('../assets/data/class2labels.json');
const products = require('../assets/data/productsA.json');
const productsIndex = require('../assets/data/productsToIndex.json');

// Get reference to bundled model assets 
const modelJson = require('../assets/model/model.json');
const modelWeights = require('../assets/model/group1-shard1of1_quantized.bin');


export default function TakePhoto(props) {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraRef, setCameraRef] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [photo, setPhoto] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [topClasses, setTopClasses] = useState(null);
  const [topItem, setTopItem] = useState(null);
  const [snackVisible, setSnackVisible] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [productName, setProductName] = useState(null);
  const [productPrice, setProductPrice] = useState(null);
  const [productNF, setProductNF] = useState(null);
  const [productPF, setProductPF] = useState(null);
  const [PopupTableVisible, setPopupTableVisible] = useState(null);

  const parseJson = () => {

    const pIndex = productsIndex[topItem]
    
    //console.log(products[pIndex][1]["Product Name"])
    //console.log(products[pIndex][1]["Price CAD"])
    //console.log(products[pIndex][2].NF)
    //console.log(products[pIndex][3].PF)
    
    setProductName(products[pIndex][1]["Product Name"])
    setProductPrice(products[pIndex][1]["Price CAD"])
    setProductNF(products[pIndex][2].NF)
    setProductPF(products[pIndex][3].PF)
  }

  const displayNutritionalFacts = () => {
    return (
      <View>
        <Title>HELOOOOOOOOOO</Title>
      </View>
    )
      
  }

  useEffect(() => {
      (async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      })();
    }, []);

  const transformImage = (img, size=224) => {
      img = tf.div(img, tf.scalar(255))
      // img = tf.image.cropAndResize(img.expandDims(0), [[0, 0, 1, 1]], [0], [224,224]).div(tf.scalar(255)).squeeze();
      // img = tf.image.resizeBilinear(img, [224, 224]);
      // console.log(img)
      img = tf.cast(img, 'float32');

      /* mean of natural image */
      let meanRgb = { red : 0.485,  green: 0.456,  blue: 0.406 }

      /* standard deviation of natural image*/
      let stdRgb = { red: 0.229,  green: 0.224,  blue: 0.225 }

      let indices = [
                  tf.tensor1d([0], "int32"),
                  tf.tensor1d([1], "int32"),
                  tf.tensor1d([2], "int32")
      ];

      /* sperating tensor channelwise and applyin normalization to each chanel seperately */
      let centeredRgb = {
         red: tf.gather(img, indices[0], 2)
                  .sub(tf.scalar(meanRgb.red))
                  .div(tf.scalar(stdRgb.red))
                  .reshape([size, size]),
         
         green: tf.gather(img, indices[1], 2)
                  .sub(tf.scalar(meanRgb.green))
                  .div(tf.scalar(stdRgb.green))
                  .reshape([size, size]),
         
         blue: tf.gather(img,indices[2], 2)
                  .sub(tf.scalar(meanRgb.blue))
                  .div(tf.scalar(stdRgb.blue))
                  .reshape([size, size]),
     }
    

      /* combining seperate normalized channels*/
      let processedImg = tf.stack([
          centeredRgb.red, centeredRgb.green, centeredRgb.blue
      ]).expandDims();
      tf.dispose(centeredRgb)
      tf.dispose(img)
     return processedImg
  }

  async function resizeAndCrop(img, size=224) {
    // const size = 224
    const height = img.height >= img.width ? (~~(img.height / img.width) * size) : size
    const width = img.width > img.height ? (~~(img.width / img.height) * size) : size
    const originX = ~~(width / 2) - ~~(size / 2)
    const originY = ~~(height / 2) - ~~(size / 2)
    const manipResult = await manipulateAsync(
      img.localUri || img.uri,
      [
        { resize: {width: width, height: height} },
        { crop: { height: size, originX: originX, originY: originY, width: size } },
      ],
      { compress: 1, format: SaveFormat.JPEG }
    );
    // setPhoto(manipResult);
    return manipResult;
  }
  
  async function classifyImage() {
    try {
      // Get a reference to the bundled asset and convert it to a tensor
      // const image = require('../assets/images/1642370787.jpg');
      // const imageAssetPath = Image.resolveAssetSource(image);
      const resizedImg = await resizeAndCrop(photo);
      // setPhoto(resizedImg)
      const response = await fetch(resizedImg.uri, {}, { isBinary: true });
      const imageDataArrayBuffer = await response.arrayBuffer();
      const imageData = new Uint8Array(imageDataArrayBuffer);


      const imageTensor = decodeJpeg(imageData);
      const transformedImg = transformImage(imageTensor);
      // const time = await tf.time(async () => await tf.loadLayersModel(bundleResourceIO(modelJson, modelWeights)))

      // console.log(`kernelMs: ${time.kernelMs}, wallTimeMs: ${time.wallMs}`);
      // const model = await tf.loadGraphModel(bundleResourceIO(modelJson, modelWeights));
      const preds = props.model.predict(transformedImg) as tf.Tensor
      const {values, indices} = tf.topk(preds, 5, true);
      var scoreValues = (await values.array()).toString().split(",");
      var topIndices = (await indices.array()).toString().split(",");
      var topCs = [];
      for (var i = 0; i < topIndices.length; i++) {
        topCs.push(image_classes[topIndices[i]]);
      }
      setTopClasses(topCs);
      setTopItem(topCs[0]);
      setSubmitted(true);
      // transformedImg.print(true)
      
    } catch(exception){
      console.log(exception);
    }
  }

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
          (photo != null && !submitted) ?
          <View style={styles.photo}>
            <Card style={{marginTop: 100, alignSelf: 'center', width: '100%', height: '100%'}}>
              <Card.Cover style={{alignSelf: 'center', width: '75%', height: '75%'}} resizeMode={'contain'} source={photo} />
              <Card.Actions style={{alignSelf: 'center'}}>
                <Button onPress={classifyImage}><Text style={{fontWeight: "bold"}}>Submit</Text></Button>
                <Button onPress={() => setPhoto(null)}>Retake</Button>
              </Card.Actions>
            </Card>
          </View> : null
        }
        {
          (photo != null && submitted && !confirmed) ?
          <View style={styles.photo}>
            <Card style={{marginTop: 50, alignSelf: 'center', width: '100%', height: '100%'}}>
              <Card.Cover style={{alignSelf: 'center', width: '75%', height: '75%'}} resizeMode={'contain'} source={photo} />
              <Card.Title titleStyle={{alignSelf: 'center'}} title={topItem}/>
              <Card.Actions style={{alignSelf: 'center'}}>
                <Button onPress={() => {setSnackVisible(true); setConfirmed(true); parseJson()}}><Text style={{fontWeight: "bold"}}>Confirm</Text></Button>
                <Button onPress={() => {setPopupVisible(true);}}>Wrong Item?</Button>
              </Card.Actions>
            </Card>
            <Modal visible={popupVisible} onDismiss={() => {setPopupVisible(false);}} contentContainerStyle={{alignSelf: 'center', width: "90%", backgroundColor: 'white', padding: 20}}>
              {topClasses.map((c) => (
                <TouchableRipple onPress={() => setTopItem(c)}>
                  <View style={{ flexDirection: 'row', alignContent: 'center' }}>
                      <View style={{ flex: 7, alignSelf: 'center' }}>
                        <Text>{c}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <RadioButton value={c} status={c === topItem ? 'checked' : 'unchecked'} onPress={() => setTopItem(c)}/>
                      </View>
                  </View>
                </TouchableRipple>             
                ))}
            </Modal>
            <Snackbar
              visible={snackVisible}
              onDismiss={() => {setSnackVisible(false); }}
              action={{
                label: 'Close',
                onPress: () => {
                  setSnackVisible(true);
                },
              }}
              duration={2000}
              >
              Item Added To Cart!
            </Snackbar>
          </View> : null
        }
        {
          (photo != null && submitted && confirmed) ?
          <View style={styles.productDetails}>
            <Title>{productName} </Title>
            <Title>Product Price : {productPrice} $</Title>
            <Card style={{marginTop:30 , alignSelf: 'center', width: '75%', height: '30%'}}>
            <Card.Cover style={{alignSelf: 'center', width: '100%', height: '100%'}} resizeMode={'contain'} source={photo} />
            </Card>
            <Button onPress={() => {setPopupTableVisible(true);}}>Display Nutrtitional Facts</Button>
            <Modal visible={PopupTableVisible} onDismiss={() => {setPopupTableVisible(false);}} contentContainerStyle={{alignSelf: 'center', width: "90%", backgroundColor: 'white', padding: 20}}>
              
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Nutritional Fact</DataTable.Title>
                  <DataTable.Title numeric> </DataTable.Title>
                  <DataTable.Title numeric>Daily %</DataTable.Title>
                </DataTable.Header>

                <DataTable.Row>
                  <DataTable.Cell>Calories </DataTable.Cell>
                  <DataTable.Cell numeric> {productNF["Total Energy Amount (in kilocalories)"]} </DataTable.Cell>
                  <DataTable.Cell numeric> - </DataTable.Cell>
                </DataTable.Row>

                <DataTable.Row>
                  <DataTable.Cell>Total Carbs</DataTable.Cell>
                  <DataTable.Cell numeric>{productNF["Total Carbohydrates (Fibre + Sugars) (in g)"]} g</DataTable.Cell>
                  <DataTable.Cell numeric>{productNF["Carbohydrate DV (in %)"]} %</DataTable.Cell>
                </DataTable.Row>

                <DataTable.Row>
                  <DataTable.Cell>Protein</DataTable.Cell>
                  <DataTable.Cell numeric>{productNF["Protein (in g)"]} g</DataTable.Cell>
                  <DataTable.Cell numeric> - </DataTable.Cell>
                </DataTable.Row>

                <DataTable.Row>
                  <DataTable.Cell>Total Fat</DataTable.Cell>
                  <DataTable.Cell numeric>{productNF["Total Fat (Saturated + Trans fats) (in g)"]} g</DataTable.Cell>
                  <DataTable.Cell numeric>{productNF["Fat DV (in%)"]} %</DataTable.Cell>
                </DataTable.Row>

                <DataTable.Row>
                  <DataTable.Cell>Dietary Fibre</DataTable.Cell>
                  <DataTable.Cell numeric>{productNF["Fibre (in g)"]} g</DataTable.Cell>
                  <DataTable.Cell numeric>{productNF["Fibre DV (in %)"]} %</DataTable.Cell>
                </DataTable.Row>
                <DataTable.Row>
                  <DataTable.Cell>Sodium</DataTable.Cell>
                  <DataTable.Cell numeric>{productNF["Sodium (in milligrams)"]} mg</DataTable.Cell>
                  <DataTable.Cell numeric>{productNF["Sodium DV (in %)"]} %</DataTable.Cell>
                </DataTable.Row>
                <DataTable.Row>
                  <DataTable.Cell>Cholsterol</DataTable.Cell>
                  <DataTable.Cell numeric>{productNF["Cholesterol (in milligrams)"]} mg</DataTable.Cell>
                  <DataTable.Cell numeric> - </DataTable.Cell>
                </DataTable.Row>
              </DataTable>

              
            </Modal>
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
    alignItems: 'center',
    justifyContent: 'center'
  },
  productDetails: {
    flex: 1,
    alignItems: 'center'
  },
  productP: {
    flex: 1,
    alignItems: 'flex-start'
  }
  });