import PocketBase from "pocketbase";
import type { RecordService } from "pocketbase";
import type {
  ProjectType,
  UserType,
} from "./types";

export interface TypedPocketBase extends PocketBase {
  collection(idOrName: "Users"): RecordService<UserType>;
  collection(idOrName: "Projects"): RecordService<ProjectType>;
}

const apiURL = import.meta.env.VITE_API_URL ?? "/";
const pb = new PocketBase(apiURL) as TypedPocketBase;

export default pb;
