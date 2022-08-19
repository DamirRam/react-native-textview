import { Component } from "react";
import { TextInputProps } from "react-native";

interface Props {
  language?: "ru" | "en" | "pl";
}

class TextView extends Component<
  Props & Omit<TextInputProps, "autoFocus", "clear", "isFocused">
> {
  focus: () => void;
  blur: () => void;
  //TODO: uncomment when functions work will be fixed
  //clear: () => void;
  //isFocused: () => boolean;
}

export default TextView;
