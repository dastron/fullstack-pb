import type { ListLoaderData } from "@/hooks/useListData";
import type { ProjectType } from "@project/shared/types";

import { ProjectMutator } from "@project/shared/mutator";

import pb from "@/pb";
import { getQueryParams } from "@/utils/query";

const projectMutator = new ProjectMutator(pb);

export type ProjectListLoaderData = ListLoaderData<ProjectType>;

export const ProjectListQuery = async (
  page: number = 1,
  perPage: number = 30,
  filter: string = "",
  sort: string = "-updated",
  expand?: string
): Promise<ProjectListLoaderData> => {
  const listResult = await projectMutator.getList(page, perPage, filter, sort, expand);

  return {
    listResult,
    mutator: projectMutator,
    defaultOptions: {
      sort: "-updated",
      perPage: 30,
      expand: undefined, // Add default expand options here if needed
    },
  };
};

export const ProjectListLoader = async (context: any): Promise<ProjectListLoaderData> => {
  const { filter, sort } = getQueryParams(context.request.url);

  // Parse additional URL parameters for pagination
  const url = new URL(context.request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const perPage = parseInt(url.searchParams.get("perPage") || "30");

  return await ProjectListQuery(page, perPage, filter || "", sort || "-updated");
};
