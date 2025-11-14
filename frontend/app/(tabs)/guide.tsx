import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';

const Guide = () => {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'items' | 'instructions' | 'tips'>('items');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      id: "plastic",
      name: "Plastic",
      icon: "cube",
      items: ["Water bottles", "Food containers", "Plastic bags", "Yogurt cups", "Shampoo bottles", "Milk jugs"],
      instructions: "Clean containers thoroughly, remove caps and labels, sort by resin code (#1-7). Crush bottles to save space.",
      acceptedTypes: "#1 PET (soda bottles), #2 HDPE (milk jugs), #3 PVC, #4 LDPE, #5 PP, #7 Other",
      environmentalTip: "Recycling one plastic bottle saves enough energy to power a 60W light bulb for 3 hours!",
      commonMistakes: "Don't recycle plastic bags at curbside - take them to grocery stores"
    },
    {
      id: "paper",
      name: "Paper",
      icon: "document",
      items: ["Newspapers", "Magazines", "Cardboard", "Office paper", "Cereal boxes", "Phone books"],
      instructions: "Keep dry and clean, remove staples/tape/glue, flatten cardboard boxes, no wax-coated paper",
      acceptedTypes: "Clean paper, cardboard, newspapers, magazines, office paper",
      environmentalTip: "One ton of recycled paper saves 17 trees and 7,000 gallons of water!",
      commonMistakes: "Remove plastic windows from envelopes, don't recycle soiled paper"
    },
    {
      id: "glass",
      name: "Glass",
      icon: "cafe",
      items: ["Bottles", "Jars", "Food containers", "Wine bottles", "Beer bottles"],
      instructions: "Rinse thoroughly, remove caps and lids, separate by color (clear, brown, green)",
      acceptedTypes: "Clear, brown, and green glass containers - no ceramics, Pyrex, or window glass",
      environmentalTip: "Glass can be recycled infinitely without loss of quality or purity!",
      commonMistakes: "Don't include ceramics or light bulbs - they contaminate the batch"
    },
    {
      id: "metal",
      name: "Metal",
      icon: "shield",
      items: ["Aluminum cans", "Steel cans", "Metal lids", "Aluminum foil", "Tin cans"],
      instructions: "Rinse clean, crush to save space, remove labels, bundle foil into balls",
      acceptedTypes: "Aluminum cans, steel/tin cans, clean aluminum foil, metal food containers",
      environmentalTip: "Recycling aluminum saves 95% of the energy needed to make new aluminum!",
      commonMistakes: "Don't recycle foil with food residue - rinse it first"
    },
    {
      id: "ewaste",
      name: "E-waste",
      icon: "phone-portrait",
      items: ["Phones", "Batteries", "Computers", "Cables", "Chargers", "Printers"],
      instructions: "Take to special e-waste centers or events - never throw in regular trash",
      acceptedTypes: "Electronics, batteries, small appliances, cables - all sizes welcome",
      environmentalTip: "E-waste contains toxic chemicals that can contaminate soil and water for centuries!",
      commonMistakes: "Don't throw electronics in trash - they contain valuable and hazardous materials"
    },
    {
      id: "organic",
      name: "Organic",
      icon: "leaf",
      items: ["Food scraps", "Garden waste", "Coffee grounds", "Egg shells", "Fruit/vegetable peels"],
      instructions: "Compost at home or use organic waste bins, avoid plastic bags, keep dry if possible",
      acceptedTypes: "Food waste, yard trimmings, organic materials - no meat/dairy in some programs",
      environmentalTip: "Food waste in landfills produces methane, a potent greenhouse gas!",
      commonMistakes: "Don't include meat, dairy, or oils in home compost - they attract pests"
    }
  ];

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);

  return (
    <SafeAreaView className="flex-1 bg-green-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-emerald-500 px-5 py-6 rounded-b-3xl">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-4"
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-white">Recycling Guide</Text>
          </View>
          <Text className="text-white opacity-90">
            Learn how to properly sort and dispose of items
          </Text>
        </View>

        <View className="px-5 -mt-3">
          {/* Quick Tips */}
          <View className="bg-white rounded-2xl p-4 shadow-md mb-6">
            <Text className="text-lg font-semibold text-slate-900 mb-3">💡 Quick Tips</Text>
            <View className="flex-row items-center">
              <Ionicons name="bulb" size={20} color="#fbbf24" />
              <Text className="text-sm text-slate-600 ml-2 flex-1">
                Always rinse containers before recycling to prevent contamination
              </Text>
            </View>
          </View>

          {!selectedCategory ? (
            <View>
              {/* Search Bar */}
              <View className="bg-white rounded-2xl p-4 shadow-md mb-6">
                <View className="flex-row items-center bg-slate-100 rounded-xl px-4 py-3">
                  <Ionicons name="search" size={20} color="#64748b" />
                  <TextInput
                    className="flex-1 ml-3 text-slate-900"
                    placeholder="Search recycling categories..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#64748b"
                  />
                  {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close" size={20} color="#64748b" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              {/* Categories Grid */}
              <View className="flex-row flex-wrap justify-between mb-24">
                {categories
                  .filter(category =>
                    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    category.items.some(item => item.toLowerCase().includes(searchQuery.toLowerCase()))
                  )
                  .map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    className="bg-white rounded-2xl p-6 items-center w-1/2 mb-4 shadow-lg"
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <View className="w-16 h-16 bg-green-100 rounded-xl items-center justify-center mb-4">
                      <Ionicons name={category.icon as any} size={32} color="#22c55e" />
                    </View>
                    <Text className="text-lg font-semibold text-slate-900 mb-2">{category.name}</Text>
                    <Text className="text-sm text-slate-500">
                      {category.items.length} item types
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            /* Category Details */
            <View className="mb-24">
              <TouchableOpacity
                onPress={() => setSelectedCategory(null)}
                className="flex-row items-center mb-5 py-2"
              >
                <Ionicons name="arrow-back" size={20} color="#22c55e" />
                <Text className="text-base text-green-600 font-medium ml-2">Back to categories</Text>
              </TouchableOpacity>

              {selectedCategoryData && (
                <View>
                  {/* Category Header */}
                  <View className="flex-row items-center bg-white rounded-2xl p-6 shadow-md mb-6">
                    <View className="w-16 h-16 bg-green-100 rounded-xl items-center justify-center mr-4">
                      <Ionicons name={selectedCategoryData.icon as any} size={32} color="#22c55e" />
                    </View>
                    <View>
                      <Text className="text-2xl font-bold text-slate-900">{selectedCategoryData.name}</Text>
                      <Text className="text-base text-slate-500">Recycling guide</Text>
                    </View>
                  </View>

                  {/* Tabs */}
                  <View className="flex-row bg-slate-100 rounded-2xl p-2 shadow-md mb-6">
                    <TouchableOpacity
                      onPress={() => setActiveTab('items')}
                      className={`flex-1 py-3 px-4 rounded-xl ${activeTab === 'items' ? 'bg-green-500 shadow-lg' : 'bg-white'}`}
                    >
                      <Text className={`text-center font-semibold ${activeTab === 'items' ? 'text-white' : 'text-slate-700'}`}>
                        📦 Items
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setActiveTab('instructions')}
                      className={`flex-1 py-3 px-4 rounded-xl ${activeTab === 'instructions' ? 'bg-green-500 shadow-lg' : 'bg-white'}`}
                    >
                      <Text className={`text-center font-semibold ${activeTab === 'instructions' ? 'text-white' : 'text-slate-700'}`}>
                        📋 Instructions
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setActiveTab('tips')}
                      className={`flex-1 py-3 px-4 rounded-xl ${activeTab === 'tips' ? 'bg-green-500 shadow-lg' : 'bg-white'}`}
                    >
                      <Text className={`text-center font-semibold ${activeTab === 'tips' ? 'text-white' : 'text-slate-700'}`}>
                        💡 Tips
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Tab Content */}
                  <View className="bg-white rounded-2xl p-6 shadow-md mb-24">
                    {activeTab === 'items' && (
                      <View>
                        <Text className="text-lg font-semibold text-slate-900 mb-4">Common Items</Text>
                        <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                          {selectedCategoryData.items.map((item, index) => (
                            <View key={index} className="bg-green-100 rounded-lg px-3 py-2">
                              <Text className="text-sm text-slate-900">{item}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {activeTab === 'instructions' && (
                      <View>
                        <Text className="text-lg font-semibold text-slate-900 mb-4">How to Prepare</Text>
                        <Text className="text-sm text-slate-500 leading-5 mb-4">
                          {selectedCategoryData.instructions}
                        </Text>
                        <View className="bg-green-100 rounded-xl p-4">
                          <Text className="text-base font-semibold text-green-600 mb-2">Accepted Types</Text>
                          <Text className="text-sm text-green-600">
                            {selectedCategoryData.acceptedTypes}
                          </Text>
                        </View>
                      </View>
                    )}

                    {activeTab === 'tips' && (
                      <View style={{ gap: 16 }}>
                        <View className="bg-blue-50 rounded-xl p-4">
                          <Text className="text-base font-semibold text-blue-600 mb-2">🌱 Environmental Impact</Text>
                          <Text className="text-sm text-blue-600">
                            {selectedCategoryData.environmentalTip}
                          </Text>
                        </View>
                        <View className="bg-amber-50 rounded-xl p-4">
                          <Text className="text-base font-semibold text-amber-600 mb-2">⚠️ Common Mistakes</Text>
                          <Text className="text-sm text-amber-600">
                            {selectedCategoryData.commonMistakes}
                          </Text>
                        </View>
                      </View>
                    )}
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

export default Guide;