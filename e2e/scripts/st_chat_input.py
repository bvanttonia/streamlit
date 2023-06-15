# Copyright (c) Streamlit Inc. (2018-2022) Snowflake Inc. (2022)
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import streamlit as st

st.write(st.session_state)

st.button("Separate trigger")
if st.button("Populate session state"):
    st.session_state.chat = "Hello world!"

st.text_input("Foo bar")
# Tell a story
st.write("Once upon a time, there was a chat input widget.")
st.write("It was a good widget, and it was used by many people.")
st.write("But one day, it was used by a very special person.")
st.write("And that person was you!")
st.write("And you said:")

st.write("Once upon a time, there was a chat input widget.")
st.write("It was a good widget, and it was used by many people.")
st.write("But one day, it was used by a very special person.")
st.write("And that person was you!")
st.write("And you said:")
st.write("Once upon a time, there was a chat input widget.")
st.write("It was a good widget, and it was used by many people.")
st.write("But one day, it was used by a very special person.")
st.write("And that person was you!")
st.write("And you said:")
st.write("Once upon a time, there was a chat input widget.")
st.write("It was a good widget, and it was used by many people.")
st.write("But one day, it was used by a very special person.")
st.write("And that person was you!")
st.write("And you said:")
st.write("Once upon a time, there was a chat input widget.")
st.write("It was a good widget, and it was used by many people.")
st.write("But one day, it was used by a very special person.")
st.write("And that person was you!")
st.write("And you said:")

output = st.chat_input("How's it going?", key="chat")
st.write(output)
