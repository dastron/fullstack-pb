import { TypedPocketBase } from "@project/shared/types";
import PocketBase from "pocketbase";

const PB_URL = import.meta.env.VITE_POCKETBASE_URL ?? "/";
const pb = new PocketBase(PB_URL) as TypedPocketBase;

export default pb;
