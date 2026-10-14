import { View, Text, StyleSheet, TouchableOpacity, 
         PermissionsAndroid, Alert, ActivityIndicator } from 'react-native';

import { useState, useRef } from 'react';

import { SafeAreaProvider, 
         SafeAreaView 
} from 'react-native-safe-area-context';

import { CameraView, useCameraPermissions } 
from 'expo-camera';

import { Asset, usePermissions } from 'expo-media-library';

export default function App() {
  return (
    <View>

    </View>
  );
}

function TelaCamera() {
  const [permissaoCamera, setPermissaoCamera] = useCameraPermissions();
  const [permissaoGaleria, setPermissaoGaleria] = usePermissions({ writeOnly: true });
  const [salvando, setSalvando] = useState(false);
  const camera = useRef(null);

  if (!permissaoCamera && !permissaoGaleria) {
    return null;
  }

  const temPermissao = permissaoCamera.granted && permissaoGaleria.granted;

  async function pedirPermissoes() {
    const bloqueada = 
      (!permissaoCamera.granted && !permissaoCamera.canAskAgain) ||
      (!permissaoGaleria.granted && !permissaoGaleria.canAskAgain);

    if (bloqueada) {
      Linking.openSettings();
      return;
    }

    const cam = await requestCameraPermission();

    if (cam.granted) {
      await requestMediaPermission();
    }
  }

  async function tirarFoto() {
    if (!camera.current || salvando) {
      return;
    }

    setSalvando(true);

    try {
      const foto = await camera.current.takePictureAsync({
        quality: 0.8
      });

      await Asset.create(foto.uri);

      Alert.alert("Sucesso", "Foto salva na galeria!");
    } catch (error) {
      console.log(error);
      Alert.alert(`Erro", "Erro ao salvar na galeria: ${error}`);
    } finally {
      setSalvando(false);
    }
  }

  if (!temPermissao) {
    return (
      <SafeAreaProvider>
        <SafeAreaView>
          <Text>
            É necessária a permissão da câmera e da galeria
          </Text>
          <TouchableOpacity onPress={pedirPermissoes}>
            <Text>
              Conceder permissões
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }
}