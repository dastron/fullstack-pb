import { UserInputSchema } from "../schema";
import { UserInputType, UserType } from "../types";
import { BaseMutator, MutatorOptions } from "./baseMutator";

export class UserMutator extends BaseMutator<UserType, UserInputType> {
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

  protected async validateInput(input: UserInputType) {
    return UserInputSchema.parse(input);
  }
}
