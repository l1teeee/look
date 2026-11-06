function roundedRectPath(
  left: number,
  top: number,
  width: number,
  height: number,
  radius: number,
): string {
  const right = left + width;
  const bottom = top + height;

  return [
    `M${left + radius} ${top}`,
    `H${right - radius}`,
    `A${radius} ${radius} 0 0 1 ${right} ${top + radius}`,
    `V${bottom - radius}`,
    `A${radius} ${radius} 0 0 1 ${right - radius} ${bottom}`,
    `H${left + radius}`,
    `A${radius} ${radius} 0 0 1 ${left} ${bottom - radius}`,
    `V${top + radius}`,
    `A${radius} ${radius} 0 0 1 ${left + radius} ${top}`,
    "Z",
  ].join(" ");
}

// offset* ignores transforms, so the path stays right while the stage is scaling.
// The radius is read from the CSS token (rounded-pane) so the style lives in one place.
export function buildPanesClipPath(panes: HTMLElement[]): string {
  const shapes = panes.map((pane) => {
    const cssRadius = parseFloat(getComputedStyle(pane).borderTopLeftRadius);
    const radius = Math.min(cssRadius, pane.offsetWidth / 2, pane.offsetHeight / 2);

    return roundedRectPath(
      pane.offsetLeft,
      pane.offsetTop,
      pane.offsetWidth,
      pane.offsetHeight,
      radius,
    );
  });

  return `path("${shapes.join(" ")}")`;
}
