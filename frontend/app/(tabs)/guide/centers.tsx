import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';

const centerDirectory = [
  {
    id: 'green-cycle-hub',
    name: 'Green Cycle Hub',
    distance: '1.2 mi',
    address: '142 Evergreen Ave, Springfield',
    hours: 'Mon-Sat 9am - 6pm',
    contact: '(555) 013-2299',
    website: 'https://example.org/green-cycle',
    accepted: ['Plastics #1-5', 'Cardboard', 'Glass bottles', 'Electronics drop-off (Sat)'],
    services: ['Curbside partner drop', 'Education tours', 'Monthly repair clinic'],
    highlight: 'Earn 2x reward points every Wednesday with EcoSort.',
  },
  {
    id: 'riverbend-mrf',
    name: 'Riverbend Materials Recovery Facility',
    distance: '3.4 mi',
    address: '760 Riverbend Rd, Springfield',
    hours: 'Daily 8am - 8pm',
    contact: '(555) 019-4411',
    website: 'https://example.org/riverbend-mrf',
    accepted: ['Metals & cans', 'Paper & cardboard', 'Bulk drop-offs', 'Household hazardous waste (Sun)'],
    services: ['Drive-through sorting', 'Community workshops', 'Donation drop zone'],
    highlight: 'Best choice for bulk cardboard and weekend hazardous waste events.',
  },
  {
    id: 'tech-loop-center',
    name: 'Tech Loop E-waste Center',
    distance: '5.0 mi',
    address: '88 Innovation Blvd, Springfield',
    hours: 'Thu-Sun 10am - 5pm',
    contact: '(555) 000-8855',
    website: 'https://example.org/tech-loop',
    accepted: ['Phones & tablets', 'Laptops & desktops', 'Batteries', 'Small appliances'],
    services: ['Certified data wiping', 'Battery recycling kits', 'Device donation program'],
    highlight: 'Secure data wiping included with every device drop-off.',
  },
];

const filters = [
  { id: 'all', label: 'All centers' },
  { id: 'drop-off', label: 'Drop-off' },
  { id: 'bulk', label: 'Bulk loads' },
  { id: 'electronics', label: 'Electronics' },
];

const tagMatches = {
  all: () => true,
  'drop-off': (center: typeof centerDirectory[number]) => center.accepted.some((item) => /drop/i.test(item)),
  bulk: (center: typeof centerDirectory[number]) =>
    center.accepted.some((item) => /bulk|hazardous/i.test(item)) ||
    center.services.some((service) => /drive|donation/i.test(service)),
  electronics: (center: typeof centerDirectory[number]) =>
    center.accepted.some((item) => /electronic|device|battery/i.test(item)) ||
    center.services.some((service) => /device|data/i.test(service)),
} as const;

type FilterKey = keyof typeof tagMatches;

const Centers = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const results = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return centerDirectory.filter((center) => {
      const matchesFilter = tagMatches[activeFilter](center);
      if (!matchesFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        center.name.toLowerCase().includes(query) ||
        center.address.toLowerCase().includes(query) ||
        center.accepted.some((item) => item.toLowerCase().includes(query))
      );
    });
  }, [activeFilter, searchQuery]);

  return (
    <SafeAreaView className="flex-1 bg-emerald-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-2">
          <View className="bg-white rounded-3xl p-5 shadow mb-5">
            <TouchableOpacity
              onPress={() => router.back()}
              className="flex-row items-center mb-4"
            >
              <Ionicons name="chevron-back" size={20} color="#047857" />
              <Text className="text-sm font-semibold text-emerald-700 ml-1">Back to guide</Text>
            </TouchableOpacity>

            <Text className="text-[26px] font-bold text-emerald-900">Nearby recycling partners</Text>
            <Text className="text-sm text-emerald-600 mt-2">
              These community-supported centers accept verified materials and sync with your EcoSort rewards.
            </Text>

            <View className="flex-row items-center bg-emerald-50 rounded-2xl px-4 py-3 mt-5">
              <Ionicons name="search" size={20} color="#047857" />
              <TextInput
                className="flex-1 ml-3 text-emerald-900"
                placeholder="Search by name, material or neighborhood"
                placeholderTextColor="rgba(4,120,87,0.45)"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#10b981" />
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 18, gap: 10 }}
            >
              {filters.map((filter) => {
                const isActive = activeFilter === filter.id;
                return (
                  <TouchableOpacity
                    key={filter.id}
                    className={`px-4 py-2 rounded-2xl border ${isActive ? 'bg-emerald-500 border-emerald-600' : 'bg-white border-emerald-100'}`}
                    onPress={() => setActiveFilter(filter.id as FilterKey)}
                  >
                    <Text className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-emerald-700'}`}>
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={{ gap: 16 }}>
            {results.map((center) => (
              <View key={center.id} className="bg-white rounded-3xl p-5 shadow border border-emerald-100">
                <View className="flex-row items-start">
                  <View className="w-12 h-12 rounded-2xl bg-emerald-100 items-center justify-center mr-4">
                    <Ionicons name="business" size={22} color="#047857" />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-lg font-semibold text-emerald-900 flex-1 pr-4">{center.name}</Text>
                      <View className="flex-row items-center bg-emerald-50 px-3 py-1.5 rounded-full">
                        <Ionicons name="navigate-outline" size={16} color="#047857" />
                        <Text className="text-xs font-semibold text-emerald-700 ml-1">{center.distance}</Text>
                      </View>
                    </View>
                    <Text className="text-xs text-emerald-600 mt-1">{center.address}</Text>
                    <Text className="text-xs text-emerald-500 mt-1">Hours: {center.hours}</Text>
                  </View>
                </View>

                <View className="mt-4 bg-emerald-50 rounded-2xl px-4 py-3">
                  <Text className="text-xs uppercase tracking-widest text-emerald-600 font-semibold">Highlight</Text>
                  <Text className="text-sm text-emerald-700 mt-1 leading-5">{center.highlight}</Text>
                </View>

                <View className="mt-4">
                  <Text className="text-sm font-semibold text-emerald-900 mb-1">Accepted materials</Text>
                  <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                    {center.accepted.map((item) => (
                      <View key={item} className="bg-emerald-50 rounded-2xl px-3 py-2">
                        <Text className="text-xs font-semibold text-emerald-700">{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View className="mt-4">
                  <Text className="text-sm font-semibold text-emerald-900 mb-1">On-site services</Text>
                  <View style={{ gap: 10 }}>
                    {center.services.map((service) => (
                      <View key={service} className="flex-row items-start">
                        <View className="w-7 h-7 rounded-full bg-emerald-100 items-center justify-center mr-3 mt-1">
                          <Ionicons name="leaf" size={16} color="#047857" />
                        </View>
                        <Text className="flex-1 text-sm text-emerald-600 leading-5">{service}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View className="flex-row items-center justify-between mt-6">
                  <View>
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`tel:${center.contact.replace(/[^0-9]/g, '')}`)}
                      className="flex-row items-center"
                    >
                      <Ionicons name="call" size={18} color="#047857" />
                      <Text className="text-sm font-semibold text-emerald-700 ml-2">{center.contact}</Text>
                    </TouchableOpacity>
                    <Text className="text-xs text-emerald-500 mt-2">Call ahead for special material requirements.</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => Linking.openURL(center.website)}
                    className="bg-emerald-500 rounded-full px-4 py-2 flex-row items-center"
                    activeOpacity={0.9}
                  >
                    <Ionicons name="open-outline" size={18} color="white" />
                    <Text className="text-sm font-semibold text-white ml-2">Visit site</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {results.length === 0 && (
              <View className="bg-white rounded-3xl p-6 items-center shadow">
                <Ionicons name="compass" size={40} color="#10b981" />
                <Text className="text-lg font-semibold text-emerald-900 mt-3">No centers match your filters yet</Text>
                <Text className="text-sm text-emerald-600 text-center mt-2">
                  Try selecting a different filter or widening your search radius to discover more recycling partners.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Centers;
