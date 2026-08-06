import React from 'react';
import { Input, InputProps } from '../ui/Input';
import { Select, SelectProps } from '../ui/Select';
import { Textarea, TextareaProps } from '../ui/Textarea';

export interface FormFieldProps {
  as?: 'input' | 'select' | 'textarea';
  [key: string]: unknown;
}

export const FormField: React.FC<FormFieldProps & (InputProps | SelectProps | TextareaProps)> = ({
  as = 'input',
  ...props
}) => {
  if (as === 'select') {
    return <Select {...(props as SelectProps)} />;
  }
  if (as === 'textarea') {
    return <Textarea {...(props as TextareaProps)} />;
  }
  return <Input {...(props as InputProps)} />;
};
