import { DeepDependency } from "@/core/deep-dependency";

export const print = (message: string) => {
  DeepDependency.doSomething();
  console.log(message);
};
