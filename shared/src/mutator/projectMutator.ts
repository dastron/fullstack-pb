import { BaseMutator } from "./baseMutator";
import { ProjectInputType, ProjectType, TypedPocketBase } from "../types";
import { ProjectInputSchema } from "../schema";

/**
 * Container-specific implementation of BaseMutator
 * Handles all container-related mutations
 */

export class ProjectMutator extends BaseMutator<ProjectType, ProjectInputType> {
  constructor(pb: TypedPocketBase) {
    super(pb);
    this.defaults = {
      expand: [],
      filter: [],
      sort: ["-updated"],
    };
  }

  protected getCollection() {
    return this.pb.collection("Projects");
  }

  protected async validateInput(input: ProjectInputType) {
    return ProjectInputSchema.parse(input);
  }
}
