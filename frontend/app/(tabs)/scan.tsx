import eact, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
// Note: For gradient effect, install expo-linear-gradient:
// npm install expo-linear-gradient
// Then uncomment the import below:
// import { LinearGradient } from "expo-linear-gradient";
import { apiService } from "../../utils/api";

const { width, height } = Dimensions.get("window");

const colors = {
  gradientMint: ["#22c55e", "#16a34a"],
  gradientSky: ["#0ea5e9", "#0284c7"],
  primary: "#22c55e",
  primaryDark: "#16a34a",
  secondary: "#10b981",
  success: "#22c55e",
  error: "#ef4444",
  background: "#f8fafc",
  surface: "#ffffff",
  text: "#1e293b",
  textSecondary: "#64748b",
  textWhite: "#ffffff",
  border: "#e2e8f0",
  shadow: "#000000",
  cardBackground: "#f1f5f9",
};

const Scan = () => {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItem, setScannedItem] = useState<any>(null);
  const [showOverlays, setShowOverlays] = useState(false);

  // Snapchat-like animations
  const scanPulseAnim = useRef(new Animated.Value(1)).current;
  const resultSlideAnim = useRef(new Animated.Value(height)).current;
  const overlayFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Pulse animation for scan button
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanPulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanPulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, [scanPulseAnim]);

  // Slide in result animation
  useEffect(() => {
    if (scannedItem) {
      Animated.parallel([
        Animated.timing(resultSlideAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.back(1.7)),
          useNativeDriver: true,
        }),
        Animated.timing(overlayFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      resultSlideAnim.setValue(height);
      overlayFadeAnim.setValue(0);
    }
  }, [scannedItem, resultSlideAnim, overlayFadeAnim]);


  const handleScan = async () => {
    if (!permission?.granted) {
      Alert.alert(
        "Permission required",
        "Camera permission is needed to scan items"
      );
      return;
    }

    if (!cameraRef.current) {
      Alert.alert("Error", "Camera not ready");
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
        instructions: response.recyclable
          ? "This item is recyclable. Please clean it and place in the appropriate recycling bin."
          : "This item is not recyclable. Please dispose of it properly in regular waste.",
        impact: `Saves ${response.co2_impact}kg CO₂`,
        category: response.item_type,
        bbox: response.bbox, // Add bounding box for AR overlay
        fallback_model: response.fallback_model, // Indicate if fallback model was used
        image_path: response.image_path || "", // Path to stored image
      };

      setScannedItem(result);
    } catch (error) {
      console.error("Scan error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      Alert.alert(
        "Scan Failed",
        `Unable to analyze the item: ${errorMessage}. Please ensure the item is clearly visible, well-lit, and try again.`
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleRescan = () => {
    setScannedItem(null);
    setIsScanning(false);
    setShowOverlays(false);
  };

  const toggleOverlays = () => {
    setShowOverlays(!showOverlays);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "#D2EBDA" }]}>
      <View style={styles.mainContainer}>
        {/* Compact Header */}
        <View style={[styles.compactHeader, { backgroundColor: colors.primary }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>AI Scanner</Text>
            <TouchableOpacity
              onPress={toggleOverlays}
              style={styles.overlayToggle}
            >
              <Ionicons
                name={showOverlays ? "eye-off" : "eye"}
                size={20}
                color={colors.textWhite}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Full-Screen Camera */}
        <View style={styles.cameraContainer}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={toggleOverlays}
            style={styles.cameraTouchable}
          >
            <View style={styles.cameraView}>
              {permission?.granted ? (
                <CameraView
                  ref={cameraRef}
                  style={StyleSheet.absoluteFillObject}
                  facing="back"
                >
                  {/* Native camera app gradient overlay */}
                  <View style={styles.nativeGradientOverlay} />

                  {/* Scan interface - hidden by default, shown when overlays enabled */}
                  {showOverlays && !isScanning && !scannedItem && (
                    <View style={styles.scanInterface}>
                      {/* Animated scan ring */}
                      <Animated.View
                        style={[
                          styles.scanRing,
                          {
                            transform: [{ scale: scanPulseAnim }],
                          },
                        ]}
                      >
                        <View style={styles.scanRingInner}>
                          <Ionicons
                            name="scan-outline"
                            size={60}
                            color={colors.primary}
                          />
                        </View>
                      </Animated.View>

                      {/* Scan instructions */}
                      <View style={styles.scanInstructions}>
                        <Text style={styles.scanTitle}>Point at waste item</Text>
                        <Text style={styles.scanSubtitle}>Tap to scan for recyclability</Text>
                      </View>
                    </View>
                  )}
                </CameraView>
              ) : (
                <View style={styles.permissionView}>
                  <View style={styles.permissionIcon}>
                    <Ionicons name="camera" size={64} color={colors.primary} />
                  </View>
                  <Text style={styles.permissionTitle}>Camera Access Needed</Text>
                  <Text style={styles.permissionText}>
                    Allow camera access to scan waste items
                  </Text>
                </View>
              )}

              {/* Scanning overlay - always visible during scanning */}
              {isScanning && (
                <View style={styles.scanningOverlay}>
                  <View style={styles.scanningContainer}>
                    <View style={styles.scanningRing}>
                      <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                    <Text style={styles.scanningTitle}>Analyzing...</Text>
                    <Text style={styles.scanningText}>
                      Detecting material type and recyclability
                    </Text>
                  </View>
                </View>
              )}

              {/* Results overlay - shown when overlays enabled */}
              {scannedItem && showOverlays && (
                <Animated.View
                  style={[
                    styles.resultOverlay,
                    {
                      transform: [{ translateY: resultSlideAnim }],
                      opacity: overlayFadeAnim,
                    },
                  ]}
                >
                  <View style={styles.resultContainer}>
                    <View style={styles.resultIconContainer}>
                      <Ionicons
                        name={
                          scannedItem.recyclable
                            ? "checkmark-circle"
                            : "close-circle"
                        }
                        size={80}
                        color={
                          scannedItem.recyclable ? colors.success : colors.error
                        }
                      />
                    </View>

                    <Text style={styles.resultTitle}>{scannedItem.item}</Text>

                    <View
                      style={[
                        styles.resultBadge,
                        {
                          backgroundColor: scannedItem.recyclable
                            ? colors.success + "20"
                            : colors.error + "20",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.resultBadgeText,
                          {
                            color: scannedItem.recyclable
                              ? colors.success
                              : colors.error,
                          },
                        ]}
                      >
                        {scannedItem.recyclable
                          ? "♻️ Recyclable"
                          : "🗑️ Not Recyclable"}
                      </Text>
                    </View>

                    <Text style={styles.resultCategory}>
                      Material: {scannedItem.category}
                    </Text>

                    {/* AR Bounding Box Overlay */}
                    {scannedItem.bbox && scannedItem.bbox.length >= 4 && (
                      <View style={styles.arOverlay}>
                        <View
                          style={[
                            styles.boundingBox,
                            {
                              left: `${scannedItem.bbox[0] * 100}%`,
                              top: `${scannedItem.bbox[1] * 100}%`,
                              width: `${
                                (scannedItem.bbox[2] - scannedItem.bbox[0]) *
                                100
                              }%`,
                              height: `${
                                (scannedItem.bbox[3] - scannedItem.bbox[1]) *
                                100
                              }%`,
                              borderColor: scannedItem.recyclable
                                ? colors.success
                                : colors.error,
                            },
                          ]}
                        />
                        <View style={styles.confidenceOnBox}>
                          <Text style={styles.confidenceOnBoxText}>
                            {scannedItem.confidence}% confidence
                          </Text>
                        </View>
                        {scannedItem.fallback_model && (
                          <View style={styles.modelIndicator}>
                            <Text style={styles.modelIndicatorText}>
                              AI Model
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {scannedItem.image_path && (
                      <View style={styles.storageIndicator}>
                        <Ionicons name="cloud-upload" size={16} color={colors.success} />
                        <Text style={styles.storageIndicatorText}>
                          Image saved for analysis
                        </Text>
                      </View>
                    )}
                  </View>
                </Animated.View>
              )}

              {/* Overlay toggle hint - shown when overlays are hidden */}
              {!showOverlays && scannedItem && (
                <View style={styles.overlayHint}>
                  <Text style={styles.overlayHintText}>
                    Tap to show details
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom Scan Button */}
        <View style={styles.bottomControls}>
          {!permission?.granted ? (
            <TouchableOpacity
              onPress={requestPermission}
              style={styles.scanButton}
            >
              <View
                style={[
                  styles.scanButtonGradient,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Ionicons name="camera" size={24} color={colors.textWhite} />
                <Text style={styles.scanButtonText}>
                  Grant Camera Permission
                </Text>
              </View>
            </TouchableOpacity>
          ) : scannedItem ? (
            <View style={styles.resultActions}>
              <TouchableOpacity
                onPress={handleRescan}
                style={styles.rescanButton}
              >
                <Ionicons name="refresh" size={20} color={colors.primary} />
                <Text style={styles.rescanButtonText}>Scan Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/guide" as any)}
                style={styles.findCenterButton}
              >
                <View
                  style={[
                    styles.findCenterGradient,
                    { backgroundColor: colors.secondary },
                  ]}
                >
                  <Text style={styles.findCenterText}>Find Center</Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleScan}
              disabled={isScanning}
              style={styles.scanButton}
            >
              <View
                style={[
                  styles.scanButtonGradient,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Ionicons name="camera" size={24} color={colors.textWhite} />
                <Text style={styles.scanButtonText}>
                  {isScanning ? "Scanning..." : "Start Scan"}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
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
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textWhite,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textWhite,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: -12,
  },
  cameraCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cameraView: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    minHeight: height * 0.7, // At least 70% of screen height
    maxHeight: height - 120, // Leave space for header and bottom elements
  },
  defaultView: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  placeholderImage: {
    width: width - 80,
    height: 240,
    position: "absolute",
  },
  scanArea: {
    width: 192,
    height: 192,
    borderWidth: 4,
    borderColor: colors.primary,
    borderStyle: "dashed",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  scanningView: {
    alignItems: "center",
    justifyContent: "center",
  },
  scanningText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
    marginTop: 16,
  },
  scanningSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  scanningHint: {
    fontSize: 12,
    color: colors.textWhite,
    marginTop: 8,
    opacity: 0.8,
    textAlign: 'center',
  },
  resultView: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  resultIcon: {
    marginBottom: 16,
  },
  itemName: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
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
    fontWeight: "600",
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
    backgroundColor: colors.primary + "20",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  impactText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  rescanButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.primary + "50",
    borderRadius: 12,
    backgroundColor: colors.primary + "10",
    gap: 8,
  },
  rescanButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  findCenterButton: {
    flex: 1,
  },
  findCenterGradient: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  findCenterText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textWhite,
  },
  scanButton: {
    marginBottom: 100,
  },
  scanButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
  },
  scanButtonText: {
    color: colors.textWhite,
    fontSize: 18,
    fontWeight: "600",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  permissionText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 16,
    textAlign: "center",
  },
  arOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
  },
  boundingBox: {
    position: "absolute",
    borderWidth: 3,
    borderStyle: "solid",
    backgroundColor: "transparent",
  },
  confidenceOnBox: {
    position: "absolute",
    top: -25,
    left: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceOnBoxText: {
    color: colors.textWhite,
    fontSize: 10,
    fontWeight: "600",
  },
  modelIndicator: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modelIndicatorText: {
    color: colors.textWhite,
    fontSize: 10,
    fontWeight: "600",
  },
  storageIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    gap: 4,
  },
  storageIndicatorText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: "500",
  },
  // Snapchat-style new styles
  cameraContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    marginHorizontal: 0,
    marginVertical: 0,
    marginBottom: 20,
    overflow: "hidden",
    borderRadius: 0, // Full screen, no rounded corners
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)", // Fallback gradient effect
  },
  scanInterface: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  scanRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  scanRingInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary + "10",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  scanInstructions: {
    alignItems: "center",
  },
  scanTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textWhite,
    marginBottom: 8,
    textAlign: "center",
  },
  scanSubtitle: {
    fontSize: 16,
    color: colors.textWhite,
    opacity: 0.9,
    textAlign: "center",
  },
  permissionView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  permissionIcon: {
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 12,
    textAlign: "center",
  },
  scanningOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanningContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  scanningRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  scanningTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textWhite,
    marginBottom: 8,
  },
  resultOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  resultContainer: {
    alignItems: "center",
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  resultIconContainer: {
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textWhite,
    textAlign: "center",
    marginBottom: 16,
  },
  resultBadge: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 16,
  },
  resultBadgeText: {
    fontSize: 16,
    fontWeight: "600",
  },
  resultCategory: {
    fontSize: 16,
    color: colors.textWhite,
    opacity: 0.8,
    textAlign: "center",
    marginBottom: 20,
  },
  mainContainer: {
    flex: 1,
  },
  // Native camera app styles
  compactHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  overlayToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraTouchable: {
    flex: 1,
  },
  nativeGradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.2)", // Subtle overlay for native camera feel
  },
  overlayHint: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  overlayHintText: {
    color: colors.textWhite,
    fontSize: 12,
    fontWeight: "500",
  },
  bottomControls: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  resultActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    justifyContent: "center",
  },
});

export default Scan;
