import * as React from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput } from "react-native";
import { ChevronDown, Search } from "lucide-react-native";

export interface DropdownItem {
  label: string;
  value: string;
}

interface SearchableDropdownProps {
  data: DropdownItem[];
  value?: string;
  onSelect: (value: string) => void;
  label: string;
  placeholder?: string;
  disabled?: boolean;
}

export function SearchableDropdown({
  data,
  value,
  onSelect,
  label,
  placeholder = "Select an option",
  disabled = false,
}: SearchableDropdownProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const selectedItem = data.find((item) => item.value === value);

  const filteredData = React.useMemo(() => {
    if (!searchQuery) return data;
    return data.filter((item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  const handleSelect = (val: string) => {
    onSelect(val);
    setIsExpanded(false);
    setSearchQuery("");
  };

  const toggleExpand = () => {
    if (disabled) return;
    setIsExpanded((prev) => !prev);
  };

  return (
    <View
      className={`relative bg-surface-container-lowest border rounded-lg shadow-sm ${
        disabled
          ? "opacity-50 border-outline-variant"
          : isExpanded
          ? "border-secondary"
          : "border-outline-variant"
      }`}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={toggleExpand}
        className="w-full min-h-[56px] px-4 py-3 flex-row items-center justify-between rounded-lg"
      >
        <View className="flex-col flex-1 mr-2">
          <Text className="text-[12px] leading-[16px] font-medium text-outline">
            {label}
          </Text>
          <Text className="text-[16px] leading-[24px] text-on-surface mt-0.5">
            {selectedItem ? selectedItem.label : placeholder}
          </Text>
        </View>
        {/* Plain View rotation — avoids Reanimated shared-value read during render */}
        <View style={{ transform: [{ rotate: isExpanded ? "180deg" : "0deg" }] }}>
          <ChevronDown size={24} color="#727780" />
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View className="w-full bg-surface-container-lowest border-t border-outline-variant rounded-b-lg overflow-hidden">
          {/* Search input */}
          <View className="p-2 border-b border-outline-variant">
            <View className="relative justify-center">
              <View className="absolute left-3 z-10">
                <Search size={20} color="#727780" />
              </View>
              <TextInput
                autoFocus
                placeholder={`Search ${label.toLowerCase()}...`}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#727780"
                className="w-full pl-10 pr-3 h-10 bg-surface-container-low rounded-md text-[16px] text-on-surface"
              />
            </View>
          </View>

          {/* ScrollView replaces FlatList — avoids nested VirtualizedList warning */}
          <ScrollView
            style={{ maxHeight: 192 }}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={false}
          >
            {filteredData.length === 0 ? (
              <View className="py-4 items-center justify-center">
                <Text className="text-outline">No results found.</Text>
              </View>
            ) : (
              filteredData.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  activeOpacity={0.7}
                  onPress={() => handleSelect(item.value)}
                  className="px-4 py-3 border-b border-surface-container-low"
                >
                  <Text
                    className={`text-[16px] ${
                      item.value === value
                        ? "font-bold text-primary"
                        : "text-on-surface"
                    }`}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
