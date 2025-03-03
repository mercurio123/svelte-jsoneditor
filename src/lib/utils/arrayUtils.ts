import { isObject } from './typeUtils.js'
import type { JSONArray, JSONObject } from 'immutable-json-patch'
import { compileJSONPointer, parseJSONPointer } from 'immutable-json-patch'
import { isEqual } from 'lodash-es'

const MAX_ITEM_PATHS_COLLECTION = 10000
const EMPTY_ARRAY = []

/**
 * Comparator to sort an array in ascending order
 *
 * Usage:
 *     [4,2,5].sort(compareAsc)    // [2,4,5]
 */
export function compareAsc<T>(a: T, b: T): number {
  return a > b ? 1 : a < b ? -1 : 0
}

/**
 * Comparator to sort an array in ascending order
 *
 * Usage:
 *     [4,2,5].sort(compareDesc)   // [5,4,2]
 */
export function compareDesc<T>(a: T, b: T): number {
  return a > b ? -1 : a < b ? 1 : 0
}

/**
 * Test whether all items of an array are strictly equal
 */
export function strictShallowEqual<T>(a: Array<T>, b: Array<T>): boolean {
  if (a.length !== b.length) {
    return false
  }

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false
    }
  }

  return true
}

export function compareArrays<T>(a: Array<T>, b: Array<T>): number {
  const minLength = Math.min(a.length, b.length)

  for (let i = 0; i < minLength; i++) {
    if (a[i] < b[i]) {
      return -1
    }

    if (a[i] > b[i]) {
      return 1
    }
  }

  return a.length - b.length
}

/**
 * Get the paths of all nested properties in the items of an array
 * @param {JSONValue} array
 * @param {boolean} [includeObjects=false] If true, object and array paths are returned as well
 * @return {Path[]}
 */
export function getNestedPaths(array, includeObjects = false) {
  const pointersMap = {}

  if (!Array.isArray(array)) {
    throw new TypeError('Array expected')
  }

  function recurseNestedPaths(obj, path) {
    const isValue = !Array.isArray(obj) && !isObject(obj)

    if (isValue || (includeObjects && path.length > 0)) {
      pointersMap[compileJSONPointer(path)] = true
    }

    if (isObject(obj)) {
      Object.keys(obj).forEach((key) => {
        recurseNestedPaths(obj[key], path.concat(key))
      })
    }
  }

  const max = Math.min(array.length, MAX_ITEM_PATHS_COLLECTION)
  for (let i = 0; i < max; i++) {
    const item = array[i]
    recurseNestedPaths(item, EMPTY_ARRAY)
  }

  const pathsArray = Object.keys(pointersMap).sort()

  return pathsArray.map(parseJSONPointer)
}

/**
 * Invoke the callback with
 * @param start   Included start index
 * @param end       Excluded end index. End must be larger or equal to start
 * @param iteratee
 */
// TODO: write tests
export function forEachIndex(start: number, end: number, iteratee: (index: number) => void) {
  if (end <= start) {
    return
  }

  for (let index = start; index < end; index++) {
    iteratee(index)
  }
}

/**
 * Limit the number of items in an array
 */
// TODO: write unit test
export function limit<T>(array: Array<T>, max: number): Array<T> {
  return array.length > max ? array.slice(0, max) : array
}

/**
 * Convert an array into an object having the array indices as keys
 */
export function arrayToObject(array: JSONArray): JSONObject {
  return {
    ...array
  } as unknown as JSONObject
}

/**
 * Get the values of an object as an array
 */
export function objectToArray(object: JSONObject): JSONArray {
  return Object.values(object) as unknown as JSONArray
}

/**
 * Test whether an array starts with a sub array
 */
export function arrayStartsWith<T>(
  array: T[],
  searchArray: T[],
  equal: (a: T, b: T) => boolean = isEqual
): boolean {
  for (let i = 0; i < searchArray.length; i++) {
    if (!equal(array[i], searchArray[i])) {
      return false
    }
  }

  return true
}

/**
 * Move a set of items inside an array
 */
export function moveItems<T>(array: T[], index: number, count: number, offset: number): T[] {
  // TODO: check boundaries: index+offset >= 0, index+offset+count<array.length, index+count<array.length, etc
  const copy = array.slice(0)
  const moving: T[] = copy.splice(index, count)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  copy.splice.apply(copy, [index + offset, 0, ...moving])
  return copy
}
