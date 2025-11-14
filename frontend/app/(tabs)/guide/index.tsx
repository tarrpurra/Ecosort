import React, { useMemo, useState } from 'react';
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

const materials = [
  {
    id: 'plastic',
    name: 'Plastic',
    icon: 'cube',
    color: 'bg-emerald-100',
    accent: 'text-emerald-600',
    subtitle: 'Bottles, containers & wraps',
    description:
      'Clean and dry plastics can be recycled into new packaging, clothing fibres and outdoor furniture.',
    items: [
      'Water & soda bottles',
      'Takeout containers',
      'Milk jugs',
      'Shampoo bottles',
      'Stretchy bags (store drop-off)',
    ],
    preparation: [
      'Empty liquids and remove lids',
      'Quick rinse to remove residue',
      'Crush bottles to save space',
      'Drop plastic bags at grocery stores',
    ],
    acceptedTypes: '#1 PET • #2 HDPE • #4 LDPE • #5 PP',
    environmentalTip:
      'Recycling just 10 plastic bottles saves enough energy to power a laptop for over 25 hours.',
    commonMistakes:
      'Greasy containers and styrofoam packaging contaminate batches – keep them out.',
  },
  {
    id: 'paper',
    name: 'Paper & Cardboard',
    icon: 'document-text',
    color: 'bg-sky-100',
    accent: 'text-sky-600',
    subtitle: 'Mail, boxes & office paper',
    description:
      'Dry paper fibres can be pulped and remade up to seven times into new paper goods.',
    items: [
      'Shipping boxes',
      'Office paper',
      'Junk mail',
      'Magazines & catalogs',
      'Paper egg cartons',
    ],
    preparation: [
      'Flatten boxes and bundle cardboard',
      'Remove plastic film, tape and staples',
      'Keep materials clean and dry',
      'Tear waxy or soiled paper for compost instead',
    ],
    acceptedTypes: 'Newspapers • Cardboard • File folders • Paper bags',
    environmentalTip: 'Each ton of recycled paper saves 17 mature trees and 7,000 gallons of water.',
    commonMistakes: 'Pizza boxes with grease should be composted – only recycle the clean lid.',
  },
  {
    id: 'glass',
    name: 'Glass',
    icon: 'wine',
    color: 'bg-amber-100',
    accent: 'text-amber-600',
    subtitle: 'Bottles & jars',
    description:
      'Glass can be recycled endlessly without losing quality, turning yesterday\'s jars into tomorrow\'s.',
    items: ['Food jars', 'Sauce bottles', 'Beverage bottles', 'Candle jars'],
    preparation: [
      'Remove caps, lids and corks',
      'Rinse and separate by colour if required locally',
      'Keep broken glass out of curbside bins – deliver to drop-off sites',
    ],
    acceptedTypes: 'Clear • Green • Brown glass bottles and jars',
    environmentalTip:
      'Recycling one glass bottle saves enough energy to power a 100W bulb for four hours.',
    commonMistakes: 'Ceramics, mirrors and cookware melt at different temperatures – recycle separately.',
  },
  {
    id: 'metal',
    name: 'Metals',
    icon: 'shield-checkmark',
    color: 'bg-violet-100',
    accent: 'text-violet-600',
    subtitle: 'Aluminum & steel cans',
    description:
      'Metals are endlessly recyclable, returning to store shelves as new cans in as little as 60 days.',
    items: ['Aluminum drink cans', 'Soup & veggie cans', 'Jar lids', 'Clean foil & trays'],
    preparation: [
      'Rinse cans and let them dry',
      'Crush aluminum to save space',
      'Ball up clean foil before recycling',
      'Keep paint or aerosol cans out unless program allows',
    ],
    acceptedTypes: 'Aluminum cans • Steel/tin cans • Food-safe foil',
    environmentalTip:
      'Recycling aluminum saves 95% of the energy compared to producing it from raw ore.',
    commonMistakes: 'Food-covered foil and scrap metal pieces belong at drop-off depots, not curbside bins.',
  },
  {
    id: 'ewaste',
    name: 'E-waste',
    icon: 'hardware-chip',
    color: 'bg-rose-100',
    accent: 'text-rose-600',
    subtitle: 'Electronics & batteries',
    description:
      'Electronics contain valuable metals and hazardous materials – keep them in circulation, not landfills.',
    items: ['Phones & tablets', 'Laptops', 'Chargers & cables', 'Household batteries'],
    preparation: [
      'Back up and wipe personal devices',
      'Bundle cables with reusable ties',
      'Store batteries in a cool container until drop-off',
      'Use manufacturer mail-back programs when offered',
    ],
    acceptedTypes: 'Devices • Power cords • Rechargeable and single-use batteries',
    environmentalTip:
      'Recycling one million laptops saves enough energy to power over 3,500 homes for a year.',
    commonMistakes: 'Never place batteries or devices in household trash – they can spark fires in trucks.',
  },
  {
    id: 'organic',
    name: 'Organics',
    icon: 'leaf',
    color: 'bg-lime-100',
    accent: 'text-lime-600',
    subtitle: 'Food scraps & yard waste',
    description:
      'Composting organics returns nutrients to the soil and prevents methane emissions in landfills.',
    items: ['Fruit & veggie peels', 'Coffee grounds', 'Tea leaves', 'Yard trimmings'],
    preparation: [
      'Line bins with compostable paper or leave unlined',
      'Chop large pieces to speed decomposition',
      'Keep meats and oils out of backyard piles',
      'Layer browns (leaves) and greens (scraps) for balance',
    ],
    acceptedTypes: 'Food scraps • Garden waste • Uncoated paper products',
    environmentalTip: 'Diverting organics can cut household trash volume by up to 40%.',
    commonMistakes: 'Plastic produce stickers and compostable plastics don\'t belong in green bins unless accepted locally.',
  },
];

const quickWins = [
  {
    title: 'Prep Checklist',
    icon: 'checkmark-done-circle',
    description: 'Empty, rinse, dry. These three steps keep recycling loads clean and market-ready.',
  },
  {
    title: 'Know Your Bin',
    icon: 'swap-horizontal',
    description: 'Glance at your community\'s guide once a month – rules can change as programs expand.',
  },
  {
    title: 'Share the Habit',
    icon: 'people-circle',
    description: 'Label household bins and teach roommates what belongs where to boost participation.',
  },
];

const wasteInsights = [
  {
    icon: 'time',
    title: 'Collection Day Reminder',
    detail: 'Set a calendar alert so materials never linger curbside longer than necessary.',
  },
  {
    icon: 'earth',
    title: 'Closed-Loop Impact',
    detail: 'Most curbside plastics become carpet, clothing or packaging – high quality material matters.',
  },
  {
    icon: 'leaf-outline',
    title: 'Climate Win',
    detail: 'If every household recycled 5 more pounds a month, it would offset 1.5M metric tons of CO₂.',
  },
];

const Guide = () => {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'howTo' | 'insights'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMaterials = useMemo(() => {
    if (!searchQuery.trim()) {
      return materials;
    }

    const query = searchQuery.toLowerCase();
    return materials.filter((material) =>
      material.name.toLowerCase().includes(query) ||
      material.items.some((item) => item.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const activeMaterial = selectedCategory
    ? materials.find((material) => material.id === selectedCategory) ?? null
    : null;

  return (
    <SafeAreaView className="flex-1 bg-emerald-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-2">
          <View className="bg-emerald-600 rounded-3xl p-6 shadow-xl mb-6">
            <View className="flex-row justify-between items-start">
              <View className="flex-1 pr-4">
                <Text className="text-xs uppercase tracking-widest text-emerald-100/80 font-semibold">
                  Recycling toolkit
                </Text>
                <Text className="text-3xl font-bold text-white mt-1">Master your materials</Text>
                <Text className="text-base text-emerald-100 mt-3 leading-5">
                  Explore preparation steps, quick wins and local drop-off options to recycle with confidence.
                </Text>
              </View>
              <View className="bg-white/15 rounded-2xl px-4 py-3 items-center">
                <Ionicons name="leaf" size={24} color="#bbf7d0" />
                <Text className="text-xs text-emerald-100 mt-2 text-center">Small shifts, big climate wins.</Text>
              </View>
            </View>

            <View className="flex-row mt-6 space-x-3">
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/guide/centers' as const)}
                className="flex-1 bg-white rounded-2xl px-4 py-3 flex-row items-center justify-between"
                activeOpacity={0.9}
              >
                <View className="flex-1 pr-3">
                  <Text className="text-sm font-semibold text-emerald-700">Find drop-off locations</Text>
                  <Text className="text-xs text-emerald-500 mt-1">See certified recycling partners nearby.</Text>
                </View>
                <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center">
                  <Ionicons name="navigate" size={22} color="#047857" />
                </View>
              </TouchableOpacity>

              <View className="w-24 bg-emerald-500/30 rounded-2xl px-3 py-3 items-center justify-between">
                <Ionicons name="trophy" size={24} color="#bbf7d0" />
                <Text className="text-[11px] text-emerald-100 text-center mt-2">Earn eco points weekly</Text>
              </View>
            </View>
          </View>

          <View className="bg-white rounded-3xl p-5 shadow-md mb-6">
            <View className="flex-row items-center bg-emerald-50 rounded-2xl px-4 py-3">
              <Ionicons name="search" size={20} color="#047857" />
              <TextInput
                className="flex-1 ml-3 text-emerald-900"
                placeholder="Search materials, items or tips"
                placeholderTextColor="rgba(4, 120, 87, 0.45)"
                value={searchQuery}
                onChangeText={(value) => {
                  setSearchQuery(value);
                  if (!value) {
                    setSelectedCategory(null);
                  }
                }}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => { setSearchQuery(''); setSelectedCategory(null); }}>
                  <Ionicons name="close-circle" size={20} color="#10b981" />
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 16, gap: 12 }}
            >
              {materials.map((material) => {
                const isActive = selectedCategory === material.id;
                return (
                  <TouchableOpacity
                    key={material.id}
                    className={`px-4 py-2 rounded-2xl border ${isActive ? 'bg-emerald-500 border-emerald-600' : 'bg-white border-emerald-100'}`}
                    onPress={() => {
                      setSelectedCategory((prev) => prev === material.id ? null : material.id);
                      setActiveTab('overview');
                    }}
                    activeOpacity={0.9}
                  >
                    <Text className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-emerald-700'}`}>
                      {material.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {!activeMaterial ? (
            <>
              <View className="mb-6">
                <Text className="text-lg font-semibold text-emerald-900 mb-3">Quick wins</Text>
                <View className="flex-row flex-wrap" style={{ gap: 12 }}>
                  {quickWins.map((tip) => (
                    <View key={tip.title} className="flex-1 min-w-[45%] bg-white rounded-3xl p-4 shadow">
                      <View className="flex-row items-center">
                        <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center mr-3">
                          <Ionicons name={tip.icon as any} size={22} color="#047857" />
                        </View>
                        <Text className="text-sm font-semibold text-emerald-900 flex-1">{tip.title}</Text>
                      </View>
                      <Text className="text-xs text-emerald-600 mt-3 leading-4">{tip.description}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View className="bg-white rounded-3xl p-5 shadow mb-6">
                <Text className="text-lg font-semibold text-emerald-900 mb-1">Material library</Text>
                <Text className="text-sm text-emerald-500 mb-4">
                  Tap a material to see preparation steps, accepted items and bonus insights.
                </Text>
                <View className="flex-row flex-wrap justify-between">
                  {filteredMaterials.map((material) => (
                    <TouchableOpacity
                      key={material.id}
                      className="w-[48%] mb-4 bg-emerald-50 rounded-3xl p-4 border border-emerald-100"
                      onPress={() => {
                        setSelectedCategory(material.id);
                        setActiveTab('overview');
                      }}
                    >
                      <View className={`w-12 h-12 rounded-2xl ${material.color} items-center justify-center mb-3`}>
                        <Ionicons name={material.icon as any} size={22} color="#065f46" />
                      </View>
                      <Text className="text-base font-semibold text-emerald-900" numberOfLines={1}>{material.name}</Text>
                      <Text className="text-xs text-emerald-600 mt-1" numberOfLines={2}>{material.subtitle}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="bg-emerald-700 rounded-3xl p-5 mb-6">
                <Text className="text-lg font-semibold text-white">Why it matters</Text>
                <View className="mt-4" style={{ gap: 14 }}>
                  {wasteInsights.map((insight) => (
                    <View key={insight.title} className="flex-row">
                      <View className="w-12 h-12 rounded-2xl bg-white/15 items-center justify-center mr-3">
                        <Ionicons name={insight.icon as any} size={22} color="#bbf7d0" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-white">{insight.title}</Text>
                        <Text className="text-xs text-emerald-100 mt-1 leading-4">{insight.detail}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </>
          ) : (
            <View className="bg-white rounded-3xl p-5 shadow mb-6">
              <TouchableOpacity
                onPress={() => setSelectedCategory(null)}
                className="flex-row items-center mb-4"
              >
                <Ionicons name="chevron-back" size={20} color="#047857" />
                <Text className="text-sm font-semibold text-emerald-700 ml-1">Back to library</Text>
              </TouchableOpacity>

              <View className="flex-row items-start mb-5">
                <View className={`w-14 h-14 rounded-2xl ${activeMaterial.color} items-center justify-center mr-4`}>
                  <Ionicons name={activeMaterial.icon as any} size={26} color="#065f46" />
                </View>
                <View className="flex-1">
                  <Text className="text-2xl font-bold text-emerald-900">{activeMaterial.name}</Text>
                  <Text className="text-sm text-emerald-500 mt-1">{activeMaterial.subtitle}</Text>
                </View>
              </View>

              <View className="flex-row bg-emerald-50 rounded-2xl p-1 mb-4">
                {[
                  { id: 'overview', label: 'Overview', icon: 'sparkles' },
                  { id: 'items', label: 'Accepted Items', icon: 'cube-outline' },
                  { id: 'howTo', label: 'Prep Steps', icon: 'list-circle' },
                  { id: 'insights', label: 'Insights', icon: 'stats-chart' },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <TouchableOpacity
                      key={tab.id}
                      className={`flex-1 flex-row items-center justify-center py-2 rounded-2xl ${isActive ? 'bg-white shadow-sm' : ''}`}
                      onPress={() => setActiveTab(tab.id as typeof activeTab)}
                    >
                      <Ionicons
                        name={tab.icon as any}
                        size={18}
                        color={isActive ? '#047857' : 'rgba(4,120,87,0.55)'}
                      />
                      <Text className={`text-xs font-semibold ml-2 ${isActive ? 'text-emerald-700' : 'text-emerald-500/80'}`}>
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {activeTab === 'overview' && (
                <View>
                  <Text className="text-base font-semibold text-emerald-900 mb-2">How it helps</Text>
                  <Text className="text-sm text-emerald-600 leading-5">{activeMaterial.description}</Text>
                  <View className="bg-emerald-50 rounded-2xl px-4 py-3 mt-4">
                    <Text className="text-xs text-emerald-700 uppercase tracking-widest">Accepted streams</Text>
                    <Text className="text-sm text-emerald-800 mt-2 font-semibold">{activeMaterial.acceptedTypes}</Text>
                  </View>
                </View>
              )}

              {activeTab === 'items' && (
                <View>
                  <Text className="text-base font-semibold text-emerald-900 mb-3">Everyday items you can recycle</Text>
                  <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                    {activeMaterial.items.map((item) => (
                      <View key={item} className="bg-emerald-50 rounded-2xl px-3 py-2">
                        <Text className="text-xs font-semibold text-emerald-700">{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {activeTab === 'howTo' && (
                <View>
                  <Text className="text-base font-semibold text-emerald-900 mb-3">Preparation checklist</Text>
                  <View style={{ gap: 12 }}>
                    {activeMaterial.preparation.map((step) => (
                      <View key={step} className="flex-row items-start">
                        <View className="w-7 h-7 rounded-full bg-emerald-100 items-center justify-center mt-1 mr-3">
                          <Ionicons name="checkmark" size={16} color="#047857" />
                        </View>
                        <Text className="flex-1 text-sm text-emerald-600 leading-5">{step}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {activeTab === 'insights' && (
                <View>
                  <View className="bg-emerald-50 rounded-3xl p-4 mb-4">
                    <Text className="text-sm font-semibold text-emerald-700 mb-1">Environmental impact</Text>
                    <Text className="text-sm text-emerald-600 leading-5">{activeMaterial.environmentalTip}</Text>
                  </View>
                  <View className="bg-amber-100 rounded-3xl p-4">
                    <Text className="text-sm font-semibold text-amber-700 mb-1">Avoid these mistakes</Text>
                    <Text className="text-sm text-amber-700 leading-5">{activeMaterial.commonMistakes}</Text>
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
