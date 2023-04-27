/**
 * Copyright (c) Streamlit Inc. (2018-2022) Snowflake Inc. (2022)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  GridCell,
  Theme as GlideTheme,
  TextCell,
  GridCellKind,
  LoadingCell,
  GridColumn,
  BaseGridCell,
} from "@glideapps/glide-data-grid"
import { toString, merge, isArray } from "lodash"
import moment from "moment"
import numbro from "numbro"

import { Type as ArrowType } from "src/lib/Quiver"
import { notNullOrUndefined, isNullOrUndefined } from "src/lib/utils"

/**
 * Interface used for defining the properties (configuration options) of a column.
 * These options can also be used to overwrite from user-defined column config.
 */
export interface BaseColumnProps {
  // The id of the column:
  readonly id: string
  // The name of the column from the original data:
  readonly name: string
  // The display title of the column:
  readonly title: string
  // The index number of the column:
  readonly indexNumber: number
  // The arrow data type of the column:
  readonly arrowType: ArrowType
  // If `True`, the column can be edited:
  readonly isEditable: boolean
  // If `True`, the column is hidden (will not be shown):
  readonly isHidden: boolean
  // If `True`, the column is a table index:
  readonly isIndex: boolean
  // If `True`, the column is a stretched:
  readonly isStretched: boolean
  // If `True`, a value is required before the cell or row can be submitted:
  readonly isRequired?: boolean
  // The initial width of the column:
  readonly width?: number
  // A help text that is displayed on hovering the column header.
  readonly help?: string
  // Column type selected via column config:
  readonly customType?: string
  // Additional metadata related to the column type:
  readonly columnTypeOptions?: Record<string, any>
  // The content alignment of the column:
  readonly contentAlignment?: "left" | "center" | "right"
  // The default value of the column used when adding a new row:
  readonly defaultValue?: string | number | boolean
  // Theme overrides for this column:
  readonly themeOverride?: Partial<GlideTheme>
  // A custom icon to be displayed in the column header:
  readonly icon?: string
}

/**
 * The interface that is implemented by any column type.
 */
export interface BaseColumn extends BaseColumnProps {
  readonly kind: string
  // Defines the sort mode that should be used for this column type:
  // default: Sorts by interpreting all values as strings.
  // smart: Detects if value is a number or a string and sorts accordingly.
  // raw: Sorts based on the actual type of the cell data value.
  readonly sortMode: "default" | "raw" | "smart"
  // Validate the input data for compatibility with the column type:
  // Either returns a boolean indicating if the data is valid or not, or
  // returns the corrected value.
  validateInput?(data?: any): boolean | any
  // Get a cell with the provided data for the column type:
  getCell(data?: any, validate?: boolean): GridCell
  // Get the raw value of the given cell:
  getCellValue(cell: GridCell): any | null
}

/**
 * A type that describes the function signature used to create a column based on
 * some column properties.
 */
export type ColumnCreator = {
  (props: BaseColumnProps): BaseColumn
  readonly isEditableType: boolean
}

// See pydantic for inspiration: https://pydantic-docs.helpmanual.io/usage/types/#booleans
const BOOLEAN_TRUE_VALUES = ["true", "t", "yes", "y", "on", "1"]
const BOOLEAN_FALSE_VALUES = ["false", "f", "no", "n", "off", "0"]

/**
 * Interface used for indicating if a cell contains an error.
 */
interface ErrorCell extends TextCell {
  readonly isError: true
}

/**
 * Returns a cell with an error message.
 *
 * @param errorMsg: A short error message to use as display value.
 * @param errorDetails: The full error message to show when the user
 *                     clicks on a cell.
 *
 * @return a read-only GridCell object that can be used by glide-data-grid.
 */
export function getErrorCell(errorMsg: string, errorDetails = ""): ErrorCell {
  errorMsg = `⚠️ ${errorMsg}`
  return {
    kind: GridCellKind.Text,
    readonly: true,
    allowOverlay: true,
    data: errorMsg + (errorDetails ? `\n\n${errorDetails}\n` : ""),
    displayData: errorMsg,
    isError: true,
  } as ErrorCell
}

/**
 * Returns `true` if the given cell contains an error.
 * This can happen if the value type is not compatible with
 * the given value type.
 */
export function isErrorCell(cell: GridCell): cell is ErrorCell {
  return cell.hasOwnProperty("isError") && (cell as ErrorCell).isError
}

interface CellWithTooltip extends BaseGridCell {
  readonly tooltip: string
}

/**
 * Returns `true` if the given cell has a tooltip
 */
export function hasTooltip(cell: BaseGridCell): cell is CellWithTooltip {
  return (
    cell.hasOwnProperty("tooltip") && (cell as CellWithTooltip).tooltip !== ""
  )
}
/**
 * Interface used for indicating if a cell contains no value.
 */
interface MissingValueCell extends BaseGridCell {
  readonly isMissingValue: true
}

/**
 * Returns `true` if the given cell contains no value (-> missing value).
 * For example, a number cell that contains null is interpreted as a missing value.
 */
export function isMissingValueCell(
  cell: BaseGridCell
): cell is MissingValueCell {
  return (
    cell.hasOwnProperty("isMissingValue") &&
    (cell as MissingValueCell).isMissingValue
  )
}

/**
 * Returns an empty cell.
 */
export function getEmptyCell(): LoadingCell {
  return {
    kind: GridCellKind.Loading,
    allowOverlay: false,
  } as LoadingCell
}

/**
 * Returns an empty text cell.
 *
 * @param readonly: If true, returns a read-only version of the cell.
 * @param faded: If true, returns a faded version of the cell.
 *
 * @return a GridCell object that can be used by glide-data-grid.
 */
export function getTextCell(readonly: boolean, faded: boolean): TextCell {
  const style = faded ? "faded" : "normal"
  return {
    kind: GridCellKind.Text,
    data: "",
    displayData: "",
    allowOverlay: true,
    readonly,
    style,
  } as TextCell
}

/**
 * Converts from our BaseColumn format to the glide-data-grid compatible GridColumn.
 */
export function toGlideColumn(column: BaseColumn): GridColumn {
  return {
    id: column.id,
    title: column.title,
    hasMenu: false,
    themeOverride: column.themeOverride,
    icon: column.icon,
    ...(column.isStretched && {
      grow: column.isIndex ? 1 : 3,
    }),
    ...(column.width && {
      width: column.width,
    }),
  } as GridColumn
}

/**
 * Merges the default column parameters with the user-defined column parameters.
 *
 * @param defaultParams - The default column parameters.
 * @param userParams - The user-defined column parameters.
 *
 * @returns The merged column parameters.
 */
export function mergeColumnParameters(
  defaultParams: Record<string, any> | undefined | null,
  userParams: Record<string, any> | undefined | null
): Record<string, any> {
  if (isNullOrUndefined(defaultParams)) {
    return userParams || {}
  }

  if (isNullOrUndefined(userParams)) {
    return defaultParams || {}
  }

  return merge(defaultParams, userParams)
}

/**
 * Converts the given value of unknown type to an array without
 * the risks of any exceptions.
 *
 * @param data - The value to convert to an array.
 *
 * @returns The converted array or an empty array if the value cannot be interpreted as an array.
 */
export function toSafeArray(data: any): any[] {
  if (isNullOrUndefined(data)) {
    return []
  }

  if (typeof data === "number" || typeof data === "boolean") {
    // Single number or boolean
    return [data]
  }

  if (typeof data === "string") {
    if (data === "") {
      // Empty string
      return []
    }

    // Try to parse string to an array
    if (data.trim().startsWith("[") && data.trim().endsWith("]")) {
      // Support for JSON arrays: ["foo", 1, null, "test"]
      try {
        return JSON.parse(data)
      } catch (error) {
        return [data]
      }
    } else {
      // Support for comma-separated values: "foo,1,,test"
      return data.split(",")
    }
  }

  try {
    const parsedData = JSON.parse(
      JSON.stringify(data, (_key, value) =>
        typeof value === "bigint" ? Number(value) : value
      )
    )
    if (!isArray(parsedData)) {
      return [toSafeString(parsedData)]
    }

    return parsedData.map((value: any) =>
      ["string", "number", "boolean", "null"].includes(typeof value)
        ? value
        : toSafeString(value)
    )
  } catch (error) {
    return [toSafeString(data)]
  }
}

/**
 * Converts the given value of unknown type to a string without
 * the risks of any exceptions.
 *
 * @param data - The value to convert to a string.
 *
 * @return The converted string or a string showing the type of the object as fallback.
 */
export function toSafeString(data: any): string {
  try {
    try {
      return toString(data)
    } catch (error) {
      return JSON.stringify(data, (_key, value) =>
        typeof value === "bigint" ? Number(value) : value
      )
    }
  } catch (error) {
    // This is most likely an object that cannot be converted to a string
    // console.log converts this to `[object Object]` which we are doing here as well:
    return `[${typeof data}]`
  }
}

/**
 * Converts the given value of unknown type to a boolean without
 * the risks of any exceptions.
 *
 * @param value - The value to convert to a boolean.
 *
 * @return The converted boolean, null if the value is empty or undefined if the
 *         value cannot be interpreted as a boolean.
 */
export function toSafeBoolean(value: any): boolean | null | undefined {
  if (isNullOrUndefined(value)) {
    return null
  }

  if (typeof value === "boolean") {
    return value
  }

  const cleanedValue = toSafeString(value).toLowerCase().trim()
  if (cleanedValue === "") {
    return null
  } else if (BOOLEAN_TRUE_VALUES.includes(cleanedValue)) {
    return true
  } else if (BOOLEAN_FALSE_VALUES.includes(cleanedValue)) {
    return false
  }
  // The value cannot be interpreted as boolean
  return undefined
}

/**
 * Converts the given value of unknown type to a number without
 * the risks of any exceptions.
 *
 * @param value - The value to convert to a number.
 *
 * @returns The converted number or null if the value is empty or undefined or NaN if the
 *          value cannot be interpreted as a number.
 */
export function toSafeNumber(value: any): number | null {
  // TODO(lukasmasuch): Should this return null as replacement for NaN?

  if (isNullOrUndefined(value)) {
    return null
  }

  if (isArray(value)) {
    return NaN
  }

  if (typeof value === "string") {
    if (value.trim().length === 0) {
      // Empty string should return null
      return null
    }

    try {
      // Try to convert string to number via numbro:
      // https://numbrojs.com/old-format.html#unformat
      const unformattedValue = numbro.unformat(value.trim())
      if (notNullOrUndefined(unformattedValue)) {
        return unformattedValue
      }
    } catch (error) {
      // Do nothing here
    }
  } else if (value instanceof Int32Array) {
    // int values need to be extracted this way:
    // eslint-disable-next-line prefer-destructuring
    return Number(value[0])
  }

  return Number(value)
}

/**
 * Formats the given number to a string with the given maximum precision.
 *
 * @param value - The number to format.
 * @param maxPrecision - The maximum number of decimals to show.
 * @param keepTrailingZeros - Whether to keep trailing zeros.
 *
 * @returns The formatted number as a string.
 */
export function formatNumber(
  value: number,
  maxPrecision = 4,
  keepTrailingZeros = false
): string {
  if (!Number.isNaN(value) && Number.isFinite(value)) {
    if (maxPrecision === 0) {
      // Numbro is unable to format the number with 0 decimals.
      value = Math.round(value)
    }
    return numbro(value).format(
      keepTrailingZeros
        ? `0,0.${"0".repeat(maxPrecision)}`
        : `0,0.[${"0".repeat(maxPrecision)}]`
    )
  }
  return ""
}

/**
 * Converts the given value of unknown type to a date without
 * the risks of any exceptions.
 *
 * Note: Unix timestamps are only supported in seconds.
 *
 * @param value - The value to convert to a date.
 *
 * @returns The converted date or null if the value cannot be interpreted as a date.
 */
export function toSafeDate(value: any): Date | null | undefined {
  if (isNullOrUndefined(value)) {
    return null
  }

  // Return the value as-is if it is already a date
  if (value instanceof Date) {
    if (!isNaN(value.getTime())) {
      return value
    }
    return undefined
  }

  if (typeof value === "string" && value.trim().length === 0) {
    // Empty string should return null
    return null
  }

  try {
    const parsedTimestamp = Number(value)
    if (!isNaN(parsedTimestamp)) {
      // Unix timestamps can be have different units.
      // As default, we handle the unit as second, but
      // if it larger than a certain threshold, we assume
      // a different unit. This is not 100% accurate, but
      // should be good enough since it is unlikely that
      // users are actually referring to years >= 5138.
      let timestampInSeconds = parsedTimestamp
      if (parsedTimestamp >= 10 ** 18) {
        // Assume that the timestamp is in nanoseconds
        // and adjust to seconds
        timestampInSeconds = parsedTimestamp / 1000 ** 3
      } else if (parsedTimestamp >= 10 ** 15) {
        // Assume that the timestamp is in microseconds
        // and adjust to seconds
        timestampInSeconds = parsedTimestamp / 1000 ** 2
      } else if (parsedTimestamp >= 10 ** 12) {
        // Assume that the timestamp is in milliseconds
        // and adjust to seconds
        timestampInSeconds = parsedTimestamp / 1000
      }

      // Parse it as a unix timestamp in seconds
      const parsedMomentDate = moment.unix(timestampInSeconds).utc()
      if (parsedMomentDate.isValid()) {
        return parsedMomentDate.toDate()
      }
    }

    if (typeof value === "string") {
      // Try to parse string via momentJS:
      const parsedMomentDate = moment.utc(value)
      if (parsedMomentDate.isValid()) {
        return parsedMomentDate.toDate()
      }
      // The pasted value was not a valid date string
      // Try to interpret value as time string instead (HH:mm:ss)
      const parsedMomentTime = moment.utc(value, [
        moment.HTML5_FMT.TIME_MS, // HH:mm:ss.SSS
        moment.HTML5_FMT.TIME_SECONDS, // HH:mm:ss
        moment.HTML5_FMT.TIME, // HH:mm
      ])
      if (parsedMomentTime.isValid()) {
        return parsedMomentTime.toDate()
      }
    }
  } catch (error) {
    return undefined
  }

  // Unable to interpret this value as a date:
  return undefined
}

/**
 * Count the number of decimals in a number.
 *
 * @param {number} value - The number to count the decimals for.
 *
 * @returns {number} The number of decimals.
 */
export function countDecimals(value: number): number {
  if (value % 1 === 0) {
    return 0
  }

  let numberStr = value.toString()

  if (numberStr.indexOf("e") !== -1) {
    // Handle scientific notation
    numberStr = value.toLocaleString("fullwide", {
      useGrouping: false,
      maximumFractionDigits: 20,
    })
  }

  if (numberStr.indexOf(".") === -1) {
    // Fallback to 0 decimals, this can happen with
    // extremely large or small numbers
    return 0
  }

  return numberStr.split(".")[1].length
}

/**
 * Truncates a number to a specified number of decimal places without rounding.
 *
 * @param {number} value - The number to be truncated.
 * @param {number} decimals - The number of decimal places to preserve after truncation.
 *
 * @returns {number} The truncated number.
 *
 * @example
 * truncateDecimals(3.14159265, 2); // returns 3.14
 * truncateDecimals(123.456, 0); // returns 123
 */
export function truncateDecimals(value: number, decimals: number): number {
  return decimals === 0
    ? Math.trunc(value)
    : Math.trunc(value * 10 ** decimals) / 10 ** decimals
}
