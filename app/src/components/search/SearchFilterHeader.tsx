import { Box, Flex, Input, Select } from "@chakra-ui/react";

interface SearchFilterHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterValue: string;
  onFilterChange: (value: string) => void;
  filterOptions: { label: string; value: string }[];
}

const SearchFilterHeader = ({
  searchTerm,
  onSearchChange,
  filterValue,
  onFilterChange,
  filterOptions = [],
}: SearchFilterHeaderProps) => {
  filterOptions = [{ label: "All", value: "all" }, ...filterOptions];
  return (
    <Flex p={4} gap={4}>
      <Box flex={1}>
        <Input placeholder="Search..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} />
      </Box>
      <Box width="200px">
        <Select value={filterValue} onChange={(e) => onFilterChange(e.target.value)}>
          {filterOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Box>
    </Flex>
  );
};

export default SearchFilterHeader;
