import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const colors = {
  gradientSky: ['#0ea5e9', '#0284c7'],
  primary: '#22c55e',
  primaryDark: '#16a34a',
  secondary: '#10b981',
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  textWhite: '#ffffff',
  border: '#e2e8f0',
  shadow: '#000000',
};

const Guide = () => {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    {
      id: "plastic",
      name: "Plastic",
      icon: "cube",
      items: ["Water bottles", "Food containers", "Plastic bags", "Yogurt cups"],
      instructions: "Clean containers, remove caps and labels, sort by number code",
      acceptedTypes: "#1 PET, #2 HDPE, #3 PVC, #4 LDPE, #5 PP"
    },
    {
      id: "paper",
      name: "Paper",
      icon: "document",
      items: ["Newspapers", "Magazines", "Cardboard", "Office paper"],
      instructions: "Keep dry, remove staples and tape, flatten cardboard boxes",
      acceptedTypes: "Clean paper, cardboard, newspapers, magazines"
    },
    {
      id: "glass",
      name: "Glass",
      icon: "cafe",
      items: ["Bottles", "Jars", "Food containers"],
      instructions: "Rinse thoroughly, remove caps and lids, separate by color",
      acceptedTypes: "Clear, brown, and green glass containers"
    },
    {
      id: "metal",
      name: "Metal",
      icon: "shield",
      items: ["Aluminum cans", "Steel cans", "Metal lids"],
      instructions: "Rinse clean, can crush to save space, remove labels",
      acceptedTypes: "Aluminum cans, steel cans, metal food containers"
    },
    {
      id: "ewaste",
      name: "E-waste",
      icon: "phone-portrait",
      items: ["Phones", "Batteries", "Computers", "Cables"],
      instructions: "Take to special e-waste centers, never throw in regular bins",
      acceptedTypes: "Electronics, batteries, small appliances"
    },
    {
      id: "organic",
      name: "Organic",
      icon: "leaf",
      items: ["Food scraps", "Garden waste", "Coffee grounds"],
      instructions: "Compost at home or use organic waste bins, no plastic bags",
      acceptedTypes: "Food waste, yard trimmings, organic materials"
    }
  ];

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#D2EBDA' }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.secondary }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Recycling Guide</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Learn how to properly sort and dispose of items
          </Text>
        </View>

        <View style={styles.content}>
          {!selectedCategory ? (
            /* Categories Grid */
            <View style={styles.categoriesGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <View style={styles.categoryIconContainer}>
                    <Ionicons name={category.icon as any} size={32} color={colors.primary} />
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryItemCount}>
                    {category.items.length} item types
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            /* Category Details */
            <View style={styles.categoryDetails}>
              <TouchableOpacity
                onPress={() => setSelectedCategory(null)}
                style={styles.backToCategories}
              >
                <Ionicons name="arrow-back" size={20} color={colors.primary} />
                <Text style={styles.backToCategoriesText}>Back to categories</Text>
              </TouchableOpacity>

              {selectedCategoryData && (
                <View style={styles.detailsContainer}>
                  {/* Category Header */}
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryHeaderIcon}>
                      <Ionicons name={selectedCategoryData.icon as any} size={32} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={styles.categoryHeaderTitle}>{selectedCategoryData.name}</Text>
                      <Text style={styles.categoryHeaderSubtitle}>Recycling guide</Text>
                    </View>
                  </View>

                  {/* Common Items */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Common Items</Text>
                    <View style={styles.itemsGrid}>
                      {selectedCategoryData.items.map((item, index) => (
                        <View key={index} style={styles.itemChip}>
                          <Text style={styles.itemChipText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Instructions */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>How to Prepare</Text>
                    <Text style={styles.instructionsText}>
                      {selectedCategoryData.instructions}
                    </Text>
                    <View style={styles.acceptedTypesContainer}>
                      <Text style={styles.acceptedTypesTitle}>Accepted Types</Text>
                      <Text style={styles.acceptedTypesText}>
                        {selectedCategoryData.acceptedTypes}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
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
    opacity: 0.8,
  },
  content: {
    paddingHorizontal: 20,
    marginTop: -12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 100,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: (width - 52) / 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  categoryItemCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  categoryDetails: {
    marginBottom: 100,
  },
  backToCategories: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
    gap: 8,
  },
  backToCategoriesText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  detailsContainer: {
    gap: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    gap: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryHeaderIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  categoryHeaderSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  itemChip: {
    backgroundColor: colors.primary + '15',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  itemChipText: {
    fontSize: 14,
    color: colors.text,
  },
  instructionsText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  acceptedTypesContainer: {
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    padding: 16,
  },
  acceptedTypesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  acceptedTypesText: {
    fontSize: 14,
    color: colors.primary,
  },
});

export default Guide;