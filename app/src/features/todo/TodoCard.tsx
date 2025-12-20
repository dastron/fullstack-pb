import type { TodoType } from "@project/shared/types";

import { Card, CardBody, CardHeader, Checkbox, Heading, HStack, Stack, Text } from "@chakra-ui/react";

interface TodoCardProps {
  todo: TodoType;
  onToggleComplete?: (todoId: string, completed: boolean) => void;
}

const TodoCard = ({ todo, onToggleComplete }: TodoCardProps) => {
  const handleToggle = () => {
    if (onToggleComplete) {
      onToggleComplete(todo.id, !todo.completed);
    }
  };

  return (
    <Card boxShadow="lg" borderRadius="lg" border="1px" borderColor="chakra-border-color">
      <CardHeader pb={0}>
        <HStack spacing={4} align="center">
          <Checkbox isChecked={todo.completed} onChange={handleToggle} size="lg" colorScheme="blue" />
          <Heading
            size="md"
            flex={1}
            textDecoration={todo.completed ? "line-through" : "none"}
            opacity={todo.completed ? 0.6 : 1}
          >
            {todo.title}
          </Heading>
        </HStack>
      </CardHeader>
      <CardBody>
        <Stack>
          {todo.description && <Text color={todo.completed ? "gray.500" : "inherit"}>{todo.description}</Text>}
          <HStack justify="flex-end" p={3} borderRadius="md">
            <Text fontWeight="medium" fontSize="sm">
              Status:{" "}
              <Text as="span" color={todo.completed ? "green.500" : "orange.500"} fontSize="sm">
                {todo.completed ? "Completed" : "Pending"}
              </Text>
            </Text>
            <Text fontWeight="medium" fontSize="sm">
              Updated:{" "}
              <Text as="span" color="secondary" fontSize="sm">
                {new Date(todo.updated).toLocaleDateString()}
              </Text>
            </Text>
            <Text fontWeight="medium" fontSize="sm">
              Created:{" "}
              <Text as="span" color="secondary" fontSize="sm">
                {new Date(todo.created).toLocaleDateString()}
              </Text>
            </Text>
          </HStack>
        </Stack>
      </CardBody>
    </Card>
  );
};

export default TodoCard;
