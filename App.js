import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library/legacy';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <TelaCamera />
    </SafeAreaProvider>
  );
}

function TelaCamera() {
  const [permissaoCamera, solicitarPermissaoCamera] = useCameraPermissions();
  const [permissaoGaleria, solicitarPermissaoGaleria] = MediaLibrary.usePermissions({
    writeOnly: true,
  });
  const [salvando, setSalvando] = useState(false);
  const [cameraPronta, setCameraPronta] = useState(false);
  const [cameraFrontal, setCameraFrontal] = useState(false);
  const [ultimaFoto, setUltimaFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const camera = useRef(null);

  if (!permissaoCamera && !permissaoGaleria) {
    return (
      <SafeAreaView style={styles.carregando}>
        <ActivityIndicator color="#e56c4c" size="large" />
      </SafeAreaView>
    );
  }

  const temPermissao = permissaoCamera?.granted && permissaoGaleria?.granted;

  async function pedirPermissoes() {
    const bloqueada =
      (!permissaoCamera?.granted && permissaoCamera?.canAskAgain === false) ||
      (!permissaoGaleria?.granted && permissaoGaleria?.canAskAgain === false);

    if (bloqueada) {
      await Linking.openSettings();
      return;
    }

    const cam = permissaoCamera?.granted
      ? permissaoCamera
      : await solicitarPermissaoCamera();

    if (cam.granted) {
      await solicitarPermissaoGaleria();
    }
  }

  async function tirarFoto() {
    if (!camera.current || !cameraPronta || salvando) {
      return;
    }

    setSalvando(true);

    try {
      const foto = await camera.current.takePictureAsync({
        quality: 0.8,
      });

      setCameraPronta(false);
      setFotoPreview(foto.uri);
    } catch (error) {
      console.log(error);
      Alert.alert('Não foi possível tirar a foto', 'Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  async function salvarFoto() {
    if (!fotoPreview || salvando) {
      return;
    }

    setSalvando(true);

    try {
      await MediaLibrary.saveToLibraryAsync(fotoPreview);
      setUltimaFoto(fotoPreview);
      setFotoPreview(null);
      setCameraPronta(false);
      Alert.alert('Foto salva', 'Sua foto já está na galeria.');
    } catch (error) {
      console.log(error);
      Alert.alert('Não foi possível salvar', 'Tente salvar a foto novamente.');
    } finally {
      setSalvando(false);
    }
  }

  function refazerFoto() {
    setFotoPreview(null);
    setCameraPronta(false);
  }

  if (!temPermissao) {
    return (
      <SafeAreaView style={styles.telaPermissao}>
        <StatusBar style="dark" />
        <View style={styles.marcaPermissao}>
          <Text style={styles.simboloMarca}>C</Text>
        </View>
        <Text style={styles.tituloPermissao}>{'Sua câmera,\nsuas memórias.'}</Text>
        <Text style={styles.textoPermissao}>
          Permita o acesso à câmera para fotografar e à galeria para guardar
          seus registros.
        </Text>
        <Pressable style={styles.botaoPermissao} onPress={pedirPermissoes}>
          <Text style={styles.textoBotaoPermissao}>Ativar câmera</Text>
          <Text style={styles.setaBotao}>→</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.tela}>
      <StatusBar style="dark" />
      <View style={styles.topo}>
        <View>
          <Text style={styles.nomeApp}>CLIC</Text>
          <Text style={styles.subtitulo}>CÂMERA DE BOLSO</Text>
        </View>
        <View style={styles.indicadorAoVivo}>
          <View style={styles.pontoAoVivo} />
          <Text style={styles.textoAoVivo}>
            {fotoPreview ? 'PRÉVIA' : 'AO VIVO'}
          </Text>
        </View>
      </View>

      <View style={styles.molduraCamera}>
        {fotoPreview ? (
          <Image
            source={{ uri: fotoPreview }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="contain"
          />
        ) : (
          <CameraView
            ref={camera}
            style={StyleSheet.absoluteFillObject}
            facing={cameraFrontal ? 'front' : 'back'}
            onCameraReady={() => setCameraPronta(true)}
          />
        )}
        <View style={styles.etiquetaCamera}>
          <Text style={styles.textoEtiquetaCamera}>
            {fotoPreview ? 'FOTO CAPTURADA' : cameraFrontal ? 'SELFIE' : 'FOTO'}
          </Text>
        </View>
        {!fotoPreview && !cameraPronta && (
          <View style={styles.carregandoCamera}>
            <ActivityIndicator color="#fffaf1" size="large" />
          </View>
        )}
      </View>

      {fotoPreview ? (
        <View style={styles.acoesPreview}>
          <Pressable
            accessibilityRole="button"
            onPress={refazerFoto}
            style={styles.botaoRefazer}
          >
            <Text style={styles.textoBotaoRefazer}>Refazer</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={salvando}
            onPress={salvarFoto}
            style={styles.botaoSalvar}
          >
            {salvando ? (
              <ActivityIndicator color="#fffaf1" />
            ) : (
              <Text style={styles.textoBotaoSalvar}>Salvar foto</Text>
            )}
          </Pressable>
        </View>
      ) : (
        <View style={styles.controles}>
          <View style={styles.lateralControle}>
            {ultimaFoto ? (
              <Image source={{ uri: ultimaFoto }} style={styles.miniatura} />
            ) : (
              <View style={styles.miniaturaVazia}>
                <Text style={styles.simboloGaleria}>▧</Text>
              </View>
            )}
            <Text style={styles.rotuloControle}>RECENTE</Text>
          </View>

          <Pressable
            accessibilityLabel="Tirar foto"
            accessibilityRole="button"
            disabled={!cameraPronta || salvando}
            onPress={tirarFoto}
            style={({ pressed }) => [
              styles.botaoFoto,
              pressed && styles.botaoFotoPressionado,
              (!cameraPronta || salvando) && styles.botaoFotoDesativado,
            ]}
          >
            {salvando ? (
              <ActivityIndicator color="#fffaf1" />
            ) : (
              <View style={styles.mioloBotaoFoto} />
            )}
          </Pressable>

          <Pressable
            accessibilityLabel="Alternar câmera frontal e traseira"
            accessibilityRole="button"
            onPress={() => {
              setCameraPronta(false);
              setCameraFrontal((frontal) => !frontal);
            }}
            style={styles.lateralControle}
          >
            <View style={styles.botaoVirar}>
              <Text style={styles.simboloVirar}>↻</Text>
            </View>
            <Text style={styles.rotuloControle}>VIRAR</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  carregando: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f1e9',
  },
  tela: {
    flex: 1,
    backgroundColor: '#f4f1e9',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  topo: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  nomeApp: {
    color: '#20211e',
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 2,
  },
  subtitulo: {
    color: '#85847d',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  indicadorAoVivo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#fffaf1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pontoAoVivo: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#e56c4c',
  },
  textoAoVivo: {
    color: '#474741',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  molduraCamera: {
    flex: 1,
    minHeight: 280,
    overflow: 'hidden',
    borderRadius: 26,
    backgroundColor: '#30332f',
  },
  etiquetaCamera: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(25, 27, 24, 0.58)',
  },
  textoEtiquetaCamera: {
    color: '#fffaf1',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  carregandoCamera: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#30332f',
  },
  controles: {
    minHeight: 126,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  acoesPreview: {
    minHeight: 126,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  botaoRefazer: {
    height: 56,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#e6e2d8',
  },
  textoBotaoRefazer: {
    color: '#373832',
    fontSize: 15,
    fontWeight: '700',
  },
  botaoSalvar: {
    height: 56,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#e56c4c',
  },
  textoBotaoSalvar: {
    color: '#fffaf1',
    fontSize: 15,
    fontWeight: '700',
  },
  lateralControle: {
    width: 66,
    alignItems: 'center',
    gap: 7,
  },
  miniatura: {
    width: 44,
    height: 44,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#fffaf1',
  },
  miniaturaVazia: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#e6e2d8',
  },
  simboloGaleria: {
    color: '#77776f',
    fontSize: 23,
  },
  rotuloControle: {
    color: '#77776f',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  botaoFoto: {
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 39,
    borderWidth: 3,
    borderColor: '#e56c4c',
    backgroundColor: '#fffaf1',
  },
  botaoFotoPressionado: {
    transform: [{ scale: 0.96 }],
  },
  botaoFotoDesativado: {
    opacity: 0.55,
  },
  mioloBotaoFoto: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#e56c4c',
  },
  botaoVirar: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#e6e2d8',
  },
  simboloVirar: {
    color: '#373832',
    fontSize: 27,
    lineHeight: 31,
  },
  telaPermissao: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#f4f1e9',
    paddingHorizontal: 30,
  },
  marcaPermissao: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#e56c4c',
    marginBottom: 28,
  },
  simboloMarca: {
    color: '#fffaf1',
    fontSize: 28,
    fontWeight: '900',
  },
  tituloPermissao: {
    color: '#20211e',
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 40,
  },
  textoPermissao: {
    maxWidth: 310,
    color: '#77776f',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 14,
  },
  botaoPermissao: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 17,
    backgroundColor: '#20211e',
    paddingHorizontal: 20,
    marginTop: 30,
  },
  textoBotaoPermissao: {
    color: '#fffaf1',
    fontSize: 15,
    fontWeight: '700',
  },
  setaBotao: {
    color: '#fffaf1',
    fontSize: 22,
  },
});