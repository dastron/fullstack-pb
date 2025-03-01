import { Card, CardHeader, CardBody, Stack, Heading, Text, HStack } from "@chakra-ui/react";
import type { ProjectType } from "@/types";
import { Link } from "react-router-dom";
import MarkdownText from "@/components/MarkdownText";
import { ImageViewer } from "@/components/images/ImageViewer";

interface ProjectCardProps {
  project: ProjectType;
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  // Safely determine the balance value and color mode

  return (
    <Card boxShadow="lg" borderRadius="lg" border="1px" borderColor="chakra-border-color">
      <ImageViewer
        src={project.imageFiles?.[0]}
        entity={project}
        width="100%"
        height="200px"
        objectFit="cover"
        borderTopRadius="md"
      />
      <CardHeader pb={0}>
        <Heading size="sm" textDecoration="underline" mb={2} color="secondary">
          Project Details:
        </Heading>
        <Heading size="md">{project.title}</Heading>
      </CardHeader>
      <CardBody>
        <Stack>
          {project.summary && (
            <Text bg="success.50" borderRadius="md">
              Summary: {project.summary}
            </Text>
          )}

          <MarkdownText>{project.content}</MarkdownText>

          <HStack justify="flex-end" p={3} borderRadius="md">
            <Text fontWeight="medium">
              <Link to={`/profile/${project.User}`}>View Profile</Link>
            </Text>
            <Text fontWeight="medium">
              Updated:{" "}
              <Text as="span" color="secondary" fontSize="sm">
                {new Date(project.updated).toLocaleDateString()}
              </Text>
            </Text>
            <Text fontWeight="medium">
              Created:{" "}
              <Text as="span" color="secondary" fontSize="sm">
                {new Date(project.created).toLocaleDateString()}
              </Text>
            </Text>
          </HStack>
        </Stack>
      </CardBody>
    </Card>
  );
};

export default ProjectCard;
