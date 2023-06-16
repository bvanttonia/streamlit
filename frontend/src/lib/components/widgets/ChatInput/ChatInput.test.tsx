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

import React from "react"
import "@testing-library/jest-dom"
import { render } from "src/lib/test_util"
import { fireEvent } from "@testing-library/react"
import { ChatInput as ChatInputProto } from "src/lib/proto"
import { WidgetStateManager } from "src/lib/WidgetStateManager"

import ChatInput, { Props } from "./ChatInput"

const getProps = (elementProps: Partial<ChatInputProto> = {}): Props => ({
  element: ChatInputProto.create({
    id: "123",
    placeholder: "Enter Text Here",
    disabled: false,
    default: "",
    position: ChatInputProto.Position.BOTTOM,
    ...elementProps,
  }),
  width: 0,
  disabled: false,
  widgetMgr: new WidgetStateManager({
    sendRerunBackMsg: jest.fn(),
    formsDataChanged: jest.fn(),
  }),
})

describe("ChatInput widget", () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("renders without crashing", () => {
    const props = getProps()
    const rtlResults = render(<ChatInput {...props} />)
    expect(rtlResults).toBeDefined()
  })

  it("shows a placeholder", () => {
    const props = getProps()
    const { container } = render(<ChatInput {...props} />)
    const textareas = container.getElementsByTagName("textarea")
    expect(textareas.length).toEqual(1)
    expect(textareas[0].placeholder).toEqual(props.element.placeholder)
  })

  it("sets the aria label to the placeholder", () => {
    const props = getProps()
    const { container } = render(<ChatInput {...props} />)
    const textareas = container.getElementsByTagName("textarea")
    expect(textareas.length).toEqual(1)
    expect(textareas[0].getAttribute("aria-label")).toEqual(
      props.element.placeholder
    )
  })

  it("sets the value intially to the element default", () => {
    const props = getProps()
    const { container } = render(<ChatInput {...props} />)
    const textareas = container.getElementsByTagName("textarea")
    expect(textareas.length).toEqual(1)
    expect(textareas[0].value).toEqual(props.element.default)
  })

  it("sets the value when values are typed in", () => {
    const props = getProps()
    const { container } = render(<ChatInput {...props} />)
    const textareas = container.getElementsByTagName("textarea")
    expect(textareas.length).toEqual(1)
    fireEvent.change(textareas[0], { target: { value: "Sample text" } })
    expect(textareas[0].value).toEqual("Sample text")
  })

  it("does not increase text value when maxChars is set", () => {
    const props = getProps({ maxChars: 10 })
    const { container } = render(<ChatInput {...props} />)
    const textareas = container.getElementsByTagName("textarea")
    expect(textareas.length).toEqual(1)
    fireEvent.change(textareas[0], { target: { value: "1234567890" } })
    expect(textareas[0].value).toEqual("1234567890")
    fireEvent.change(textareas[0], { target: { value: "12345678901" } })
    expect(textareas[0].value).toEqual("1234567890")
  })

  it("sends and resets the value on enter", () => {
    const props = getProps()
    const spy = jest.spyOn(props.widgetMgr, "setStringTriggerValue")
    const { container } = render(<ChatInput {...props} />)
    const textareas = container.getElementsByTagName("textarea")
    expect(textareas.length).toEqual(1)
    fireEvent.change(textareas[0], { target: { value: "1234567890" } })
    expect(textareas[0].value).toEqual("1234567890")
    fireEvent.keyDown(textareas[0], { key: "Enter" })
    expect(spy).toHaveBeenCalledWith(props.element, "1234567890", {
      fromUi: true,
    })
    expect(textareas[0].value).toEqual("")
  })

  it("will send an empty value on enter if empty", () => {
    const props = getProps()
    const spy = jest.spyOn(props.widgetMgr, "setStringTriggerValue")
    const { container } = render(<ChatInput {...props} />)
    const textareas = container.getElementsByTagName("textarea")
    expect(textareas.length).toEqual(1)
    fireEvent.keyDown(textareas[0], { key: "Enter" })
    expect(spy).toHaveBeenCalledWith(props.element, "", {
      fromUi: true,
    })
    expect(textareas[0].value).toEqual("")
  })

  it("will show instructions when the text has changed and reset when submitted", () => {
    const props = getProps()
    const { container, getAllByTestId } = render(<ChatInput {...props} />)
    const textareas = container.getElementsByTagName("textarea")
    expect(textareas.length).toEqual(1)
    const instructions = getAllByTestId("InputInstructions")
    expect(instructions.length).toEqual(1)
    expect(instructions[0].textContent).toEqual("")
    fireEvent.change(textareas[0], { target: { value: "1234567890" } })
    expect(instructions[0].textContent).toEqual("Press Enter to apply")
    fireEvent.keyDown(textareas[0], { key: "Enter" })
    expect(instructions[0].textContent).toEqual("")
  })

  it("does not send/clear on shift + enter", () => {
    const props = getProps()
    const spy = jest.spyOn(props.widgetMgr, "setStringTriggerValue")
    const { container } = render(<ChatInput {...props} />)
    const textareas = container.getElementsByTagName("textarea")
    expect(textareas.length).toEqual(1)
    fireEvent.change(textareas[0], { target: { value: "1234567890" } })
    expect(textareas[0].value).toEqual("1234567890")
    fireEvent.keyDown(textareas[0], { key: "Enter", shiftKey: true })
    // We cannot test the value to be changed cause that is essentially a
    // change event.
    expect(textareas[0].value).not.toEqual("")
    expect(spy).not.toHaveBeenCalled()
  })

  it("does not send/clear on ctrl + enter", () => {
    const props = getProps()
    const spy = jest.spyOn(props.widgetMgr, "setStringTriggerValue")
    const { container } = render(<ChatInput {...props} />)
    const textareas = container.getElementsByTagName("textarea")
    expect(textareas.length).toEqual(1)
    fireEvent.change(textareas[0], { target: { value: "1234567890" } })
    expect(textareas[0].value).toEqual("1234567890")
    fireEvent.keyDown(textareas[0], { key: "Enter", ctrlKey: true })
    // We cannot test the value to be changed cause that is essentially a
    // change event.
    expect(textareas[0].value).not.toEqual("")
    expect(spy).not.toHaveBeenCalled()
  })

  it("does not send/clear on meta + enter", () => {
    const props = getProps()
    const spy = jest.spyOn(props.widgetMgr, "setStringTriggerValue")
    const { container } = render(<ChatInput {...props} />)
    const textareas = container.getElementsByTagName("textarea")
    expect(textareas.length).toEqual(1)
    fireEvent.change(textareas[0], { target: { value: "1234567890" } })
    expect(textareas[0].value).toEqual("1234567890")
    fireEvent.keyDown(textareas[0], { key: "Enter", metaKey: true })
    // We cannot test the value to be changed cause that is essentially a
    // change event.
    expect(textareas[0].value).not.toEqual("")
    expect(spy).not.toHaveBeenCalled()
  })
})
