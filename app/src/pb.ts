import { TypedPocketBase } from "@project/shared/types";
import PocketBase from "pocketbase";


const apiURL = import.meta.env.VITE_API_URL ?? "/";
const pb = new PocketBase(apiURL) as TypedPocketBase;

export default pb;
