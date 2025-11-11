import React, { useEffect, useRef, useState } from "react";
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
import { apiService } from "../../utils/api";

const { width, height } = Dimensions.get("window");
const RETICLE_SIZE = Math.min(width * 0.88, height * 0.64);
const RETICLE_CORNERS = [
  "topLeft",
  "topRight",
  "bottomLeft",
  "bottomRight",
] as const;

const palette = {
  backdrop: "#01140b",
  surface: "#042014",
  card: "rgba(4, 32, 20, 0.94)",
  accent: "#2dd36f",
  accentSoft: "#3ee48a",
  accentAlt: "#34d399",
  warning: "#f97316",
  danger: "#ef4444",
  textPrimary: "#f8fafc",
  textSecondary: "rgba(226, 232, 240, 0.8)",
  textMuted: "rgba(148, 163, 184, 0.9)",
  glassBorder: "rgba(46, 204, 113, 0.3)",
  cameraMask: "rgba(1, 15, 9, 0.5)",
};

type ScanResult = {
  item: string;
  recyclable: boolean;
  confidence: number;
  instructions: string;
  impact: string;
  category: string;
  bbox?: number[];
  fallback_model?: boolean;
  image_path?: string;
};

const Scan = () => {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItem, setScannedItem] = useState<ScanResult | null>(null);
  const [showOverlays, setShowOverlays] = useState(true);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [facing, setFacing] = useState<"back" | "front">("back");

  const scanPulseAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const resultSheetAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanPulseAnim, {
          toValue: 1.08,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanPulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, [scanPulseAnim]);

  useEffect(() => {
    const lineAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    lineAnimation.start();
    return () => lineAnimation.stop();
  }, [scanLineAnim]);

  useEffect(() => {
    Animated.timing(resultSheetAnim, {
      toValue: scannedItem ? 1 : 0,
      duration: 360,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [scannedItem, resultSheetAnim]);

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
    setScannedItem(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.5,
      });

      const response = await apiService.classifyItem(photo.base64!);

      const result: ScanResult = {
        item: response.item_type,
        recyclable: response.recyclable,
        confidence: Math.round(response.confidence * 100),
        instructions: response.recyclable
          ? "Clean the item and place it into your recycling bin."
          : "Dispose of this item in general waste to avoid contamination.",
        impact: `Saves ${response.co2_impact}kg CO₂`,
        category: response.item_type,
        bbox: response.bbox,
        fallback_model: response.fallback_model,
        image_path: response.image_path || "",
      };

      setScannedItem(result);
      setShowOverlays(true);
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
    setShowOverlays(true);
  };

  const toggleOverlays = () => {
    setShowOverlays((prev) => !prev);
  };

  const toggleTorch = () => {
    setTorchEnabled((prev) => !prev);
  };

  const toggleFacing = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  const calloutIcon = scannedItem
    ? scannedItem.recyclable
      ? "checkmark-circle"
      : "alert-circle"
    : "sparkles-outline";
  const calloutMessage = scannedItem
    ? scannedItem.recyclable
      ? "This item can be recycled. Follow the guidance below."
      : "This item is not recyclable. See safe disposal tips below."
    : "Align the item within the frame to analyze recyclability";
  const calloutIconColor = scannedItem
    ? scannedItem.recyclable
      ? palette.accent
      : palette.danger
    : palette.accentSoft;

  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, RETICLE_SIZE - 20],
  });

  const resultTranslate = resultSheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [280, 0],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.cameraShell}>
        {permission?.granted ? (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            facing={facing}
            enableTorch={torchEnabled}
          >
            <View style={styles.overlayContainer}>
              <View style={styles.topControls}>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => router.back()}
                  style={styles.roundButton}
                >
                  <Ionicons
                    name="chevron-back"
                    size={20}
                    color={palette.textPrimary}
                  />
                </TouchableOpacity>

                <View style={styles.headerMeta}>
                  <Text style={styles.headerTitle}>AI Scanner</Text>
                  <Text style={styles.headerSubtitle}>
                    YOLO11 real-time detection
                  </Text>
                </View>

                <View style={styles.topActions}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={toggleTorch}
                    style={styles.roundButton}
                  >
                    <Ionicons
                      name={torchEnabled ? "flash" : "flash-outline"}
                      size={18}
                      color={palette.textPrimary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={toggleFacing}
                    style={styles.roundButton}
                  >
                    <Ionicons
                      name="camera-reverse-outline"
                      size={20}
                      color={palette.textPrimary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={toggleOverlays}
                    style={styles.roundButton}
                  >
                    <Ionicons
                      name={showOverlays ? "layers" : "layers-outline"}
                      size={20}
                      color={palette.textPrimary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.reticleWrapper}>
                <Animated.View
                  style={[
                    styles.reticle,
                    { transform: [{ scale: scanPulseAnim }] },
                  ]}
                >
                  {RETICLE_CORNERS.map((corner) => (
                    <View
                      key={corner}
                      style={[styles.corner, styles[corner]]}
                    />
                  ))}
                  <View style={styles.gridLineHorizontal} />
                  <View
                    style={[
                      styles.gridLineHorizontal,
                      styles.gridLineHorizontalSecondary,
                    ]}
                  />
                  <View style={styles.gridLineVertical} />
                  <View
                    style={[
                      styles.gridLineVertical,
                      styles.gridLineVerticalSecondary,
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.scanLine,
                      { transform: [{ translateY: scanLineTranslate }] },
                    ]}
                  />
                </Animated.View>
                <View
                  style={[
                    styles.callout,
                    scannedItem &&
                      (scannedItem.recyclable
                        ? styles.calloutSuccess
                        : styles.calloutDanger),
                  ]}
                >
                  <Ionicons
                    name={calloutIcon as any}
                    size={18}
                    color={calloutIconColor}
                  />
                  <Text
                    style={[
                      styles.calloutText,
                      scannedItem && styles.calloutResultText,
                    ]}
                  >
                    {calloutMessage}
                  </Text>
                </View>
              </View>

              {showOverlays &&
                scannedItem?.bbox &&
                scannedItem.bbox.length >= 4 && (
                  <View style={styles.boundingBoxContainer}>
                    <View
                      style={[
                        styles.boundingBox,
                        {
                          left: `${scannedItem.bbox[0] * 100}%`,
                          top: `${scannedItem.bbox[1] * 100}%`,
                          width: `${
                            (scannedItem.bbox[2] - scannedItem.bbox[0]) * 100
                          }%`,
                          height: `${
                            (scannedItem.bbox[3] - scannedItem.bbox[1]) * 100
                          }%`,
                          borderColor: scannedItem.recyclable
                            ? palette.accent
                            : palette.danger,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.boundingCornerBase,
                          styles.boundingCornerTL,
                        ]}
                      />
                      <View
                        style={[
                          styles.boundingCornerBase,
                          styles.boundingCornerTR,
                        ]}
                      />
                      <View
                        style={[
                          styles.boundingCornerBase,
                          styles.boundingCornerBL,
                        ]}
                      />
                      <View
                        style={[
                          styles.boundingCornerBase,
                          styles.boundingCornerBR,
                        ]}
                      />
                      <View style={styles.confidenceBadge}>
                        <Text style={styles.confidenceBadgeText}>
                          {scannedItem.confidence}% •{" "}
                          {scannedItem.recyclable
                            ? "Recyclable"
                            : "Not recyclable"}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.recycleFlag,
                          scannedItem.recyclable
                            ? styles.recycleFlagPositive
                            : styles.recycleFlagNegative,
                        ]}
                      >
                        <Ionicons
                          name={
                            scannedItem.recyclable
                              ? "checkmark-circle"
                              : "close-circle"
                          }
                          size={14}
                          color={palette.textPrimary}
                        />
                        <Text style={styles.recycleFlagText}>
                          {scannedItem.recyclable
                            ? "Recycle this item"
                            : "Do not recycle"}
                        </Text>
                      </View>
                      {scannedItem.fallback_model && (
                        <View style={styles.modelBadge}>
                          <Ionicons
                            name="hardware-chip-outline"
                            size={12}
                            color={palette.textPrimary}
                          />
                          <Text style={styles.modelBadgeText}>
                            Fallback model
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

              <View style={styles.bottomOverlay}>
                <View style={styles.modelStatus}>
                  <View style={styles.statusIconWrapper}>
                    <Ionicons
                      name="radio-outline"
                      size={16}
                      color={palette.textPrimary}
                    />
                  </View>
                  <View>
                    <Text style={styles.statusTitle}>Live analysis</Text>
                    <Text style={styles.statusSubtitle}>
                      {isScanning
                        ? "Running YOLO11 inference"
                        : scannedItem
                        ? `Confidence ${scannedItem.confidence}%`
                        : "Tap capture to start scanning"}
                    </Text>
                  </View>
                </View>
                {scannedItem?.impact && (
                  <View style={styles.impactTag}>
                    <Ionicons
                      name="leaf-outline"
                      size={14}
                      color={palette.accent}
                    />
                    <Text style={styles.impactTagText}>
                      {scannedItem.impact}
                    </Text>
                  </View>
                )}
              </View>

              {isScanning && (
                <View style={styles.loadingOverlay}>
                  <View style={styles.loadingCard}>
                    <ActivityIndicator size="large" color={palette.accent} />
                    <Text style={styles.loadingTitle}>Analyzing...</Text>
                    <Text style={styles.loadingText}>
                      Detecting material type and recyclability
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </CameraView>
        ) : (
          <View style={styles.permissionCard}>
            <View style={styles.permissionIconWrapper}>
              <Ionicons name="camera" size={42} color={palette.accent} />
            </View>
            <Text style={styles.permissionTitle}>Camera access needed</Text>
            <Text style={styles.permissionText}>
              We use your camera to detect materials with our AI scanner.
            </Text>
            <TouchableOpacity
              onPress={requestPermission}
              style={styles.permissionButton}
            >
              <Ionicons
                name="lock-open-outline"
                size={18}
                color={palette.textPrimary}
              />
              <Text style={styles.permissionButtonText}>Grant permission</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Animated.View
        pointerEvents={scannedItem ? "auto" : "none"}
        style={[
          styles.resultSheet,
          {
            transform: [{ translateY: resultTranslate }],
            opacity: resultSheetAnim,
          },
        ]}
      >
        {scannedItem ? (
          <View style={styles.resultContent}>
            <View style={styles.resultHeader}>
              <View
                style={[
                  styles.resultPill,
                  {
                    backgroundColor: scannedItem.recyclable
                      ? "rgba(34, 197, 94, 0.14)"
                      : "rgba(239, 68, 68, 0.14)",
                  },
                ]}
              >
                <Ionicons
                  name={
                    scannedItem.recyclable ? "checkmark-circle" : "close-circle"
                  }
                  size={18}
                  color={
                    scannedItem.recyclable ? palette.accent : palette.danger
                  }
                />
                <Text
                  style={[
                    styles.resultPillText,
                    {
                      color: scannedItem.recyclable
                        ? palette.accent
                        : palette.danger,
                    },
                  ]}
                >
                  {scannedItem.recyclable ? "Recyclable" : "Not recyclable"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleRescan}
                style={styles.secondaryButton}
              >
                <Ionicons
                  name="refresh"
                  size={16}
                  color={palette.textSecondary}
                />
                <Text style={styles.secondaryButtonText}>Scan again</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.resultTitle}>{scannedItem.item}</Text>
            <Text style={styles.resultSubtitle}>{scannedItem.category}</Text>

            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Confidence</Text>
                <Text style={styles.metricValue}>
                  {scannedItem.confidence}%
                </Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Model</Text>
                <Text style={styles.metricValue}>
                  {scannedItem.fallback_model ? "Fallback" : "YOLO11"}
                </Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Impact</Text>
                <Text style={styles.metricValue}>{scannedItem.impact}</Text>
              </View>
            </View>

            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsTitle}>Next steps</Text>
              <Text style={styles.instructionsText}>
                {scannedItem.instructions}
              </Text>
            </View>

            {scannedItem.image_path && (
              <View style={styles.storageRow}>
                <Ionicons
                  name="cloud-upload-outline"
                  size={16}
                  color={palette.accent}
                />
                <Text style={styles.storageText}>
                  Image saved for training improvements
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.resultPlaceholder}>
            <Ionicons
              name="scan-circle-outline"
              size={32}
              color={palette.textMuted}
            />
            <Text style={styles.placeholderTitle}>Ready when you are</Text>
            <Text style={styles.placeholderText}>
              Position your item in the frame and tap the capture button to
              detect its material instantly.
            </Text>
          </View>
        )}
      </Animated.View>

      <View
        pointerEvents={scannedItem ? "none" : "auto"}
        style={[styles.captureBar, scannedItem && styles.captureBarHidden]}
      >
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => router.push("/(tabs)/guide" as any)}
          style={styles.utilityButton}
        >
          <Ionicons name="book-outline" size={20} color={palette.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          onPress={handleScan}
          disabled={isScanning}
          style={[
            styles.captureButton,
            isScanning && styles.captureButtonDisabled,
          ]}
        >
          <View style={styles.captureInner}>
            <Ionicons name="scan" size={28} color={palette.textPrimary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          onPress={toggleOverlays}
          style={styles.utilityButton}
        >
          <Ionicons
            name={showOverlays ? "eye-outline" : "eye-off-outline"}
            size={20}
            color={palette.textPrimary}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const baseShadow = {
  shadowColor: palette.accent,
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.35,
  shadowRadius: 32,
  elevation: 22,
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.backdrop,
  },
  cameraShell: {
    flex: 1,
    backgroundColor: palette.surface,
  },
  overlayContainer: {
    flex: 1,
    backgroundColor: palette.cameraMask,
    justifyContent: "space-between",
  },
  topControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  headerMeta: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: palette.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: palette.textSecondary,
    marginTop: 2,
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(4, 32, 20, 0.72)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: palette.glassBorder,
  },
  reticleWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  reticle: {
    width: RETICLE_SIZE,
    height: RETICLE_SIZE,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(45, 211, 111, 0.35)",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(4, 32, 20, 0.28)",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: palette.accent,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderTopLeftRadius: 20,
  },
  topRight: {
    top: 0,
    right: 0,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderTopRightRadius: 20,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderBottomLeftRadius: 20,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderBottomRightRadius: 20,
  },
  gridLineHorizontal: {
    position: "absolute",
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: "rgba(45, 211, 111, 0.2)",
    top: RETICLE_SIZE / 3,
  },
  gridLineHorizontalSecondary: {
    top: undefined,
    bottom: RETICLE_SIZE / 3,
  },
  gridLineVertical: {
    position: "absolute",
    top: 24,
    bottom: 24,
    width: 1,
    backgroundColor: "rgba(45, 211, 111, 0.2)",
    left: RETICLE_SIZE / 3,
  },
  gridLineVerticalSecondary: {
    left: undefined,
    right: RETICLE_SIZE / 3,
  },
  scanLine: {
    position: "absolute",
    left: 18,
    right: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(45, 211, 111, 0.85)",
  },
  callout: {
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "rgba(4, 32, 20, 0.78)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    gap: 10,
  },
  calloutSuccess: {
    backgroundColor: "rgba(45, 211, 111, 0.24)",
    borderColor: "rgba(45, 211, 111, 0.38)",
  },
  calloutDanger: {
    backgroundColor: "rgba(239, 68, 68, 0.22)",
    borderColor: "rgba(239, 68, 68, 0.42)",
  },
  calloutText: {
    color: palette.textPrimary,
    fontSize: 13,
    flexShrink: 1,
  },
  calloutResultText: {
    fontWeight: "600",
  },
  boundingBoxContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  boundingBox: {
    position: "absolute",
    borderWidth: 2,
    borderRadius: 18,
  },
  boundingCornerBase: {
    position: "absolute",
    width: 22,
    height: 22,
    borderColor: palette.textPrimary,
    borderStyle: "solid",
    opacity: 0.75,
  },
  boundingCornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 10,
  },
  boundingCornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 10,
  },
  boundingCornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 10,
  },
  boundingCornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 10,
  },
  confidenceBadge: {
    position: "absolute",
    top: -32,
    left: 0,
    backgroundColor: palette.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.glassBorder,
  },
  confidenceBadgeText: {
    color: palette.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  recycleFlag: {
    position: "absolute",
    left: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  recycleFlagPositive: {
    backgroundColor: "rgba(45, 211, 111, 0.28)",
    borderColor: "rgba(45, 211, 111, 0.5)",
  },
  recycleFlagNegative: {
    backgroundColor: "rgba(239, 68, 68, 0.26)",
    borderColor: "rgba(239, 68, 68, 0.48)",
  },
  recycleFlagText: {
    color: palette.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  modelBadge: {
    position: "absolute",
    bottom: -28,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(4, 32, 20, 0.75)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.glassBorder,
  },
  modelBadgeText: {
    color: palette.textPrimary,
    fontSize: 11,
    fontWeight: "600",
  },
  bottomOverlay: {
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  modelStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(4, 32, 20, 0.78)",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: palette.glassBorder,
  },
  statusIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(45, 211, 111, 0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  statusTitle: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  statusSubtitle: {
    color: palette.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  impactTag: {
    marginTop: 12,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(45, 211, 111, 0.18)",
  },
  impactTagText: {
    color: palette.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(1, 15, 9, 0.78)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingCard: {
    width: RETICLE_SIZE,
    backgroundColor: palette.card,
    borderRadius: 22,
    paddingVertical: 28,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: palette.glassBorder,
  },
  loadingTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  loadingText: {
    color: palette.textSecondary,
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 28,
  },
  permissionCard: {
    flex: 1,
    margin: 24,
    borderRadius: 24,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 24,
  },
  permissionIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(45, 211, 111, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  permissionTitle: {
    color: palette.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  permissionText: {
    color: palette.textSecondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  permissionButton: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: palette.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  permissionButtonText: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  resultSheet: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 28,
    backgroundColor: palette.card,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    ...baseShadow,
  },
  resultContent: {
    gap: 18,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  resultPillText: {
    fontSize: 13,
    fontWeight: "600",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(148, 163, 184, 0.16)",
  },
  secondaryButtonText: {
    color: palette.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  resultTitle: {
    color: palette.textPrimary,
    fontSize: 24,
    fontWeight: "700",
  },
  resultSubtitle: {
    color: palette.textSecondary,
    fontSize: 14,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.glassBorder,
  },
  metricLabel: {
    color: palette.textSecondary,
    fontSize: 12,
    marginBottom: 6,
  },
  metricValue: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  instructionsCard: {
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: palette.glassBorder,
  },
  instructionsTitle: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  instructionsText: {
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  storageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(45, 211, 111, 0.18)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  storageText: {
    color: palette.accent,
    fontSize: 12,
    fontWeight: "600",
  },
  resultPlaceholder: {
    alignItems: "center",
    gap: 10,
  },
  placeholderTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  placeholderText: {
    color: palette.textSecondary,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  captureBar: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  captureBarHidden: {
    opacity: 0,
    transform: [{ scale: 0.95 }],
  },
  utilityButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(4, 32, 20, 0.86)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: palette.glassBorder,
  },
  captureButton: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(45, 211, 111, 0.24)",
    borderWidth: 2,
    borderColor: "rgba(45, 211, 111, 0.45)",
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: palette.accent,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default Scan;
