import { InputField } from './InputField';

type TextAreaProps = Omit<React.ComponentProps<typeof InputField>, 'secureTextEntry' | 'multiline'>;

/** Multi-line text input; same props and testID rules as InputField. */
export function TextArea(props: TextAreaProps) {
  return <InputField {...props} multiline />;
}
