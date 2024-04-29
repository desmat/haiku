

export function StyledLayers({
  styles,
  className,
  disabled,
  children,
}: {
  styles: any[],
  className?: string,
  disabled?: boolean,
  children?: any,
}) {
  // console.log("StyledLayers", { styles });
  if (disabled) {
    return (
      <div className={className || ""}>
        {children}
      </div>
    )
  }
  
  return (
    <div
      style={styles[0]}
      className={className || ""}
    >
      {styles.length > 0 &&
        <StyledLayers styles={[...styles.slice(1)]}>
          {children}
        </StyledLayers>
      }
      {styles.length == 0 &&
        <>
          {children}
        </>
      }
    </div>
  )
}