import { Box, Flex, Select } from "@chakra-ui/react";

interface StatusFilterHeaderProps {
  statusValue: string;
  onStatusChange: (value: string) => void;
}

const StatusFilterHeader = ({ statusValue, onStatusChange }: StatusFilterHeaderProps) => {
  return (
    <Flex p={4}>
      <Box width="200px">
        <Select value={statusValue} onChange={(e) => onStatusChange(e.target.value)}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
      </Box>
    </Flex>
  );
};

export default StatusFilterHeader;
