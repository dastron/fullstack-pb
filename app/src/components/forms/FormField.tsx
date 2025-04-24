import { Stack, Text } from "@chakra-ui/react";

export const Field = (props: {
  label: string;
  children?: React.ReactNode;
  invalid?: boolean;
  errorText?: string;
  helperText?: string;
}) => (
  <Stack w="100%" data-testid={props.label?.toLowerCase()}>
    <label>
      <Text>{props.label}</Text>
      <Stack direction="row" spacing={4}>
        <Stack flex={props.helperText ? "3" : "3"}>{props?.children}</Stack>
        {props?.helperText && (
          <Stack flex="1" justify="center">
            <Text color="secondary">{props?.helperText}</Text>
          </Stack>
        )}
      </Stack>
    </label>
    {props?.errorText && <Text color="red.500">{props?.errorText}</Text>}
  </Stack>
);
export default Field;
