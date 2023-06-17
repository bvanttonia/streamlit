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
  useEffect,
  useState,
  useCallback,
  UIEvent,
  RefObject,
  UIEventHandler,
} from "react"
import { debounce } from "src/lib/util/utils"

export interface ScrollToBottomOptions {
  bottomThreshold?: number
  debounceMs?: number
}

const DEFAULT_BOTTOM_THRESHOLD = 20
const DEFAULT_DEBOUNCE_MS = 100

function useScrollToBottom<T extends HTMLElement>(
  scrollableRef: RefObject<T>,
  options: ScrollToBottomOptions = {}
): UIEventHandler<T> {
  const [sticky, setSticky] = useState(true)

  const handleDOMChanges = useCallback(() => {
    const scrollableDiv = scrollableRef.current

    // Avoid the effort of performing a scroll if there is no need to like:
    // - The user has scrolled, and we are no longer stuck to the bottom.
    // - There's no scrollable div.
    // - The scrollable div is already at the bottom.
    if (
      !sticky ||
      !scrollableDiv ||
      scrollableDiv.scrollTop + scrollableDiv.clientHeight ===
        scrollableDiv.scrollHeight
    ) {
      return
    }

    // Some elements (e.g. charts) will get the final height only a few ms after the first render.
    debounce(options.debounceMs ?? DEFAULT_DEBOUNCE_MS, () => {
      if (sticky && scrollableDiv) {
        scrollableDiv.scrollTo({
          top: scrollableDiv.scrollHeight - scrollableDiv.clientHeight,
          behavior: "smooth",
        })
      }
    })()
  }, [scrollableRef, sticky, options.debounceMs])

  useEffect(() => {
    if (scrollableRef.current) {
      const observer = new MutationObserver(handleDOMChanges)

      // Start observing the target node for configured mutations
      observer.observe(scrollableRef.current, {
        characterData: true,
        childList: true,
        subtree: true,
      })

      return () => {
        observer.disconnect()
      }
    }

    return () => {}
  }, [handleDOMChanges, scrollableRef])

  const handleScroll = (e: UIEvent<T>): void => {
    const bottom =
      e.currentTarget.scrollHeight -
        e.currentTarget.scrollTop -
        e.currentTarget.clientHeight <
      (options.bottomThreshold ?? DEFAULT_BOTTOM_THRESHOLD)

    if (sticky && !bottom) {
      setSticky(false)
    }

    if (!sticky && bottom) {
      setSticky(true)
    }
  }

  return handleScroll
}

export default useScrollToBottom
