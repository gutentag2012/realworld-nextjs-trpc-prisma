import React, { type FunctionComponent } from 'react'

interface SpinnerProps {
  color?: string
  size?: number
}

type Props = SpinnerProps

export const Spinner: FunctionComponent<Props> = ({ color = '#959595', size = 16 }) => {
  const style = {
    '--color': color ?? undefined,
    '--size': size ? `${size}px` : undefined,
  } as React.CSSProperties
  return (
    <div className="spinner" style={style}>
      <div></div>
      <div></div>
      <div></div>
    </div>
  )
}
