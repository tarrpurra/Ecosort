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
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { apiService } from "../../utils/api";
import { styles } from "./scan.styles";

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
  const [showReticle, setShowReticle] = useState(true);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [cameraReady, setCameraReady] = useState(false);

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
    return () => {
      pulseAnimation.stop();
      scanPulseAnim.setValue(1);
    };
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
    return () => {
      lineAnimation.stop();
      scanLineAnim.setValue(0);
    };
  }, [scanLineAnim]);

  useEffect(() => {
    const animation = Animated.timing(resultSheetAnim, {
      toValue: scannedItem ? 1 : 0,
      duration: 360,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    });

    animation.start();
    return () => {
      animation.stop();
      resultSheetAnim.setValue(0);
    };
  }, [scannedItem, resultSheetAnim]);

  const handleScan = async () => {
    if (!permission?.granted) {
      Alert.alert(
        "Permission required",
        "Camera permission is needed to scan items"
      );
      return;
    }

    if (!cameraReady || !cameraRef.current) {
      Alert.alert("Error", "Camera not ready");
      return;
    }

    setIsScanning(true);
    setScannedItem(null);

    try {
      if (!cameraRef.current) {
        throw new Error("Camera ref is null");
      }
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

  const toggleReticle = () => {
    setShowReticle((prev) => !prev);
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
    outputRange: [400, 0],
  });

  return (
    <View style={styles.safeArea}>
      <View style={styles.cameraShell}>
        {permission?.granted ? (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            facing={facing}
            enableTorch={torchEnabled}
            onCameraReady={() => setCameraReady(true)}
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

              <View style={styles.statusContainer}>
                <View style={styles.modelStatus}>
                  <View style={styles.statusIconWrapper}>
                    <Ionicons
                      name="radio-outline"
                      size={16}
                      color={palette.textPrimary}
                    />
                  </View>
                  <View style={styles.statusTextContainer}>
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
              </View>

              {showReticle && (
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
              )}

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
        <View style={styles.resultContent}>
          <View style={styles.resultHeader}>
            <View
              style={[
                styles.resultPill,
                {
                  backgroundColor: scannedItem
                    ? scannedItem.recyclable
                      ? "rgba(34, 197, 94, 0.14)"
                      : "rgba(239, 68, 68, 0.14)"
                    : "rgba(148, 163, 184, 0.1)",
                },
              ]}
            >
              <Ionicons
                name={
                  scannedItem
                    ? scannedItem.recyclable
                      ? "checkmark-circle"
                      : "close-circle"
                    : "scan-circle-outline"
                }
                size={18}
                color={
                  scannedItem
                    ? scannedItem.recyclable
                      ? palette.accent
                      : palette.danger
                    : palette.textSecondary
                }
              />
              <Text
                style={[
                  styles.resultPillText,
                  {
                    color: scannedItem
                      ? scannedItem.recyclable
                        ? palette.accent
                        : palette.danger
                      : palette.textSecondary,
                  },
                ]}
              >
                {scannedItem
                  ? scannedItem.recyclable
                    ? "Recyclable"
                    : "Not recyclable"
                  : "Ready to scan"}
              </Text>
            </View>
            {scannedItem && (
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
            )}
          </View>

          {scannedItem && (
            <>
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
            </>
          )}
        </View>
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
          onPress={toggleReticle}
          style={styles.utilityButton}
        >
          <Ionicons
            name={showReticle ? "eye-outline" : "eye-off-outline"}
            size={20}
            color={palette.textPrimary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};


export default Scan;
