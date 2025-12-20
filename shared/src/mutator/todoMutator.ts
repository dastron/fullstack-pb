import { TodoInputSchema } from "../schema";
import { TodoInputType, TodoType } from "../types";
import { BaseMutator, MutatorOptions } from "./baseMutator";

export class TodoMutator extends BaseMutator<TodoType, TodoInputType> {
  protected setDefaults(): MutatorOptions {
    return {
      expand: [],
      filter: [],
      sort: ["-updated"],
    };
  }

  protected getCollection() {
    return this.pb.collection("Todos");
  }

  protected async validateInput(input: TodoInputType) {
    return TodoInputSchema.parse(input);
  }
}
