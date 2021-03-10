import { stub } from "sinon";
import { extend } from "lodash";

export function stubEnv(newValues: Record<string, unknown>): void {
  const extendedEnv = extend({}, process.env, newValues);
  stub(process, "env").value(extendedEnv);
}
