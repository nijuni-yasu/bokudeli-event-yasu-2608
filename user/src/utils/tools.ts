import _ from "lodash";
import { QueryConstraint } from "firebase/firestore";

export const checkFiltersEquivalent = (a: QueryConstraint[], b: QueryConstraint[]) => {
  const arrayLength = Math.max(a.length, b.length);
  return !([...Array(arrayLength)].some((__, i) => !_.isEqual(a[i], b[i])))
}
