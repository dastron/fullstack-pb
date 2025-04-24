import { useState } from "react";

import SearchFilterHeader from "./SearchFilterHeader";

import pb from "@/pb";

interface SearchHeaderProps {
  onSearch: (searchString: string) => void;
  filterOptions?: { label: string; value: string }[];
}

const SearchHeader = ({ onSearch, filterOptions = [] }: SearchHeaderProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterValue, setFilterValue] = useState("all");

  const createSearchString = (searchTerm: string, filterValue: string) => {
    return pb.filter("content ~ {:searchTerm} & status = {:filterValue}", {
      searchTerm: searchTerm,
      filterValue: filterValue,
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onSearch(createSearchString(value, filterValue));
  };

  const handleFilterChange = (value: string) => {
    setFilterValue(value);
    onSearch(createSearchString(searchTerm, value));
  };

  if (filterOptions.length === 0) {
    filterOptions = [
      { label: "Draft", value: "draft" },
      { label: "Active", value: "active" },
      { label: "Completed", value: "completed" },
    ];
  }

  return (
    <SearchFilterHeader
      searchTerm={searchTerm}
      onSearchChange={handleSearchChange}
      filterValue={filterValue}
      onFilterChange={handleFilterChange}
      filterOptions={filterOptions}
    />
  );
};

export default SearchHeader;
