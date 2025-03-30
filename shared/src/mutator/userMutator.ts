import { BaseMutator } from "./baseMutator";
import { UserInputType, UserType, TypedPocketBase } from "../types";
import { UserInputSchema } from "../schema";

/**
 * Container-specific implementation of BaseMutator
 * Handles all container-related mutations
 */

export class UserMutator extends BaseMutator<UserType, UserInputType> {
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

  protected async validateInput(input: UserInputType) {
    return UserInputSchema.parse(input);
  }
}
