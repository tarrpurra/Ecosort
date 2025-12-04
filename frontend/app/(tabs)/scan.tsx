import React, { useEffect, useMemo, useRef, useState } from "react";
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

const { width, height } = Dimensions.get("window");
const RETICLE_SIZE = Math.min(width * 0.88, height * 0.64);
const RETICLE_CORNERS = [
  "topLeft",
  "topRight",
  "bottomLeft",
  "bottomRight",
] as const;

const palette = {
  backdrop: "#070c14",
  surface: "#0f172a",
  card: "rgba(12, 18, 32, 0.94)",
  accent: "#ffffff",
  accentSoft: "#d9e2ec",
  accentAlt: "#94a3b8",
  warning: "#f97316",
  danger: "#ef4444",
  textPrimary: "#f8fafc",
  textSecondary: "rgba(226, 232, 240, 0.8)",
  textMuted: "rgba(148, 163, 184, 0.9)",
  glassBorder: "rgba(255, 255, 255, 0.3)",
  cameraMask: "rgba(0, 0, 0, 0.5)",
};

const OVERLAY_CARD_WIDTH = Math.min(width * 0.8, 340);

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const formatItemName = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

type MaterialProfile = {
  match: RegExp;
  label: string;
  recyclableSummary: string;
  nonRecyclableSummary: string;
  recycleSteps: string;
  disposeSteps: string;
  centerPrompt: string;
};

const MATERIAL_PROFILES: MaterialProfile[] = [
  {
    match: /(plastic|pet|hdpe|ldpe|poly|bottle|clamshell|cup|container)/i,
    label: "Plastic packaging",
    recyclableSummary:
      "Plastic packaging detected. Clean PET and HDPE items are widely accepted curbside.",
    nonRecyclableSummary:
      "Plastic packaging detected. This variant should stay out of the recycling bin to prevent contamination.",
    recycleSteps:
      "Rinse the plastic, remove films or caps, let it dry, and sort with plastics #1-2.",
    disposeSteps:
      "Bag it with household waste or use specialty drop-offs that accept mixed plastics.",
    centerPrompt:
      "Check supermarket film-collection bins or municipal plastic drop-off depots.",
  },
  {
    match: /(glass|bottle|jar)/i,
    label: "Glass container",
    recyclableSummary:
      "Glass container detected. Rinsed bottles and jars can be recycled repeatedly.",
    nonRecyclableSummary:
      "Glass detected. Tempered or treated glass needs a specialist drop-off site.",
    recycleSteps:
      "Remove lids, rinse thoroughly, and sort by color if your center requests it.",
    disposeSteps:
      "Wrap safely and take it to a civic amenity site or follow local disposal rules.",
    centerPrompt:
      "Use local bottle banks or glass igloos for quick drop-off points.",
  },
  {
    match: /(paper|cardboard|carton|box|newspaper|magazine)/i,
    label: "Paper & cardboard",
    recyclableSummary:
      "Paper product detected. Keep it dry and flat for easy curbside recycling.",
    nonRecyclableSummary:
      "Paper detected. Waxed or food-soiled paper should avoid the recycling stream.",
    recycleSteps:
      "Flatten boxes, remove tape, and stack clean paper together before recycling.",
    disposeSteps:
      "Place soiled paper in the trash or compost if accepted locally.",
    centerPrompt:
      "Community recycling centers accept bundled cardboard and paper bales.",
  },
  {
    match: /(metal|aluminum|steel|tin|can)/i,
    label: "Metal packaging",
    recyclableSummary:
      "Metal packaging detected. Clean cans and lids recycle endlessly.",
    nonRecyclableSummary:
      "Metal detected. Greasy or sharp metals need special handling.",
    recycleSteps:
      "Rinse cans, remove labels if possible, and crush lightly to save space.",
    disposeSteps:
      "Wrap sharp edges and take to scrap metal or household waste facilities.",
    centerPrompt:
      "Drop cans at curbside bins or local scrap yards for redemption.",
  },
  {
    match: /(battery|phone|laptop|electronic|cable|charger)/i,
    label: "Electronic waste",
    recyclableSummary:
      "Electronic item detected. Route it through an e-waste program for safe recovery.",
    nonRecyclableSummary:
      "Electronic item detected. Never place electronics in regular bins.",
    recycleSteps:
      "Store data securely, remove batteries, and take it to a certified e-waste center.",
    disposeSteps:
      "Bring it to municipal e-waste days or retailer take-back programs.",
    centerPrompt:
      "Use EcoSort's finder to locate certified e-waste recycling partners.",
  },
  {
    match: /(organic|food|compost|banana|apple|yard|garden|coffee|tea)/i,
    label: "Organic material",
    recyclableSummary:
      "Organic material detected. Composting keeps nutrients in the cycle.",
    nonRecyclableSummary:
      "Organic waste detected. Keep it separate from recyclables to avoid contamination.",
    recycleSteps:
      "Collect with other food scraps and place in a green/compost bin or backyard composter.",
    disposeSteps:
      "Seal and send with municipal organics or general waste if composting isn't available.",
    centerPrompt:
      "Check community gardens or municipal composting programs nearby.",
  },
  {
    match: /(textile|fabric|clothing|cloth|garment)/i,
    label: "Textiles",
    recyclableSummary:
      "Textile detected. Donate or recycle fabric to extend its life.",
    nonRecyclableSummary:
      "Textile detected. Damaged fabrics should be routed through textile recovery programs.",
    recycleSteps:
      "Wash, bag, and deliver to textile donation or recycling drop-offs.",
    disposeSteps:
      "Repurpose as cleaning rags or bring to textile-specific collection bins.",
    centerPrompt:
      "Search for clothing donation bins or textile recovery hubs in your area.",
  },
];

type MaterialInsights = {
  label: string;
  callout: string;
  summary: string;
  steps: string;
  centerPrompt: string;
  carbonFootprint: string;
  impact: string;
};

const getMaterialInsights = (
  itemType: string,
  recyclable: boolean,
  co2Impact: number
): MaterialInsights => {
  const profile = MATERIAL_PROFILES.find((entry) => entry.match.test(itemType));
  const fallbackLabel = formatItemName(itemType || "Item");
  const label = profile?.label ?? fallbackLabel;
  const normalizedImpact = Number.isFinite(co2Impact)
    ? Math.max(co2Impact, 0)
    : 0;

  const summary = recyclable
    ? profile?.recyclableSummary ??
      `${label} can be recycled after a quick clean.`
    : profile?.nonRecyclableSummary ??
      `${label} needs special handling to stay out of recycling bins.`;

  const steps = recyclable
    ? profile?.recycleSteps ??
      `Clean the ${fallbackLabel.toLowerCase()} and place it with your recyclables.`
    : profile?.disposeSteps ??
      `Dispose of the ${fallbackLabel.toLowerCase()} according to local guidance.`;

  const centerPrompt =
    profile?.centerPrompt ??
    "Open the EcoSort guide to see nearby recycling and drop-off locations.";

  const carbonFootprint =
    normalizedImpact > 0
      ? `${normalizedImpact.toFixed(2)}kg CO₂ impact`
      : "Trace CO₂ impact";

  const impact =
    normalizedImpact > 0
      ? recyclable
        ? `Diverts ~${normalizedImpact.toFixed(2)}kg CO₂`
        : `Avoids ${normalizedImpact.toFixed(2)}kg CO₂ when disposed correctly`
      : recyclable
      ? "Positive recycling impact"
      : "Dispose responsibly";

  const callout = recyclable
    ? `${label} ready to recycle`
    : `${label} needs special handling`;

  return {
    label,
    callout,
    summary,
    steps,
    centerPrompt,
    carbonFootprint,
    impact,
  };
};

type ScanResult = {
  item: string;
  recyclable: boolean;
  confidence: number;
  impact: string;
  category: string;
  carbonFootprint: string;
  materialSummary: string;
  recyclingSteps: string;
  centerPrompt: string;
  callout: string;
  bbox?: number[];
  fallback_model?: boolean;
  image_path?: string;
};

type ARBoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  className: string;
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
  const [arOverlays, setArOverlays] = useState<ARBoundingBox[]>([]);
  const [arAnimations, setArAnimations] = useState<{
    [key: string]: Animated.Value;
  }>({});

  const scanPulseAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const resultSheetAnim = useRef(new Animated.Value(0)).current;
  const arGlowAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(arGlowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(arGlowAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    glowAnimation.start();
    return () => {
      glowAnimation.stop();
      arGlowAnim.setValue(0);
    };
  }, [arGlowAnim]);

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

      const co2Impact = Number.isFinite(response.co2_impact)
        ? response.co2_impact
        : 0;
      const insights = getMaterialInsights(
        response.item_type,
        response.recyclable,
        co2Impact
      );

      const result: ScanResult = {
        item: formatItemName(response.item_type),
        recyclable: response.recyclable,
        confidence: Math.round(response.confidence * 100),
        impact: insights.impact,
        category: insights.label,
        carbonFootprint: insights.carbonFootprint,
        materialSummary: insights.summary,
        recyclingSteps: insights.steps,
        centerPrompt: insights.centerPrompt,
        callout: insights.callout,
        bbox: response.bbox,
        fallback_model: response.fallback_model,
        image_path: response.image_path || "",
      };

      // Create AR overlays from bounding boxes
      if (response.bbox && response.bbox.length >= 4) {
        const [x1, y1, x2, y2] = response.bbox;
        const arOverlay: ARBoundingBox = {
          x: x1 * width,
          y: y1 * height,
          width: (x2 - x1) * width,
          height: (y2 - y1) * height,
          confidence: Math.round(response.confidence * 100),
          className: result.item,
        };
        setArOverlays([arOverlay]);
      }

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
    setArOverlays([]);
    resultSheetAnim.setValue(0);
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
    ? scannedItem.callout
    : "Align the item within the frame to analyze recyclability";
  const calloutIconColor = scannedItem
    ? scannedItem.recyclable
      ? palette.accent
      : palette.danger
    : palette.accentSoft;

  const hasBoundingBox = useMemo(
    () => Boolean(scannedItem?.bbox && scannedItem.bbox.length >= 4),
    [scannedItem]
  );

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
          <>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFillObject}
              facing={facing}
              enableTorch={torchEnabled}
              onCameraReady={() => setCameraReady(true)}
            />
            <View style={styles.overlayContainer}>
              {!scannedItem && (
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
              )}

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

              {showOverlays && scannedItem && (
                <View
                  style={styles.boundingBoxContainer}
                  pointerEvents="box-none"
                >
                  <View
                    style={[
                      styles.arInsightPanel,
                      scannedItem.recyclable
                        ? styles.arInsightPanelPositive
                        : styles.arInsightPanelNegative,
                    ]}
                    pointerEvents="auto"
                  >
                    <View style={styles.arInsightHeader}>
                      <View
                        style={[
                          styles.arInsightIcon,
                          scannedItem.recyclable
                            ? styles.arInsightIconPositive
                            : styles.arInsightIconNegative,
                        ]}
                      >
                        <Ionicons
                          name={
                            scannedItem.recyclable
                              ? "leaf-outline"
                              : "alert-circle-outline"
                          }
                          size={18}
                          color={palette.textPrimary}
                        />
                      </View>
                      <View style={styles.arInsightHeaderCopy}>
                        <Text style={styles.arInsightTitle} numberOfLines={2}>
                          {scannedItem.item}
                        </Text>
                        <Text
                          style={styles.arInsightSubtitle}
                          numberOfLines={2}
                        >
                          {scannedItem.materialSummary}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.arInsightStatus,
                          scannedItem.recyclable
                            ? styles.arInsightStatusPositive
                            : styles.arInsightStatusNegative,
                        ]}
                      >
                        <Text
                          style={styles.arInsightStatusText}
                          numberOfLines={2}
                        >
                          {scannedItem.recyclable
                            ? "Recyclable"
                            : "Special disposal"}
                        </Text>
                      </View>
                    </View>

                    {!hasBoundingBox && scannedItem.fallback_model && (
                      <View style={styles.arInsightFallbackBadge}>
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

                    <View style={styles.arInsightMetaRow}>
                      <View style={styles.arInsightMetaChip}>
                        <Ionicons
                          name="leaf-outline"
                          size={14}
                          color={palette.accent}
                        />
                        <Text style={styles.arInsightMetaText}>
                          {scannedItem.carbonFootprint}
                        </Text>
                      </View>
                      <View style={styles.arInsightMetaChip}>
                        <Ionicons
                          name="speedometer-outline"
                          size={14}
                          color={palette.textPrimary}
                        />
                        <Text style={styles.arInsightMetaText}>
                          {scannedItem.confidence}% confidence
                        </Text>
                      </View>
                    </View>

                    <View style={styles.arInsightSection}>
                      <Text style={styles.arInsightSectionTitle}>
                        {scannedItem.recyclable
                          ? "How to recycle"
                          : "Safe disposal"}
                      </Text>
                      <Text style={styles.arInsightSectionText}>
                        {scannedItem.recyclingSteps}
                      </Text>
                    </View>

                    <TouchableOpacity
                      accessibilityRole="button"
                      style={styles.arInsightAction}
                      onPress={handleRescan}
                    >
                      <Ionicons
                        name="scan-outline"
                        size={18}
                        color={palette.textPrimary}
                      />
                      <View style={styles.arInsightActionCopy}>
                        <Text style={styles.arInsightActionTitle}>
                          Scan More
                        </Text>
                        <Text
                          style={styles.arInsightActionSubtitle}
                          numberOfLines={2}
                        >
                          Scan another item for recycling guidance
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={palette.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* AR Bounding Box Visualization */}
              {showOverlays &&
                arOverlays.map((overlay, index) => (
                  <View
                    key={index}
                    style={styles.arBoundingBoxContainer}
                    pointerEvents="none"
                  >
                    <Animated.View
                      style={[
                        styles.arBoundingBox,
                        {
                          left: overlay.x,
                          top: overlay.y,
                          width: overlay.width,
                          height: overlay.height,
                          borderColor: scannedItem?.recyclable
                            ? "rgba(45, 211, 111, 0.8)"
                            : "rgba(239, 68, 68, 0.8)",
                          opacity: arGlowAnim,
                        },
                      ]}
                    />

                    {/* AR Corner Markers */}
                    <View
                      style={[
                        styles.arCornerMarker,
                        styles.arCornerTL,
                        { left: overlay.x - 6, top: overlay.y - 6 },
                      ]}
                    >
                      <View
                        style={[
                          styles.arCornerLine,
                          styles.arCornerHorizontal,
                          {
                            borderColor: scannedItem?.recyclable
                              ? "#2dd47b"
                              : "#ef4444",
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.arCornerLine,
                          styles.arCornerVertical,
                          {
                            borderColor: scannedItem?.recyclable
                              ? "#2dd47b"
                              : "#ef4444",
                          },
                        ]}
                      />
                    </View>

                    <View
                      style={[
                        styles.arCornerMarker,
                        styles.arCornerTR,
                        {
                          right: width - overlay.x - overlay.width - 6,
                          top: overlay.y - 6,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.arCornerLine,
                          styles.arCornerHorizontal,
                          {
                            borderColor: scannedItem?.recyclable
                              ? "#2dd47b"
                              : "#ef4444",
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.arCornerLine,
                          styles.arCornerVertical,
                          {
                            borderColor: scannedItem?.recyclable
                              ? "#2dd47b"
                              : "#ef4444",
                          },
                        ]}
                      />
                    </View>

                    <View
                      style={[
                        styles.arCornerMarker,
                        styles.arCornerBL,
                        {
                          left: overlay.x - 6,
                          bottom: height - overlay.y - overlay.height - 6,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.arCornerLine,
                          styles.arCornerHorizontal,
                          {
                            borderColor: scannedItem?.recyclable
                              ? "#2dd47b"
                              : "#ef4444",
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.arCornerLine,
                          styles.arCornerVertical,
                          {
                            borderColor: scannedItem?.recyclable
                              ? "#2dd47b"
                              : "#ef4444",
                          },
                        ]}
                      />
                    </View>

                    <View
                      style={[
                        styles.arCornerMarker,
                        styles.arCornerBR,
                        {
                          right: width - overlay.x - overlay.width - 6,
                          bottom: height - overlay.y - overlay.height - 6,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.arCornerLine,
                          styles.arCornerHorizontal,
                          {
                            borderColor: scannedItem?.recyclable
                              ? "#2dd47b"
                              : "#ef4444",
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.arCornerLine,
                          styles.arCornerVertical,
                          {
                            borderColor: scannedItem?.recyclable
                              ? "#2dd47b"
                              : "#ef4444",
                          },
                        ]}
                      />
                    </View>

                    {/* AR Floating Label */}
                    <View
                      style={[
                        styles.arFloatingLabel,
                        {
                          left: overlay.x + overlay.width / 2 - 60,
                          top: overlay.y - 40,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.arLabelBubble,
                          {
                            backgroundColor: scannedItem?.recyclable
                              ? "rgba(45, 211, 111, 0.95)"
                              : "rgba(239, 68, 68, 0.95)",
                          },
                        ]}
                      >
                        <Text style={styles.arLabelText}>
                          {overlay.confidence}%
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.arLabelArrow,
                          {
                            borderTopColor: scannedItem?.recyclable
                              ? "rgba(45, 211, 111, 0.95)"
                              : "rgba(239, 68, 68, 0.95)",
                          },
                        ]}
                      />
                    </View>

                    {/* AR Success/Error Indicators */}
                    <View
                      style={[
                        styles.arStatusIndicator,
                        {
                          left: overlay.x + overlay.width + 12,
                          top: overlay.y + overlay.height / 2 - 12,
                        },
                      ]}
                    >
                      <Animated.View
                        style={[
                          styles.arStatusIcon,
                          scannedItem?.recyclable
                            ? styles.arStatusSuccess
                            : styles.arStatusError,
                          { opacity: arGlowAnim },
                        ]}
                      >
                        <Ionicons
                          name={scannedItem?.recyclable ? "checkmark" : "close"}
                          size={16}
                          color="white"
                        />
                      </Animated.View>
                    </View>

                    {/* AR Guidance Arrow for Recyclable Items */}
                    {scannedItem?.recyclable && (
                      <View
                        style={[
                          styles.arGuidanceArrow,
                          {
                            left: overlay.x + overlay.width / 2,
                            top: overlay.y - 60,
                          },
                        ]}
                      >
                        <Animated.View
                          style={[
                            styles.arArrowBubble,
                            { opacity: arGlowAnim },
                          ]}
                        >
                          <Ionicons
                            name="chevron-down"
                            size={18}
                            color={palette.accent}
                          />
                        </Animated.View>
                        <View style={styles.arArrowText}>
                          <Text style={styles.arArrowLabel}>Recyclable</Text>
                          <Text style={styles.arArrowHint}>
                            Ready for green bin
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* AR Guidance for Non-Recyclable Items */}
                    {!scannedItem?.recyclable && (
                      <View
                        style={[
                          styles.arGuidanceArrow,
                          {
                            left: overlay.x + overlay.width / 2,
                            top: overlay.y - 80,
                          },
                        ]}
                      >
                        <Animated.View
                          style={[
                            styles.arArrowBubble,
                            { opacity: arGlowAnim },
                          ]}
                        >
                          <Ionicons
                            name="alert-circle"
                            size={18}
                            color={palette.danger}
                          />
                        </Animated.View>
                        <View style={styles.arArrowText}>
                          <Text style={styles.arArrowLabel}>
                            Special Handling
                          </Text>
                          <Text style={styles.arArrowHint}>
                            Follow disposal guide
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                ))}

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
          </>
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
            transform: [
              { translateX: -Math.min(width - 32, 400) / 2 },
              {
                translateY: Animated.add(-(height - 100) / 2, resultTranslate),
              },
            ],
            opacity: resultSheetAnim,
          },
        ]}
      >
        {scannedItem && (
          <View style={styles.resultContent}>
            <View style={styles.resultHeader}>
              <View
                style={[
                  styles.resultPill,
                  {
                    backgroundColor: "rgba(255, 255, 255, 0.14)",
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
            </View>
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
    backgroundColor: "transparent", // Changed from palette.cameraMask
    flexDirection: "column",
  },
  topControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 18,
    zIndex: 10,
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
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: palette.glassBorder,
  },
  statusContainer: {
    paddingHorizontal: 18,
    paddingTop: 12,
    zIndex: 5,
  },
  statusTextContainer: {
    display: "flex",
    justifyContent: "flex-start",
    position: "relative",
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
    borderColor: "rgba(255, 255, 255, 0.35)",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.32)",
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
    backgroundColor: "rgba(255, 255, 255, 0.2)",
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
    backgroundColor: "rgba(255, 255, 255, 0.2)",
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
    backgroundColor: "rgba(255, 255, 255, 0.85)",
  },
  callout: {
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "rgba(15, 23, 42, 0.78)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    gap: 10,
  },
  calloutSuccess: {
    backgroundColor: "rgba(255, 255, 255, 0.24)",
    borderColor: "rgba(255, 255, 255, 0.38)",
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
    zIndex: 8,
    pointerEvents: "none",
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
  arInsightPanel: {
    position: "absolute",
    top: 120, // Changed from percentage positioning
    left: 16,
    right: 16,
    maxHeight: height * 0.7, // Increased from 0.5
    backgroundColor: "rgba(12, 18, 32, 0.96)", // Increased opacity
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: palette.glassBorder,
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 20,
    zIndex: -1, // Increased z-index significantly
    pointerEvents: "auto", // Ensure interaction is enabled
  },
  arInsightPanelPositive: {
    borderColor: "rgba(45, 211, 111, 0.5)",
    shadowColor: "rgba(45, 211, 111, 0.3)",
  },
  arInsightPanelNegative: {
    borderColor: "rgba(239, 68, 68, 0.5)",
    shadowColor: "rgba(239, 68, 68, 0.3)",
  },
  arInsightHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  arInsightIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  arInsightIconPositive: {
    backgroundColor: "rgba(45, 211, 111, 0.25)",
    borderColor: "rgba(45, 211, 111, 0.6)",
  },
  arInsightIconNegative: {
    backgroundColor: "rgba(239, 68, 68, 0.25)",
    borderColor: "rgba(239, 68, 68, 0.6)",
  },
  arInsightHeaderCopy: {
    flex: 1,
    gap: 2,
    marginRight: 8,
  },
  arInsightTitle: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
  arInsightSubtitle: {
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  arInsightStatus: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    maxWidth: 105,
    minWidth: 85,
  },
  arInsightStatusPositive: {
    backgroundColor: "rgba(45, 211, 111, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(45, 211, 111, 0.4)",
  },
  arInsightStatusNegative: {
    backgroundColor: "rgba(239, 68, 68, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
  },
  arInsightStatusText: {
    color: palette.textPrimary,
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    lineHeight: 14,
  },
  arInsightMetaRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  arInsightMetaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  arInsightMetaText: {
    color: palette.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  arInsightSection: {
    gap: 8,
    paddingTop: 4,
  },
  arInsightSectionTitle: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  arInsightSectionText: {
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  arInsightAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  arInsightActionCopy: {
    flex: 1,
    gap: 2,
  },
  arInsightActionTitle: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  arInsightActionSubtitle: {
    color: palette.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  confidenceBadge: {
    position: "absolute",
    top: -32,
    left: 0,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
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
    borderWidth: 1.5,
  },
  recycleFlagPositive: {
    backgroundColor: "rgba(45, 211, 111, 0.3)",
    borderColor: "rgba(45, 211, 111, 0.6)",
  },
  recycleFlagNegative: {
    backgroundColor: "rgba(239, 68, 68, 0.3)",
    borderColor: "rgba(239, 68, 68, 0.6)",
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
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.glassBorder,
  },
  arInsightFallbackBadge: {
    marginTop: 12,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
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
    zIndex: 5,
  },
  modelStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
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
    backgroundColor: "rgba(255, 255, 255, 0.22)",
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
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
  impactTagText: {
    color: palette.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(1, 15, 9, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
  },
  loadingCard: {
    width: RETICLE_SIZE,
    backgroundColor: "rgba(15, 23, 42, 0.95)",
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
    backgroundColor: "rgba(255, 255, 255, 0.18)",
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
    top: 100, // Fixed positioning instead of percentage
    left: 16,
    right: 16,
    maxHeight: height - 200,
    backgroundColor: "rgba(15, 23, 42, 0.97)",
    borderRadius: 28,
    padding: 24,
    borderWidth: 1.5,
    borderColor: palette.glassBorder,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 20,
    zIndex: 100,
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
    backgroundColor: "rgba(255, 255, 255, 0.14)",
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
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
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
  metricCaption: {
    color: palette.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  instructionsCard: {
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    gap: 6,
    alignSelf: "center",
    width: "90%",
    maxWidth: 350,
  },
  instructionsTitle: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  instructionsText: {
    color: palette.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  centerCard: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  centerIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderWidth: 1,
    borderColor: palette.glassBorder,
  },
  centerCopy: {
    flex: 1,
    gap: 4,
  },
  centerTitle: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  centerSubtitle: {
    color: palette.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  storageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignSelf: "center",
    maxWidth: 300,
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
    zIndex: 10,
  },
  captureBarHidden: {
    opacity: 0,
    transform: [{ scale: 0.95 }],
  },
  utilityButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
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
    backgroundColor: "rgba(255, 255, 255, 0.24)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.45)",
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

  // AR Bounding Box Styles
  arBoundingBoxContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  arBoundingBox: {
    position: "absolute",
    borderWidth: 3,
    borderRadius: 8,
    backgroundColor: "transparent",
  },

  // AR Corner Markers
  arCornerMarker: {
    position: "absolute",
    width: 24,
    height: 24,
  },
  arCornerTL: {},
  arCornerTR: {},
  arCornerBL: {},
  arCornerBR: {},
  arCornerLine: {
    position: "absolute",
    borderWidth: 2,
  },
  arCornerHorizontal: {
    width: 16,
    height: 0,
    top: 12,
  },
  arCornerVertical: {
    width: 0,
    height: 16,
    left: 12,
  },

  // AR Floating Label
  arFloatingLabel: {
    position: "absolute",
    alignItems: "center",
    zIndex: 6,
  },
  arLabelBubble: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    minWidth: 48,
    alignItems: "center",
  },
  arLabelText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  arLabelArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -1,
  },

  // AR Status Indicators
  arStatusIndicator: {
    position: "absolute",
    zIndex: 7,
  },
  arStatusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  arStatusSuccess: {
    backgroundColor: "rgba(45, 211, 111, 0.9)",
    borderColor: "rgba(45, 211, 111, 1)",
  },
  arStatusError: {
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    borderColor: "rgba(239, 68, 68, 1)",
  },

  // AR Guidance Arrows
  arGuidanceArrow: {
    position: "absolute",
    flexDirection: "column",
    alignItems: "center",
    zIndex: 10,
  },
  arArrowBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  arArrowText: {
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  arArrowLabel: {
    color: palette.textPrimary,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  arArrowHint: {
    color: palette.textSecondary,
    fontSize: 9,
    textAlign: "center",
    marginTop: 2,
  },
});

export default Scan;
