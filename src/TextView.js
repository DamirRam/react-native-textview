/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
"use strict";

import React from "react";
import {
  Platform,
  findNodeHandle,
  Text,
  TouchableWithoutFeedback,
  UIManager,
  requireNativeComponent,
  StyleSheet,
} from "react-native";
const createReactClass = require("create-react-class");
const invariant = require("invariant");

const TextAncestor = require("./files/TextAncestor");
const TextInputState = require("./TextInputState");

let AndroidTextInput;
let RCTMultilineTextInputView;
let RCTSinglelineTextInputView;

if (Platform.OS === "android") {
  AndroidTextInput = requireNativeComponent("SNTextView");
} else if (Platform.OS === "ios") {
  RCTMultilineTextInputView = requireNativeComponent(
    "RCTMultilineTextInputView"
  );
  RCTSinglelineTextInputView = requireNativeComponent(
    "RCTSinglelineTextInputView"
  );
}

const onlyMultiline = {
  onTextInput: true,
  children: true,
};

const TextView = createReactClass({
  displayName: "TextView",
  statics: {
    State: {
      currentlyFocusedField: TextInputState.currentlyFocusedField,
      focusTextInput: TextInputState.focusTextInput,
      blurTextInput: TextInputState.blurTextInput,
    },
  },
  getDefaultProps() {
    return {
      allowFontScaling: true,
      rejectResponderTermination: true,
      underlineColorAndroid: "transparent",
    };
  },

  _inputRef: undefined,
  _focusSubscription: undefined,
  _lastNativeText: undefined,
  _lastNativeSelection: undefined,
  _rafId: null,

  componentDidMount: function () {
    this._lastNativeText = this.props.value;
    const tag = findNodeHandle(this._inputRef);
    if (tag != null) {
      // tag is null only in unit tests
      TextInputState.registerInput(tag);
    }

    // TODO: add autoFocus function
    // if (this.props.autoFocus) {
    //   this._rafId = requestAnimationFrame(this._inputRef?.focus);
    // }
  },

  componentWillUnmount: function () {
    this._focusSubscription && this._focusSubscription.remove();
    if (this.isFocused()) {
      this._inputRef?.blur();
    }
    const tag = findNodeHandle(this._inputRef);
    if (tag != null) {
      TextInputState.unregisterInput(tag);
    }

    // TODO: add autoFocus function
    // if (this._rafId != null) {
    //   cancelAnimationFrame(this._rafId);
    // }
  },

  /**
   * Removes all text from the `TextInput`.
   */

  //TODO: not work correctly, not clear text in textInput
  clear: function () {
    if (this._inputRef && this._inputRef.setNativeProps) {
      this._inputRef.setNativeProps({ text: "" });
    }
  },

  /**
   * Returns `true` if the input is currently focused; `false` otherwise.
   */
  //TODO: not work correctly, always return false
  isFocused: function () {
    return (
      TextInputState.currentlyFocusedField() === findNodeHandle(this._inputRef)
    );
  },

  focus: function () {
    this._inputRef?.focus();
  },

  blur: function () {
    this._inputRef?.blur();
  },

  render: function () {
    let textInput;
    if (Platform.OS === "ios") {
      textInput = UIManager.getViewManagerConfig("RCTVirtualText")
        ? this._renderIOS()
        : this._renderIOSLegacy();
    } else if (Platform.OS === "android") {
      textInput = this._renderAndroid();
    }
    return (
      <TextAncestor.Provider value={true}>{textInput}</TextAncestor.Provider>
    );
  },

  _getText: function () {
    return typeof this.props.value === "string"
      ? this.props.value
      : typeof this.props.defaultValue === "string"
      ? this.props.defaultValue
      : "";
  },

  _setNativeRef: function (ref) {
    this._inputRef = ref;
  },

  _renderIOSLegacy: function () {
    let textContainer;

    const props = Object.assign({}, this.props);
    props.style = [this.props.style];

    if (props.selection && props.selection.end == null) {
      props.selection = {
        start: props.selection.start,
        end: props.selection.start,
      };
    }

    if (!props.multiline) {
      if (__DEV__) {
        for (const propKey in onlyMultiline) {
          if (props[propKey]) {
            const error = new Error(
              "TextInput prop `" +
                propKey +
                "` is only supported with multiline."
            );
            console.warn(false, "%s", error.stack);
          }
        }
      }
      textContainer = (
        <RCTSinglelineTextInputView
          ref={this._setNativeRef}
          {...props}
          onFocus={this._onFocus}
          onBlur={this._onBlur}
          onChange={this._onChange}
          onSelectionChange={this._onSelectionChange}
          onSelectionChangeShouldSetResponder={emptyFunctionThatReturnsTrue}
          text={this._getText()}
        />
      );
    } else {
      let children = props.children;
      let childCount = 0;
      React.Children.forEach(children, () => ++childCount);
      invariant(
        !(props.value && childCount),
        "Cannot specify both value and children."
      );
      if (childCount >= 1) {
        children = (
          <Text
            style={props.style}
            allowFontScaling={props.allowFontScaling}
            maxFontSizeMultiplier={props.maxFontSizeMultiplier}
          >
            {children}
          </Text>
        );
      }
      if (props.inputView) {
        children = [children, props.inputView];
      }
      props.style.unshift(styles.multilineInput);
      textContainer = (
        <RCTMultilineTextInputView
          ref={this._setNativeRef}
          {...props}
          children={children}
          onFocus={this._onFocus}
          onBlur={this._onBlur}
          onChange={this._onChange}
          onContentSizeChange={this.props.onContentSizeChange}
          onSelectionChange={this._onSelectionChange}
          onTextInput={this._onTextInput}
          onSelectionChangeShouldSetResponder={emptyFunctionThatReturnsTrue}
          text={this._getText()}
          dataDetectorTypes={this.props.dataDetectorTypes}
          onScroll={this._onScroll}
        />
      );
    }

    return (
      <TouchableWithoutFeedback
        onLayout={props.onLayout}
        onPress={this._onPress}
        rejectResponderTermination={true}
        accessible={props.accessible}
        accessibilityLabel={props.accessibilityLabel}
        accessibilityRole={props.accessibilityRole}
        accessibilityStates={props.accessibilityStates}
        accessibilityState={props.accessibilityState}
        nativeID={this.props.nativeID}
        testID={props.testID}
      >
        {textContainer}
      </TouchableWithoutFeedback>
    );
  },

  _renderIOS: function () {
    const props = Object.assign({}, this.props);
    props.style = [this.props.style];

    if (props.selection && props.selection.end == null) {
      props.selection = {
        start: props.selection.start,
        end: props.selection.start,
      };
    }

    const RCTTextInputView = props.multiline
      ? RCTMultilineTextInputView
      : RCTSinglelineTextInputView;

    if (props.multiline) {
      props.style.unshift(styles.multilineInput);
    }

    const textContainer = (
      <RCTTextInputView
        ref={this._setNativeRef}
        {...props}
        onFocus={this._onFocus}
        onBlur={this._onBlur}
        onChange={this._onChange}
        onContentSizeChange={this.props.onContentSizeChange}
        onSelectionChange={this._onSelectionChange}
        onTextInput={this._onTextInput}
        onSelectionChangeShouldSetResponder={emptyFunctionThatReturnsTrue}
        text={this._getText()}
        dataDetectorTypes={this.props.dataDetectorTypes}
        onScroll={this._onScroll}
      />
    );

    return (
      <TouchableWithoutFeedback
        onLayout={props.onLayout}
        onPress={this._onPress}
        rejectResponderTermination={props.rejectResponderTermination}
        accessible={props.accessible}
        accessibilityLabel={props.accessibilityLabel}
        accessibilityRole={props.accessibilityRole}
        accessibilityStates={props.accessibilityStates}
        accessibilityState={props.accessibilityState}
        nativeID={this.props.nativeID}
        testID={props.testID}
      >
        {textContainer}
      </TouchableWithoutFeedback>
    );
  },

  _renderAndroid: function () {
    const props = Object.assign({}, this.props);
    props.style = [this.props.style];
    props.autoCapitalize = props.autoCapitalize || "sentences";
    let children = this.props.children;
    let childCount = 0;
    React.Children.forEach(children, () => ++childCount);
    invariant(
      !(this.props.value && childCount),
      "Cannot specify both value and children."
    );
    if (childCount > 1) {
      children = <Text>{children}</Text>;
    }

    if (props.selection && props.selection.end == null) {
      props.selection = {
        start: props.selection.start,
        end: props.selection.start,
      };
    }

    const textContainer = (
      <AndroidTextInput
        ref={this._setNativeRef}
        {...props}
        mostRecentEventCount={0}
        onFocus={this._onFocus}
        onBlur={this._onBlur}
        onChange={this._onChange}
        onSelectionChange={this._onSelectionChange}
        onTextInput={this._onTextInput}
        text={this._getText()}
        children={children}
        disableFullscreenUI={this.props.disableFullscreenUI}
        textBreakStrategy={this.props.textBreakStrategy}
        onScroll={this._onScroll}
      />
    );

    return (
      <TouchableWithoutFeedback
        onLayout={props.onLayout}
        onPress={this._onPress}
        accessible={this.props.accessible}
        accessibilityLabel={this.props.accessibilityLabel}
        accessibilityRole={this.props.accessibilityRole}
        accessibilityStates={this.props.accessibilityStates}
        accessibilityState={this.props.accessibilityState}
        nativeID={this.props.nativeID}
        testID={this.props.testID}
      >
        {textContainer}
      </TouchableWithoutFeedback>
    );
  },

  _onFocus: function (event) {
    if (this.props.onFocus) {
      this.props.onFocus(event);
    }

    if (this.props.selectionState) {
      this.props.selectionState.focus();
    }
  },

  _onPress: function (event) {
    if (this.props.editable || this.props.editable === undefined) {
      this._inputRef?.focus();
    }
  },

  _onChange: function (event) {
    // Make sure to fire the mostRecentEventCount first so it is already set on
    // native when the text value is set.
    if (this._inputRef && this._inputRef.setNativeProps) {
      this._inputRef.setNativeProps(this._inputRef, {
        mostRecentEventCount: event.nativeEvent.eventCount,
      });
    }

    const text = event.nativeEvent.text;
    this.props.onChange && this.props.onChange(event);
    this.props.onChangeText && this.props.onChangeText(text);

    if (!this._inputRef) {
      // calling `this.props.onChange` or `this.props.onChangeText`
      // may clean up the input itself. Exits here.
      return;
    }

    this._lastNativeText = text;
  },

  _onSelectionChange: function (event) {
    this.props.onSelectionChange && this.props.onSelectionChange(event);

    if (!this._inputRef) {
      // calling `this.props.onSelectionChange`
      // may clean up the input itself. Exits here.
      return;
    }

    this._lastNativeSelection = event.nativeEvent.selection;
  },

  componentDidUpdate: function () {
    // This is necessary in case native updates the text and JS decides
    // that the update should be ignored and we should stick with the value
    // that we have in JS.
    const nativeProps = {};

    if (
      this._lastNativeText !== this.props.value &&
      typeof this.props.value === "string"
    ) {
      nativeProps.text = this.props.value;
    }

    // Selection is also a controlled prop, if the native value doesn't match
    // JS, update to the JS value.
    const { selection } = this.props;
    if (
      this._lastNativeSelection &&
      selection &&
      (this._lastNativeSelection.start !== selection.start ||
        this._lastNativeSelection.end !== selection.end)
    ) {
      nativeProps.selection = this.props.selection;
    }

    if (
      Object.keys(nativeProps).length > 0 &&
      this._inputRef &&
      this._inputRef.setNativeProps
    ) {
      this._inputRef.setNativeProps(this._inputRef, nativeProps);
    }

    if (this.props.selectionState && selection) {
      this.props.selectionState.update(selection.start, selection.end);
    }
  },

  _onBlur: function (event) {
    // This is a hack to fix https://fburl.com/toehyir8
    // @todo(rsnara) Figure out why this is necessary.
    this._inputRef?.blur();
    if (this.props.onBlur) {
      this.props.onBlur(event);
    }

    if (this.props.selectionState) {
      this.props.selectionState.blur();
    }
  },

  _onTextInput: function (event) {
    this.props.onTextInput && this.props.onTextInput(event);
  },

  _onScroll: function (event) {
    this.props.onScroll && this.props.onScroll(event);
  },
});

const styles = StyleSheet.create({
  multilineInput: {
    // This default top inset makes RCTMultilineTextInputView seem as close as possible
    // to single-line RCTSinglelineTextInputView defaults, using the system defaults
    // of font size 17 and a height of 31 points.
    paddingTop: 5,
  },
});

module.exports = TextView;
