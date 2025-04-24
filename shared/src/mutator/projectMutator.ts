import { ProjectInputSchema } from "../schema";
import { ProjectInputType, ProjectType } from "../types";
import { BaseMutator, MutatorOptions } from "./baseMutator";

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
