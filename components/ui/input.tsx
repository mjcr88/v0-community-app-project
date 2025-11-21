import * as React from 'react'

import { cn } from '@/lib/utils'
import { getInputStateClasses, type ComponentState } from '@/lib/design-system/component-states'

export interface InputProps extends React.ComponentProps<'input'> {
  state?: ComponentState
  hasError?: boolean
}

function Input({ className, type, state = 'default', hasError = false, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={getInputStateClasses(state, hasError, className)}
      {...props}
    />
  )
}

export { Input }
