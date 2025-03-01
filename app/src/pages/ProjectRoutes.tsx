import ProjectDetailPage, { ProjectItemQuery } from "./project/ProjectItemPage";
import ProjectListPage, { ProjectListLoader } from "./project/ProjectListPage";
import { RouteObject } from "react-router-dom";
import ProjectAppNav from "./project/ProjectAppNav";

export const ProjectRoutes: RouteObject = {
  path: "/project",
  element: <ProjectAppNav />,
  children: [
    {
      index: true,
      element: <ProjectListPage />,
      loader: ProjectListLoader,
    },
    {
      path: ":projectId",
      children: [
        {
          index: true,
          element: <ProjectDetailPage />,
          loader: ProjectItemQuery,
        },
      ],
    },
  ],
};
