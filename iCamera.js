import React, { useState, useEffect, Component  } from 'react';
import { Button, Text, View, TouchableOpacity, ref, StyleSheet, ActivityIndicator, Image, ImageBackground , Alert } from 'react-native';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { Audio } from 'expo-av';
import * as Permissions from 'expo-permissions';
import * as FileSystem from 'expo-file-system';
import { render } from 'react-dom';
import * as Speech from 'expo-speech';
import Icon from 'react-native-vector-icons/Ionicons';
import ActionButton from 'react-native-action-button';
import { YellowBox } from 'react-native'
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import { message } from './message.js';
import { streamingPage } from './streaming.js';
import { Container } from 'semantic-ui-react';
import { DrawerActions } from '@react-navigation/native';




//disable yellow warnings on EXPO client!
console.disableYellowBox = true;



YellowBox.ignoreWarnings([
  'Animated: `useNativeDriver` was not specified. This is a required option and must be explicitly set to `true` or `false`',
])

const recordingOptions = {
  // android not currently in use, but parameters are required
  android: {
      extension: '.m4a',
      outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
      audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
      sampleRate: 44100,
      numberOfChannels: 2,
      bitRate: 128000,
  },
  ios: {
      extension: '.wav',
      audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
      sampleRate: 44100,
      numberOfChannels: 1,
      bitRate: 128000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
  },
};


export const XCamera =({navigation}) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [isRecording, setIsRecording] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [recording, setRecording] = useState(null);
  //const useRef = useRef(null);
  const [photoJson,setPhoto] = useState("");
  const [objectsInPic,SetObjectsInPhoto] = useState([]);
  const [isPictureFetching, setIsPictureFetching] = useState(false);
  const [picStr,setPicStr] = useState("");
  const [Load,SetLoad] = useState(false);
  const [vid,setVid] = useState(null);



  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      console.log("Camera status granted")
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraRollPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera roll permissions to make this work!');
        }
      }
    })();
  }, []);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      SetObjectsInPhoto("");
      setPhoto("");
    });

    // Return the function to unsubscribe from the event so it gets removed on unmount
    return unsubscribe;
  }, [navigation]);
  snap = async () => {
    console.log("reached")
    if (this.camera) {
      console.log("hereeee");
      
      const options = { quality: .1, base64: true, fixOrientation: true, 
        exif: true};
        //const photo = await this.camera.takePictureAsync();
        await this.camera.takePictureAsync(options).then(photo => {
          setIsPictureFetching(true);
            setPicStr(photo.base64);
           fetch('http://iseek.cs.messiah.edu:5000/image',{
           //fetch('http://153.42.129.91:5000/image',{
             method: 'POST',
             headers:{
               Accept: 'application/json',
               'Content-Type': 'application/json',
             },
             body: JSON.stringify({
               pictureString: photo.base64,
             }),
           }).then((response) => response.json())
           .then((json) => {
             setPhoto(json.pictureResponse);
             SetObjectsInPhoto(json.objects);
             console.log(json.objects);
             setIsPictureFetching(false);
            })
         });
         
     }  
     
   }

  
  startRecording = async () => {
    const { status } = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
    setHasPermission(status === 'granted');
    if (status !== 'granted') return;
    setIsRecording(true);
    // some of these are not applicable, but are required
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      playThroughEarpieceAndroid: true,
  
    });
    const recording = new Audio.Recording();
    try {
      await recording.prepareToRecordAsync(recordingOptions);
      await recording.startAsync();
    } catch (error) {
      console.log(error);
      stopRecording();
    }
    setRecording(recording);
  }

  const stopRecording = async () => {
    setIsRecording(false);
    try {
        await recording.stopAndUnloadAsync();
    } catch (error) {
        // Do nothing -- we are already unloaded.
    }
}

//code snippet that reads audio file and converts it to text

const getTranscription = async () => {
  setIsFetching(true);
  try {
      const info = await FileSystem.getInfoAsync(recording.getURI());
      const fileUri = info.uri;
      var file = {
        uri: fileUri,
        type: 'audio/x-wav',
        name: 'audio.wav'
      }
      var body = new FormData();
      body.append('file',file);
      
      const response = await fetch('http://iseek.cs.messiah.edu:5000/recording'
      /*'http://ec2-3-23-33-73.us-east-2.compute.amazonaws.com:5000/recording'*/
      /*'http://153.42.129.91:5000/recording'*/, {
          method: 'POST',
          body: body
      });
      const data = await response.json();
      console.log(data.textResponse)
      switch(data.textResponse){
        case ("%0oc"):
          navigation.navigate('Camera');
          changeScreenBack();
          break; 
        case("%0om"):
          navigation.navigate('Messenger');
          break;
        case("%0st"):
          navigation.navigate('BETA Streaming')  ;
          break;
        case("%0tp"):
          console.log("her")
          
          snap2 = async () => {
            console.log("reached")
            if (this.camera) {
              console.log("hereeee");
              //
              const options = { quality: .1, base64: true, fixOrientation: true, 
                exif: true};
                await this.camera.takePictureAsync(options).then(photo => {
                   setIsPictureFetching(true);
                    setPicStr(photo.base64);
                    console.log(photo.base64)
                   fetch('http://iseek.cs.messiah.edu:5000/image',{
                   //fetch('http://153.42.129.91:5000/image',{
                     method: 'POST',
                     headers:{
                       Accept: 'application/json',
                       'Content-Type': 'application/json',
                     },
                     body: JSON.stringify({
                       pictureString: photo.base64,
                     }),
                   }).then((response) => response.json())
                   .then((json) => {
                     setPhoto(json.pictureResponse);
                     SetObjectsInPhoto(json.objects);
                     setIsPictureFetching(false);
                    })
                 });
             }  
           }
           snap2();
          console.log("herer")
          break;
          case("%0ri"):
            if(objectsInPic === "" && picStr === ""){
              Alert.alert("You must take a picture first")
              Speech.speak("You must take a picture first")
            }
            else{
              ListObjects();
            }
            break;
          case("%0sp"):
            if(photoJson !== "" || picStr !== "" ){
              SavePicture();
            }else{
              Alert.alert("You must take a picture first")
              Speech.speak("You must take a picture first")
            }
            break;
          case("%1si"):
            if(objectsInPic === "" && picStr === ""){
              Alert.alert("You must take a picture first")
              Speech.speak("You must take a picture first")
            }
            else{
              ListObjects();
            }
            break;
          default:
            Speech.speak(data.textResponse);
            break;
      }
  } catch(error) {
      console.log('There was an error reading file', error);
      stopRecording();
  }
  setIsFetching(false);
}
const handleOnPressIn = () => {
  startRecording();
};

const handleOnPressOut = () => {
  stopRecording();
  getTranscription();
};


  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }
  
  SavePicture = async () =>{
    const filename = FileSystem.documentDirectory + "iSeekPhoto.jpg";
    await FileSystem.writeAsStringAsync(filename, photoJson, {
    encoding: FileSystem.EncodingType.Base64,
    });
    await MediaLibrary.saveToLibraryAsync(filename);
  }
  ListObjects = async () => {
    //et obj = objectsInPic.split('\n');
    Speech.speak("The Objects in this picture are: ");
    if (objectsInPic.length === 1){
      Speech.speak("The object in this picture " + objectsInPic[0]);
      return;
    }
    else{
    for(i = 0; i < objectsInPic.length ; i++){
      if (i ===  objectsInPic.length - 1 ){
        Speech.speak("and " + objectsInPic[i]);
        return;
      }
      else{
       Speech.speak(objectsInPic[i]);
    }
  }
  }
  }
        

  getCameraPic = async () =>{
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      
      quality: 1,
      base64: true,
    });


    if (!result.cancelled) {
      setIsPictureFetching(true);
      fetch('http://iseek.cs.messiah.edu:5000/image',
      //fetch('153.42.129.91:5000/image',
           {
             method: 'POST',
             headers:{
               Accept: 'application/json',
               'Content-Type': 'application/json',
             },
             body: JSON.stringify({
               pictureString: result.base64,
             }),
           }).then((response) => response.json())
           .then((json) => {
             setPhoto(json.pictureResponse);
             SetObjectsInPhoto(json.objects);
             setIsPictureFetching(false);
            })
    }
  }
  
 changeScreenBack = async () =>{
  SetObjectsInPhoto("");
  setPhoto("");
  setPhoto("");
 }

 //this.changeScreenBack(); 
  return (
    
      
    <View style={styles.container}>

      
      
        {(photoJson != ""  && !isPictureFetching)  && (
           
           <ImageBackground source ={{ uri:`data:image/jpg;base64,${photoJson}`}} style={{flex:1, height: undefined, width: undefined}}>
            {(Load) && (<ActivityIndicator alignContent="center" size="large" color="#000" 
            style={{position:"absolute"}}> </ActivityIndicator>)}

          <View style = {{position:"absolute", flex:'1', flexDirection:"row", borderRadius:100,bottom:'20%'}}>
            
          <ActionButton  buttonColor="rgba(231,76,60,1)">
          <ActionButton.Item buttonColor='#f0fff1' title="Read Objects out loud" onPress={()=>this.ListObjects()}>
            <Icon name="ios-text"   onPress={()=>this.ListObjects()}/>
          </ActionButton.Item>
        
          <ActionButton.Item buttonColor='#5f6702' title="Save Picture"onPress={()=>this.findText()} >
            <Icon name="ios-book" onPress={()=>this.SavePicture()}/>
          </ActionButton.Item>

          <ActionButton.Item buttonColor='#5f6702' title="Back to Home Screen"onPress={()=>this.findText()} >
            <Icon name="ios-book" onPress={()=>this.changeScreenBack()}/>
          </ActionButton.Item>
          </ActionButton>
          

          <TouchableOpacity style={{bottom:'-80%',left:'500%'}} onPressIn={handleOnPressIn} onPressOut={handleOnPressOut}> 
    {isFetching ?  <ActivityIndicator color="#0f0"></ActivityIndicator> :
         <Image source={require("./images/chat.png")} style={{ width: 55, height: 55 ,  borderRadius:100}} />}
      </TouchableOpacity> 
      </View>
          
          </ImageBackground>
        )}


{/*
        {(photoJson == ""  && !isPictureFetching)  && (
           <>
           <Video
           source={{ vid }}
           rate={1.0}
           volume={1.0}
           isMuted={false}
           resizeMode="cover"
           shouldPlay
           isLooping
         />

            {(Load) && (
            <ActivityIndicator alignContent="center" size="large" color="#000" 
            style={{position:"absolute"}}> </ActivityIndicator>)}

          <View style={styles.close}>
          <Button title="Save Picture" style={{position:"absolute", backgroundColor:'#F50303',borderRadius:10,borderWidth: 1,borderColor: '#fff'}} onPress={async () => this.SavePicture()}> Save Picture</Button>
          </View>
          <ActionButton style={styles.close2} buttonColor="rgba(231,76,60,1)">
          <ActionButton.Item buttonColor='#f0fff1' title="Read Objects out loud" onPress={()=>this.ListObjects()}>
            <Icon name="ios-text"   onPress={()=>this.ListObjects()}/>
          </ActionButton.Item>
          <ActionButton.Item buttonColor='#5f6702' title="Find text in screen"onPress={()=>this.findText()} >
            <Icon name="ios-book" onPress={()=>this.findText()}/>
          </ActionButton.Item>
          </ActionButton>
          </>
        )}

            */}

      {(isPictureFetching)&&<View style={[styles.container_nik,styles.horizontal]}>
        <ActivityIndicator alignContent="center" size="large" color="#000"></ActivityIndicator>
      </View>}


      {(photoJson == "" && !isPictureFetching && vid == null) &&(
        <>
        <Camera style={{ flex: 1 }} type={type} ref={ref => { this.camera = ref; }}>
      </Camera>
      
      
      {//!checkVid ? 
      <TouchableOpacity style = {{position: 'absolute', borderRadius:100,bottom:'2%',left:'42.5%'}} onPress={ async () =>  this.snap()}>
         <Image source={require("./images/cam.png")} style={{ width: 55, height: 55 , borderRadius:100}} onPress={ async () =>  this.snap()}/>

      </TouchableOpacity>
        }

<TouchableOpacity style = {{position: 'absolute', borderRadius:"100%",bottom:'2%',left:'80%'}} onPressIn={handleOnPressIn} onPressOut={handleOnPressOut}>
    {isFetching ?  <ActivityIndicator color="#0f0"></ActivityIndicator> :
         <Image source={require("./images/chat.png")} style={{ width: 55, height: 55 ,  borderRadius:100}} />}
      </TouchableOpacity> 

     <TouchableOpacity style = {{position: 'absolute', borderRadius:100,bottom:'2%',left:'3%'}} onPress={() => {setType(type === Camera.Constants.Type.back? Camera.Constants.Type.front: Camera.Constants.Type.back);}}> 
    {isFetching ?  <ActivityIndicator color="#0f0"></ActivityIndicator> :
         <Image source={require("./images/flipcamera.png")} style={{ width: 55, height: 55 ,  borderRadius:100}} />}
    </TouchableOpacity> 

      <TouchableOpacity style = {{position: 'absolute', borderRadius:100,bottom:'90%',left:'5%'}} onPressIn={handleOnPressIn} onPressOut={handleOnPressOut}> 
    {isFetching ?  <ActivityIndicator color="#0f0"></ActivityIndicator> :
         <Icon
         name="ios-menu"
         color="#ccc"
         size={25}
         onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
       />}
      </TouchableOpacity> 

      <TouchableOpacity style = {{position: 'absolute', borderRadius:100,bottom:'90%',left:'90%'}} onPressIn={handleOnPressIn} onPressOut={handleOnPressOut}> 
    {isFetching ?  <ActivityIndicator color="#0f0"></ActivityIndicator> :
         <Icon
         name="ios-browsers"
         color="#ccc"
         size={25}
         onPress = {() =>  this.getCameraPic()}
       />}

    </TouchableOpacity> 

        </>  
      ) }
        
    </View>
   ); 
  }
                 
      
const styles = StyleSheet.create({
  container_nik: {
    flex: 1,
    justifyContent: "center"
  },
  horizontal: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10
  },
  actionButtonIcon: {
    fontSize: 20,
    height: 22,
    color: 'white',
  },

  container: {
    flex: 1,
  },
  close: {
    position: 'absolute',
    width: '100%', 
    padding: 30,
    justifyContent: 'center', 
    alignItems: 'flex-start',
   bottom: 45,
   marginLeft:'5%',

  },
  close2: {
    position: 'absolute',
    bottom:'5%',
    //width: '100%', 
    //padding: 30,
    //justifyContent: 'center', 
    //alignItems: 'flex-start',
    //top: '195%',
    //alignSelf:'flex-end'
   //marginRight:'5%',

  },
  buttongroup: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: '135%',
    paddingLeft: '0.1%',
    margin: 6,
  },
});