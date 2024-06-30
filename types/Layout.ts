export type Layout = {
  spacing?: number[],
  alignments?: string[],
}

export const [l, c, r] = ["start", "center", "end"];

export const defaultPresetLayout = 4;

export const presetLayouts: Layout[] = [
  {
    spacing: [0, 0, 0, 0, 0, 32], // top left
    alignments: [l, l, l, l, l]
  },
  {
    spacing: [0, 0, 0, 0, 0, 32], // top mix
    alignments: [l, l, l, r, c]
  },
  {
    spacing: [0, 0, 0, 0, 0, 32], // top center
    alignments: [c, c, c, c, c]
  },
  {
    spacing: [0, 0, 0, 0, 0, 32], // top right
    alignments: [r, r, r, r, r]
  },
  {
    spacing: [0, 1, 20, 2, 8, 0], // mid-level focus (DEFAULT)
    alignments: [l, l, l, r, l]
  },
  {
    spacing: [0, 1, 20, 2, 8, 0], // mid-level focus
    alignments: [l, l, l, r, c]
  },
  {
    spacing: [0, 10, 10, 10, 10, 0], // wide spread left-aligned
    alignments: [l, l, l, l, l]
  },
  {
    spacing: [0, 10, 10, 10, 10, 0], // wide spread mix
    alignments: [l, l, l, r, l]
  },
  {
    spacing: [0, 10, 10, 10, 10, 0], // wide spread mix
    alignments: [l, l, l, r, c]
  },
  {
    spacing: [0, 10, 10, 10, 10, 0], // wide spread centered
    alignments: [c, c, c, c, c]
  },
  {
    spacing: [0, 10, 10, 10, 10, 0], // wide spread right-aligned
    alignments: [r, r, r, r, r]
  },
  {
    spacing: [0, 15, 15, 2, 5, 0], // mid-top focus
    alignments: [l, l, l, r, l]
  },
  {
    spacing: [0, 15, 15, 2, 5, 0], // mid-top focus
    alignments: [l, l, l, r, c]
  },
  {
    spacing: [10, 10, 10, 10, 10, 10], // spread left-aligned
    alignments: [l, l, l, l, l]
  },
  {
    spacing: [10, 10, 10, 10, 10, 10], // spread mix
    alignments: [l, l, l, r, l]
  },
  {
    spacing: [10, 10, 10, 10, 10, 10], // spread mix
    alignments: [l, l, l, r, c]
  },
  {
    spacing: [10, 10, 10, 10, 10, 10], // spread centered
    alignments: [c, c, c, c, c]
  },
  {
    spacing: [10, 10, 10, 10, 10, 10], // spread right-aligned
    alignments: [r, r, r, r, r]
  },
  {
    spacing: [20, 5, 10, 2, 5, 5], // mid-top-level focus and pushed up for balance
    alignments: [l, l, l, r, l]
  },
  {
    spacing: [20, 5, 10, 2, 5, 5], // mid-top-level focus and pushed up for balance
    alignments: [l, l, l, r, c]
  },
  {
    spacing: [32, 0, 0, 0, 0, 32], // middle left
    alignments: [l, l, l, l, l]
  },
  {
    spacing: [32, 0, 0, 0, 0, 32], // middle mix
    alignments: [l, l, l, r, l]
  },
  {
    spacing: [32, 0, 0, 0, 0, 32], // middle mix
    alignments: [l, l, l, r, c]
  },
  {
    spacing: [32, 0, 0, 0, 0, 32], // middle center
    alignments: [c, c, c, c, c]
  },
  {
    spacing: [32, 0, 0, 0, 0, 32], // middle right
    alignments: [r, r, r, r, r]
  },
  {
    spacing: [32, 0, 0, 0, 0, 0], // bottom left
    alignments: [l, l, l, l, l]
  },
  {
    spacing: [32, 0, 0, 0, 0, 0], // bottom mix
    alignments: [l, l, l, r, l]
  },
  {
    spacing: [32, 0, 0, 0, 0, 0], // bottom mix
    alignments: [l, l, l, r, c]
  },
  {
    spacing: [32, 0, 0, 0, 0, 0], // bottom center
    alignments: [c, c, c, c, c]
  },
  {
    spacing: [32, 0, 0, 0, 0, 0], // bottom right
    alignments: [r, r, r, r, r]
  },
];
