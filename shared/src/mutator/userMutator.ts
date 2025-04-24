import { BaseMutator, MutatorOptions } from "./baseMutator";
import { UserInputType, UserType, TypedPocketBase } from "../types";
import { UserInputSchema } from "../schema";

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
