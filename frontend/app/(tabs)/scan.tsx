import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { apiService } from '../../utils/api';

const { width } = Dimensions.get('window');

const colors = {
  gradientMint: ['#22c55e', '#16a34a'],
  gradientSky: ['#0ea5e9', '#0284c7'],
  primary: '#22c55e',
  primaryDark: '#16a34a',
  secondary: '#10b981',
  success: '#22c55e',
  error: '#ef4444',
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  textWhite: '#ffffff',
  border: '#e2e8f0',
  shadow: '#000000',
  cardBackground: '#f1f5f9',
};

const Scan = () => {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItem, setScannedItem] = useState<any>(null);

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleScan = async () => {
    if (!permission?.granted) {
      Alert.alert('Permission required', 'Camera permission is needed to scan items');
      return;
    }

    if (!cameraRef.current) {
      Alert.alert('Error', 'Camera not ready');
      return;
    }

    setIsScanning(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
      });

      // Send to API
      const response = await apiService.classifyItem(photo.base64!);

      // Format response to match expected structure
      const result = {
        item: response.item_type,
        recyclable: response.recyclable,
        confidence: Math.round(response.confidence * 100),
        instructions: response.recyclable ?
          "This item is recyclable. Please clean it and place in the appropriate recycling bin." :
          "This item is not recyclable. Please dispose of it properly in regular waste.",
        impact: `Saves ${response.co2_impact}kg CO₂`,
        category: response.item_type
      };

      setScannedItem(result);
    } catch (error) {
      console.error('Scan error:', error);
      Alert.alert('Scan Failed', 'Unable to analyze the item. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleRescan = () => {
    setScannedItem(null);
    setIsScanning(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#D2EBDA' }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>AI Scanner</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Point camera at item for instant identification
          </Text>
        </View>

        <View style={styles.content}>
          {/* Camera View */}
          <View style={styles.cameraCard}>
            <View style={styles.cameraView}>
              {permission?.granted ? (
                <CameraView
                  ref={cameraRef}
                  style={StyleSheet.absoluteFillObject}
                  facing="back"
                >
                  {!isScanning && !scannedItem && (
                    <View style={styles.overlay}>
                      <View style={styles.scanArea}>
                        <Ionicons name="camera" size={48} color={colors.textWhite} />
                      </View>
                    </View>
                  )}
                </CameraView>
              ) : (
                <View style={styles.defaultView}>
                  <View style={styles.scanArea}>
                    <Ionicons name="camera" size={48} color={colors.primary} />
                  </View>
                  <Text style={styles.permissionText}>
                    Camera permission required
                  </Text>
                </View>
              )}

              {isScanning && (
                <View style={styles.overlay}>
                  <View style={styles.scanningView}>
                    <ActivityIndicator size="large" color={colors.textWhite} />
                    <Text style={styles.scanningText}>Analyzing item...</Text>
                    <Text style={styles.scanningSubtext}>Please hold steady</Text>
                  </View>
                </View>
              )}

              {scannedItem && (
                <View style={styles.overlay}>
                  <View style={styles.resultView}>
                    <View style={styles.resultIcon}>
                      <Ionicons
                        name={scannedItem.recyclable ? "checkmark-circle" : "close-circle"}
                        size={64}
                        color={scannedItem.recyclable ? colors.success : colors.error}
                      />
                    </View>
                    <Text style={styles.itemName}>{scannedItem.item}</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: scannedItem.recyclable ? colors.success + '20' : colors.error + '20' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: scannedItem.recyclable ? colors.success : colors.error }
                      ]}>
                        {scannedItem.recyclable ? 'Recyclable' : 'Not Recyclable'}
                      </Text>
                      <Text style={styles.confidenceText}>
                        {scannedItem.confidence}% confidence
                      </Text>
                    </View>
                    <Text style={styles.categoryText}>{scannedItem.category}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Results or Scan Button */}
          {!permission?.granted ? (
            <TouchableOpacity
              onPress={requestPermission}
              style={styles.scanButton}
            >
              <View style={[styles.scanButtonGradient, { backgroundColor: colors.primary }]}>
                <Ionicons name="camera" size={24} color={colors.textWhite} />
                <Text style={styles.scanButtonText}>
                  Grant Camera Permission
                </Text>
              </View>
            </TouchableOpacity>
          ) : scannedItem ? (
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsTitle}>Disposal Instructions</Text>
              <Text style={styles.instructionsText}>
                {scannedItem.instructions}
              </Text>
              <View style={styles.impactBadge}>
                <Text style={styles.impactText}>
                  🌱 Environmental Impact: {scannedItem.impact}
                </Text>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  onPress={handleRescan}
                  style={styles.rescanButton}
                >
                  <Ionicons name="refresh" size={20} color={colors.primary} />
                  <Text style={styles.rescanButtonText}>Scan Again</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push('/guide' as any)}
                  style={styles.findCenterButton}
                >
                  <View style={[styles.findCenterGradient, { backgroundColor: colors.secondary }]}>
                    <Text style={styles.findCenterText}>Find Center</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleScan}
              disabled={isScanning}
              style={styles.scanButton}
            >
              <View style={[styles.scanButtonGradient, { backgroundColor: colors.primary }]}>
                <Ionicons name="camera" size={24} color={colors.textWhite} />
                <Text style={styles.scanButtonText}>
                  {isScanning ? 'Scanning...' : 'Start Scan'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textWhite,
    opacity: 0.9,
  },
  content: {
    paddingHorizontal: 20,
    marginTop: -12,
  },
  cameraCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cameraView: {
    height: 320,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  defaultView: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  placeholderImage: {
    width: width - 80,
    height: 240,
    position: 'absolute',
  },
  scanArea: {
    width: 192,
    height: 192,
    borderWidth: 4,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  scanningView: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanningText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 16,
  },
  scanningSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  resultView: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  resultIcon: {
    marginBottom: 16,
  },
  itemName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confidenceText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  categoryText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  instructionsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 100,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  impactBadge: {
    backgroundColor: colors.primary + '20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  impactText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  rescanButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.primary + '50',
    borderRadius: 12,
    backgroundColor: colors.primary + '10',
    gap: 8,
  },
  rescanButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  findCenterButton: {
    flex: 1,
  },
  findCenterGradient: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  findCenterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textWhite,
  },
  scanButton: {
    marginBottom: 100,
  },
  scanButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
  },
  scanButtonText: {
    color: colors.textWhite,
    fontSize: 18,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  permissionText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default Scan;