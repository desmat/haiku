

export function StyledLayers({ styles, disabled, children }: { styles: any[], disabled?: boolean, children?: any }) {
  // console.log("StyledLayers", { styles });
  if (disabled) {
    return (
      <>
        {children}
      </>
    )
  }
  return (
    <div style={styles[0]}>
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