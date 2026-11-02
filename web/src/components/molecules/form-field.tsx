import * as React from 'react';
import { Label } from '@/components/atoms/label';
import { Input, type InputProps } from '@/components/atoms/input';
import { cn } from '@/lib/utils';

export interface FormFieldProps extends InputProps {
  label: string;
  error?: string;
  containerClassName?: string;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, id, containerClassName, className, ...props }, ref) => {
    const generatedId = React.useId();
    const fieldId = id || generatedId;
    return (
      <div className={cn('flex flex-col space-y-1.5', containerClassName)}>
        <Label htmlFor={fieldId} className={cn(error && 'text-destructive')}>
          {label}
        </Label>
        <Input
          id={fieldId}
          ref={ref}
          className={cn(error && 'border-destructive focus-visible:border-destructive', className)}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${fieldId}-error`} className="text-xs font-medium text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }
);
FormField.displayName = 'FormField';

