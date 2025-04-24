import { SettingsIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Select,
  Switch,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const SearchQueryHeader = ({ filterOptions }: { filterOptions?: { label: string; value: string }[] }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [localSearch, setLocalSearch] = useState(searchParams.get("search") || "");

  useEffect(() => {
    setLocalSearch(searchParams.get("search") || "");
  }, [searchParams]);

  const applySearch = () => {
    const current = Object.fromEntries(searchParams.entries());
    setSearchParams({
      ...current,
      search: localSearch,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      applySearch();
    }
  };

  const handleStatusChange = (value: string) => {
    const current = Object.fromEntries(searchParams.entries());
    if (value === "all") {
      const { status: _, ...rest } = current;
      setSearchParams(rest);
    } else {
      setSearchParams({
        ...current,
        status: value,
      });
    }
  };

  const handleSortChange = (value: string) => {
    const current = Object.fromEntries(searchParams.entries());
    if (value === "-updated") {
      const { sortBy: _, ...rest } = current;
      setSearchParams(rest);
    } else {
      setSearchParams({
        ...current,
        sortBy: value,
      });
    }
  };

  filterOptions = [
    { label: "All", value: "all" },
    ...(filterOptions || [
      { label: "Pending", value: "pending" },
      { label: "Active", value: "active" },
      { label: "Complete", value: "complete" },
    ]),
  ];

  return (
    <Flex p={4} gap={4} direction={{ base: "column", md: "row" }}>
      <Box width={{ base: "100%", md: "200px" }}>
        <FormControl>
          <FormLabel>Filter</FormLabel>
          <Select
            id="filter-select"
            value={searchParams.get("status") || "all"}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box flex={1}>
        <FormControl>
          <FormLabel>Search</FormLabel>
          <Flex gap={2}>
            <Input
              id="search-input"
              placeholder="Search..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <Button onClick={applySearch}>Search</Button>
          </Flex>
        </FormControl>
      </Box>
      <Box>
        <FormControl>
          <FormLabel>More</FormLabel>
          <Menu closeOnSelect={false}>
            <MenuButton as={Button} aria-label="Options" leftIcon={<SettingsIcon />} variant="outline">
              Filters
            </MenuButton>
            <MenuList position="fixed">
              <MenuItem>
                <Flex width="100%" alignItems="center" justifyContent="space-between">
                  Sort by:
                  <Select
                    id="sort-select"
                    size="sm"
                    width="100px"
                    value={searchParams.get("sortBy") || "-updated"}
                    onChange={(e) => handleSortChange(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="-updated">Latest</option>
                    <option value="updated">Oldest</option>
                  </Select>
                </Flex>
              </MenuItem>
              <MenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  const newParams = new URLSearchParams(searchParams);
                  const currentValue = searchParams.get("mine") === "true";
                  newParams.set("mine", (!currentValue).toString());
                  setSearchParams(newParams);
                }}
              >
                Subscribed{" "}
                <Switch
                  id="subscribed-switch"
                  ml="auto"
                  isChecked={searchParams.get("mine") === "true"}
                  onClick={(e) => e.stopPropagation()}
                />
              </MenuItem>
            </MenuList>
          </Menu>
        </FormControl>
      </Box>
    </Flex>
  );
};

export default SearchQueryHeader;
