import type { TodoType } from "@project/shared/types";

import { Box, Checkbox, HStack, Stack, Text, useColorModeValue, VStack } from "@chakra-ui/react";
import { Link } from "react-router-dom";

import DateRelativeText from "../DateRelativeText";

interface TodoListProps {
  todos: TodoType[];
  prefix?: string;
  onToggleComplete?: (todoId: string, completed: boolean) => void;
}

export const TodoList = ({ todos, prefix = "/todo", onToggleComplete }: TodoListProps) => {
  const bgColor = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const hoverBg = useColorModeValue("gray.50", "gray.600");
  const textColor = useColorModeValue("gray.700", "gray.200");
  const completedTextColor = useColorModeValue("gray.500", "gray.400");

  const handleToggle = (e: React.MouseEvent, todoId: string, currentCompleted: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleComplete) {
      onToggleComplete(todoId, !currentCompleted);
    }
  };

  if (todos.length === 0) {
    return (
      <Box p={8} textAlign="center" bg={bgColor} borderRadius="lg" border="1px" borderColor={borderColor}>
        <Text fontSize="lg" color={textColor} fontStyle="italic">
          No todos yet. Create your first todo to get started!
        </Text>
      </Box>
    );
  }

  return (
    <VStack spacing={3} align="stretch">
      {todos.map((todo) => (
        <Box
          key={todo.id}
          p={4}
          bg={bgColor}
          borderRadius="lg"
          border="1px"
          borderColor={borderColor}
          _hover={{
            bg: hoverBg,
            borderColor: "brand.400",
            transform: "translateY(-2px)",
            boxShadow: "md",
          }}
          transition="all 0.2s"
        >
          <HStack spacing={4} align="flex-start">
            <Box onClick={(e) => handleToggle(e, todo.id, todo.completed)} cursor="pointer">
              <Checkbox
                isChecked={todo.completed}
                size="lg"
                colorScheme="blue"
                onChange={() => {}} // Handled by parent onClick
              />
            </Box>
            <Link to={`${prefix}/${todo.id}`} style={{ textDecoration: "none", flex: 1 }}>
              <Stack flex={1} spacing={2} cursor="pointer">
                <HStack justify="space-between" align="flex-start">
                  <Text
                    fontSize="lg"
                    fontWeight="semibold"
                    color={todo.completed ? completedTextColor : textColor}
                    textDecoration={todo.completed ? "line-through" : "none"}
                    noOfLines={2}
                  >
                    {todo.title}
                  </Text>
                  <Box
                    px={2}
                    py={1}
                    borderRadius="md"
                    bg={todo.completed ? "green.100" : "orange.100"}
                    _dark={{
                      bg: todo.completed ? "green.900" : "orange.900",
                    }}
                  >
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      color={todo.completed ? "green.700" : "orange.700"}
                      _dark={{
                        color: todo.completed ? "green.300" : "orange.300",
                      }}
                      textTransform="uppercase"
                    >
                      {todo.completed ? "Done" : "Pending"}
                    </Text>
                  </Box>
                </HStack>
                {todo.description && (
                  <Text fontSize="sm" color={todo.completed ? completedTextColor : textColor} noOfLines={2}>
                    {todo.description}
                  </Text>
                )}
                <HStack spacing={4} fontSize="xs" color={completedTextColor}>
                  <Text>
                    Updated <DateRelativeText date={todo.updated} />
                  </Text>
                  {todo.created !== todo.updated && (
                    <Text>
                      Created <DateRelativeText date={todo.created} />
                    </Text>
                  )}
                </HStack>
              </Stack>
            </Link>
          </HStack>
        </Box>
      ))}
    </VStack>
  );
};
