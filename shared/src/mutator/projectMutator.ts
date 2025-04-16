import { BaseMutator, MutatorOptions } from "./baseMutator";
import { ProjectInputType, ProjectType, TypedPocketBase } from "../types";
import { ProjectInputSchema } from "../schema";

/**
 * Container-specific implementation of BaseMutator
 * Handles all container-related mutations
 */

export class ProjectMutator extends BaseMutator<ProjectType, ProjectInputType> {
  protected setDefaults(): MutatorOptions {
    return {
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
