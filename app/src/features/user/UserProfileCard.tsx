// import { UserType } from "@/types";
import {
  Card,
  CardHeader,
  CardBody,
  Stack,
  Heading,
  Text,
  Box,
  Grid,
  GridItem,
  Flex,
  Badge,
  Avatar,
} from "@chakra-ui/react";
import type { UserType } from "@project/shared/types";

interface UserProfileCardProps {
  user: UserType;
}

const UserProfileCard = ({ user }: UserProfileCardProps) => {
  return (
    <Card boxShadow="lg" borderRadius="lg" border="1px" borderColor="chakra-border-color">
      <CardHeader bg="chakra-subtle-bg" borderBottomWidth="1px" borderColor="chakra-border-color" py={3}>
        <Flex justify="space-between" align="center">
          <Stack direction="row" spacing={4} align="center">
            <Avatar size="lg" name={user.name} />
            <Box>
              <Heading size="md">{user.name}</Heading>
              <Text fontSize="sm" color="secondary"></Text>
            </Box>
          </Stack>
        </Flex>
      </CardHeader>

      <CardBody py={4}>
        <Stack spacing={4}>
          <Grid templateColumns="repeat(3, 1fr)" gap={3}>
            <GridItem bg="chakra-subtle-bg" p={3} borderRadius="md">
              <Text color="secondary" fontSize="sm">
                Status
              </Text>
              <Stack direction="row" spacing={1}>
                <Badge colorScheme="yellow">New</Badge>
                {/* {user?.verified && <Badge colorScheme="green">Verified</Badge>}
                {user?.active && <Badge colorScheme="blue">Active</Badge>} */}
              </Stack>
            </GridItem>
            {/* <GridItem bg="chakra-subtle-bg" p={3} borderRadius="md">
              <Text color="secondary" fontSize="sm">
                Balance
              </Text>
              <Text fontWeight="medium">{user?.balance ?? 0} tokens</Text>
            </GridItem> */}
          </Grid>

          <Grid templateColumns="repeat(3, 1fr)" gap={3}>
            <GridItem bg="chakra-subtle-bg" p={3} borderRadius="md">
              <Text color="secondary" fontSize="sm">
                Created
              </Text>
              <Text fontWeight="medium">{new Date(user.created).toLocaleDateString()}</Text>
            </GridItem>
            <GridItem bg="chakra-subtle-bg" p={3} borderRadius="md">
              <Text color="secondary" fontSize="sm">
                Updated
              </Text>
              <Text fontWeight="medium">{new Date(user.updated).toLocaleDateString()}</Text>
            </GridItem>
          </Grid>
        </Stack>
      </CardBody>
    </Card>
  );
};

export default UserProfileCard;
