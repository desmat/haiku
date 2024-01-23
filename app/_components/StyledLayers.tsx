

export function StyledLayers({ styles, children }: { styles: any[], children?: any }) {
  // console.log("StyledLayers", { styles });
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