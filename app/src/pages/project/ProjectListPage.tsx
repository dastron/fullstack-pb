import type { ProjectType } from "@project/shared/types";
import type { ListResult } from "pocketbase";

import { Button, Flex, Heading, Spacer, Stack } from "@chakra-ui/react";
import { Link, useLoaderData, useParams } from "react-router-dom";

import { CardPattern } from "@/components/CardPattern";
import SearchQueryHeader from "@/components/search/SearchQueryHeader";
import pb from "@/pb";
import { getQueryParams } from "@/utils/query";

export const ProjectListQuery = async (sort: string = "-updated", filter: string = "") => {
  return await pb.collection("Projects").getList(1, 30, { sort, filter });
};

export const ProjectListLoader = async (context: any) => {
  const { filter, sort } = getQueryParams(context.request.url);
  return await ProjectListQuery(sort, filter);
};

const ProjectListPage = () => {
  const loader = useLoaderData() as ListResult<ProjectType> | undefined;
  const projects = loader?.items || [];
  const { requestId } = useParams();
  const title = requestId ? "Request Projects" : "Projects";

  return (
    <Stack spacing={4}>
      <Flex align="center">
        <Heading>{title}</Heading>
        <Spacer />
        <Button as={Link} to="./new" colorScheme="blue">
          Create New Project
        </Button>
      </Flex>
      <SearchQueryHeader />
      <CardPattern data={projects} columns={["title", "status"]} prefix="/project" />
    </Stack>
  );
};

export default ProjectListPage;
