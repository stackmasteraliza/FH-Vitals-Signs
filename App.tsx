/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useEffect, useState } from 'react';
import { requireNativeComponent, Button, StyleSheet, Text, View, PermissionsAndroid, Platform} from 'react-native';

import FHVitals, { VITAL, HRV_TYPE, BP_MODE, GENDER, BP_GROUP, VITALS_SYST, ERROR_CODE, IQA_TYPE, RADAR_TYPE, HRV_ANS_TYPE} from './FHVitalsSDK';
import FHCamera from './FHCamera';
import FHVitalsSDKCamera from './FHVitalsSDKCamera';
// const CameraPreview = requireNativeComponent('FHCameraPreViewLayout');
interface CameraPreviewProps {
  style?: Record<string, unknown>; // Define style prop as optional
}
const CameraPreview: React.ComponentType<CameraPreviewProps> = requireNativeComponent(
  'FHCameraPreViewLayout'
);
const styles = StyleSheet.create({
  text: {
    color: "#FFFFFF",
    fontSize: 18
  },
  container:
  {
    justifyContent: "center",
    alignItems: "center",
  },
  preView: {
    width: 200,
    height: 200,
  },
});

function App(): React.JSX.Element {
  const [version, setVersion] = useState("");
  const [sdk_activated, setSDKState] = useState("");
  const [result, setResult] = useState<String>("");
  const [has_started, setHasStarted] = useState(false);
  const [result_timer, setResultTimer] = useState<NodeJS.Timeout | null>(null);
  const [camera_access, setCameraAccess] = useState(false);

  useEffect(() => {
    (async () => {

      if (Platform.OS == "android")
      {
        while(true)
        {
          if (await FHCamera.checkCameraAccess())
          {
            break;
          }

          requestCameraPermission();
          sleep(1000);
          console.log("wait for camera access");
        }
      }    

      setCameraAccess(true);   

      setVersion(await FHVitals.version());

      console.log("Start Init SDK")
	  
      let error_code = await FHVitals.init("assets", "License_Key", "setest.faceheart.com", 8090);
      
      console.log(`initialize FHVitals successfully, error_code=${error_code}`);

      if (await FHVitals.isActivated() && error_code == ERROR_CODE.SUCCESS)
      {
        setSDKState("SUCCESS");
      }
      else if (error_code == ERROR_CODE.ERROR_AUTHENTICATION_FAILED){
        setSDKState("AUTHENTICATION_FAILED");
      }
      else if (error_code == ERROR_CODE.ERROR_INITIALIZATION_FAILED){
        setSDKState("INITIALIZATION_FAILED");
      }
      else if (error_code == ERROR_CODE.ERROR_ACTIVATION_FAILED){
        setSDKState("ACTIVATION_FAILED");
      }
      else if (error_code == ERROR_CODE.ERROR_INVALID_DEVICE){
        setSDKState("INVALID_DEVICE");
      }
      else if (error_code == ERROR_CODE.ERROR_INVALID_ASSETS){
        setSDKState("INVALID_ASSETS");
      }
      else if (error_code == ERROR_CODE.ERROR_INVALID_LICENSE){
        setSDKState("INVALID_LICENSE");
      }
      else if (error_code == ERROR_CODE.ERROR_SERVER_CONNECTION_FAILED){
        setSDKState("SERVER_CONNECTION_FAILED");
      }
      else if (error_code == ERROR_CODE.ERROR_INVALID_APPLICATION_ID){
        setSDKState("INVALID_APPLICATION_ID");
      }
      else if (error_code == ERROR_CODE.ERROR_CONFIG_NOT_SUPPORTED){
        setSDKState("CONFIG_NOT_SUPPORTED");
      }

      FHVitals.useFaceTrackMode()
        .then(() => console.log("FHVitals useFaceTrackMode"));
      FHVitals.setBloodPressureMode(BP_MODE.BP_MODE_TERNARY)
        .then(() => console.log("FHVitals setBloodPressureMode"))

      let reset_fps_success = await FHVitals.resetFPS(30);
      console.log(`FHVitals resetFPS = ${reset_fps_success}`)
    })();
  }, []);

  useEffect(() => {
    if (result_timer == null) {

      setResultTimer(setInterval(async () => {
        let display = "";
        
        let pfc_hr = await FHVitals.getProcessedFrameCount(VITALS_SYST.VITALS_SYST_HR_HRV)
        display += "Process Frame : " + pfc_hr ;

        let iqa_score_bri = (await FHVitals.getImageQualityScore(IQA_TYPE.IQA_TYPE_BRIGHTNESS)).toFixed(2);
        let iqa_score_cont = (await FHVitals.getImageQualityScore(IQA_TYPE.IQA_TYPE_CONTRAST)).toFixed(2);
        let iqa_score_motion = (await FHVitals.getImageQualityScore(IQA_TYPE.IQA_TYPE_MOTION)).toFixed(2);
        display += "\nIQA (Bri/Cont/Motion) : " + iqa_score_bri + " / " + iqa_score_cont + " / " + iqa_score_motion;

        let hr = await FHVitals.getSmoothedHR();
        let hr_sq = (await FHVitals.getSignalQualityScore(VITALS_SYST.VITALS_SYST_HR_HRV)).toFixed(2);
        display += "\nHeart Rate -- (SQ) : " + Math.round(hr) + " -- " + hr_sq;

        let hrv = await FHVitals.getHRV(HRV_TYPE.HRV_TYPE_SDNN);
        let check_hrv = (await FHVitals.checkFeatureBufferForHRV()) * 100;
        display += "\nHRV (SDNN): " + Math.round(hrv) + "["  + Math.round(check_hrv) + "%]";

        let prq = (await FHVitals.getPRQ()).toFixed(2);
        display += "\nPRQ : " + prq;

        let sd_1 = (await FHVitals.getHRV(HRV_TYPE.HRV_TYPE_SD1)).toFixed(2);
        let sd_2 = (await FHVitals.getHRV(HRV_TYPE.HRV_TYPE_SD2)).toFixed(2);
        display += "\nSD1/SD2 : " + sd_1 + " / " + sd_2;

        let pns = (await FHVitals.getANSIndex(HRV_ANS_TYPE.HRV_ANS_TYPE_PNS)).toFixed(2);
        let sns = (await FHVitals.getANSIndex(HRV_ANS_TYPE.HRV_ANS_TYPE_SNS)).toFixed(2);
        display += "\nPNS/SNS : " + pns + " / " + sns;

        let sbp = await FHVitals.getSmoothedSBP();
        let dbp = await FHVitals.getSmoothedDBP();
        let bp_sq = (await FHVitals.getSignalQualityScore(VITALS_SYST.VITALS_SYST_BP)).toFixed(2);
        display += "\nSBP/DBP -- (SQ): " + Math.round(sbp) + " / " + Math.round(dbp) + " -- " + bp_sq;

        let rr = await FHVitals.getSmoothedRR();
        let rr_sq = (await FHVitals.getSignalQualityScore(VITALS_SYST.VITALS_SYST_RESP)).toFixed(2);
        display += "\nRR -- (SQ): " + Math.round(rr) + " -- " + rr_sq;

        let spo2 = await FHVitals.getSpO2();
        let spo2_sq = (await FHVitals.getSignalQualityScore(VITALS_SYST.VITALS_SYST_SPO2)).toFixed(2);
        display += "\nSpo2 -- (SQ): " + Math.round(spo2) + " -- " + spo2_sq;

        let health_activity = await FHVitals.getRadar(RADAR_TYPE.RADAR_TYPE_ACTIVITY);
        let health_sleep = await FHVitals.getRadar(RADAR_TYPE.RADAR_TYPE_SLEEP);
        let health_equilibrium = await FHVitals.getRadar(RADAR_TYPE.RADAR_TYPE_EQUILIBRIUM);
        let health_metabolism = await FHVitals.getRadar(RADAR_TYPE.RADAR_TYPE_METABOLISM);
        let health_health = await FHVitals.getRadar(RADAR_TYPE.RADAR_TYPE_HEALTH);
        let health_relaxation = await FHVitals.getRadar(RADAR_TYPE.RADAR_TYPE_RELAXATION);
        let stress = await FHVitals.getStressIndex();
        display += "\nHealth / Stress: " + health_activity + " "
                                         + health_sleep + " "
                                         + health_equilibrium + " "
                                         + health_metabolism + " "
                                         + health_health + " "
                                         + health_relaxation + " / "
                                         + Math.round(stress);
        setResult(display);
      }, 1000));
    }
    else if (!has_started && result_timer != null) {
      clearInterval(result_timer)
      setResultTimer(null)
    }
  }, [has_started]);


  const startMeasure = () => {
    FHVitalsSDKCamera.startPushFrame();
    console.log("Camera: ",camera_access);
    
    console.log("click startMeasure");
    FHVitals.setSubjectInfo(GENDER.MALE, 30, 170, 70, BP_GROUP.BP_NORMAL)
      .then(() => {
        console.log("FHVitals setSubjectInfo finish");
        return FHVitals.startMeasuring(VITAL.VITAL_ALL);
      })
      .then(() => {
        console.log("FHVitals startMeasuring finish");
        setHasStarted(true);
      })
      .catch(err => console.error(err));

  }

  const stopMeasure = () => {
    console.log("click stopMeasure");
    FHVitalsSDKCamera.stopPushFrame();
    FHVitals.stopMeasuring()
      .then(() => {
        console.log("FHVitals stopMeasuring finish");
        setHasStarted(false);
      })
      .catch(err => console.error(err));
  }

  const requestCameraPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: "App Camera Permission",
          message: "App need access to your camera",
          buttonNeutral: "Ask me later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTRD){
        console.log("You can use camera");
      }
      else
      {
        console.log("Camera permission denied");
      }

    }
    catch (err){
      console.warn(err);
    }
  };

  const sleep = (ms: any) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  return (
    <View style={{ flex: 1 }}>
      
      <View>
        <Text style={styles.text}>
        </Text>
        <Text style={styles.text}>
        </Text>
        <Text style={styles.text}>
        </Text>
        <Text style={styles.text}>
        </Text>
      </View>

      <View style={styles.container}>
        {camera_access && <CameraPreview style={styles.preView}/>}
      </View>

      <View>
        <Text style={styles.text}>
            {`SDK Version = ${version} / ${sdk_activated}`}
          </Text>
        <Text style={styles.text}>
          {result}
        </Text>
      </View>

      <View>
        <Button
          onPress={startMeasure}
          title="start"
          color="#841584"
          disabled={has_started}
        />
        <Button
          onPress={stopMeasure}
          title="stop"
          color="#FF1584"
          disabled={!has_started}
        />
      </View>

    </View>
  );

};

export default App;
