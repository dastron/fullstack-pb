import React from "react";
import { Box } from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";

interface MarkdownTextProps {
  children: string;
}

const MarkdownText: React.FC<MarkdownTextProps> = ({ children }) => {
  return (
    <Box
      p={2}
      sx={{
        "& ul": {
          paddingLeft: "2rem",
          marginY: "0.5rem",
        },
        "& ol": {
          paddingLeft: "2rem",
          marginY: "0.5rem",
        },
        "& p": {
          marginY: "1rem",
        },
        "& p:first-of-type": {
          marginTop: 0,
        },
        "& p:last-of-type": {
          marginBottom: 0,
        },
      }}
    >
      <ReactMarkdown>{children}</ReactMarkdown>
    </Box>
  );
};

export default MarkdownText;
